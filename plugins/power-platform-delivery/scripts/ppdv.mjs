#!/usr/bin/env node
// ppdv — Power Platform delivery toolkit. Tested fallbacks for what Microsoft's plugins don't cover.
// No dependencies (Node 18+). Auth comes from the Azure CLI session (`az login`).
// Every write is a dry run unless --apply is passed, and is refused when the target environment
// is not in .pp/project.json (or is marked production without --allow-prod).
import { execFileSync } from "node:child_process";
import { existsSync, readFileSync, readdirSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { homedir } from "node:os";

const HELP = `ppdv <command> [options]   (all output is JSON)

Context:  --env <url> | --target <dev|test|prod key in .pp/project.json>  --project <path to .pp/project.json>
Writes:   dry run by default; add --apply. Production targets also need --allow-prod.

  whoami                                         Who am I, which org
  probe                                          Tools, auth, installed Microsoft plugins and skills
  guard-check --url <url>                        Is <url> an allowed write target? (used by the hook)
  request <METHOD> <path> [--data <json|@file>] [--solution <name>] [--strong]
  publish [--entities a,b]                       PublishXml for tables, or PublishAllXml
  solution components --solution <name> [--type <n>]
  solution has --solution <name> --id <guid>
  solution add --solution <name> --id <guid> --type <n> [--required]
  role get|members --role <name|guid>
  role add --role <r> --privilege <prv,...> --depth <Basic|Local|Deep|Global>
  role remove --role <r> --privilege <prv,...>
  role assign|unassign --role <r> --user <upn|guid>
  flow state|enable|disable --flow <workflowid>
  flow check-trigger --flow <workflowid>
  flow fix-trigger --flow <workflowid>           (flow must be off)
  choice default --table <logical> --column <logical> --value <int> [--solution <name>]
  view sort --view <name|guid> --table <logical> --attr <col> [--desc] [--replace]
  test as-user --user <upn|guid> --table <logical> [--ops create,read,update,delete,read-others]
`;

// ---------------------------------------------------------------- args
const argv = process.argv.slice(2);
const pos = [], opt = {};
for (let i = 0; i < argv.length; i++) {
  const a = argv[i];
  if (a.startsWith("--")) {
    const k = a.slice(2);
    if (i + 1 < argv.length && !argv[i + 1].startsWith("--")) opt[k] = argv[++i]; else opt[k] = true;
  } else pos.push(a);
}
const out = (o, code = 0) => { process.stdout.write(JSON.stringify(o, null, 2) + "\n"); process.exit(code); };
const fail = (msg, extra = {}) => out({ ok: false, error: msg, ...extra }, 1);
const norm = (u) => (u || "").toLowerCase().replace(/\/+$/, "").replace(".api.crm", ".crm");

// ---------------------------------------------------------------- project context
function findProject() {
  if (opt.project) return resolve(opt.project);
  let d = process.cwd();
  for (;;) {
    const p = join(d, ".pp", "project.json");
    if (existsSync(p)) return p;
    const up = dirname(d);
    if (up === d) return null;
    d = up;
  }
}
const projectPath = findProject();
const project = projectPath ? JSON.parse(readFileSync(projectPath, "utf8")) : null;

function envEntry(url) {
  if (!project?.environments) return null;
  for (const [key, e] of Object.entries(project.environments))
    if (norm(e.url) === norm(url)) return { key, ...e };
  return null;
}
function targetEnv() {
  if (opt.env) return { url: norm(opt.env), entry: envEntry(opt.env) };
  if (project?.environments) {
    const key = opt.target || Object.keys(project.environments)[0];
    const e = project.environments[key];
    if (!e) fail(`target '${key}' not in ${projectPath}`);
    return { url: norm(e.url), entry: { key, ...e } };
  }
  fail("no environment: pass --env <url> or create .pp/project.json (skill project-context)");
}
const isProd = (entry) => entry && (entry.production === true || /^prod/i.test(entry.key) || /production/i.test(entry.type || ""));

function guardWrite(url, what) {
  const entry = envEntry(url);
  const problems = [];
  if (!project) problems.push("no .pp/project.json found; writes need a project context");
  else if (!entry) problems.push(`environment ${url} is not listed in ${projectPath}`);
  if (isProd(entry) && !opt["allow-prod"]) problems.push(`environment '${entry.key}' is production; add --allow-prod after explicit user approval`);
  if (problems.length) fail("write refused", { what, env: url, problems });
  if (!opt.apply) out({ ok: true, dryRun: true, env: url, envKey: entry.key, wouldDo: what, hint: "re-run with --apply after user approval" });
  return entry;
}

// ---------------------------------------------------------------- auth + http
const tokens = {};
function token(resource) {
  if (!tokens[resource]) {
    try {
      tokens[resource] = execFileSync("az", ["account", "get-access-token", "--resource", resource, "--query", "accessToken", "-o", "tsv"], { encoding: "utf8" }).trim();
    } catch (e) { fail(`az could not get a token for ${resource}; run: az login --allow-no-subscriptions`); }
  }
  return tokens[resource];
}
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
async function http(method, url, { body, headers = {}, resource } = {}) {
  for (let attempt = 1; ; attempt++) {
    const res = await fetch(url, {
      method,
      headers: { Authorization: `Bearer ${token(resource)}`, Accept: "application/json", "OData-Version": "4.0", "OData-MaxVersion": "4.0",
        ...(body !== undefined ? { "Content-Type": "application/json; charset=utf-8" } : {}), ...headers },
      body: body === undefined ? undefined : typeof body === "string" ? body : JSON.stringify(body),
    });
    if ([429, 502, 503, 504].includes(res.status) && attempt < 6) {
      const ra = Number(res.headers.get("retry-after")) || 2 ** attempt;
      await sleep(Math.min(ra, 60) * 1000);
      continue;
    }
    const text = await res.text();
    let json = null; try { json = text ? JSON.parse(text) : null; } catch { json = text; }
    return { status: res.status, ok: res.ok, headers: Object.fromEntries(res.headers), json };
  }
}
let ENV;
const api = (p) => `${ENV}/api/data/v9.2/${p.replace(/^\//, "")}`;
async function dv(method, path, { body, solution, strong, headers = {} } = {}) {
  const h = { ...headers };
  if (solution) h["MSCRM.SolutionUniqueName"] = solution;
  if (strong) h["Consistency"] = "Strong";
  const r = await http(method, api(path), { body, headers: h, resource: ENV + "/" });
  return r;
}
async function dvOk(method, path, o) {
  const r = await dv(method, path, o);
  if (!r.ok) fail(`${method} ${path} -> ${r.status}`, { response: r.json });
  return r;
}
const q = (s) => encodeURIComponent(s).replace(/'/g, "''");
const isGuid = (s) => /^[0-9a-f]{8}-([0-9a-f]{4}-){3}[0-9a-f]{12}$/i.test(s || "");

// ---------------------------------------------------------------- lookups
async function roleId(r) {
  if (isGuid(r)) return r;
  const res = await dvOk("GET", `roles?$select=roleid,name&$filter=name eq '${r.replace(/'/g, "''")}' and _parentroleid_value eq null`);
  const v = res.json.value;
  if (v.length !== 1) fail(`role '${r}' matched ${v.length} root roles; pass the role id`, { matches: v });
  return v[0].roleid;
}
async function userRow(u) {
  const f = isGuid(u) ? `systemuserid eq ${u}` : `domainname eq '${u.replace(/'/g, "''")}'`;
  const res = await dvOk("GET", `systemusers?$select=systemuserid,fullname,domainname,azureactivedirectoryobjectid&$filter=${f}`);
  if (res.json.value.length !== 1) fail(`user '${u}' not found in ${ENV}`);
  return res.json.value[0];
}
async function privilegeIds(names) {
  const ids = [];
  for (const n of names) {
    const r = await dvOk("GET", `privileges?$select=privilegeid,name&$filter=name eq '${n}'`);
    if (!r.json.value.length) fail(`privilege ${n} not found`);
    ids.push({ name: n, id: r.json.value[0].privilegeid });
  }
  return ids;
}
async function rolePrivileges(rid) {
  const r = await dvOk("GET", `RetrieveRolePrivilegesRole(RoleId=${rid})`);
  return r.json.RolePrivileges.map((p) => ({ name: p.PrivilegeName, depth: p.Depth }));
}
async function workflow(id) {
  const r = await dvOk("GET", `workflows(${id})?$select=name,statecode,category,clientdata`);
  return r.json;
}
function triggerInfo(wf) {
  const c = JSON.parse(wf.clientdata);
  const trig = Object.entries(c.properties.definition.triggers || {});
  const dvTrig = trig.find(([, t]) => t?.inputs?.host?.operationId === "SubscribeWebhookTrigger");
  return { client: c, dvTrig };
}
function flowEnvId(entry) {
  const id = opt["env-id"] || entry?.id;
  if (!id) fail("flow commands need the environment id: add \"id\" to the environment in .pp/project.json or pass --env-id");
  return id;
}

// ---------------------------------------------------------------- commands
async function main() {
  const [cmd, sub, ...rest] = pos;
  if (!cmd || opt.help) { process.stdout.write(HELP); return; }

  if (cmd === "probe") return probe();
  const t = targetEnv(); ENV = "https://" + t.url.replace(/^https?:\/\//, "");

  if (cmd === "guard-check") {
    const url = norm(opt.url || ENV); const entry = envEntry(url);
    return out({ ok: !!entry && (!isProd(entry) || !!opt["allow-prod"]), env: url, inProject: !!entry, production: isProd(entry), project: projectPath });
  }

  if (cmd === "whoami") {
    const w = (await dvOk("GET", "WhoAmI")).json;
    const org = (await dvOk("GET", `organizations(${w.OrganizationId})?$select=name`)).json;
    return out({ ok: true, env: ENV, org: org.name, userId: w.UserId, businessUnitId: w.BusinessUnitId, project: projectPath, envKey: envEntry(ENV)?.key || null });
  }

  if (cmd === "request") {
    const method = (sub || "GET").toUpperCase(), path = rest[0];
    if (!path) fail("request needs <METHOD> <path>");
    let body; if (opt.data) body = opt.data.startsWith("@") ? readFileSync(opt.data.slice(1), "utf8") : opt.data;
    if (method !== "GET") guardWrite(ENV, `${method} ${path}`);
    const r = await dv(method, path, { body, solution: opt.solution, strong: !!opt.strong });
    return out({ ok: r.ok, status: r.status, entityId: r.headers["odata-entityid"], body: r.json }, r.ok ? 0 : 1);
  }

  if (cmd === "publish") {
    const ents = opt.entities ? String(opt.entities).split(",") : null;
    guardWrite(ENV, ents ? `PublishXml ${ents}` : "PublishAllXml");
    if (ents) await dvOk("POST", "PublishXml", { body: { ParameterXml: `<importexportxml><entities>${ents.map((e) => `<entity>${e}</entity>`).join("")}</entities></importexportxml>` } });
    else await dvOk("POST", "PublishAllXml", { body: {} });
    return out({ ok: true, published: ents || "all" });
  }

  if (cmd === "solution") {
    const s = opt.solution; if (!s) fail("--solution required");
    const sr = await dvOk("GET", `solutions?$select=solutionid&$filter=uniquename eq '${s}'`);
    if (!sr.json.value.length) fail(`solution ${s} not found`);
    const sid = sr.json.value[0].solutionid;
    if (sub === "components" || sub === "has") {
      let f = `_solutionid_value eq ${sid}`;
      if (opt.type) f += ` and componenttype eq ${opt.type}`;
      if (sub === "has") f += ` and objectid eq ${opt.id}`;
      const r = await dvOk("GET", `solutioncomponents?$select=objectid,componenttype,rootcomponentbehavior&$filter=${f}`);
      const v = r.json.value.map((c) => ({ id: c.objectid, type: c.componenttype, rootBehavior: c.rootcomponentbehavior }));
      return out(sub === "has" ? { ok: true, solution: s, id: opt.id, member: v.length > 0 } : { ok: true, solution: s, count: v.length, components: v });
    }
    if (sub === "add") {
      if (!opt.id || !opt.type) fail("--id and --type required");
      guardWrite(ENV, `AddSolutionComponent ${opt.id} (type ${opt.type}) -> ${s}`);
      const r = await dvOk("POST", "AddSolutionComponent", { body: { ComponentId: opt.id, ComponentType: Number(opt.type), SolutionUniqueName: s, AddRequiredComponents: !!opt.required } });
      return out({ ok: true, added: opt.id, solution: s, result: r.json });
    }
  }

  if (cmd === "role") {
    if (!opt.role) fail("--role required");
    const rid = await roleId(opt.role);
    if (sub === "get") return out({ ok: true, roleId: rid, privileges: await rolePrivileges(rid) });
    if (sub === "members") {
      const r = await dvOk("GET", `roles(${rid})/systemuserroles_association?$select=fullname,domainname`);
      return out({ ok: true, roleId: rid, members: r.json.value.map((u) => ({ id: u.systemuserid, name: u.fullname, upn: u.domainname })) });
    }
    if (sub === "add" || sub === "remove") {
      if (!opt.privilege) fail("--privilege required");
      const privs = await privilegeIds(String(opt.privilege).split(","));
      if (sub === "add") {
        const depth = opt.depth || "Basic";
        if (!["Basic", "Local", "Deep", "Global"].includes(depth)) fail("--depth must be Basic|Local|Deep|Global");
        guardWrite(ENV, `AddPrivilegesRole ${privs.map((p) => p.name)} @${depth} on role ${rid}`);
        const role = (await dvOk("GET", `roles(${rid})?$select=_businessunitid_value`)).json;
        await dvOk("POST", `roles(${rid})/Microsoft.Dynamics.CRM.AddPrivilegesRole`, { body: { Privileges: privs.map((p) => ({ PrivilegeId: p.id, Depth: depth, BusinessUnitId: role._businessunitid_value })) } });
      } else {
        guardWrite(ENV, `RemovePrivilegeRole ${privs.map((p) => p.name)} from role ${rid}`);
        for (const p of privs)
          await dvOk("POST", `roles(${rid})/Microsoft.Dynamics.CRM.RemovePrivilegeRole`, { body: { Privilege: { "@odata.type": "Microsoft.Dynamics.CRM.privilege", privilegeid: p.id } } });
      }
      return out({ ok: true, roleId: rid, privileges: await rolePrivileges(rid) });
    }
    if (sub === "assign" || sub === "unassign") {
      if (!opt.user) fail("--user required");
      const u = await userRow(opt.user);
      guardWrite(ENV, `${sub} role ${rid} ${sub === "assign" ? "to" : "from"} ${u.domainname}`);
      if (sub === "assign") await dvOk("POST", `systemusers(${u.systemuserid})/systemuserroles_association/$ref`, { body: { "@odata.id": api(`roles(${rid})`) } });
      else await dvOk("DELETE", `systemusers(${u.systemuserid})/systemuserroles_association(${rid})/$ref`);
      const m = await dvOk("GET", `systemusers(${u.systemuserid})/systemuserroles_association?$select=name`);
      return out({ ok: true, user: u.domainname, roles: m.json.value.map((r) => r.name) });
    }
  }

  if (cmd === "flow") {
    const id = opt.flow; if (!isGuid(id)) fail("--flow <workflowid> required");
    const PA = "https://service.flow.microsoft.com/";
    const paUrl = (a) => `https://api.flow.microsoft.com/providers/Microsoft.ProcessSimple/environments/${flowEnvId(t.entry)}/flows/${id}${a}?api-version=2016-11-01`;
    if (sub === "state") {
      const r = await http("GET", paUrl(""), { resource: PA });
      if (!r.ok) fail(`flow service ${r.status}`, { response: r.json });
      return out({ ok: true, flow: id, name: r.json.properties?.displayName, state: r.json.properties?.state });
    }
    if (sub === "enable" || sub === "disable") {
      guardWrite(ENV, `${sub} flow ${id} through the flow service`);
      const r = await http("POST", paUrl(sub === "enable" ? "/start" : "/stop"), { resource: PA, body: {} });
      if (!r.ok) fail(`flow service ${r.status}`, { response: r.json });
      if (sub === "disable") return out({ ok: true, flow: id, state: "Stopped" });
      await sleep(10000);
      return out({ ok: true, flow: id, state: "Started", trigger: await checkTrigger(id) });
    }
    if (sub === "check-trigger") return out({ ok: true, flow: id, ...(await checkTrigger(id)) });
    if (sub === "fix-trigger") {
      const wf = await workflow(id);
      const { client, dvTrig } = triggerInfo(wf);
      if (!dvTrig) fail("flow has no Dataverse webhook trigger");
      if (wf.statecode !== 0) fail("turn the flow off first: ppdv flow disable --flow " + id + " --apply");
      const p = dvTrig[1].inputs.parameters, changes = [];
      if (p["subscriptionRequest/name"] !== `${id}:MTA`) { p["subscriptionRequest/name"] = `${id}:MTA`; changes.push("set subscriptionRequest/name"); }
      if (p["subscriptionRequest/message"] === 1 && p["subscriptionRequest/filteringattributes"]) { delete p["subscriptionRequest/filteringattributes"]; changes.push("removed filteringattributes on create-only trigger"); }
      if (!changes.length) return out({ ok: true, flow: id, changes: [] });
      guardWrite(ENV, `patch trigger of flow ${id}: ${changes.join("; ")}`);
      await dvOk("PATCH", `workflows(${id})`, { body: { clientdata: JSON.stringify(client) }, headers: { "If-Match": "*" } });
      return out({ ok: true, flow: id, changes, next: `ppdv flow enable --flow ${id} --apply` });
    }
  }

  if (cmd === "choice" && sub === "default") {
    const { table, column, value } = opt;
    if (!table || !column || value === undefined) fail("--table --column --value required");
    const path = `EntityDefinitions(LogicalName='${table}')/Attributes(LogicalName='${column}')/Microsoft.Dynamics.CRM.PicklistAttributeMetadata`;
    const a = (await dvOk("GET", `${path}?$expand=OptionSet`)).json;
    if (!a.OptionSet.Options.some((o) => o.Value === Number(value))) fail(`value ${value} is not an option of ${table}.${column}`, { options: a.OptionSet.Options.map((o) => ({ value: o.Value, label: o.Label?.UserLocalizedLabel?.Label })) });
    guardWrite(ENV, `set DefaultFormValue of ${table}.${column} from ${a.DefaultFormValue} to ${value}`);
    const body = { ...a, DefaultFormValue: Number(value) };
    delete body["@odata.context"]; delete body.OptionSet; delete body.GlobalOptionSet;
    body["@odata.type"] = "Microsoft.Dynamics.CRM.PicklistAttributeMetadata";
    await dvOk("PUT", `EntityDefinitions(LogicalName='${table}')/Attributes(${a.MetadataId})`, { body, solution: opt.solution || project?.solution?.uniqueName, headers: { "MSCRM.MergeLabels": "true" } });
    await dvOk("POST", "PublishXml", { body: { ParameterXml: `<importexportxml><entities><entity>${table}</entity></entities></importexportxml>` } });
    const after = (await dvOk("GET", path + "?$select=DefaultFormValue", { strong: true })).json;
    return out({ ok: true, table, column, defaultFormValue: after.DefaultFormValue });
  }

  if (cmd === "view" && sub === "sort") {
    const { table, attr } = opt; if (!table || !attr || !opt.view) fail("--view --table --attr required");
    const f = isGuid(opt.view) ? `savedqueryid eq ${opt.view}` : `name eq '${opt.view.replace(/'/g, "''")}' and returnedtypecode eq '${table}'`;
    const v = (await dvOk("GET", `savedqueries?$select=savedqueryid,name,fetchxml&$filter=${f}`)).json.value;
    if (v.length !== 1) fail(`view matched ${v.length}`, { matches: v.map((x) => x.name) });
    let fx = v[0].fetchxml;
    const order = `<order attribute="${attr}" descending="${opt.desc ? "true" : "false"}" />`;
    const entOpen = fx.match(/<entity name="[^"]+">/);
    if (!entOpen) fail("could not parse fetchxml");
    // only touch orders of the main entity (not link-entities)
    const head = fx.slice(0, entOpen.index + entOpen[0].length), tail = fx.slice(entOpen.index + entOpen[0].length);
    const linkIdx = tail.search(/<link-entity/);
    let main = linkIdx >= 0 ? tail.slice(0, linkIdx) : tail.replace(/<\/entity>[\s\S]*$/, "");
    const restXml = tail.slice(main.length);
    if (opt.replace) main = main.replace(/<order [^>]*\/>/g, "");
    else main = main.replace(new RegExp(`<order attribute="${attr}"[^>]*/>`, "g"), "");
    fx = head + order + main + restXml;
    guardWrite(ENV, `set sort of view '${v[0].name}' to ${attr} ${opt.desc ? "desc" : "asc"}${opt.replace ? " (replacing other sorts)" : ""}`);
    await dvOk("PATCH", `savedqueries(${v[0].savedqueryid})`, { body: { fetchxml: fx } });
    await dvOk("POST", "PublishXml", { body: { ParameterXml: `<importexportxml><entities><entity>${table}</entity></entities></importexportxml>` } });
    return out({ ok: true, view: v[0].name, fetchxml: fx });
  }

  if (cmd === "test" && sub === "as-user") {
    const { table } = opt; if (!opt.user || !table) fail("--user --table required");
    const ops = String(opt.ops || "create,read,update,delete").split(",");
    const u = await userRow(opt.user);
    const md = (await dvOk("GET", `EntityDefinitions(LogicalName='${table}')?$select=EntitySetName,PrimaryNameAttribute,PrimaryIdAttribute`)).json;
    guardWrite(ENV, `impersonate ${u.domainname} and try ${ops} on ${table} (test row is cleaned up)`);
    const as = { headers: { CallerObjectId: u.azureactivedirectoryobjectid } };
    const res = {}; let rowId = null;
    const tag = `[ppdv test ${new Date().toISOString()}]`;
    const result = (r) => (r.ok ? "allowed" : r.status === 403 || r.json?.error?.code === "0x80040220" ? "denied" : `error ${r.status}: ${r.json?.error?.message?.slice(0, 160)}`);
    if (ops.includes("create")) {
      const r = await dv("POST", md.EntitySetName, { body: { [md.PrimaryNameAttribute]: tag }, ...as });
      res.create = result(r);
      if (r.ok) rowId = r.headers["odata-entityid"].match(/\(([^)]+)\)$/)[1];
    }
    if (!rowId) { // need a row for the other ops: create as admin
      const r = await dvOk("POST", md.EntitySetName, { body: { [md.PrimaryNameAttribute]: tag } });
      rowId = r.headers["odata-entityid"].match(/\(([^)]+)\)$/)[1]; res.note = "row created by admin for read/update/delete checks (owned by admin)";
    }
    if (ops.includes("read")) res.read = result(await dv("GET", `${md.EntitySetName}(${rowId})?$select=${md.PrimaryNameAttribute}`, as));
    if (ops.includes("update")) res.update = result(await dv("PATCH", `${md.EntitySetName}(${rowId})`, { body: { [md.PrimaryNameAttribute]: tag + " updated" }, ...as }));
    if (ops.includes("read-others")) { // scope check: a row owned by the admin running ppdv
      const o = await dvOk("POST", md.EntitySetName, { body: { [md.PrimaryNameAttribute]: tag + " (other owner)" } });
      const oid = o.headers["odata-entityid"].match(/\(([^)]+)\)$/)[1];
      res.readOthers = result(await dv("GET", `${md.EntitySetName}(${oid})?$select=${md.PrimaryNameAttribute}`, as));
      await dv("DELETE", `${md.EntitySetName}(${oid})`);
    }
    let deleted = false;
    if (ops.includes("delete")) { const r = await dv("DELETE", `${md.EntitySetName}(${rowId})`, as); res.delete = result(r); deleted = r.ok; }
    if (!deleted) await dv("DELETE", `${md.EntitySetName}(${rowId})`);
    return out({ ok: true, user: u.domainname, table, results: res, cleanedUp: true });
  }

  fail(`unknown command: ${pos.join(" ")}`, { help: HELP });
}

async function checkTrigger(id) {
  const wf = await workflow(id);
  const { dvTrig } = triggerInfo(wf);
  if (!dvTrig) return { dataverseTrigger: false };
  const p = dvTrig[1].inputs.parameters, issues = [];
  if (p["subscriptionRequest/name"] !== `${id}:MTA`) issues.push("subscriptionRequest/name is not '<workflowid>:MTA'");
  if (p["subscriptionRequest/message"] === 1 && p["subscriptionRequest/filteringattributes"]) issues.push("filteringattributes set on a create-only trigger");
  const cb = await dvOk("GET", `callbackregistrations?$select=name,entityname,message&$filter=startswith(name,'${id}')`);
  const registered = cb.json.value.length > 0;
  if (wf.statecode === 1 && !registered) issues.push("flow is on but no callback registration exists: the trigger will never fire");
  return { flowOn: wf.statecode === 1, table: p["subscriptionRequest/entityname"], registered, registrations: cb.json.value.map((c) => c.name), issues,
    fix: issues.length ? `ppdv flow disable --flow ${id} --apply; ppdv flow fix-trigger --flow ${id} --apply; ppdv flow enable --flow ${id} --apply` : null };
}

function run(cmd, args) { try { return execFileSync(cmd, args, { encoding: "utf8", stdio: ["ignore", "pipe", "pipe"] }).trim(); } catch { return null; } }
function probe() {
  const pacBin = run("which", ["pac"]) || (existsSync(join(homedir(), ".dotnet/tools/pac")) ? join(homedir(), ".dotnet/tools/pac") : null);
  const tools = {
    node: process.version,
    pac: pacBin ? (run(pacBin, ["help"]) || "").match(/Version: (\S+)/)?.[1] || "present" : null,
    pacOrg: pacBin ? (run(pacBin, ["org", "who"]) || "").match(/Org URL:\s+(\S+)/)?.[1] || null : null,
    az: run("az", ["account", "show", "--query", "user.name", "-o", "tsv"]),
    dotnetSdks: (run("dotnet", ["--list-sdks"]) || "").split("\n").filter(Boolean).map((l) => l.split(" ")[0]),
    dataverseCli: run("dataverse", ["--version"]),
    claude: run("claude", ["--version"]),
    copilot: run("copilot", ["--version"]),
  };
  // Skills shipped by installed plugins (Claude Code cache; Copilot CLI if present)
  const skills = {};
  const roots = [join(homedir(), ".claude/plugins/cache"), join(homedir(), ".copilot/installed-plugins")];
  for (const root of roots) {
    if (!existsSync(root)) continue;
    const walk = (d, depth) => {
      if (depth > 5) return;
      for (const e of readdirSync(d, { withFileTypes: true })) {
        if (!e.isDirectory()) continue;
        const p = join(d, e.name);
        if (e.name === "skills") for (const s of readdirSync(p)) skills[s] = p.replace(homedir(), "~");
        else walk(p, depth + 1);
      }
    };
    walk(root, 0);
  }
  const want = { "dataverse (dv-*)": ["dv-metadata", "dv-data", "dv-solution", "dv-security"], "model-apps": ["app-builder", "genpage"], "canvas-apps": ["canvas-app"],
    "power-automate": ["build-flow", "debug-flow"], pcf: ["pcf"], "power-pages": ["create-site"] };
  const microsoft = Object.fromEntries(Object.entries(want).map(([k, names]) => [k, names.every((n) => skills[n]) ? "installed" : names.some((n) => skills[n]) ? "partial" : "missing"]));
  const pacMismatch = project && tools.pacOrg && !envEntry(tools.pacOrg) ? `pac points at ${tools.pacOrg}, which is not in .pp/project.json` : null;
  out({ ok: true, project: projectPath, tools, microsoftPlugins: microsoft, warnings: [pacMismatch, tools.az ? null : "az not signed in", tools.dotnetSdks.some((v) => +v.split(".")[0] >= 10) ? null : ".NET 10 SDK missing (canvas-apps, pac copilot mcp)"].filter(Boolean) });
}

main().catch((e) => fail(e.message));

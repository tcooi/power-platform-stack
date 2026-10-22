// Offline tests: no network, no Azure login. Run: node --test tests/offline.test.mjs
import { test } from "node:test";
import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { mkdtempSync, mkdirSync, writeFileSync, readFileSync } from "node:fs";
import { join, dirname } from "node:path";
import { tmpdir } from "node:os";
import { fileURLToPath } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const plugin = join(root, "plugins", "power-platform-delivery");
const hook = join(plugin, "scripts", "guard-hook.mjs");
const wrapper = join(plugin, "scripts", "run-guard-hook.sh");
const ppdv = join(plugin, "scripts", "ppdv.mjs");

function project(envs) {
  const d = mkdtempSync(join(tmpdir(), "pptest-"));
  mkdirSync(join(d, ".pp"));
  writeFileSync(join(d, ".pp", "project.json"), JSON.stringify({ environments: envs }));
  return d;
}
const DEV = { dev: { url: "https://devorg.crm4.dynamics.com", id: "11111111-1111-1111-1111-111111111111" } };
const PROD = { prod: { url: "https://prodorg.crm4.dynamics.com", id: "22222222-2222-2222-2222-222222222222" } };

function decide(payload, runner = hook) {
  const r = spawnSync(runner.endsWith(".sh") ? "sh" : "node", [runner], { input: JSON.stringify(payload), encoding: "utf8", env: { ...process.env, HOME: tmpdir() } });
  assert.equal(r.status, 0, r.stderr);
  return r.stdout ? JSON.parse(r.stdout).permissionDecision : "allow";
}
const bash = (cwd, command) => ({ cwd, tool_name: "Bash", tool_input: { command } });

test("hook: curl write to unlisted environment is denied", () => {
  assert.equal(decide(bash(project(DEV), "curl -X POST https://other.crm.dynamics.com/api/data/v9.2/accounts -d '{}'")), "deny");
});
test("hook: curl write to listed dev environment is allowed", () => {
  assert.equal(decide(bash(project(DEV), "curl -X PATCH https://devorg.crm4.dynamics.com/api/data/v9.2/x -d '{}'")), "allow");
});
test("hook: reads are allowed", () => {
  assert.equal(decide(bash(project(DEV), "curl https://other.crm.dynamics.com/api/data/v9.2/accounts")), "allow");
});
test("hook: production write asks", () => {
  assert.equal(decide(bash(project(PROD), "curl -X DELETE https://prodorg.crm4.dynamics.com/api/data/v9.2/x")), "ask");
});
test("hook: no project folder means no interference", () => {
  assert.equal(decide(bash(mkdtempSync(join(tmpdir(), "noproj-")), "curl -X DELETE https://other.crm.dynamics.com/x")), "allow");
});
test("hook: pac write with --environment outside the project is denied", () => {
  assert.equal(decide(bash(project(DEV), "pac solution import --path a.zip --environment https://other.crm.dynamics.com")), "deny");
});
test("hook: pac write by environment id in the project is allowed", () => {
  assert.equal(decide(bash(project(DEV), "pac solution import --path a.zip --environment 11111111-1111-1111-1111-111111111111")), "allow");
});
test("hook: pac read is allowed", () => {
  assert.equal(decide(bash(project(DEV), "pac solution list")), "allow");
});
test("hook: MCP write in an unlisted environment is denied", () => {
  assert.equal(decide({ cwd: project(DEV), tool_name: "mcp__plugin_power-automate_flowagent__delete_flow", tool_input: { env: "33333333-3333-3333-3333-333333333333" } }), "deny");
});
test("hook: MCP delete with unknown environment asks", () => {
  assert.equal(decide({ cwd: project(DEV), tool_name: "mcp__dataverse__delete_record", tool_input: { tablename: "x" } }), "ask");
});
test("hook: Copilot camelCase payload is understood", () => {
  assert.equal(decide({ cwd: project(DEV), toolName: "bash", toolArgs: JSON.stringify({ command: "curl -X DELETE https://other.crm.dynamics.com/x" }) }), "deny");
});
test("hook wrapper: runs the hook and never blocks harmless commands", () => {
  assert.equal(decide(bash(project(DEV), "curl -X DELETE https://other.crm.dynamics.com/x"), wrapper), "deny");
  assert.equal(decide(bash(project(DEV), "ls"), wrapper), "allow");
});

function ppdvRun(cwd, args) {
  const r = spawnSync("node", [ppdv, ...args], { cwd, encoding: "utf8" });
  return { code: r.status, json: JSON.parse(r.stdout || "{}") };
}
test("ppdv: writes are dry runs without --apply", () => {
  const r = ppdvRun(project(DEV), ["request", "PATCH", "accounts(1)", "--data", "{}"]);
  assert.equal(r.code, 0); assert.equal(r.json.dryRun, true);
});
test("ppdv: writes to an environment outside the project are refused", () => {
  const r = ppdvRun(project(DEV), ["request", "PATCH", "accounts(1)", "--env", "https://other.crm.dynamics.com", "--apply"]);
  assert.equal(r.code, 1); assert.match(r.json.problems.join(" "), /not listed/);
});
test("ppdv: production writes need --allow-prod", () => {
  const r = ppdvRun(project(PROD), ["request", "DELETE", "accounts(1)", "--apply"]);
  assert.equal(r.code, 1); assert.match(r.json.problems.join(" "), /production/);
});
test("ppdv: writes without a project are refused", () => {
  const r = ppdvRun(mkdtempSync(join(tmpdir(), "noproj-")), ["request", "POST", "accounts", "--env", "https://x.crm.dynamics.com", "--apply"]);
  assert.equal(r.code, 1);
});
test("ppdv: guard-check reports listed environments", () => {
  assert.equal(ppdvRun(project(DEV), ["guard-check", "--url", "https://devorg.crm4.dynamics.com"]).json.ok, true);
  assert.equal(ppdvRun(project(DEV), ["guard-check", "--url", "https://other.crm.dynamics.com"]).json.ok, false);
});
test("ppdv: teardown with no recorded artifacts does nothing", () => {
  const r = ppdvRun(project(DEV), ["teardown"]);
  assert.equal(r.json.nothingToDo, true);
});

test("manifests: plugin and marketplace versions match", () => {
  const mk = JSON.parse(readFileSync(join(root, ".claude-plugin", "marketplace.json"), "utf8"));
  const pj = JSON.parse(readFileSync(join(plugin, ".claude-plugin", "plugin.json"), "utf8"));
  assert.equal(mk.plugins[0].version, pj.version);
});

test("ppdv state: valid project passes, bad prefix and secrets fail", () => {
  const d = project(DEV);
  writeFileSync(join(d, ".pp", "project.json"), JSON.stringify({ environments: DEV, solution: { uniqueName: "Sol", prefix: "con" } }));
  assert.equal(ppdvRun(d, ["state", "check"]).json.ok, true);
  writeFileSync(join(d, ".pp", "project.json"), JSON.stringify({ environments: DEV, solution: { uniqueName: "Sol", prefix: "Con_X" }, clientSecret: "x" }));
  const r = ppdvRun(d, ["state", "check"]);
  assert.equal(r.json.ok, false); assert.equal(r.json.errors.length, 2);
});
test("ppdv state: tasks, phases and entries are validated", () => {
  const d = project(DEV);
  writeFileSync(join(d, ".pp", "project.json"), JSON.stringify({ environments: DEV, solution: { uniqueName: "Sol", prefix: "con" } }));
  assert.equal(ppdvRun(d, ["state", "task", "--id", "T1", "--title", "Design", "--status", "in-progress"]).json.ok, true);
  assert.equal(ppdvRun(d, ["state", "task", "--id", "T1", "--status", "finished"]).code, 1);
  assert.equal(ppdvRun(d, ["state", "phase", "--set", "build"]).code, 1, "build without approvals is refused");
  assert.equal(ppdvRun(d, ["state", "add", "--kind", "approval", "--text", "design v1"]).json.ok, true);
  assert.equal(ppdvRun(d, ["state", "phase", "--set", "build"]).json.ok, true);
  assert.equal(ppdvRun(d, ["state", "task", "--id", "T1", "--status", "done"]).json.ok, true);
  const s = JSON.parse(readFileSync(join(d, ".pp", "state", "delivery.json"), "utf8"));
  assert.equal(s.tasks[0].status, "done"); assert.equal(s.phase, "build");
  assert.equal(ppdvRun(d, ["state", "check"]).json.ok, true);
});

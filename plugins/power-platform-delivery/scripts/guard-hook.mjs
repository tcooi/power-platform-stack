#!/usr/bin/env node
// PreToolUse hook (Claude Code and Copilot CLI): blocks shell writes to Dataverse environments that are not in .pp/project.json,
// and asks before writes to production entries. Reads the hook payload on stdin; prints a decision as JSON.
import { existsSync, readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { homedir } from "node:os";


function findProject(start) {
  let d = start;
  for (;;) { const p = join(d, ".pp", "project.json"); if (existsSync(p)) return p; const up = dirname(d); if (up === d) return null; d = up; }
}
function envList(projectPath) { return Object.entries(JSON.parse(readFileSync(projectPath, "utf8")).environments || {}); }
const isProdEnv = (key, e) => e.production === true || /^prod/i.test(key) || /production/i.test(e.type || "");
function emit(decision, reason) {
  process.stdout.write(JSON.stringify({ permissionDecision: decision, permissionDecisionReason: reason, hookSpecificOutput: { hookEventName: "PreToolUse", permissionDecision: decision, permissionDecisionReason: reason } }));
  process.exit(0);
}
function judge(projectPath, match, label) {
  const hit = envList(projectPath).find(([, e]) => match(e));
  if (!hit) emit("deny", `power-platform-delivery guard: ${label} is not an environment in ${projectPath}. Switch to a listed environment or add it there with the user's confirmation.`);
  if (isProdEnv(hit[0], hit[1])) emit("ask", `power-platform-delivery guard: this writes to PRODUCTION environment '${hit[0]}'. Confirm only if the user approved this exact change.`);
}
function pacCheck(cmd) {
  const projectPath = findProject(globalThis.__cwd); if (!projectPath) return;
  const m = cmd.match(/(?:--environment|-env)\s+("?)([^\s"]+)\1/i);
  let target = m?.[2];
  if (!target) { // pac uses its active auth profile
    try {
      const f = join(homedir(), process.platform === "darwin" ? "Library/Application Support/Microsoft/PowerAppsCli/authprofiles_v2.json" : ".local/share/Microsoft/PowerAppsCli/authprofiles_v2.json");
      const cur = JSON.parse(readFileSync(f, "utf8")).Current?.UNIVERSAL;
      target = cur?.Resource || cur?.EnvironmentId;
    } catch { emit("ask", "power-platform-delivery guard: pac write without --environment and the active pac profile could not be read; confirm the target environment."); }
  }
  const norm = (u) => String(u).toLowerCase().replace(/\/+$/, "").replace(".api.crm", ".crm");
  judge(projectPath, (e) => norm(e.url || "") === norm(target) || (e.id || "").toLowerCase() === String(target).toLowerCase(), `pac target ${target}`);
}
function mcpCheck(op, a) {
  const projectPath = findProject(globalThis.__cwd); if (!projectPath) return;
  const env = a.env || a.environment || a.environmentId;
  if (env) judge(projectPath, (e) => (e.id || "").toLowerCase() === String(env).toLowerCase(), `MCP target ${env}`);
  else if (/^delete/.test(op)) emit("ask", `power-platform-delivery guard: ${op} through MCP, target environment unknown; confirm with the user.`);
}

let input = "";
process.stdin.on("data", (c) => (input += c)).on("end", () => {
  let ev; try { ev = JSON.parse(input); } catch { process.exit(0); }
  globalThis.__cwd = ev.cwd || process.cwd();
  const args = ev?.tool_input ?? (typeof ev?.toolArgs === "string" ? (() => { try { return JSON.parse(ev.toolArgs); } catch { return { command: ev.toolArgs }; } })() : ev?.toolArgs);
  const cmd = args?.command || "";
  const urls = [...cmd.matchAll(/https?:\/\/([a-z0-9-]+)\.(?:api\.)?(crm\d*)\.dynamics\.com/gi)].map((m) => `https://${m[1]}.${m[2]}.dynamics.com`.toLowerCase());
  const toolName = ev?.tool_name || ev?.toolName || "";
  // MCP write tools (Dataverse MCP, Power Automate FlowAgent): check their env argument, else ask.
  if (/^mcp__/.test(toolName) || /^(create|update|delete|edit|publish|disable|copy|restore|run|resubmit|cancel|fix|pick_or_create)_/.test(toolName.split("__").pop() || "")) {
    const op = toolName.split("__").pop();
    if (/^(create|update|delete|edit|publish|disable|copy|restore|run|resubmit|cancel|fix|pick_or_create|upsert|commit|init_file)/.test(op)) mcpCheck(op, args || {});
    process.exit(0);
  }
  const isPacWrite = /\bpac\s+(solution\s+(import|delete|publish|upgrade|add-solution-component|online-version|sync)|admin\s+(create|delete|assign-user|assign-group|create-service-principal|copy|reset|backup|restore)|copilot\s+(push|publish|delete|init)|pcf\s+push|plugin\s+push|model\s+(create|genpage\s+(upload|add|remove))|pipeline\s+deploy|data\s+import|canvas\s+create|pages\s+upload|connection\s+(create|delete|update))\b/i.test(cmd);
  if (isPacWrite) pacCheck(cmd);
  const isWrite =
    /\bcurl\b[\s\S]*(-X\s*(POST|PATCH|PUT|DELETE)|--request\s+(POST|PATCH|PUT|DELETE)|\s-d\s|--data)/i.test(cmd) ||
    /\b(Invoke-RestMethod|Invoke-WebRequest)\b[\s\S]*-Method\s+(Post|Patch|Put|Delete)/i.test(cmd) ||
    (/ppdv\.mjs/.test(cmd) && /--apply\b/.test(cmd));
  if (!isWrite || !urls.length) process.exit(0);

  let d = ev.cwd || process.cwd(), projectPath = null;
  for (;;) { const p = join(d, ".pp", "project.json"); if (existsSync(p)) { projectPath = p; break; } const up = dirname(d); if (up === d) break; d = up; }
  if (!projectPath) process.exit(0); // not a Power Platform project folder: don't interfere
  const envs = Object.entries(JSON.parse(readFileSync(projectPath, "utf8")).environments || {});
  const norm = (u) => u.toLowerCase().replace(/\/+$/, "").replace(".api.crm", ".crm");
  const decide = (decision, reason) => {
    // Claude Code reads hookSpecificOutput; Copilot CLI reads the top-level fields. One object serves both.
    process.stdout.write(JSON.stringify({ permissionDecision: decision, permissionDecisionReason: reason, hookSpecificOutput: { hookEventName: "PreToolUse", permissionDecision: decision, permissionDecisionReason: reason } }));
    process.exit(0);
  };
  for (const u of new Set(urls)) {
    const hit = envs.find(([, e]) => norm(e.url || "") === norm(u));
    if (!hit) decide("deny", `power-platform-delivery guard: ${u} is not an environment in ${projectPath}. Add it there (with the user's confirmation) or target a listed environment.`);
    const [key, e] = hit;
    if (e.production === true || /^prod/i.test(key) || /production/i.test(e.type || ""))
      decide("ask", `power-platform-delivery guard: this writes to PRODUCTION environment '${key}' (${u}). Confirm only if the user approved this exact change.`);
  }
  process.exit(0);
});

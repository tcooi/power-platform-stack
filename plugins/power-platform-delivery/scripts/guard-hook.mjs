#!/usr/bin/env node
// PreToolUse hook (Claude Code and Copilot CLI): blocks shell writes to Dataverse environments that are not in .pp/project.json,
// and asks before writes to production entries. Reads the hook payload on stdin; prints a decision as JSON.
import { existsSync, readFileSync } from "node:fs";
import { dirname, join } from "node:path";

let input = "";
process.stdin.on("data", (c) => (input += c)).on("end", () => {
  let ev; try { ev = JSON.parse(input); } catch { process.exit(0); }
  const args = ev?.tool_input ?? (typeof ev?.toolArgs === "string" ? (() => { try { return JSON.parse(ev.toolArgs); } catch { return { command: ev.toolArgs }; } })() : ev?.toolArgs);
  const cmd = args?.command || "";
  const urls = [...cmd.matchAll(/https?:\/\/([a-z0-9-]+)\.(?:api\.)?(crm\d*)\.dynamics\.com/gi)].map((m) => `https://${m[1]}.${m[2]}.dynamics.com`.toLowerCase());
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

#!/usr/bin/env node
// Evals: run each scenario headless against the delivery lead with this plugin loaded, then check the answer
// and (optionally) files and the environment. Usage: node evals/run.mjs [--all] [scenario-id ...]  (--all includes slow scenarios)
import { execFileSync, spawnSync } from "node:child_process";
import { mkdtempSync, mkdirSync, writeFileSync, readFileSync, existsSync, readdirSync } from "node:fs";
import { join, dirname } from "node:path";
import { tmpdir } from "node:os";
import { fileURLToPath } from "node:url";

const here = dirname(fileURLToPath(import.meta.url));
const plugin = join(here, "..", "plugins", "power-platform-delivery");
const ppdv = join(plugin, "scripts", "ppdv.mjs");
const { real, scenarios } = JSON.parse(readFileSync(join(here, "scenarios.json"), "utf8"));
const args = process.argv.slice(2), all = args.includes("--all"), only = args.filter((a) => a !== "--all");
const results = [];

for (const s of scenarios.filter((x) => (only.length ? only.includes(x.id) : all || !x.slow))) {
  const dir = mkdtempSync(join(tmpdir(), `ppeval-${s.id}-`));
  mkdirSync(join(dir, ".pp", "state"), { recursive: true });
  const envs = Object.fromEntries(Object.entries(s.project).map(([k, v]) => [k, v === "real" ? real : v]));
  writeFileSync(join(dir, ".pp", "project.json"), JSON.stringify({ client: "eval", environments: envs, solution: { uniqueName: "ClaudeTestSolution", publisher: "ClaudePublisher", prefix: "claude" } }, null, 2));
  const t0 = Date.now();
  const r = spawnSync("claude", ["-p", s.prompt, "--plugin-dir", plugin, "--agent", "power-platform-delivery:pp-delivery-lead", "--output-format", "json",
    "--allowedTools", "Read", "Glob", "Grep", "Skill", "Agent", "Task", "Write", "Edit", "Bash(mkdir:*)", "Bash(ls:*)", "Bash(node:*)", "Bash(pac org who)", "Bash(pac auth list)", "Bash(az account show:*)", "Bash(dotnet --list-sdks)"],
    { cwd: dir, encoding: "utf8", timeout: 600000, maxBuffer: 50e6 });
  let text = ""; try { text = JSON.parse(r.stdout).result || ""; } catch { text = r.stdout || r.stderr || ""; }
  const failures = [];
  for (const re of s.mustMatch) if (!new RegExp(re, "i").test(text)) failures.push(`missing /${re}/`);
  for (const re of s.mustNotMatch) if (new RegExp(re, "i").test(text)) failures.push(`forbidden /${re}/`);
  for (const pat of s.expectFiles || []) {
    const [d, f] = pat.includes("*") ? [pat.slice(0, pat.lastIndexOf("/")), null] : [null, pat];
    const ok = f ? existsSync(join(dir, f)) : existsSync(join(dir, d)) && readdirSync(join(dir, d)).some((n) => n.endsWith(".md"));
    if (!ok) failures.push(`expected file ${pat}`);
  }
  if (s.verify) {
    const v = JSON.parse(execFileSync("node", [ppdv, "request", "GET", s.verify.get, "--env", real.url], { encoding: "utf8" }));
    const n = v.body?.value?.length;
    if (n !== s.verify.expectCount) failures.push(`environment check: expected ${s.verify.expectCount} rows, got ${n}`);
  }
  results.push({ id: s.id, pass: failures.length === 0, failures, seconds: Math.round((Date.now() - t0) / 1000), answer: text.slice(0, 600) });
  console.error(`${failures.length ? "FAIL" : "PASS"} ${s.id} (${results.at(-1).seconds}s) ${failures.join("; ")}`);
}
const pass = results.filter((r) => r.pass).length;
console.log(JSON.stringify({ pass, total: results.length, results }, null, 2));
process.exit(pass === results.length ? 0 : 1);

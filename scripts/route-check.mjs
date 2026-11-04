#!/usr/bin/env node
// Free, deterministic routing check (no model): do the right skills' descriptions match what users say,
// next to Microsoft's skills, and do two of our descriptions overlap too much?
// Lexical approximation (TF-IDF cosine over descriptions); a failure usually means: fix the description.
//   node scripts/route-check.mjs            check evals/routing.json (CI)
//   node scripts/route-check.mjs --refresh  re-snapshot Microsoft skill descriptions from installed plugins
//   node scripts/route-check.mjs --explain "<prompt>"   show the ranking for one prompt
import { readFileSync, writeFileSync, readdirSync, existsSync } from "node:fs";
import { join, dirname } from "node:path";
import { homedir } from "node:os";
import { fileURLToPath } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const plugin = join(root, "plugins", "power-platform-delivery");
const snapshot = join(root, "evals", "microsoft-skills.json");
const args = process.argv.slice(2);

// Frontmatter description: quoted, plain, or a YAML block scalar (>, >-, |).
const desc = (text) => {
  const fm = text.match(/^---\n([\s\S]*?)\n---/)?.[1] || "";
  const m = fm.match(/^description:[ \t]*(.*)\n?((?:[ \t]+.*\n?)*)/m);
  if (!m) return "";
  const head = m[1].trim(), rest = m[2].trim().replace(/\s*\n\s*/g, " ");
  if (/^[>|][+-]?$/.test(head) || !head) return rest;
  if (head.startsWith('"')) { try { return JSON.parse(head); } catch { return head.replace(/^"|"$/g, ""); } }
  if (head.startsWith("'")) return head.replace(/^'|'$/g, "");
  return (head + " " + rest).trim();
};

if (args[0] === "--refresh") {
  const installed = JSON.parse(readFileSync(join(homedir(), ".claude/plugins/installed_plugins.json"), "utf8")).plugins;
  const want = ["model-apps", "dataverse", "power-automate", "canvas-apps", "pcf", "power-pages"];
  const out = { note: "Snapshot of Microsoft skill descriptions for route-check. Refresh after reviewing plugin updates.", plugins: {}, skills: [] };
  for (const [key, recs] of Object.entries(installed)) {
    const name = key.split("@")[0];
    if (!want.includes(name)) continue;
    const r = recs[recs.length - 1];
    out.plugins[name] = r.version;
    const dir = join(r.installPath, "skills");
    if (!existsSync(dir)) continue;
    for (const s of readdirSync(dir)) {
      const f = join(dir, s, "SKILL.md");
      if (existsSync(f)) out.skills.push({ name: `${name}:${s}`, description: desc(readFileSync(f, "utf8")) });
    }
  }
  writeFileSync(snapshot, JSON.stringify(out, null, 2) + "\n");
  console.log(`snapshot: ${out.skills.length} skills from ${JSON.stringify(out.plugins)}`);
  process.exit(0);
}

// Candidates: our skills and agents, plus Microsoft's snapshot.
const docs = [];
for (const s of readdirSync(join(plugin, "skills"))) docs.push({ name: s, ours: true, text: desc(readFileSync(join(plugin, "skills", s, "SKILL.md"), "utf8")) });
for (const a of readdirSync(join(plugin, "agents"))) docs.push({ name: "agent:" + a.replace(".agent.md", ""), ours: true, text: desc(readFileSync(join(plugin, "agents", a), "utf8")) });
if (existsSync(snapshot)) for (const s of JSON.parse(readFileSync(snapshot, "utf8")).skills) docs.push({ name: s.name, ours: false, text: s.description });

const STOP = new Set("a an and or the to of in on for with from by is are be as at it its this that use used using when whenever any all not no do does into than then via your you our we can only also each per before after which what who how".split(" "));
const stem = (w) => w.replace(/(ies)$/, "y").replace(/(ing|ed|es|s)$/, "");
const tokens = (t) => (t.toLowerCase().match(/[a-z0-9]+/g) || []).filter((w) => w.length > 1 && !STOP.has(w)).map(stem);
const df = new Map();
for (const d of docs) { d.tok = tokens(d.text); for (const w of new Set(d.tok)) df.set(w, (df.get(w) || 0) + 1); }
const idf = (w) => Math.log((docs.length + 1) / ((df.get(w) || 0) + 1)) + 1;
const vec = (toks) => { const v = new Map(); for (const w of toks) v.set(w, (v.get(w) || 0) + 1); for (const [w, c] of v) v.set(w, c * idf(w)); return v; };
const cos = (a, b) => { let dot = 0, na = 0, nb = 0; for (const [w, x] of a) { na += x * x; if (b.has(w)) dot += x * b.get(w); } for (const x of b.values()) nb += x * x; return na && nb ? dot / Math.sqrt(na * nb) : 0; };
for (const d of docs) d.vec = vec(d.tok);
const rank = (prompt) => { const q = vec(tokens(prompt)); return docs.map((d) => ({ name: d.name, ours: d.ours, score: cos(q, d.vec) })).sort((a, b) => b.score - a.score); };

if (args[0] === "--explain") {
  for (const r of rank(args.slice(1).join(" ")).slice(0, 8)) console.log(r.score.toFixed(3), r.name);
  process.exit(0);
}

const cfg = JSON.parse(readFileSync(join(root, "evals", "routing.json"), "utf8"));
const K = cfg.topK || 5;
let fail = 0;
for (const c of cfg.cases) {
  const r = rank(c.prompt), names = r.slice(0, K).map((x) => x.name);
  const missing = (c.expect || []).filter((e) => !names.includes(e));
  const wrongTop = c.notTop && c.notTop.includes(r[0].name);
  const ok = !missing.length && !wrongTop;
  if (!ok) fail++;
  console.log(`${ok ? "ok  " : "FAIL"} ${c.prompt}${ok ? "" : `\n     expected in top ${K}: ${missing.join(", ") || "-"}${wrongTop ? `; must not be first: ${r[0].name}` : ""}\n     got: ${names.join(", ")}`}`);
}
// Our descriptions must stay distinct from each other.
const ours = docs.filter((d) => d.ours);
const limit = cfg.maxOverlap || 0.5;
for (let i = 0; i < ours.length; i++) for (let j = i + 1; j < ours.length; j++) {
  if (ours[i].name.startsWith("agent:") !== ours[j].name.startsWith("agent:")) continue; // a skill and its sub-agent pair by design
  const s = cos(ours[i].vec, ours[j].vec);
  if (s > limit) { fail++; console.log(`FAIL overlap ${s.toFixed(2)} > ${limit}: ${ours[i].name} / ${ours[j].name}`); }
}
console.log(fail ? `${fail} routing problem(s)` : `routing OK (${cfg.cases.length} prompts, ${docs.length} candidates)`);
process.exit(fail ? 1 : 0);

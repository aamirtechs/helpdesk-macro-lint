#!/usr/bin/env node
import { readFileSync, writeFileSync, mkdirSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { parseMacros, lintMacros, buildReport } from "./lint.js";
function usage() { console.error("Usage: helpdesk-macro-lint <macros.json> [--deleted-fields FILE] [--out-dir DIR] [--report FILE] [--findings FILE]"); }
const args = process.argv.slice(2);
if (!args.length) { usage(); process.exit(2); }
let input = null, deletedFile = null, outDir = ".", reportFile = null, findingsFile = null;
for (let i = 0; i < args.length; i++) {
  if (args[i] === "--deleted-fields") deletedFile = args[++i];
  else if (args[i] === "--out-dir") outDir = args[++i];
  else if (args[i] === "--report") reportFile = args[++i];
  else if (args[i] === "--findings") findingsFile = args[++i];
  else if (!input) input = args[i];
  else { usage(); process.exit(2); }
}
if (!input) { usage(); process.exit(2); }
const data = JSON.parse(readFileSync(input, "utf8"));
const macros = parseMacros(data);
const deletedFields = deletedFile ? readFileSync(deletedFile, "utf8").split(/\r?\n/) : [];
const findings = lintMacros(macros, { deletedFields });
reportFile = reportFile ? resolve(reportFile) : join(resolve(outDir), "report.md");
findingsFile = findingsFile ? resolve(findingsFile) : join(resolve(outDir), "findings.csv");
mkdirSync(dirname(reportFile), { recursive: true });
mkdirSync(dirname(findingsFile), { recursive: true });
const esc = v => { const s = String(v ?? ""); return /[",\n]/.test(s) ? '"' + s.replaceAll('"','""') + '"' : s; };
const lines = ["macro_id,title,rule,severity,message"];
for (const f of findings) lines.push([f.macro_id, f.title, f.rule, f.severity, f.message].map(esc).join(","));
writeFileSync(findingsFile, lines.join("\n") + "\n");
writeFileSync(reportFile, buildReport(macros, findings));
const errors = findings.filter(f => f.severity === "error").length;
console.log(`Checked ${macros.length} macros, found ${findings.length} findings (${errors} errors).`);
console.log(`Wrote ${findingsFile}`);
console.log(`Wrote ${reportFile}`);
process.exit(errors ? 1 : 0);

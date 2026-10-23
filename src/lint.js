import { isKnownPlaceholder } from "./placeholders.js";
export function normaliseTitle(title) {
  return String(title || "").toLowerCase().replace(/[^a-z0-9\s]/g, " ").replace(/\s+/g, " ").trim();
}
export function titleSimilarity(a, b) {
  const ta = new Set(normaliseTitle(a).split(" ").filter(Boolean));
  const tb = new Set(normaliseTitle(b).split(" ").filter(Boolean));
  if (!ta.size || !tb.size) return 0;
  let inter = 0;
  for (const t of ta) if (tb.has(t)) inter++;
  return inter / (ta.size + tb.size - inter);
}
export function collectStrings(value, acc = []) {
  if (typeof value === "string") acc.push(value);
  else if (Array.isArray(value)) value.forEach(v => collectStrings(v, acc));
  else if (value && typeof value === "object") Object.values(value).forEach(v => collectStrings(v, acc));
  return acc;
}
export function parseMacros(data) {
  if (Array.isArray(data)) return data;
  if (data && Array.isArray(data.macros)) return data.macros;
  throw new Error("Expected a top-level array or an object with a macros array");
}
export function lintMacros(macros, options = {}) {
  const deleted = new Set((options.deletedFields || []).map(s => s.trim()).filter(Boolean));
  const findings = [];
  const add = (macro, rule, severity, message) => findings.push({ macro_id: macro.id ?? "", title: macro.title ?? "", rule, severity, message });
  for (const macro of macros) {
    const texts = collectStrings(macro);
    const joined = texts.join("\n");
    if (macro.active === false) add(macro, "inactive_macro", "warning", "Macro is marked inactive");
    const placeholderMatches = joined.match(/\{\{[^}]*\}\}/g) || [];
    for (const raw of placeholderMatches) {
      const inner = raw.slice(2, -2).trim();
      if (!inner || /\s/.test(inner) || !/^[a-z0-9_.]+$/i.test(inner)) {
        add(macro, "malformed_placeholder", "error", `Placeholder ${raw} is malformed`);
      } else if (!isKnownPlaceholder(inner)) {
        add(macro, "unknown_placeholder", "error", `Placeholder ${raw} is not in the placeholder dictionary`);
      }
      for (const field of deleted) {
        if (inner === field || inner.endsWith(field) || inner.includes(field)) {
          add(macro, "deleted_field_reference", "warning", `Placeholder ${raw} references deleted field ${field}`);
        }
      }
    }
    const openCount = (joined.match(/\{\{/g) || []).length;
    const closeCount = (joined.match(/\}\}/g) || []).length;
    if (openCount !== closeCount) add(macro, "malformed_placeholder", "error", "Macro text has unbalanced placeholder braces");
    for (const field of deleted) {
      const escaped = field.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
      if (new RegExp(`\\b${escaped}\\b`).test(joined) && !placeholderMatches.join(" ").includes(field)) {
        add(macro, "deleted_field_reference", "warning", `Macro references deleted field ${field}`);
      }
    }
    const httpLinks = joined.match(/http:\/\/[^\s"')\]]+/g) || [];
    for (const link of httpLinks) add(macro, "insecure_link", "warning", `Macro contains a non-https link ${link}`);
  }
  for (let i = 0; i < macros.length; i++) {
    for (let j = i + 1; j < macros.length; j++) {
      const a = macros[i], b = macros[j];
      if (normaliseTitle(a.title) && normaliseTitle(a.title) === normaliseTitle(b.title)) {
        add(b, "duplicate_title", "warning", `Title duplicates macro ${a.id ?? i} "${a.title}"`);
      } else {
        const sim = titleSimilarity(a.title, b.title);
        if (sim >= 0.7) add(b, "near_duplicate_title", "warning", `Title is similar to macro ${a.id ?? i} "${a.title}" (similarity ${sim.toFixed(2)})`);
      }
    }
  }
  return findings;
}
export function buildReport(macros, findings) {
  const counts = {};
  for (const f of findings) counts[f.rule] = (counts[f.rule] || 0) + 1;
  const errors = findings.filter(f => f.severity === "error").length;
  const lines = ["# Macro Lint Report", "", `Total macros checked: ${macros.length}`, `Total findings: ${findings.length}`, `Errors: ${errors}`, `Warnings: ${findings.length - errors}`, "", "## Counts per rule", ""];
  if (!Object.keys(counts).length) lines.push("No findings.");
  for (const [rule, count] of Object.entries(counts).sort((a,b)=>b[1]-a[1])) lines.push(`- ${rule}: ${count}`);
  lines.push("", "## Findings", "");
  if (!findings.length) lines.push("No findings.");
  for (const f of findings) lines.push(`- [${f.severity}] Macro ${f.macro_id} "${f.title}": ${f.rule}, ${f.message}`);
  lines.push("");
  return lines.join("\n");
}

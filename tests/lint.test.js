import { test } from "node:test";
import assert from "node:assert/strict";
import { lintMacros, parseMacros, normaliseTitle, titleSimilarity } from "../src/lint.js";
const clean = [{ id: 1, title: "Greeting", active: true, actions: [{ field: "comment_value", value: "Hi {{ticket.requester.first_name}}, ticket {{ticket.id}} is open." }] }];
test("clean macro produces no findings", () => { assert.equal(lintMacros(clean).length, 0); });
test("parseMacros accepts a top-level array", () => { assert.equal(parseMacros(clean).length, 1); });
test("parseMacros accepts an object with a macros array", () => { assert.equal(parseMacros({ macros: clean }).length, 1); });
test("parseMacros rejects an unexpected shape", () => { assert.throws(() => parseMacros({ items: [] })); });
test("unknown placeholder is an error", () => {
  const findings = lintMacros([{ id: 2, title: "Bad", active: true, actions: [{ field: "comment_value", value: "Hi {{ticket.requester.firstname}}" }] }]);
  assert.ok(findings.some(f => f.rule === "unknown_placeholder" && f.severity === "error"));
});
test("malformed placeholder is flagged", () => {
  const findings = lintMacros([{ id: 3, title: "Broken", active: true, actions: [{ field: "comment_value", value: "Hi {{ticket.requester.name}" }] }]);
  assert.ok(findings.some(f => f.rule === "malformed_placeholder"));
});
test("http link is flagged but https is not", () => {
  const bad = lintMacros([{ id: 4, title: "Link", active: true, actions: [{ field: "comment_value", value: "See http://example.com/old" }] }]);
  assert.ok(bad.some(f => f.rule === "insecure_link"));
  const good = lintMacros([{ id: 5, title: "Link", active: true, actions: [{ field: "comment_value", value: "See https://example.com/new" }] }]);
  assert.equal(good.length, 0);
});
test("deleted field reference is flagged", () => {
  const findings = lintMacros([{ id: 6, title: "Legacy", active: true, actions: [{ field: "comment_value", value: "Code legacy_account_code here" }] }], { deletedFields: ["legacy_account_code"] });
  assert.ok(findings.some(f => f.rule === "deleted_field_reference"));
});
test("inactive macro is flagged", () => {
  const findings = lintMacros([{ id: 7, title: "Old", active: false, actions: [] }]);
  assert.ok(findings.some(f => f.rule === "inactive_macro"));
});
test("duplicate titles are flagged after normalisation", () => {
  const findings = lintMacros([
    { id: 8, title: "Refund Reply", active: true, actions: [] },
    { id: 9, title: "refund reply!", active: true, actions: [] }
  ]);
  assert.ok(findings.some(f => f.rule === "duplicate_title"));
});
test("near-duplicate titles are flagged", () => {
  const findings = lintMacros([
    { id: 10, title: "Password reset help for customers", active: true, actions: [] },
    { id: 11, title: "Password reset help customers", active: true, actions: [] }
  ]);
  assert.ok(findings.some(f => f.rule === "near_duplicate_title"));
});
test("title normalisation strips case and punctuation", () => { assert.equal(normaliseTitle("Refund Reply!"), "refund reply"); });
test("title similarity is 1 for identical token sets", () => { assert.equal(titleSimilarity("Refund reply now", "now reply refund"), 1); });
test("custom field placeholders are accepted", () => {
  const findings = lintMacros([{ id: 12, title: "Custom", active: true, actions: [{ field: "comment_value", value: "Ref {{ticket.custom_field_123}}" }] }]);
  assert.equal(findings.length, 0);
});

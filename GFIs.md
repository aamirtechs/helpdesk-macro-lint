# Good First Issues

## 1. Freshdesk canned-response JSON adapter

Freshdesk canned responses use a different export shape and field names than Zendesk macros. Add an adapter that converts that shape into the internal macro model so all existing rules run unchanged. Include a small synthetic export fixture and tests for the conversion.

## 2. Similar-macro fuzzy-title clustering report

Near-duplicate pairs are useful, but a cluster view would help a support ops lead clean up a large library in one pass. Add a report section that groups macros into title similarity clusters above a configurable threshold. Keep the pairwise findings in the CSV output unchanged.

## 3. Rule: macro sets a field that a trigger also sets

A macro and a trigger setting the same field can cause confusing overwrites for agents. Add a rule that accepts a user-supplied trigger export and flags macros whose actions set a field that any active trigger also sets. Document the export format you support and add tests with a synthetic trigger file.

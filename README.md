# helpdesk-macro-lint
Live page: https://aamirtechs.github.io/helpdesk-macro-lint/

Lint an exported Zendesk or Freshdesk macro library like code: broken or unknown placeholders, dead http links, references to deleted fields, near-duplicate titles and inactive macros, in one Markdown and CSV report.

## Why

Macro libraries grow for years and quietly rot. A renamed requester field breaks a placeholder, an old help page link stays on http, a deleted custom field is still referenced, and three near-identical refund macros confuse new agents. This tool checks an export locally and reports those problems in one pass.

## Install

Requires Node.js 20 or later. No dependencies to install.

```bash
git clone <your fork or copy of this repo>
cd helpdesk-macro-lint
```

## Usage

```bash
node src/cli.js examples/macros.json --deleted-fields examples/deleted-fields.txt --out-dir out
```

This writes `report.md` and `findings.csv` to the output directory. Use `--report FILE` and `--findings FILE` to choose exact paths.

Input is a Zendesk macros JSON export, either a top-level array or an object with a `macros` array. The optional deleted-fields file has one field name per line, see `examples/deleted-fields.txt`.

Exit code is 1 when errors exist. Broken, unknown, and malformed placeholders are errors. Other findings are warnings.

Library use:

```js
import { lintMacros, parseMacros } from "./src/index.js";

const macros = parseMacros(JSON.parse(jsonText));
const findings = lintMacros(macros, { deletedFields: ["legacy_account_code"] });
console.log(findings.length);
```

## Rules

- Placeholder syntax and dictionary: `{{ticket.xxx}}`, `{{ticket.requester.xxx}}`, assignee, organization, group, and current_user fields, plus numeric custom field placeholders such as `{{ticket.custom_field_123}}`.
- Unknown placeholders and malformed or unbalanced placeholders are errors.
- Links starting with http:// are flagged. Use https.
- References to fields listed in the deleted-fields file are flagged.
- Duplicate titles after normalisation (case and punctuation removed) and near-duplicate titles by token overlap similarity of 0.7 or higher are flagged.
- Macros with `"active": false` are flagged as inactive.

## Example

Input is `examples/macros.json`, four macros including a duplicate refund title, an unknown placeholder, an http link, an inactive legacy macro, and references to the deleted fields in `examples/deleted-fields.txt`:

```text
legacy_account_code
ticket.custom_field_999
```

Real output captured by running the command above:

```text
Checked 4 macros, found 6 findings (1 errors).
```

Real `findings.csv` output:

```csv
macro_id,title,rule,severity,message
102,Refund Reply!,unknown_placeholder,error,Placeholder {{ticket.requester.firstname}} is not in the placeholder dictionary
102,Refund Reply!,insecure_link,warning,Macro contains a non-https link http://example.com/old-refund-page
103,Legacy account closure,inactive_macro,warning,Macro is marked inactive
103,Legacy account closure,deleted_field_reference,warning,Macro references deleted field legacy_account_code
103,Legacy account closure,deleted_field_reference,warning,Macro references deleted field ticket.custom_field_999
102,Refund Reply!,duplicate_title,warning,"Title duplicates macro 101 ""Refund reply"""
```

Real `report.md` output:

```markdown
# Macro Lint Report

Total macros checked: 4
Total findings: 6
Errors: 1
Warnings: 5

## Counts per rule

- deleted_field_reference: 2
- unknown_placeholder: 1
- insecure_link: 1
- inactive_macro: 1
- duplicate_title: 1

## Findings

- [error] Macro 102 "Refund Reply!": unknown_placeholder, Placeholder {{ticket.requester.firstname}} is not in the placeholder dictionary
- [warning] Macro 102 "Refund Reply!": insecure_link, Macro contains a non-https link http://example.com/old-refund-page
- [warning] Macro 103 "Legacy account closure": inactive_macro, Macro is marked inactive
- [warning] Macro 103 "Legacy account closure": deleted_field_reference, Macro references deleted field legacy_account_code
- [warning] Macro 103 "Legacy account closure": deleted_field_reference, Macro references deleted field ticket.custom_field_999
- [warning] Macro 102 "Refund Reply!": duplicate_title, Title duplicates macro 101 "Refund reply"
```

## Tests

```bash
npm test
```

## License

MIT, see LICENSE.

---
trigger: model_decision
description: before making a commit to git
---

**CRITICAL:** All rules below are mandatory.

## Testing

DO NOT commit unless the following are true:

- Analyze the workspace to make sure sensative information is not being commited and only the files we want to commit are being saved.
- All **tests** must be written BEFORE writing code.
- All code MUST be commented to pass tests.
- Tests CANNOT be skipped or bypassed.
- Tests **MUST PASS**
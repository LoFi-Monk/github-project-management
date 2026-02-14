## Comment Rules

- **Only open threads for actionable items**: bugs, regressions, missing validation, security issues.
- **Do NOT open threads for confirmations** like "this looks correct" or "this is safe." These create noise.
- **Use `suggestion` blocks** for concrete code fixes whenever possible. This enables auto-application.
- **Prefix comment IDs** with severity: `BUG_`, `SUGGESTION_`, or `QUESTION_`.

## Re-Review Scope

- On subsequent pushes, **only review changed files** in the new commits.
- **Do NOT re-analyze files** that were unchanged since the last review.
- If a previous comment was resolved, do not re-open the same concern unless the fix introduced a new issue.

## Severity Guidelines

| Prefix        | When to Use                                       | Example                               |
| ------------- | ------------------------------------------------- | ------------------------------------- |
| `BUG_`        | Must fix before merge — causes incorrect behavior | Off-by-one error, missing null check  |
| `SUGGESTION_` | Nice-to-have improvement, not blocking            | Better variable name, slight refactor |
| `QUESTION_`   | Needs clarification from author                   | "Is this intentional?"                |

## Skip These

- **`chore:` prefixed PRs** — cleanup, formatting, file deletions. Minimal review needed.
- **Documentation-only changes** — `.md` files, comments, READMEs.
- **Confirming correct behavior** — If the code is correct, don't open a thread saying so.

## 📝 Code Review Checklist

### 1. 🎯 Correctness & Logic

- [ ] Does the code implement the intended logic correctly?
- [ ] Are edge cases handled (nulls, empty arrays, zeros, etc.)?
- [ ] Are there any off-by-one errors?
- [ ] Does the code match the design/specs?

### 2. 🛡️ Security

- [ ] Are there any obvious vulnerabilities (XSS, SQLi, etc.)?
- [ ] Is input validated properly?
- [ ] Are secrets/tokens handled securely?
- [ ] Are there any race conditions?

### 3. 🏗️ Architecture & Design

- [ ] Does the code follow SOLID principles?
- [ ] Is the code modular and reusable?
- [ ] Are abstractions used appropriately?
- [ ] Is there unnecessary coupling between components?

### 4. 🧪 Testing

- [ ] Are there sufficient unit tests?
- [ ] Do tests cover edge cases?
- [ ] Are integration tests needed?
- [ ] Do tests pass?

### 5. ⚡ Performance

- [ ] Are there any unnecessary loops or operations?
- [ ] Are database queries optimized?
- [ ] Is memory usage reasonable?
- [ ] Are there any N+1 query issues?

### 6. 🧹 Code Quality

- [ ] Is the code readable and maintainable?
- [ ] Are variable/function names descriptive?
- [ ] Is there proper error handling?
- [ ] Is the code DRY (Don't Repeat Yourself)?

### 7. 📝 Documentation

- [ ] Are complex parts of the code commented?
- [ ] Are function signatures clear?
- [ ] Is the PR description accurate?
- [ ] Are there any missing README updates?

### 8. 🎨 UI/UX (if applicable)

- [ ] Is the UI intuitive and easy to use?
- [ ] Is the design consistent with the rest of the app?
- [ ] Are there any accessibility issues?
- [ ] Does the UI work on different screen sizes?

### 9. ⚙️ Configuration

- [ ] Are configuration changes documented?
- [ ] Are there any breaking changes to the config?
- [ ] Are default values sensible?
- [ ] Is the configuration easy to understand?

### 10. 🔄 Git & Version Control

- [ ] Is the commit history clean?
- [ ] Are commit messages descriptive?
- [ ] Is the PR focused and atomic?
- [ ] Are there any merge conflicts?

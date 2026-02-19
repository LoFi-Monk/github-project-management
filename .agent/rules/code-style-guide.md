---
trigger: always_on
---

# Workflow
**PROTOCOL:** 
REQUIRED SKILLS USED: `.agent\skills\tdd`, `.agent\skills\pre-review-check`, `.agent\skills\ears-method`, `.agent\skills\mermaid-diagrams` and `.agent\skills\brainstorming`

MUST follow git branch protection rules `.agent\docs\Main Branch Protection.json`

1. use brainstorming skill when planning.
2. Follow TDD Skill workflow.
3. Self audit using pre-review-skill
4. After approval from user submit a DRAFT PR
5. Wait for CI tests to pass. Only proceed once CI passes.
6. Verify CI has passed
7. Mark PR as Ready for review
8. Await review from Devin.
9. Consider devins review. 
- look for comments from devin that are bugs and address those conversations, look over any other suggestions from devin and apply any that seem sensible and do not go against our design and decisions. Then address, reply and resolve the conversations.
10. confirm CI is still passing.
11. if all checks pass and conversations are resolved ask the user if it is ok to merge.

# Best Practices
- When making changes to files, first understand the file's code conventions. Mimic code style, use existing libraries and utilities, and follow existing patterns.
- NEVER assume that a given library is available, even if it is well known. Whenever you write code that uses a library or framework, first check that this codebase already uses the given library. For example, you might look at neighboring files, or check the package.json (or cargo.toml, and so on depending on the language).

- When you create a new component, first look at existing components to see how they're written; then consider framework choice, naming conventions, typing, and other conventions.
- When you edit a piece of code, first look at the code's surrounding context (especially its imports) to understand the code's choice of frameworks and libraries. Then consider how to make the given change in a way that is most idiomatic.


# Code Comments

Only write TSDoc comments that explain the intent and guarantees of the code; comments must never restate implementation details, control flow, or names already expressed by the code. A comment is valid only if it explicitly answers at least one of: why this exists, what it guarantees to callers, or what callers must never assume. Vague, speculative, or hedging language is forbidden, and comments that would become false if the implementation changes but behavior does not are considered incorrect. Ambiguous or misleading comments are worse than no comment and must be removed.

## Required TSDoc Shape

When a TSDoc comment exists, it must follow this order:
/\*\*

- Intent (why this exists).
-
- Guarantees and contracts.
-
- Non-obvious constraints or misuse warnings.
  \*/
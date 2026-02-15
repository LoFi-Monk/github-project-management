# ADR 0003: Strict Documentation Policy

## Status

Accepted

## Context

Documentation in previous iterations often decayed into "speculative fiction," describing future features as if they were already implemented. This led to confusion about the systems' actual capabilities.

## Decision

Enforce a **Strict Documentation Policy**:

- Architecture documentation must strictly reflect the _current_ state of the code.
- Future plans must be isolated in the `plans/` directory or explicitly marked as "Phase X" or "Proposed".
- Any code change that alters system guarantees must be accompanied by a documentation update.

## Consequences

### Positive

- **Trust**: Developers can rely on documentation as a source of truth for the active codebase.
- **Clarity**: Onboarding becomes faster as the delta between docs and code is minimized.

### Negative

- Increased overhead for feature development as documentation must be updated in sync.

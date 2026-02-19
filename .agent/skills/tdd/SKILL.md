---
name: tdd
description: Use this skill whenever writing TypeScript or JavaScript code — building features, creating modules, implementing classes/functions, fixing bugs, or refactoring. Enforces Red-Green-Refactor TDD workflow, TSDoc on all public APIs, SOLID principles, DRY, and intent-focused comments (never mechanical descriptions). Apply even when the user doesn't explicitly mention tests, documentation, or design patterns.
---

# TDD Skill

This skill enforces a disciplined workflow: write a failing test first, make it pass with minimal
code, then improve the design — all while keeping every public symbol documented with TSDoc,
applying SOLID and DRY principles, and writing comments that explain intent, not mechanics.

---

## The Three Phases

Work through every coding task in exactly this order. Never skip ahead.

### 🔴 Phase 1 — RED: Write a Failing Test

Before writing a single line of implementation, write a test that describes the desired behavior.
The test **must fail** when you first run it — that's the point. A test that passes before any
implementation exists is a signal that it's testing the wrong thing (or nothing at all).

**What to do in the RED phase:**

- Identify the smallest unit of behavior to implement next
- Write a test file (or add to an existing one) that asserts that behavior
- Include a TSDoc comment on the `describe` or top-level `it`/`test` block explaining what
  scenario is being tested
- Run the tests and confirm the new test **fails** with a meaningful error — not a syntax error
  or import error, but a real assertion failure
- Show the failing test output to confirm RED state before moving on

**RED phase TSDoc pattern for test files:**

```ts
/**
 * Tests for {@link calculateDiscount}
 * Covers standard discount rules, edge cases, and error conditions.
 */
describe("calculateDiscount", () => {
  /**
   * @remarks
   * A 0% rate should return the original price unchanged.
   */
  it("returns the original price when discount rate is 0", () => {
    expect(calculateDiscount(100, 0)).toBe(100);
  });
});
```

---

### 🟢 Phase 2 — GREEN: Write the Minimum Code to Pass

Write only the implementation needed to make the failing test pass. Resist the urge to generalize
or build ahead. Ugly code is fine here — the goal is a green test suite, not beautiful code.

**What to do in the GREEN phase:**

- Write the simplest implementation that satisfies the failing test
- Add TSDoc comments to every exported function, class, interface, type alias, and enum
- Run the tests and confirm **all tests pass** — including previously passing ones
- Do not refactor yet; just get to green

**GREEN phase TSDoc requirements — every exported symbol must have:**

````ts
/**
 * [One-line summary of what this does.]
 *
 * @param paramName - Description of the parameter
 * @returns Description of the return value
 * @throws {ErrorType} When this throws and why
 *
 * @example
 * ```ts
 * const result = myFunction('hello');
 * // result => 'HELLO'
 * ```
 */
export function myFunction(paramName: string): string {
  return paramName.toUpperCase();
}
````

**TSDoc tags to use by context:**

| Symbol type        | Required tags                                               |
| ------------------ | ----------------------------------------------------------- |
| Function/method    | `@param`, `@returns`, `@throws` (if applicable), `@example` |
| Class              | Summary sentence, `@example`                                |
| Interface/type     | Summary + per-property `/** inline comment */`              |
| Enum               | Summary + per-member `/** inline comment */`                |
| Generic type param | `@typeParam T - description`                                |

---

### 🔵 Phase 3 — REFACTOR: Improve the Design

Now that tests are green, improve the code without changing behavior. Tests are your safety net.
If any test goes red during refactoring, stop and fix it before continuing.

**What to do in the REFACTOR phase:**

- Eliminate duplication — extract shared logic into helper functions (DRY)
- Improve naming — variable names, function names, and file names should reveal intent
- Simplify complex conditionals — consider guard clauses, early returns, or decomposition
- Apply SOLID principles — see the dedicated section below for each principle
- Update TSDoc comments if the refactoring changes behavior, signatures, or assumptions
- Run the full test suite after each refactor step to stay green
- Only stop refactoring when the code is clean and all tests pass

**Refactor checklist before declaring done:**

- [ ] No duplicated logic (DRY)
- [ ] Each class/module has one reason to change (SRP)
- [ ] New behavior added by extension, not by editing existing code (OCP)
- [ ] No fat interfaces forcing unused dependencies (ISP / DIP)
- [ ] All functions do one thing
- [ ] All exported symbols have TSDoc (correct tags, examples, and throws documentation)
- [ ] All inline comments explain _why_, not _what_ the code does
- [ ] Test descriptions still accurately reflect what they're testing
- [ ] Full test suite is green

---

## TSDoc Standards Reference

### Core Tags

````ts
/**
 * Brief summary (shown in IDE hover). Keep to one line when possible.
 *
 * Longer description if needed. Can span multiple paragraphs.
 *
 * @param name - The user's display name
 * @param age  - Age in years; must be >= 0
 *
 * @returns A formatted greeting string
 *
 * @throws {RangeError} If `age` is negative
 *
 * @example
 * ```ts
 * greet('Alice', 30); // => 'Hello, Alice (age 30)'
 * ```
 *
 * @remarks
 * Use this for contextual notes that don't fit the summary.
 *
 * @see {@link formatName} for the underlying name formatter
 *
 * @since 1.2.0
 *
 * @deprecated Use {@link greetUser} instead, which supports localization.
 */
````

### Documenting Interfaces

```ts
/** Represents a paginated API response. */
export interface PaginatedResult<T> {
  /** The items returned for this page. */
  items: T[];
  /** Total number of items across all pages. */
  total: number;
  /** The current page number (1-indexed). */
  page: number;
  /** Whether there is a subsequent page. */
  hasNextPage: boolean;
}
```

### Documenting Classes

````ts
/**
 * Manages connection pooling for database clients.
 *
 * @example
 * ```ts
 * const pool = new ConnectionPool({ max: 10, idleTimeout: 30_000 });
 * const conn = await pool.acquire();
 * ```
 */
export class ConnectionPool {
  /**
   * Creates a new connection pool.
   * @param options - Pool configuration options
   */
  constructor(private readonly options: PoolOptions) {}

  /**
   * Acquires an available connection, waiting if none are free.
   * @returns A database connection
   * @throws {TimeoutError} If no connection is available within `options.acquireTimeout`
   */
  async acquire(): Promise<Connection> { ... }
}
````

---

## SOLID Principles

Apply these during the REFACTOR phase. They're not a checklist to mechanically tick off — they're
lenses for noticing design problems. When something is painful to test, extend, or reuse, one of
these principles is usually the diagnosis.

### S — Single Responsibility Principle

A class or module should have one reason to change. If you find yourself writing "and" when
describing what a class does ("it validates _and_ persists the user"), that's two responsibilities.
Split them. Small, focused classes are easier to test in isolation and easier to understand.

```ts
// ❌ Two reasons to change: formatting logic AND persistence logic
class UserReport {
  format(user: User): string { ... }
  save(user: User): void { ... }
}

// ✅ Each class has one job
class UserReportFormatter { format(user: User): string { ... } }
class UserReportRepository { save(report: string): void { ... } }
```

### O — Open/Closed Principle

Code should be open for extension but closed for modification. When adding a new variant of
behavior requires editing existing, tested code, that's a signal to introduce an abstraction
(interface, strategy, or plugin point) so new behavior can be added without touching what works.

```ts
// ❌ Adding a new shape requires editing this function
function area(shape: { kind: string }): number {
  if (shape.kind === 'circle') { ... }
  if (shape.kind === 'square') { ... }
}

// ✅ New shapes extend the interface without touching existing code
interface Shape { area(): number; }
class Circle implements Shape { area() { ... } }
class Square implements Shape { area() { ... } }
```

### L — Liskov Substitution Principle

Subtypes must be usable wherever their parent type is expected, without breaking the program.
If an override removes behavior, narrows accepted inputs, or throws where the parent didn't,
it violates LSP. Prefer composition over inheritance when substitution can't be guaranteed.

### I — Interface Segregation Principle

Don't force a class to implement methods it doesn't need. Large, catch-all interfaces create
awkward "stub" implementations and tight coupling. Split interfaces by the role of the consumer,
not the capabilities of the implementor.

```ts
// ❌ A read-only consumer is forced to implement write methods
interface Storage {
  read(key: string): string;
  write(key: string, val: string): void;
}

// ✅ Consumers depend only on what they use
interface Readable {
  read(key: string): string;
}
interface Writable {
  write(key: string, val: string): void;
}
```

### D — Dependency Inversion Principle

High-level modules should not depend on low-level modules. Both should depend on abstractions.
Inject dependencies (via constructor or parameter) rather than instantiating them inside a class.
This makes units testable without real databases, HTTP clients, or file systems.

```ts
// ❌ Hard dependency — impossible to test without a real database
class OrderService {
  private db = new PostgresDatabase();
}

// ✅ Depends on an abstraction — inject a mock in tests
class OrderService {
  constructor(private readonly db: Database) {}
}
```

---

## DRY — Don't Repeat Yourself

Every piece of knowledge should have a single, authoritative representation in the codebase.
Duplication is not just copy-pasted code — it's also parallel structures, magic numbers repeated
in multiple places, and logic that encodes the same rule in two different spots.

**Signs of DRY violations to watch for:**

- The same validation logic appears in multiple functions
- A magic number or string literal appears in more than one place → extract to a named constant
- Two functions do subtly different versions of the same thing → unify with a parameter
- The same data transformation is written twice → extract a helper

**DRY does not mean "never repeat a line of code."** Two lines that look identical but represent
different concepts should stay separate. Unify things that encode the _same knowledge_, not things
that merely look similar.

---

## Commenting Intent, Not Mechanics

Comments should explain the _why_ and _what for_ — the reasoning, the constraint, the business
rule — not restate what the code already says plainly. If a reader has to ask "but why does it
do that?", a comment belongs there. If the code already answers "what is happening?", a comment
is noise.

**The test:** cover the code and read only the comment. If the comment adds no information beyond
what the code would reveal on its own, delete it.

### ❌ Mechanic comments (never write these)

```ts
// increment i
i++;

// check if user is active
if (user.isActive) { ... }

// return the result
return result;
```

### ✅ Intent comments (explain the reasoning behind a decision)

```ts
// Retry up to 3 times — the payment gateway occasionally returns 503 on first attempt
// due to a known cold-start issue in their infrastructure.
for (let attempt = 0; attempt < 3; attempt++) { ... }

// Exclude soft-deleted users here rather than in the query so the count
// stays consistent with what the UI already showed before this action.
const visible = users.filter(u => !u.deletedAt);

// Sort descending so the most recent item is pre-selected in the dropdown
// without requiring the user to scroll. Product decision from UX review 2024-03.
items.sort((a, b) => b.createdAt - a.createdAt);
```

### In TSDoc specifically

TSDoc summaries and `@remarks` should explain the purpose and contract of the function —
what problem it solves and under what conditions — not narrate its implementation.

```ts
// ❌ Mechanic TSDoc — describes the algorithm, not the purpose
/**
 * Iterates over the array and checks each element against the predicate,
 * returning the first element for which the predicate returns true.
 */

// ✅ Intent TSDoc — explains why you'd call this and what it guarantees
/**
 * Returns the highest-priority pending task for the given user, or `undefined`
 * if no actionable tasks remain. Priority is determined by due date, then
 * by manual sort order set in the dashboard.
 */
```

---

## Workflow in Practice

When given a coding task, work through it like this:

1. **Understand the requirement** — restate what you're building in one sentence
2. **RED** — write a failing test (show the failing output)
3. **GREEN** — write minimum implementation with TSDoc (show passing output)
4. **REFACTOR** — clean up code and comments (show final green test suite)
5. **Repeat** for the next unit of behavior

If a task is large, break it into small vertical slices and run the RED → GREEN → REFACTOR
cycle independently for each slice. Don't accumulate a lot of untested code.

---

## Common Mistakes to Avoid

- **Writing implementation before a test** — always RED first, no exceptions
- **Making tests pass without running them** — always execute and confirm the output
- **Skipping TSDoc on "obvious" functions** — there's no such thing; document everything public
- **Refactoring during GREEN** — get to green first, then refactor
- **Over-mocking** — test behavior, not implementation; mock at boundaries (I/O, network, time)
- **Writing tests after the fact** — retroactive tests don't prove the design was test-driven
- **Mechanic comments** — never write comments that restate what the code already says; explain the _why_
- **DRY by coincidence** — don't merge two things just because they look alike; only unify logic that encodes the same knowledge
- **God classes** — a class that does too many things violates SRP and becomes impossible to test cleanly; split early
- **Hardcoding dependencies** — instantiating collaborators inside a class violates DIP and makes unit testing painful; inject them instead
- **Skipping SOLID during GREEN** — it's fine to write simple code in GREEN, but REFACTOR must address any obvious violations before declaring done

---

## File Naming Conventions

- Test files: `*.test.ts` or `*.spec.ts` co-located with source, or in a `__tests__/` directory
- One test file per source module
- Test `describe` blocks mirror the module or class name being tested

## Completion

**Critical:**
When you are done with the task, You **MUST** use the following skill to judge your work before making commits and before code review: `.agent/skills/pre-review-check`

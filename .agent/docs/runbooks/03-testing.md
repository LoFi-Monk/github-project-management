# 3. Testing Standards & Troubleshooting

## 1. Context

We use **Vitest** for unit and integration testing. Due to the monorepo structure and native bindings (`libsql`) on Windows, we use a custom test runner to ensure stability.

## 2. Running Tests

### Standard Command (Recommended)

Run all tests sequentially using the custom runner:

```bash
node scripts/test-all.js
```

**Why?** This script bypasses `pnpm`'s shell orchestration issues on Windows and ensures that each package runs in a fresh process, preventing `libsql` binding deadlocks.

### Package-Specific Tests

You can run tests for a specific package directly if you are debugging:

```bash
pnpm --filter @lofi-pm/server test
# OR
cd apps/server && npx vitest run
```

> **Warning:** Avoid running `pnpm -r test` directly on Windows as it may hang or fail to parse package names correctly.

## 3. Writing Tests

### Asynchronous Cleanup

**CRITICAL:** All tests that interact with the database or WebSockets must explicitly `await` cleanup in `afterEach`.

```ts
afterEach(async () => {
  // 1. Close application/server first
  if (app) await app.close();

  // 2. Close database connection explicitly
  await closeDb();
});
```

Failure to `await closeDb()` will cause the test process to hang at the end of execution.

## 4. Troubleshooting Hangs

If standard tests are hanging:

1.  **Check `closeDb()`**: Ensure every test file calls it and awaits it.
2.  **Check WebSockets**: Ensure `EventBus.clear()` is called to terminate active client connections.
3.  **Force Exit**: If locally debugging, you can try `npx vitest run --forceRerunTriggers` or manual execution.
4.  **Isolate**: Run a single test file: `npx vitest apps/server/test/ws/sync.test.ts`.

## 5. TSDoc Verification

To verify documentation coverage:

```bash
pnpm check:docs
```

This runs `scripts/verify-docs.ts` which uses `ts-morph` to ensure all exports have JSDoc comments.

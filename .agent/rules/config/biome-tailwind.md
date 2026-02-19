# Biome & Tailwind Configuration

**CRITICAL RULE: DO NOT REMOVE TAILWIND SUPPORT**

When editing `biome.json` or `*.css` files, you MUST preserve the following settings to prevent CI failures.

## 1. Biome Configuration

The root `biome.json` is configured to handle Tailwind CSS directives (`@tailwind`, `@layer`, `@apply`).

- **Do NOT** remove `files.ignoreUnknown: false`.
- **Do NOT** enforce `noUnknownAtRules` on CSS files.
- **DO** ensure `tailwindDirectives` support is enabled if available in your version, OR rely on `ignoreUnknown` as the fallback.

## 2. CSS Files

`apps/web/src/index.css` contains standard Tailwind directives.

- **Do NOT** delete or comment out `@tailwind base;` etc. to "fix" lint errors.
- **Do NOT** enclose them in `/* ... */` comments.

If Biome complains about "unknown at-rule", the solution is to **configure Biome**, not to break the CSS.

## 3. Ignored Files

`apps/web/src/index.css` may be ignored in `.biomeignore` as a last resort. Check `.biomeignore` before editing.

import type { TestingLibraryMatchers } from '@testing-library/jest-dom/matchers';
import '@testing-library/jest-dom';

declare module 'vitest' {
  interface Assertion<T = unknown>
    extends TestingLibraryMatchers<typeof expect.stringContaining, T> {}
}

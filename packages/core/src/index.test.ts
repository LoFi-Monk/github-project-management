import { describe, expect, it } from 'vitest';
import * as Core from './index';

describe('Core Exports', () => {
  it('should export Card schema', () => {
    expect(Core.Card).toBeDefined();
  });
  it('should export mergeCards function', () => {
    expect(Core.mergeCards).toBeDefined();
  });
});

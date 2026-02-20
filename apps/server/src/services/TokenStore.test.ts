import keytar from 'keytar';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { TokenStore } from './TokenStore';

vi.mock('keytar', () => ({
  default: {
    getPassword: vi.fn(),
    setPassword: vi.fn(),
    deletePassword: vi.fn(),
  },
}));

describe('TokenStore', () => {
  let tokenStore: TokenStore;

  beforeEach(() => {
    vi.clearAllMocks();
    tokenStore = new TokenStore();
  });

  it('should return null when no token is stored', async () => {
    // @ts-expect-error - mocked keytar
    vi.mocked(keytar.getPassword).mockResolvedValue(null);
    const token = await tokenStore.getToken();
    expect(token).toBeNull();
    // @ts-expect-error
    expect(keytar.getPassword).toHaveBeenCalledWith('lofi-pm', 'github-oauth-token');
  });

  it('should set and get a token', async () => {
    const testToken = 'gho_12345';
    // @ts-expect-error
    vi.mocked(keytar.getPassword).mockResolvedValue(testToken);

    await tokenStore.setToken(testToken);
    // @ts-expect-error
    expect(keytar.setPassword).toHaveBeenCalledWith('lofi-pm', 'github-oauth-token', testToken);

    const retrieved = await tokenStore.getToken();
    expect(retrieved).toBe(testToken);
  });

  it('should delete a token', async () => {
    await tokenStore.deleteToken();
    // @ts-expect-error
    expect(keytar.deletePassword).toHaveBeenCalledWith('lofi-pm', 'github-oauth-token');
  });
});

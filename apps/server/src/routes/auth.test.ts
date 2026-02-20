import { beforeEach, describe, expect, it, vi } from 'vitest';
import { buildApp } from '../app';
import { GitHubAuthService } from '../services/GitHubAuthService';
import { TokenStore } from '../services/TokenStore';

describe('Auth Routes', () => {
  let authService: GitHubAuthService;
  let tokenStore: TokenStore;

  beforeEach(() => {
    vi.clearAllMocks();
    tokenStore = new TokenStore();
    authService = new GitHubAuthService(tokenStore, 'test-client-id');
  });

  it('POST /auth/github/device-code should initiate flow', async () => {
    vi.spyOn(authService, 'initiateDeviceFlow').mockResolvedValue({
      userCode: 'CODE-123',
      verificationUri: 'https://github.com/login/device',
      expiresIn: 900,
      interval: 5,
    });

    const app = await buildApp({ githubAuthService: authService });
    const response = await app.inject({
      method: 'POST',
      url: '/auth/github/device-code',
    });

    expect(response.statusCode).toBe(200);
    expect(response.json()).toEqual({
      userCode: 'CODE-123',
      verificationUri: 'https://github.com/login/device',
      expiresIn: 900,
      interval: 5,
    });
  });

  it('GET /auth/github/poll should check status', async () => {
    vi.spyOn(authService, 'completeDeviceFlow').mockResolvedValue({
      authenticated: true,
      username: 'lofi-monk',
    });

    const app = await buildApp({ githubAuthService: authService });
    const response = await app.inject({
      method: 'GET',
      url: '/auth/github/poll',
    });

    expect(response.statusCode).toBe(200);
    expect(response.json()).toEqual({
      authenticated: true,
      username: 'lofi-monk',
    });
  });

  it('GET /auth/github/status should return current status', async () => {
    vi.spyOn(authService, 'getAuthStatus').mockResolvedValue({
      authenticated: true,
      username: 'lofi-monk',
    });

    const app = await buildApp({ githubAuthService: authService });
    const response = await app.inject({
      method: 'GET',
      url: '/auth/github/status',
    });

    expect(response.statusCode).toBe(200);
    expect(response.json()).toEqual({
      authenticated: true,
      username: 'lofi-monk',
    });
  });

  it('POST /auth/github/logout should clear session', async () => {
    vi.spyOn(authService, 'logout').mockResolvedValue();

    const app = await buildApp({ githubAuthService: authService });
    const response = await app.inject({
      method: 'POST',
      url: '/auth/github/logout',
    });

    expect(response.statusCode).toBe(204);
  });
});

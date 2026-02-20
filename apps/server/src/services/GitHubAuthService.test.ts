import { createOAuthDeviceAuth } from '@octokit/auth-oauth-device';
import { request } from '@octokit/request';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { GitHubAuthService } from './GitHubAuthService';
import { TokenStore } from './TokenStore';

vi.mock('@octokit/auth-oauth-device', () => ({
  createOAuthDeviceAuth: vi.fn(),
}));

vi.mock('@octokit/request', () => ({
  request: vi.fn(),
}));

describe('GitHubAuthService', () => {
  let authService: GitHubAuthService;
  let tokenStore: TokenStore;
  const clientId = 'Ov23liZ2QIZU9jiDah4b';

  beforeEach(() => {
    vi.clearAllMocks();
    tokenStore = new TokenStore();
    vi.spyOn(tokenStore, 'getToken').mockResolvedValue(null);
    vi.spyOn(tokenStore, 'setToken').mockResolvedValue();
    vi.spyOn(tokenStore, 'deleteToken').mockResolvedValue();

    authService = new GitHubAuthService(tokenStore, clientId);
  });

  describe('initiateDeviceFlow', () => {
    it('should initiate device flow and return verification details', async () => {
      const mockVerification = {
        user_code: 'WDJB-MJHT',
        verification_uri: 'https://github.com/login/device',
        expires_in: 900,
        interval: 5,
        device_code: 'device_123',
      };

      const mockAuth = vi.fn();
      vi.mocked(createOAuthDeviceAuth).mockReturnValue(mockAuth as any);

      const promise = authService.initiateDeviceFlow();

      const onVerification = vi.mocked(createOAuthDeviceAuth).mock.calls[0][0].onVerification;
      await onVerification(mockVerification);

      const result = await promise;

      expect(result).toEqual({
        userCode: 'WDJB-MJHT',
        verificationUri: 'https://github.com/login/device',
        expiresIn: 900,
        interval: 5,
      });

      expect(mockAuth).toHaveBeenCalledWith(
        expect.objectContaining({
          type: 'oauth',
          request: expect.objectContaining({
            signal: expect.any(AbortSignal),
          }),
        }),
      );
      expect(createOAuthDeviceAuth).toHaveBeenCalledWith(
        expect.objectContaining({
          clientType: 'oauth-app',
          clientId: clientId,
          scopes: ['repo', 'project'],
        }),
      );
    });

    it('should throw if clientId is missing', async () => {
      const invalidService = new GitHubAuthService(tokenStore, '');
      await expect(invalidService.initiateDeviceFlow()).rejects.toThrow(
        'GitHub Client ID is required',
      );
    });
  });

  describe('completeDeviceFlow', () => {
    it('should wait for auth, store token, and return status', async () => {
      const mockAuth = vi.fn().mockResolvedValue({
        type: 'token',
        token: 'gho_test_token',
      });
      const mockHook = vi.fn().mockResolvedValue({
        data: { login: 'lofi-monk' },
      });
      (mockAuth as any).hook = mockHook;
      vi.mocked(createOAuthDeviceAuth).mockReturnValue(mockAuth as any);

      const initiatePromise = authService.initiateDeviceFlow();
      const onVerification = vi.mocked(createOAuthDeviceAuth).mock.calls[0][0].onVerification;
      await onVerification({
        user_code: 'A',
        verification_uri: 'B',
        expires_in: 1,
        interval: 1,
      } as any);
      await initiatePromise;

      // Status should now be ready
      const status = await authService.completeDeviceFlow();

      expect(mockAuth).toHaveBeenCalledWith(
        expect.objectContaining({
          type: 'oauth',
          request: expect.objectContaining({
            signal: expect.any(AbortSignal),
          }),
        }),
      );
      expect(tokenStore.setToken).toHaveBeenCalledWith('gho_test_token');
      expect(status).toEqual({
        authenticated: true,
        username: 'lofi-monk',
      });
    });
  });

  describe('getAuthStatus', () => {
    it('should return unauthenticated if no token is stored', async () => {
      vi.mocked(tokenStore.getToken).mockResolvedValue(null);
      const status = await authService.getAuthStatus();
      expect(status).toEqual({ authenticated: false });
    });

    it('should return authenticated if valid token is stored', async () => {
      vi.mocked(tokenStore.getToken).mockResolvedValue('gho_valid');
      vi.mocked(request).mockResolvedValue({ data: { login: 'lofi-monk' } } as any);

      const status = await authService.getAuthStatus();

      expect(request).toHaveBeenCalledWith('GET /user', {
        headers: { authorization: 'token gho_valid' },
      });
      expect(status).toEqual({
        authenticated: true,
        username: 'lofi-monk',
      });
    });

    it('should return unauthenticated if token is invalid or request fails', async () => {
      vi.mocked(tokenStore.getToken).mockResolvedValue('gho_invalid');
      vi.mocked(request).mockRejectedValue(new Error('Unauthorized'));

      const status = await authService.getAuthStatus();
      expect(status).toEqual({ authenticated: false });
    });
  });

  describe('logout', () => {
    it('should delete token from store', async () => {
      await authService.logout();
      expect(tokenStore.deleteToken).toHaveBeenCalled();
    });
  });
});

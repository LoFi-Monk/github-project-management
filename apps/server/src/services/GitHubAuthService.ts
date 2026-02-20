import type { DeviceCodeResponse, GitHubAuthStatus } from '@lofi-pm/core';
import { createOAuthDeviceAuth } from '@octokit/auth-oauth-device';
import { request } from '@octokit/request';
import type { TokenStore } from './TokenStore';

/**
 * Service for handling GitHub Authentication via OAuth Device Flow.
 *
 * Intent: Encapsulates GitHub-specific authentication logic using the Octokit ecosystem.
 *
 * Guarantees:
 * - Initiates Device Flow and returns user-facing verification codes.
 * - Handles polling and token persistence (Slice 3).
 *
 * Constraints:
 * - Requires a valid GitHub Client ID.
 * - Maintains transient state (auth instances) during the flow.
 */
export class GitHubAuthService {
  private authInstance: any | null = null;
  private pendingAuth: Promise<any> | null = null;

  constructor(
    private tokenStore: TokenStore,
    private clientId: string,
  ) {}

  /**
   * Initiates the GitHub OAuth Device Flow.
   *
   * @returns A promise that resolves to the verification details (user code and URI).
   * @throws Error if clientId is missing or if the request fails.
   */
  async initiateDeviceFlow(): Promise<DeviceCodeResponse> {
    if (!this.clientId) {
      throw new Error('GitHub Client ID is required');
    }

    return new Promise((resolve) => {
      this.authInstance = createOAuthDeviceAuth({
        clientType: 'oauth-app',
        clientId: this.clientId,
        scopes: ['repo', 'project'],
        onVerification: (verification) => {
          resolve({
            userCode: verification.user_code,
            verificationUri: verification.verification_uri,
            expiresIn: verification.expires_in,
            interval: verification.interval,
          });
        },
      });

      // Trigger the auth flow in the background so onVerification can fire
      this.pendingAuth = this.authInstance({ type: 'oauth' });
    });
  }

  /**
   * Completes the Device Flow by waiting for the user to authorize.
   * Polling is handled internally by the Octokit auth strategy.
   *
   * @returns A promise that resolves to the authenticated status and username.
   * @throws Error if called before initiateDeviceFlow or if authentication fails.
   */
  async completeDeviceFlow(): Promise<GitHubAuthStatus> {
    if (!this.pendingAuth) {
      throw new Error('Device flow not initiated');
    }

    // This polls until the user authorizes or the code expires
    const authResult = await this.pendingAuth;

    // Store the token
    await this.tokenStore.setToken(authResult.token);

    // Fetch username to confirm auth and provide UI context
    const { data: user } = await this.authInstance.hook(request, 'GET /user');

    return {
      authenticated: true,
      username: user.login,
    };
  }

  /**
   * Checks the current authentication status by validating the stored token.
   *
   * @returns A promise that resolves to the current auth status.
   */
  async getAuthStatus(): Promise<GitHubAuthStatus> {
    const token = await this.tokenStore.getToken();
    if (!token) {
      return { authenticated: false };
    }

    try {
      // Validate token by fetching the authenticated user
      const { data: user } = await request('GET /user', {
        headers: {
          authorization: `token ${token}`,
        },
      });

      return {
        authenticated: true,
        username: user.login,
      };
    } catch (_error) {
      // If token is invalid or request fails, treat as unauthenticated
      return { authenticated: false };
    }
  }

  /**
   * Deletes the stored authentication token.
   */
  async logout(): Promise<void> {
    await this.tokenStore.deleteToken();
  }
}

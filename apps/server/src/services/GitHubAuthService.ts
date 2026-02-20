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
  private authInstance: any = null;
  private pendingAuth: Promise<any> | null = null;
  private abortController: AbortController | null = null;

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

    // Abort previous flow if exists to prevent orphaned background polls
    if (this.abortController) {
      this.abortController.abort();
    }
    this.abortController = new AbortController();

    return new Promise((resolve, reject) => {
      // Create a request instance that includes the abort signal
      // This ensures all requests (initiation and polling) respect the signal
      const requestWithSignal = request.defaults({
        request: {
          signal: this.abortController?.signal,
        },
      });

      const auth = createOAuthDeviceAuth({
        clientType: 'oauth-app',
        clientId: this.clientId,
        scopes: ['repo', 'project'],
        request: requestWithSignal,
        onVerification: (verification) => {
          resolve({
            userCode: verification.user_code,
            verificationUri: verification.verification_uri,
            expiresIn: verification.expires_in,
            interval: verification.interval,
          });
        },
      });

      this.authInstance = auth;

      // Trigger the auth flow in the background so onVerification can fire
      const pending = auth({
        type: 'oauth',
      });

      this.pendingAuth = pending as Promise<any>;

      // Use the local 'pending' promise to ensure null safety for .catch()
      // This prevents unhandled rejections if the request fails before onVerification resolves the outer promise.
      // Rejections will be properly caught and thrown when completeDeviceFlow awaits this.pendingAuth.
      pending.catch((err: unknown) => {
        // Only reject if it wasn't an abort
        if (err instanceof Error && err.name === 'AbortError') return;
        reject(err);
      });
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
    if (!this.pendingAuth || !this.authInstance) {
      throw new Error('Device flow not initiated');
    }

    // This polls until the user authorizes or the code expires
    const authResult = await this.pendingAuth;

    // Reset abort controller as flow is complete
    this.abortController = null;

    // Guard against concurrent logout nullifying authInstance (PR #21 feedback)
    if (!this.authInstance) {
      throw new Error('Authentication flow was cancelled or user logged out');
    }

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
    if (this.abortController) {
      this.abortController.abort();
    }
    this.authInstance = null;
    this.pendingAuth = null;
    this.abortController = null;
  }
}

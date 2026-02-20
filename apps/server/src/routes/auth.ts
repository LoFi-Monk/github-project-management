import type { FastifyInstance } from 'fastify';
import type { GitHubAuthService } from '../services/GitHubAuthService';

/**
 * Registers routes for GitHub Authentication.
 *
 * @param app - The Fastify instance
 * @param options - Plugin options containing the GitHubAuthService
 */
export async function authRoutes(
  app: FastifyInstance,
  options: { githubAuthService?: GitHubAuthService },
) {
  const authService = options.githubAuthService;

  if (!authService) {
    app.log.warn('GitHubAuthService not provided to authRoutes. Auth endpoints will be disabled.');
    return;
  }

  /**
   * POST /auth/github/device-code
   *
   * Initiates the GitHub OAuth Device Flow.
   */
  app.post('/device-code', async (_request, reply) => {
    try {
      const details = await authService.initiateDeviceFlow();
      return details;
    } catch (error) {
      app.log.error(error);
      return reply.internalServerError('Failed to initiate GitHub auth');
    }
  });

  /**
   * GET /auth/github/poll
   *
   * Completes the Device Flow by waiting for user authorization.
   */
  app.get('/poll', async (_request, reply) => {
    try {
      const status = await authService.completeDeviceFlow();
      return status;
    } catch (error) {
      app.log.error(error);
      return reply.internalServerError('GitHub authentication failed');
    }
  });

  /**
   * GET /auth/github/status
   *
   * Returns current authentication status and username.
   */
  app.get('/status', async (_request, reply) => {
    try {
      const status = await authService.getAuthStatus();
      return status;
    } catch (error) {
      app.log.error(error);
      return reply.internalServerError('Failed to fetch auth status');
    }
  });

  /**
   * POST /auth/github/logout
   *
   * Clears the stored GitHub token.
   */
  app.post('/logout', async (_request, reply) => {
    try {
      await authService.logout();
      return reply.status(204).send();
    } catch (error) {
      app.log.error(error);
      return reply.internalServerError('Failed to logout');
    }
  });
}

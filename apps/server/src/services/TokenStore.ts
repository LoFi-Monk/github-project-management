import keytar from 'keytar';

const SERVICE_NAME = 'lofi-pm';
const ACCOUNT_NAME = 'github-oauth-token';

/**
 * Service for securely storing and retrieving authentication tokens
 * using the operating system's keychain.
 *
 * Intent: Provides a clean abstraction over `keytar` for secure storage.
 *
 * Guarantees:
 * - Tokens are stored in the system keychain (Windows Credential Manager, macOS Keychain, or Linux Secret Service).
 * - Operations are asynchronous and return Promises.
 *
 * Constraints:
 * - Depends on the native `keytar` module.
 * - Requires platform-specific build tools for native compilation.
 */
export class TokenStore {
  /**
   * Retrieves the stored GitHub token from the system keychain.
   * @returns A promise that resolves to the token string, or null if no token is found.
   */
  async getToken(): Promise<string | null> {
    return keytar.getPassword(SERVICE_NAME, ACCOUNT_NAME);
  }

  /**
   * Stores the GitHub token securely in the system keychain.
   * @param token The OAuth access token to store.
   * @returns A promise that resolves when the token has been successfully stored.
   */
  async setToken(token: string): Promise<void> {
    await keytar.setPassword(SERVICE_NAME, ACCOUNT_NAME, token);
  }

  /**
   * Deletes the stored GitHub token from the system keychain.
   * @returns A promise that resolves when the token has been successfully deleted.
   */
  async deleteToken(): Promise<void> {
    await keytar.deletePassword(SERVICE_NAME, ACCOUNT_NAME);
  }
}

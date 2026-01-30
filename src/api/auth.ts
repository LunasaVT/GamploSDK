import type { AuthProvider, HttpClient, AuthResponse } from '../types/index.js';

export class AuthService implements AuthProvider {
  constructor(
    private httpClient: HttpClient
  ) {}

  /**
   * Exchange a Gamplo token for a session ID
   * @param token - The Gamplo token from URL or client
   * @returns Promise resolving to authentication response
   * @throws {Error} When token is invalid or API request fails
   */
  async authenticate(token: string): Promise<AuthResponse> {
    if (!token || typeof token !== 'string') {
      throw new Error('Token is required and must be a string');
    }

    if (token.length === 0) {
      throw new Error('Token cannot be empty');
    }

    try {
      const response = await this.httpClient.post<AuthResponse>('/api/sdk/auth', { token });
      return response;
    } catch (error) {
      if (error instanceof Error) {
        throw new Error(`Authentication failed: ${error.message}`);
      }
      throw new Error('Authentication failed: Unknown error');
    }
  }
}
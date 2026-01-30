import type { PlayerService as IPlayerService, HttpClient, SessionManager, Player } from '../types/index.js';
import { GamploError } from '../types/index.js';

export class PlayerService implements IPlayerService {
  constructor(
    private httpClient: HttpClient,
    private sessionManager: SessionManager
  ) {}

  /**
   * Get current player information
   * @returns Promise resolving to player data or null if not authenticated
   * @throws {GamploError} When not authenticated or API request fails
   */
  async getPlayer(): Promise<Player | null> {
    const sessionId = this.sessionManager.getSessionId();
    
    if (!sessionId) {
      throw new GamploError('Not authenticated. Please call authenticate() first.');
    }

    try {
      const response = await this.httpClient.get<{ player: Player }>('/api/sdk/player', {
        'x-sdk-session': sessionId
      });
      return response.player;
    } catch (error) {
      if (error instanceof GamploError) {
        throw error;
      }
      
      if (error instanceof Error) {
        throw new GamploError(`Failed to get player: ${error.message}`);
      }
      
      throw new GamploError('Failed to get player: Unknown error');
    }
  }
}
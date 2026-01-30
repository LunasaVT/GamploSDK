import type { 
  AchievementService as IAchievementService, 
  HttpClient, 
  SessionManager, 
  Achievement, 
  UnlockAchievementResponse 
} from '../types/index.js';
import { GamploError } from '../types/index.js';

export class AchievementService implements IAchievementService {
  constructor(
    private httpClient: HttpClient,
    private sessionManager: SessionManager
  ) {}

  /**
   * Get all achievements for the game
   * @returns Promise resolving to array of achievements
   * @throws {GamploError} When not authenticated or API request fails
   */
  async getAchievements(): Promise<Achievement[]> {
    const sessionId = this.sessionManager.getSessionId();
    
    if (!sessionId) {
      throw new GamploError('Not authenticated. Please call authenticate() first.');
    }

    try {
      const response = await this.httpClient.get<{ achievements: Achievement[] }>('/api/sdk/achievements', {
        'x-sdk-session': sessionId
      });
      return response.achievements;
    } catch (error) {
      if (error instanceof GamploError) {
        throw error;
      }
      
      if (error instanceof Error) {
        throw new GamploError(`Failed to get achievements: ${error.message}`);
      }
      
      throw new GamploError('Failed to get achievements: Unknown error');
    }
  }

  /**
   * Unlock an achievement for the player
   * @param key - Achievement key to unlock
   * @returns Promise resolving to unlock response
   * @throws {GamploError} When not authenticated, key is invalid, or API request fails
   */
  async unlockAchievement(key: string): Promise<UnlockAchievementResponse> {
    const sessionId = this.sessionManager.getSessionId();
    
    if (!sessionId) {
      throw new GamploError('Not authenticated. Please call authenticate() first.');
    }

    if (!key || typeof key !== 'string') {
      throw new GamploError('Achievement key is required and must be a string');
    }

    if (key.length === 0) {
      throw new GamploError('Achievement key cannot be empty');
    }

    try {
      const response = await this.httpClient.post<UnlockAchievementResponse>(
        '/api/sdk/achievements/unlock',
        { key },
        { 'x-sdk-session': sessionId }
      );
      return response;
    } catch (error) {
      if (error instanceof GamploError) {
        throw error;
      }
      
      if (error instanceof Error) {
        throw new GamploError(`Failed to unlock achievement: ${error.message}`);
      }
      
      throw new GamploError('Failed to unlock achievement: Unknown error');
    }
  }
}
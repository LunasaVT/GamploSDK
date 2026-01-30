import type { 
  GamploInstance, 
  GamploOptions, 
  GamploConfig,
  AuthResponse,
  Player,
  Achievement,
  UnlockAchievementResponse,
  SendMessageResponse,
  ChatMessage
} from './types/index.js';

import { FetchHttpClient } from './utils/http-client.js';
import { MemorySessionManager } from './utils/session-manager.js';
import { getGamploToken } from './utils/env.js';

import { AuthService } from './api/auth.js';
import { PlayerService } from './api/player.js';
import { AchievementService } from './api/achievements.js';
import { ChatService } from './api/chat.js';

export class GamploSDK implements GamploInstance {
  private config: Required<GamploConfig>;
  private sessionManager: MemorySessionManager;
  private httpClient: FetchHttpClient;
  
  private authService: AuthService;
  private playerService: PlayerService;
  private achievementService: AchievementService;
  private chatService: ChatService;

  constructor(options: GamploOptions = {}) {
    this.config = {
      apiUrl: options.config?.apiUrl || 'https://gamplo.com',
      timeout: options.config?.timeout || 10000,
      fetch: options.config?.fetch || globalThis.fetch,
    };

    this.sessionManager = new MemorySessionManager();
    this.httpClient = new FetchHttpClient(this.config);

    this.authService = new AuthService(this.httpClient);
    this.playerService = new PlayerService(this.httpClient, this.sessionManager);
    this.achievementService = new AchievementService(this.httpClient, this.sessionManager);
    this.chatService = new ChatService(this.httpClient, this.sessionManager, this.config.apiUrl);

    this.autoInitialize(options);
  }

  private async autoInitialize(options: GamploOptions): Promise<void> {
    try {
      if (options.sessionId) {
        this.sessionManager.setSessionId(options.sessionId);
      } else if (options.token) {
        await this.authenticate(options.token);
      } else {
        const token = getGamploToken();
        if (token) {
          await this.authenticate(token);
        }
      }
    } catch (error) {
      console.warn('Failed to auto-initialize authentication:', error);
    }
  }

  getSessionId(): string | null {
    return this.sessionManager.getSessionId();
  }

  async authenticate(token: string): Promise<AuthResponse> {
    const response = await this.authService.authenticate(token);
    this.sessionManager.setSessionId(response.sessionId);
    return response;
  }

  async getPlayer(): Promise<Player | null> {
    return this.playerService.getPlayer();
  }

  async getAchievements(): Promise<Achievement[]> {
    return this.achievementService.getAchievements();
  }

  async unlockAchievement(key: string): Promise<UnlockAchievementResponse> {
    return this.achievementService.unlockAchievement(key);
  }

  async sendMessage(roomId: number, message: string): Promise<SendMessageResponse> {
    return this.chatService.sendMessage(roomId, message);
  }

  connectToChat(roomId: number, onMessage: (message: ChatMessage) => void): () => void {
    return this.chatService.connectToChat(roomId, onMessage);
  }

  disconnectFromChat(roomId: number): void {
    this.chatService.disconnectFromChat(roomId);
  }

  disconnectAllChat(): void {
    this.chatService.disconnectAll();
  }

  destroy(): void {
    this.disconnectAllChat();
    this.sessionManager.clearSession();
  }

  getConfig(): Omit<Required<GamploConfig>, 'fetch'> {
    return {
      apiUrl: this.config.apiUrl,
      timeout: this.config.timeout,
    };
  }
}
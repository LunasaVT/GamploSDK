/**
 * Represents a Gamplo player
 */
export interface Player {
  id: string;
  username: string;
  displayName: string;
  image: string;
}

/**
 * Represents a Gamplo achievement
 */
export interface Achievement {
  id: number;
  key: string;
  title: string;
  description: string;
  icon: string;
  points: number;
  hidden: boolean;
  unlocked?: boolean;
  unlockedAt?: string;
}

/**
 * Represents a chat message in Gamplo
 */
export interface ChatMessage {
  id: string;
  userId: string;
  username: string;
  displayName: string;
  image: string;
  message: string;
  timestamp: number;
}

/**
 * Represents the response from an authentication request
 */
export interface AuthResponse {
  sessionId: string;
  player: Player;
}

/**
 * Represents the response when unlocking an achievement
 */
export interface UnlockAchievementResponse {
  success: boolean;
  alreadyUnlocked: boolean;
  achievement: {
    key: string;
    title: string;
    description: string;
    icon: string;
    points: number;
  };
}

/**
 * Represents the response from sending a chat message
 */
export interface SendMessageResponse {
  success: boolean;
}

/**
 * Represents a chat event
 */
export interface ChatEvent {
  type: 'connected' | 'message';
  data?: ChatMessage;
}

export interface GamploConfig {
  apiUrl?: string;
  timeout?: number;
  fetch?: typeof globalThis.fetch;
}

export interface GamploOptions {
  config?: GamploConfig;
  token?: string;
  sessionId?: string;
}

export type Environment = 'browser' | 'node' | 'unknown';

/**
 * The main Gamplo SDK instance
 */
export interface GamploInstance {
  getSessionId(): string | null;
  
  authenticate(token: string): Promise<AuthResponse>;
  
  getPlayer(): Promise<Player | null>;
  
  getAchievements(): Promise<Achievement[]>;
  unlockAchievement(key: string): Promise<UnlockAchievementResponse>;
  
  sendMessage(roomId: number, message: string): Promise<SendMessageResponse>;
  connectToChat(roomId: number, onMessage: (message: ChatMessage) => void): () => void;
}

/**
 * The static Gamplo SDK class
 */
export interface GamploStatic {
  new(options?: GamploOptions): GamploInstance;
  
  init(options?: GamploOptions): GamploInstance;
  
  getSessionId(): string | null;
  authenticate(token: string): Promise<AuthResponse>;
  getPlayer(): Promise<Player | null>;
  getAchievements(): Promise<Achievement[]>;
  unlockAchievement(key: string): Promise<UnlockAchievementResponse>;
  sendMessage(roomId: number, message: string): Promise<SendMessageResponse>;
  connectToChat(roomId: number, onMessage: (message: ChatMessage) => void): () => void;
}

export class GamploError extends Error {
  constructor(
    message: string,
    /** HTTP status code if available */
    public status?: number,
    /** Error code from API */
    public code?: string
  ) {
    super(message);
    this.name = 'GamploError';
  }
}

export interface HttpClient {
  get<T>(url: string, headers?: Record<string, string>): Promise<T>;
  post<T>(url: string, body?: any, headers?: Record<string, string>): Promise<T>;
}

export interface SessionManager {
  getSessionId(): string | null;
  setSessionId(sessionId: string): void;
  clearSession(): void;
}

export interface AuthProvider {
  authenticate(token: string): Promise<AuthResponse>;
}

export interface PlayerService {
  getPlayer(): Promise<Player | null>;
}

export interface AchievementService {
  getAchievements(): Promise<Achievement[]>;
  unlockAchievement(key: string): Promise<UnlockAchievementResponse>;
}

export interface ChatService {
  sendMessage(roomId: number, message: string): Promise<SendMessageResponse>;
  connectToChat(roomId: number, onMessage: (message: ChatMessage) => void): () => void;
  disconnectFromChat(roomId: number): void;
}
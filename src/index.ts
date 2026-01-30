import { GamploSDK } from './sdk.js';
import type { GamploInstance, GamploStatic, GamploOptions } from './types/index.js';

let defaultInstance: GamploInstance | null = null;

function GamploConstructor(this: GamploInstance, options?: GamploOptions): GamploInstance {
  return new GamploSDK(options);
}

function createStaticMethods(sdk: GamploSDK): GamploInstance {
  return {
    getSessionId: () => sdk.getSessionId(),
    authenticate: (token: string) => sdk.authenticate(token),
    getPlayer: () => sdk.getPlayer(),
    getAchievements: () => sdk.getAchievements(),
    unlockAchievement: (key: string) => sdk.unlockAchievement(key),
    sendMessage: (roomId: number, message: string) => sdk.sendMessage(roomId, message),
    connectToChat: (roomId: number, onMessage: (message: any) => void) => sdk.connectToChat(roomId, onMessage),
  };
}

const Gamplo = GamploConstructor as unknown as GamploStatic;

Gamplo.init = (options?: GamploOptions): GamploInstance => {
  const sdk = new GamploSDK(options);
  defaultInstance = createStaticMethods(sdk);
  return defaultInstance;
};

Gamplo.getSessionId = (): string | null => {
  if (!defaultInstance) {
    throw new Error('Gamplo not initialized. Call Gamplo.init() first.');
  }
  return defaultInstance.getSessionId();
};

Gamplo.authenticate = async (token: string): Promise<any> => {
  if (!defaultInstance) {
    throw new Error('Gamplo not initialized. Call Gamplo.init() first.');
  }
  return await defaultInstance.authenticate(token);
};

Gamplo.getPlayer = async () => {
  if (!defaultInstance) {
    throw new Error('Gamplo not initialized. Call Gamplo.init() first.');
  }
  return await defaultInstance.getPlayer();
};

Gamplo.getAchievements = async () => {
  if (!defaultInstance) {
    throw new Error('Gamplo not initialized. Call Gamplo.init() first.');
  }
  return await defaultInstance.getAchievements();
};

Gamplo.unlockAchievement = async (key: string) => {
  if (!defaultInstance) {
    throw new Error('Gamplo not initialized. Call Gamplo.init() first.');
  }
  return await defaultInstance.unlockAchievement(key);
};

Gamplo.sendMessage = async (roomId: number, message: string) => {
  if (!defaultInstance) {
    throw new Error('Gamplo not initialized. Call Gamplo.init() first.');
  }
  return await defaultInstance.sendMessage(roomId, message);
};

Gamplo.connectToChat = (roomId: number, onMessage: (message: any) => void) => {
  if (!defaultInstance) {
    throw new Error('Gamplo not initialized. Call Gamplo.init() first.');
  }
  return defaultInstance.connectToChat(roomId, onMessage);
};

export { Gamplo };
export { GamploSDK };

export type {
  Player,
  Achievement,
  ChatMessage,
  AuthResponse,
  UnlockAchievementResponse,
  SendMessageResponse,
  ChatEvent,
  GamploConfig,
  GamploOptions,
  GamploInstance,
  Environment,
  HttpClient,
  SessionManager,
  AuthProvider,
  PlayerService,
  AchievementService,
  ChatService
} from './types/index.js';

export { GamploError } from './types/index.js';
export { detectEnvironment, isBrowser, isNode } from './utils/env.js';

export default Gamplo;
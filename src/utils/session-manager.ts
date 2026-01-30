import type { SessionManager } from '../types/index.js';

export class MemorySessionManager implements SessionManager {
  private sessionId: string | null = null;

  getSessionId(): string | null {
    return this.sessionId;
  }

  setSessionId(sessionId: string): void {
    this.sessionId = sessionId;
  }

  clearSession(): void {
    this.sessionId = null;
  }
}
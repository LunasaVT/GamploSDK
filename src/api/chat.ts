import type { 
  ChatService as IChatService, 
  HttpClient, 
  SessionManager, 
  ChatMessage, 
  SendMessageResponse,
  ChatEvent 
} from '../types/index.js';
import { GamploError } from '../types/index.js';
import { retryWithBackoff } from '../utils/env.js';

export class ChatService implements IChatService {
  private connections: Map<number, AbortController> = new Map();

  constructor(
    private httpClient: HttpClient,
    private sessionManager: SessionManager,
    private baseUrl: string
  ) {}

  /**
   * Send a message to a chat room
   * @param roomId - Numeric room ID
   * @param message - Message content
   * @returns Promise resolving to send response
   * @throws {GamploError} When not authenticated, message too long, or API request fails
   */
  async sendMessage(roomId: number, message: string): Promise<SendMessageResponse> {
    const sessionId = this.sessionManager.getSessionId();
    
    if (!sessionId) {
      throw new GamploError('Not authenticated. Please call authenticate() first.');
    }

    if (!Number.isInteger(roomId) || roomId <= 0) {
      throw new GamploError('Room ID must be a positive integer');
    }

    if (!message || typeof message !== 'string') {
      throw new GamploError('Message is required and must be a string');
    }

    if (message.length > 500) {
      throw new GamploError('Message too long. Maximum 500 characters allowed.');
    }

    if (message.trim().length === 0) {
      throw new GamploError('Message cannot be empty');
    }

    try {
      const response = await this.httpClient.post<SendMessageResponse>(
        '/api/sdk/chat/send',
        { roomId, message },
        { 'x-sdk-session': sessionId }
      );
      return response;
    } catch (error) {
      if (error instanceof GamploError) {
        throw error;
      }
      
      if (error instanceof Error) {
        throw new GamploError(`Failed to send message: ${error.message}`);
      }
      
      throw new GamploError('Failed to send message: Unknown error');
    }
  }

  /**
   * Connect to a chat room and receive messages
   * @param roomId - Numeric room ID
   * @param onMessage - Callback function for incoming messages
   * @returns Function to disconnect from chat
   * @throws {GamploError} When not authenticated or connection fails
   */
  connectToChat(
    roomId: number, 
    onMessage: (message: ChatMessage) => void
  ): () => void {
    const sessionId = this.sessionManager.getSessionId();
    
    if (!sessionId) {
      throw new GamploError('Not authenticated. Please call authenticate() first.');
    }

    if (!Number.isInteger(roomId) || roomId <= 0) {
      throw new GamploError('Room ID must be a positive integer');
    }

    if (typeof onMessage !== 'function') {
      throw new GamploError('onMessage callback must be a function');
    }

    if (this.connections.has(roomId)) {
      this.disconnectFromChat(roomId);
    }

    const controller = new AbortController();
    this.connections.set(roomId, controller);

    const url = `${this.baseUrl}/api/sdk/chat/stream?roomId=${roomId}&session=${sessionId}`;
    
    const connect = async () => {
      try {
        await retryWithBackoff(async () => {
          if (controller.signal.aborted) {
            throw new Error('Connection aborted');
          }

          const response = await fetch(url, {
            signal: controller.signal,
          });

          if (!response.ok) {
            throw new Error(`HTTP ${response.status}: ${response.statusText}`);
          }

          return this.handleStreamResponse(response, onMessage, controller);
        }, 3, 1000);
      } catch (error) {
        if (controller.signal.aborted) {
          return; // Expected when disconnect is called
        }
        
        console.warn('Chat connection failed permanently:', error);
        this.connections.delete(roomId);
      }
    };

    connect();

    return () => this.disconnectFromChat(roomId);
  }

  /**
   * Disconnect from a chat room
   * @param roomId - Room ID to disconnect from
   */
  disconnectFromChat(roomId: number): void {
    const controller = this.connections.get(roomId);
    if (controller) {
      controller.abort();
      this.connections.delete(roomId);
    }
  }

  /**
   * Disconnect from all active chat connections
   */
  disconnectAll(): void {
    for (const roomId of this.connections.keys()) {
      this.disconnectFromChat(roomId);
    }
  }

  private async handleStreamResponse(
    response: Response,
    onMessage: (message: ChatMessage) => void,
    controller: AbortController
  ): Promise<void> {
    const reader = response.body?.getReader();
    const decoder = new TextDecoder();

    if (!reader) {
      throw new Error('No response body available');
    }

    try {
      while (!controller.signal.aborted) {
        const { done, value } = await reader.read();
        
        if (done) {
          break;
        }

        const chunk = decoder.decode(value, { stream: true });
        const lines = chunk.split('\n').filter(line => line.trim().length > 0);

        for (const line of lines) {
          if (line.startsWith('data: ')) {
            try {
              const data = JSON.parse(line.slice(6));
              const event: ChatEvent = data;
              
              if (event.type === 'message' && event.data) {
                onMessage(event.data);
              }
            } catch (parseError) {
              console.warn('Failed to parse chat event:', parseError);
            }
          }
        }
      }
    } finally {
      reader.releaseLock();
    }
  }
}
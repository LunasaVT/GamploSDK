import type { HttpClient, GamploConfig } from '../types/index.js';
import { GamploError } from '../types/index.js';

/**
 * Default HTTP client implementation using fetch API
 */
export class FetchHttpClient implements HttpClient {
  private baseUrl: string;
  private timeout: number;
  private fetchImpl: typeof globalThis.fetch;

  constructor(config: Required<GamploConfig>) {
    this.baseUrl = config.apiUrl.replace(/\/$/, ''); // remove trailing slash
    this.timeout = config.timeout;
    this.fetchImpl = config.fetch || this.createFetch();
  }

  async get<T>(url: string, headers: Record<string, string> = {}): Promise<T> {
    return this.request<T>('GET', url, undefined, headers);
  }

  async post<T>(
    url: string, 
    body?: any, 
    headers: Record<string, string> = {}
  ): Promise<T> {
    return this.request<T>('POST', url, body, headers);
  }

  private async request<T>(
    method: string,
    url: string,
    body?: any,
    headers: Record<string, string> = {}
  ): Promise<T> {
    const fullUrl = url.startsWith('http') ? url : `${this.baseUrl}${url}`;
    
    const requestHeaders: Record<string, string> = {
      'Content-Type': 'application/json',
      ...headers,
    };

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), this.timeout);

    try {
      const response = await this.fetchImpl(fullUrl, {
        method,
        headers: requestHeaders,
        body: body ? JSON.stringify(body) : undefined,
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        let errorMessage = `HTTP ${response.status}`;
        try {
          const errorText = await response.text();
          errorMessage += `: ${errorText}`;
        } catch {}
        throw new GamploError(errorMessage, response.status);
      }

      const data = await response.json();
      return data as T;
    } catch (error) {
      clearTimeout(timeoutId);

      if (error instanceof GamploError) {
        throw error;
      }

      if (error instanceof Error) {
        if (error.name === 'AbortError') {
          throw new GamploError(`Request timeout after ${this.timeout}ms`);
        }
        throw new GamploError(`Network error: ${error.message}`);
      }

      throw new GamploError('Unknown network error');
    }
  }

  private createFetch(): typeof globalThis.fetch {
    if (typeof globalThis !== 'undefined' && globalThis.fetch) {
      return globalThis.fetch;
    }

    if (typeof fetch !== 'undefined') {
      return fetch;
    }

    try {
      const { default: nodeFetch } = require('node-fetch');
      return nodeFetch;
    } catch {
      throw new Error(
        'Fetch is not available in this environment. ' +
        'Please install node-fetch or use a newer Node.js version.'
      );
    }
  }
}
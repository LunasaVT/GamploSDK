import type { HttpClient, GamploConfig } from '../types/index.js';
import { GamploError } from '../types/index.js';

type FetchLike = (
  input: string,
  init?: {
    method?: string;
    headers?: Record<string, string>;
    body?: string;
    signal?: AbortSignal;
  }
) => Promise<{
  ok: boolean;
  status: number;
  json(): Promise<any>;
  text(): Promise<string>;
}>;

export class FetchHttpClient implements HttpClient {
  private baseUrl: string;
  private timeout: number;
  private fetchImpl: FetchLike;

  constructor(config: Required<GamploConfig>) {
    this.baseUrl = config.apiUrl.replace(/\/$/, '');
    this.timeout = config.timeout;

    this.fetchImpl = config.fetch ?? globalThis.fetch;

    if (!this.fetchImpl) {
      throw new Error(
        'No fetch implementation available. ' +
        'Provide config.fetch or run in an environment with global fetch.'
      );
    }
  }

  async get<T>(
    url: string,
    headers: Record<string, string> = {}
  ): Promise<T> {
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
    const fullUrl = url.startsWith('http')
      ? url
      : `${this.baseUrl}${url}`;

    const controller = new AbortController();
    const timeoutId = setTimeout(
      () => controller.abort(),
      this.timeout
    );

    try {
      const response = await this.fetchImpl(fullUrl, {
        method,
        headers: {
          'Content-Type': 'application/json',
          ...headers,
        },
        body: body !== undefined ? JSON.stringify(body) : undefined,
        signal: controller.signal,
      });

      if (!response.ok) {
        const text = await response.text().catch(() => '');
        throw new GamploError(
          `HTTP ${response.status}${text ? `: ${text}` : ''}`,
          response.status
        );
      }

      return (await response.json()) as T;
    } catch (err) {
      if (err instanceof GamploError) throw err;

      if (err instanceof Error) {
        if (err.name === 'AbortError') {
          throw new GamploError(
            `Request timeout after ${this.timeout}ms`
          );
        }

        throw new GamploError(`Network error: ${err.message}`);
      }

      throw new GamploError('Unknown network error');
    } finally {
      clearTimeout(timeoutId);
    }
  }
}

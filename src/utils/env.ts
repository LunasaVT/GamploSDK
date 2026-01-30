import type { Environment } from '../types/index.js';

declare const window: any;
declare const document: any;
declare const self: any;
declare const importScripts: any;
declare const process: any;

/**
 * Detect the current runtime environment
 * @returns The detected environment
 */
export function detectEnvironment(): Environment {
  if (typeof window !== 'undefined' && typeof document !== 'undefined') {
    return 'browser';
  }

  if (typeof process !== 'undefined' && process.versions?.node) {
    return 'node';
  }

  if (typeof self !== 'undefined' && typeof importScripts === 'function') {
    return 'browser'; // Treat web workers as browser environment
  }

  return 'unknown';
}

/**
 * Check if running in browser environment
 * @returns True if in browser
 */
export function isBrowser(): boolean {
  return detectEnvironment() === 'browser';
}

/**
 * Check if running in Node.js environment
 * @returns True if in Node.js
 */
export function isNode(): boolean {
  return detectEnvironment() === 'node';
}

/**
 * Extract URL parameters from different environments
 * @returns Object containing URL parameters
 */
export function getUrlParams(): Record<string, string> {
  if (isBrowser()) {
    const params = new URLSearchParams(window.location.search);
    const result: Record<string, string> = {};
    
    params.forEach((value, key) => {
      result[key] = value;
    });
    
    return result;
  }

  if (isNode() && typeof process !== 'undefined' && process.argv) {
    const args = process.argv.slice(2);
    const result: Record<string, string> = {};
    
    for (let i = 0; i < args.length; i++) {
      const arg = args[i];
      if (!arg) continue;
      
      if (arg.startsWith('--')) {
        const key = arg.slice(2);
        const nextArg = args[i + 1];
        
        if (nextArg && !nextArg.startsWith('--')) {
          result[key] = nextArg;
          i++;
        } else {
          result[key] = 'true';
        }
      } else if (arg.includes('=')) {
        const [key, value] = arg.split('=', 2);
        if (key) {
          result[key] = value || '';
        }
      }
    }
    
    return result;
  }

  return {};
}

/**
 * Get the Gamplo token from URL parameters or environment variables
 * @returns The Gamplo token if available, null otherwise
 */
export function getGamploToken(): string | null {
  const params = getUrlParams();
  if (params.gamplo_token) {
    return params.gamplo_token;
  }

  if (isNode() && typeof process !== 'undefined') {
    return process.env.GAMPLO_TOKEN || null;
  }

  return null;
}

/**
 * Create a timeout promise
 * @param ms - Timeout duration in milliseconds
 * @returns Promise that rejects after timeout
 */
export function createTimeout(ms: number): Promise<never> {
  return new Promise((_, reject) => {
    setTimeout(() => reject(new Error(`Operation timed out after ${ms}ms`)), ms);
  });
}

/**
 * Retry a function with exponential backoff
 * @param fn - Function to retry
 * @param maxRetries - Maximum number of retries
 * @param baseDelay - Base delay in milliseconds
 * @returns Promise with retry logic
 */
export async function retryWithBackoff<T>(
  fn: () => Promise<T>,
  maxRetries: number = 3,
  baseDelay: number = 1000
): Promise<T> {
  let lastError: Error;

  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error instanceof Error ? error : new Error(String(error));
      
      if (attempt === maxRetries) {
        break; // rip
      }

      const delay = baseDelay * Math.pow(2, attempt) + Math.random() * 1000;
      await new Promise(resolve => setTimeout(resolve, delay));
    }
  }

  throw lastError!;
}
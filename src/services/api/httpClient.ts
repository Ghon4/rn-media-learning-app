import axios, { AxiosError, AxiosInstance, InternalAxiosRequestConfig, isAxiosError } from 'axios';

import { TMDB_BASE_URL } from '../tmdb/constants';

import { AppError } from './errors';

function redactUrl(url: string): string {
  return url.replace(/api_key=[^&]+/gi, 'api_key=***');
}

function buildLogUrl(config: InternalAxiosRequestConfig): string {
  const base = config.baseURL ?? '';
  const path = config.url ?? '';
  const params = config.params as Record<string, string> | undefined;
  const qs =
    params && Object.keys(params).length > 0
      ? `?${new URLSearchParams(params as Record<string, string>).toString()}`
      : '';
  return redactUrl(`${base}${path}${qs}`);
}

export function createTmdbHttpClient(apiKey: string): AxiosInstance {
  const client = axios.create({
    baseURL: TMDB_BASE_URL,
    timeout: 20_000,
    params: {
      api_key: apiKey,
    },
    headers: {
      Accept: 'application/json',
    },
  });

  client.interceptors.request.use((config) => {
    if (__DEV__) {
      (config as InternalAxiosRequestConfig & { metadata?: { start: number } }).metadata = {
        start: Date.now(),
      };
      console.log(`[HTTP] → ${config.method?.toUpperCase() ?? 'GET'} ${buildLogUrl(config)}`);
    }
    return config;
  });

  client.interceptors.response.use(
    (response) => {
      if (__DEV__) {
        const meta = (response.config as InternalAxiosRequestConfig & { metadata?: { start: number } })
          .metadata;
        if (meta?.start) {
          console.log(
            `[HTTP] ← ${response.status} ${response.config.url} (${Date.now() - meta.start}ms)`,
          );
        }
      }
      return response;
    },
    (error: unknown) => {
      if (axios.isCancel(error)) {
        return Promise.reject(new AppError('Request cancelled', 'cancelled'));
      }
      if (isAxiosError(error)) {
        const ax = error as AxiosError<{ status_message?: string }>;
        if (!ax.response) {
          return Promise.reject(new AppError(ax.message || 'Network error', 'network'));
        }
        const status = ax.response.status;
        const msg =
          ax.response.data?.status_message ||
          ax.message ||
          `Request failed (${status})`;
        if (status === 401) {
          return Promise.reject(new AppError('Invalid or missing API key', 'http', 401, ax.response.data));
        }
        if (status === 429) {
          return Promise.reject(
            new AppError('Rate limited. Try again shortly.', 'http', 429, ax.response.data),
          );
        }
        return Promise.reject(new AppError(String(msg), 'http', status, ax.response.data));
      }
      return Promise.reject(new AppError('Unknown error', 'unknown'));
    },
  );

  return client;
}

const key = process.env.EXPO_PUBLIC_TMDB_API_KEY ?? '';

if (__DEV__ && !key) {
  console.warn(
    '[TMDB] EXPO_PUBLIC_TMDB_API_KEY is empty. Add it to .env (see .env.example).',
  );
}

export const tmdbHttp = createTmdbHttpClient(key);

async function sleep(ms: number) {
  return new Promise((r) => setTimeout(r, ms));
}

/** One retry with jitter for transient GET failures (network). */
export async function getWithRetry<T>(
  fn: () => Promise<T>,
  options?: { retries?: number },
): Promise<T> {
  const retries = options?.retries ?? 1;
  try {
    return await fn();
  } catch (e) {
    if (retries <= 0) throw e;
    if (e instanceof AppError && e.kind === 'network') {
      await sleep(200 + Math.random() * 300);
      return getWithRetry(fn, { retries: retries - 1 });
    }
    throw e;
  }
}

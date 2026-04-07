import { createWriteStream } from 'node:fs';
import { mkdir } from 'node:fs/promises';
import { dirname } from 'node:path';
import { Readable } from 'node:stream';
import { pipeline } from 'node:stream/promises';
import { ApiError, formatApiError } from './errors.js';
import type { Config } from './config.js';

export interface RequestOptions {
  method?: 'GET' | 'POST' | 'PUT' | 'DELETE';
  path: string;
  query?: Record<string, string | number | boolean | undefined>;
  body?: unknown;
}

export interface HttpClient {
  request<T>(options: RequestOptions): Promise<T>;
  downloadToFile(path: string, destPath: string): Promise<void>;
  downloadFromUrl(url: string, destPath: string): Promise<void>;
}

function buildUrl(baseUrl: string, path: string, query?: Record<string, string | number | boolean | undefined>): string {
  const url = new URL(path, baseUrl);

  if (query) {
    for (const [key, value] of Object.entries(query)) {
      if (value !== undefined) {
        url.searchParams.set(key, String(value));
      }
    }
  }

  return url.toString();
}

async function downloadStream(response: Response, destPath: string, label: string): Promise<void> {
  if (!response.ok) {
    throw new ApiError(`Download failed: ${response.status} ${response.statusText}`, response.status, label);
  }

  if (!response.body) {
    throw new ApiError('Empty response body', 0, label);
  }

  await mkdir(dirname(destPath), { recursive: true });
  const nodeStream = Readable.fromWeb(response.body as import('node:stream/web').ReadableStream);
  await pipeline(nodeStream, createWriteStream(destPath));
}

export function createHttpClient(config: Config): HttpClient {
  const token = config.token;

  return {
    async request<T>(options: RequestOptions): Promise<T> {
      const { method = 'GET', path, query, body } = options;
      const url = buildUrl(config.baseUrl, path, query);

      const headers: Record<string, string> = {
        'X-Figma-Token': token,
        'Accept': 'application/json',
      };

      if (body !== undefined) {
        headers['Content-Type'] = 'application/json';
      }

      const response = await fetch(url, {
        method,
        headers,
        body: body !== undefined ? JSON.stringify(body) : undefined,
      });

      if (!response.ok) {
        let errorBody: unknown;
        try {
          errorBody = await response.json();
        } catch {
          errorBody = await response.text().catch(() => null);
        }
        throw formatApiError(response.status, errorBody, `${method} ${path}`);
      }

      if (response.status === 204) {
        return undefined as T;
      }

      return (await response.json()) as T;
    },

    async downloadToFile(path: string, destPath: string): Promise<void> {
      const url = buildUrl(config.baseUrl, path, {});

      const response = await fetch(url, {
        method: 'GET',
        headers: { 'X-Figma-Token': token },
      });

      await downloadStream(response, destPath, `GET ${path}`);
    },

    async downloadFromUrl(url: string, destPath: string): Promise<void> {
      const response = await fetch(url, { method: 'GET' });
      await downloadStream(response, destPath, `GET ${url}`);
    },
  };
}

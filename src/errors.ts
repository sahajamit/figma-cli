export class CliError extends Error {
  constructor(
    message: string,
    public code: string,
    public exitCode: number = 1,
  ) {
    super(message);
    this.name = 'CliError';
  }
}

export class ConfigError extends CliError {
  constructor(message: string) {
    super(message, 'CONFIG_ERROR');
    this.name = 'ConfigError';
  }
}

export class ApiError extends CliError {
  constructor(
    message: string,
    public statusCode: number,
    public endpoint: string,
  ) {
    super(message, 'API_ERROR');
    this.name = 'ApiError';
  }
}

export function formatApiError(statusCode: number, body: unknown, endpoint: string): ApiError {
  let message: string;

  if (statusCode === 401 || statusCode === 403) {
    message = `Authentication failed (${statusCode}). Check your FIGMA_TOKEN.`;
  } else if (statusCode === 404) {
    message = `Not found: ${endpoint}`;
  } else if (statusCode === 429) {
    message = `Rate limited. Wait a moment and try again.`;
  } else if (statusCode === 400 && body && typeof body === 'object') {
    const b = body as Record<string, unknown>;
    const err = b.err as string | undefined;
    message = err ?? `Bad request: ${endpoint}`;
  } else {
    message = `API error ${statusCode}: ${endpoint}`;
  }

  return new ApiError(message, statusCode, endpoint);
}

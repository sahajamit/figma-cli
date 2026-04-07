import { ConfigError } from './errors.js';

export interface Config {
  token: string;
  baseUrl: string;
}

export function loadConfig(): Config {
  const token = process.env.FIGMA_TOKEN;
  if (!token) {
    throw new ConfigError(
      'FIGMA_TOKEN is not set. Generate a Personal Access Token at https://www.figma.com/developers/api#access-tokens',
    );
  }

  return {
    token,
    baseUrl: 'https://api.figma.com',
  };
}

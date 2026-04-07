import { createInterface } from 'node:readline';
import chalk from 'chalk';
import { CliError } from './errors.js';

export interface OutputContext {
  json: boolean;
}

export function detectOutputMode(forceJson?: boolean): OutputContext {
  const json = forceJson ?? !process.stdout.isTTY;
  return { json };
}

export function output<T>(data: T, humanFormat: (data: T) => string, ctx: OutputContext): void {
  if (ctx.json) {
    process.stdout.write(JSON.stringify(data, null, 2) + '\n');
  } else {
    process.stdout.write(humanFormat(data) + '\n');
  }
}

export function outputError(error: unknown, ctx: OutputContext): void {
  if (ctx.json) {
    const payload: Record<string, unknown> = { error: '' };
    if (error instanceof CliError) {
      payload.error = error.message;
      payload.code = error.code;
      if ('statusCode' in error) {
        payload.statusCode = (error as { statusCode: number }).statusCode;
      }
    } else if (error instanceof Error) {
      payload.error = error.message;
      payload.code = 'UNKNOWN_ERROR';
    } else {
      payload.error = String(error);
      payload.code = 'UNKNOWN_ERROR';
    }
    process.stderr.write(JSON.stringify(payload) + '\n');
  } else {
    const message = error instanceof Error ? error.message : String(error);
    process.stderr.write(chalk.red('Error: ') + message + '\n');
  }
}

export async function readStdin(): Promise<string> {
  const chunks: Buffer[] = [];
  for await (const chunk of process.stdin) {
    chunks.push(typeof chunk === 'string' ? Buffer.from(chunk) : chunk);
  }
  return Buffer.concat(chunks).toString('utf-8').trim();
}

export async function resolveBody(body: string): Promise<string> {
  return body === '-' ? readStdin() : body;
}

export function formatTable(headers: string[], rows: string[][]): string {
  const colWidths = headers.map((h, i) => {
    const maxRow = rows.reduce((max, row) => Math.max(max, (row[i] ?? '').length), 0);
    return Math.max(h.length, maxRow);
  });

  const headerLine = headers.map((h, i) => h.padEnd(colWidths[i]!)).join('  ');
  const separator = colWidths.map(w => '─'.repeat(w)).join('──');
  const dataLines = rows.map(row =>
    row.map((cell, i) => cell.padEnd(colWidths[i]!)).join('  '),
  );

  return [headerLine, separator, ...dataLines].join('\n');
}

import { join } from 'node:path';
import type { Command } from 'commander';
import chalk from 'chalk';
import { loadConfig } from '../../config.js';
import { createHttpClient } from '../../http.js';
import { createFigmaClient } from '../../clients/figma.js';
import { detectOutputMode, output } from '../../output.js';

interface ExportResult {
  fileKey: string;
  outputDir: string;
  format: string;
  exported: Array<{ nodeId: string; filename: string; path: string }>;
  failed: Array<{ nodeId: string; reason: string }>;
}

function formatHuman(result: ExportResult): string {
  const lines: string[] = [];
  lines.push(chalk.bold(`Exported ${result.exported.length} image(s) to ${result.outputDir}`));
  lines.push('');

  for (const item of result.exported) {
    lines.push(`  ${chalk.green('✓')}  ${item.nodeId} → ${item.path}`);
  }

  for (const item of result.failed) {
    lines.push(`  ${chalk.red('✗')}  ${item.nodeId} — ${item.reason}`);
  }

  return lines.join('\n');
}

export function registerExportCommand(images: Command): void {
  images
    .command('export <file-key>')
    .description('Export nodes as images (PNG, SVG, JPG, PDF)')
    .requiredOption('--ids <ids>', 'Comma-separated node IDs (e.g. 1:2,3:4)')
    .option('-f, --format <format>', 'Image format: png, svg, jpg, pdf', 'png')
    .option('-s, --scale <n>', 'Scale factor (0.01 to 4)', '2')
    .option('-o, --output-dir <dir>', 'Output directory', '.')
    .action(async (fileKey: string, opts: { ids: string; format: string; scale: string; outputDir: string }, command: Command) => {
      const config = loadConfig();
      const http = createHttpClient(config);
      const client = createFigmaClient(http);
      const ctx = detectOutputMode(command.optsWithGlobals().json);

      const nodeIds = opts.ids.split(',').map(id => id.trim());
      const format = opts.format as 'png' | 'svg' | 'jpg' | 'pdf';
      const scale = parseFloat(opts.scale);

      const imageResponse = await client.getImages(fileKey, nodeIds, { format, scale });

      const result: ExportResult = {
        fileKey,
        outputDir: opts.outputDir,
        format,
        exported: [],
        failed: [],
      };

      for (const [nodeId, url] of Object.entries(imageResponse.images)) {
        if (!url) {
          result.failed.push({ nodeId, reason: 'No image URL returned' });
          continue;
        }

        const safeNodeId = nodeId.replace(/:/g, '-');
        const filename = `${safeNodeId}.${format}`;
        const destPath = join(opts.outputDir, filename);

        try {
          await http.downloadFromUrl(url, destPath);
          result.exported.push({ nodeId, filename, path: destPath });
        } catch (err) {
          result.failed.push({ nodeId, reason: err instanceof Error ? err.message : String(err) });
        }
      }

      output(result, formatHuman, ctx);
    });
}

import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { z } from 'zod';
import { performScan } from '../data/scanner.js';
import { invalidateAssetIndex, loadScanStatus } from '../data/index-cache.js';
import { getGraphicsRoot } from '../data/config.js';

export function registerScanDirectory(server: McpServer): void {
  server.tool(
    'scan_directory',
    'Scan a directory and update the asset index cache',
    {
      path: z.string().optional()
        .describe('Directory to scan (defaults to graphics root)'),
      recursive: z.boolean().optional().default(true)
        .describe('Scan subdirectories recursively'),
      force: z.boolean().optional().default(false)
        .describe('Force rescan even if cache is valid'),
    },
    async ({ path, recursive, force }) => {
      const scanPath = path || getGraphicsRoot();

      if (force) {
        invalidateAssetIndex();
      }

      const startTime = Date.now();
      const index = performScan({ path: scanPath, recursive, force });
      const duration = Date.now() - startTime;

      const status = loadScanStatus();

      return {
        content: [
          {
            type: 'text' as const,
            text: JSON.stringify({
              success: true,
              scanned_path: scanPath,
              recursive,
              results: {
                total_assets: index.stats.total,
                by_type: index.stats.by_type,
                scan_duration_ms: duration,
              },
              cache_updated: index.generated,
              directories_tracked: Object.keys(status.directories).length,
            }, null, 2),
          },
        ],
      };
    }
  );
}

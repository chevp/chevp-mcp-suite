// =============================================================================
// VFP MCP - LIST Tool (FTP-like)
// =============================================================================

import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { z } from 'zod';
import { getStore } from '../data/store.js';

export function registerList(server: McpServer): void {
  server.tool(
    'vfp_list',
    'List contents of a directory in the virtual file system (FTP LIST equivalent)',
    {
      path: z.string().optional().describe('Directory path (default: /)'),
      recursive: z.boolean().optional().describe('List recursively'),
      pattern: z.string().optional().describe('Filter by glob pattern (e.g., *.state)'),
    },
    async ({ path = '/', recursive = false, pattern }) => {
      const store = getStore();

      const entries = store.list(path, { recursive, pattern });

      // Format like FTP listing
      const listing = entries.map(entry => {
        const typeChar = entry.type === 'directory' ? 'd' : '-';
        const sizeStr = entry.size.toString().padStart(10);
        const date = new Date(entry.modified).toISOString().split('T')[0];
        const tickStr = `tick:${entry.version.tick}`;

        return {
          type: entry.type,
          name: entry.name,
          path: entry.path,
          size: entry.size,
          modified: entry.modified,
          version: entry.version,
          display: `${typeChar}rw-r--r-- 1 user ${sizeStr} ${date} ${entry.name}  ${tickStr}`,
        };
      });

      return {
        content: [{
          type: 'text' as const,
          text: JSON.stringify({
            status: 'ok',
            path,
            count: entries.length,
            currentTick: store.getCurrentTick(),
            currentBranch: store.getCurrentBranch(),
            entries: listing,
            display: listing.map(l => l.display).join('\n'),
          }, null, 2),
        }],
      };
    }
  );
}
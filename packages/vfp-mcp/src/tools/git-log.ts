// =============================================================================
// VFP MCP - LOG Tool (Git-like)
// =============================================================================

import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { z } from 'zod';
import { getStore } from '../data/store.js';

export function registerLog(server: McpServer): void {
  server.tool(
    'vfp_log',
    'Show version history (Git log equivalent)',
    {
      path: z.string().optional().describe('Filter by path'),
      limit: z.number().optional().describe('Maximum entries to return (default: 10)'),
    },
    async ({ path, limit = 10 }) => {
      const store = getStore();

      const entries = store.log(path, limit);

      // Format as log output
      const logLines: string[] = [];
      for (const entry of entries) {
        logLines.push(`tick:${entry.version.tick} | hash:${entry.version.hash} | ${entry.version.author} | ${new Date(entry.version.timestamp).toISOString()}`);
        logLines.push(`  ${entry.message}`);
        logLines.push('');
      }

      return {
        content: [{
          type: 'text' as const,
          text: JSON.stringify({
            status: 'ok',
            path: path || '/',
            currentBranch: store.getCurrentBranch(),
            currentTick: store.getCurrentTick(),
            entries,
            count: entries.length,
            display: logLines.join('\n') || 'No history',
          }, null, 2),
        }],
      };
    }
  );
}
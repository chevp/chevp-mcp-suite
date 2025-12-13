// =============================================================================
// VFP MCP - SNAPSHOT Tool (Realtime)
// =============================================================================

import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { z } from 'zod';
import { getStore } from '../data/store.js';

export function registerSnapshot(server: McpServer): void {
  server.tool(
    'vfp_snapshot',
    'Get full state snapshot (Realtime full sync)',
    {
      path: z.string().optional().describe('Path to snapshot (default: /)'),
    },
    async ({ path = '/' }) => {
      const store = getStore();

      const snapshot = store.snapshot(path);

      return {
        content: [{
          type: 'text' as const,
          text: JSON.stringify({
            status: 'ok',
            tick: snapshot.tick,
            path,
            nodeCount: snapshot.nodes.length,
            nodes: snapshot.nodes,
            message: `Snapshot at tick:${snapshot.tick}`,
          }, null, 2),
        }],
      };
    }
  );
}
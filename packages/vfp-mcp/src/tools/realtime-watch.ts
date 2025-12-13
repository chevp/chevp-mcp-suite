// =============================================================================
// VFP MCP - WATCH Tool (Realtime)
// =============================================================================

import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { z } from 'zod';
import { getStore } from '../data/store.js';

export function registerWatch(server: McpServer): void {
  server.tool(
    'vfp_watch',
    'Subscribe to changes on paths (Realtime subscription)',
    {
      patterns: z.array(z.string()).describe('Path patterns to watch (e.g., ["/scenes/*/nodes/*"])'),
      fromTick: z.number().optional().describe('Start watching from this tick (for replay)'),
    },
    async ({ patterns, fromTick = 0 }) => {
      const store = getStore();

      const subscription = store.subscribe(patterns, fromTick);

      return {
        content: [{
          type: 'text' as const,
          text: JSON.stringify({
            status: 'ok',
            subscriptionId: subscription.subscriptionId,
            patterns: subscription.patterns,
            fromTick: subscription.fromTick,
            currentTick: store.getCurrentTick(),
            message: `Subscribed to ${patterns.length} pattern(s)`,
            usage: 'Use vfp_snapshot to get initial state, then poll for deltas',
          }, null, 2),
        }],
      };
    }
  );
}
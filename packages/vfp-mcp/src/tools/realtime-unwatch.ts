// =============================================================================
// VFP MCP - UNWATCH Tool (Realtime)
// =============================================================================

import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { z } from 'zod';
import { getStore } from '../data/store.js';

export function registerUnwatch(server: McpServer): void {
  server.tool(
    'vfp_unwatch',
    'Unsubscribe from a watch subscription',
    {
      subscriptionId: z.string().describe('Subscription ID to cancel'),
    },
    async ({ subscriptionId }) => {
      const store = getStore();

      const success = store.unsubscribe(subscriptionId);

      if (!success) {
        return {
          content: [{
            type: 'text' as const,
            text: JSON.stringify({
              status: 'not_found',
              error: `Subscription not found: ${subscriptionId}`,
            }, null, 2),
          }],
        };
      }

      return {
        content: [{
          type: 'text' as const,
          text: JSON.stringify({
            status: 'ok',
            subscriptionId,
            message: 'Unsubscribed successfully',
          }, null, 2),
        }],
      };
    }
  );
}
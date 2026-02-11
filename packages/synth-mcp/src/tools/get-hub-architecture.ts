import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { z } from 'zod';
import { getArchitecture } from '../data/hub-architecture.js';

export function registerGetHubArchitecture(server: McpServer): void {
  server.tool(
    'get_hub_architecture',
    'Get synth-core-hub architecture overview, including startup flow and cluster-editor integration',
    {
      section: z
        .enum(['all', 'components', 'rest-api', 'websocket', 'cluster-editor'])
        .optional()
        .describe('Which section to return'),
    },
    async ({ section }) => {
      const result = getArchitecture(section || 'all');

      return {
        content: [
          {
            type: 'text' as const,
            text: JSON.stringify(result, null, 2),
          },
        ],
      };
    }
  );
}
import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { z } from 'zod';
import { getServices } from '../data/hub-services.js';

export function registerListHubServices(server: McpServer): void {
  server.tool(
    'list_hub_services',
    'List all gRPC/REST services available in synth-core-hub ecosystem',
    {
      type: z.enum(['all', 'grpc', 'rest', 'hybrid']).optional().describe('Filter by service type'),
      usedBy: z.string().optional().describe('Filter by consumer (e.g., "frost-runtime", "synth-cluster-editor")'),
    },
    async ({ type, usedBy }) => {
      const services = getServices({ type, usedBy });

      const result = services.map((s) => ({
        name: s.name,
        type: s.type,
        protoFile: s.protoFile,
        description: s.description,
        rpcCount: s.rpcs.length,
        usedBy: s.usedBy,
      }));

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
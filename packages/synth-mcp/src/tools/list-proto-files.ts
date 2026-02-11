import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { z } from 'zod';
import { getProtoFiles, getProtoDomains } from '../data/proto-files.js';

export function registerListProtoFiles(server: McpServer): void {
  server.tool(
    'list_proto_files',
    'List all available proto files in synth-protocol with their purposes',
    {
      domain: z
        .enum(['all', 'synth-endpoint', 'synth-wire', 'synth-state-sync', 'synth-core', 'synth-agent', 'nuna'])
        .optional()
        .describe('Filter by protocol domain'),
    },
    async ({ domain }) => {
      const result = getProtoFiles(domain || 'all');
      const domains = getProtoDomains();

      return {
        content: [
          {
            type: 'text' as const,
            text: JSON.stringify(
              {
                ...result,
                availableDomains: domains,
              },
              null,
              2
            ),
          },
        ],
      };
    }
  );
}
import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { z } from 'zod';
import { searchModules } from '../data/modules.js';

export function registerSearchModules(server: McpServer): void {
  server.tool(
    'search_modules',
    'Search Nuna SDK modules by keyword (searches in name, description, and category)',
    {
      query: z.string().describe('Search query keyword'),
    },
    async ({ query }) => {
      const results = searchModules(query);

      if (results.length === 0) {
        return {
          content: [
            {
              type: 'text' as const,
              text: `No modules found matching "${query}"`,
            },
          ],
        };
      }

      const list = results.map((mod) => ({
        name: mod.name,
        description: mod.description,
        category: mod.category,
      }));

      return {
        content: [
          {
            type: 'text' as const,
            text: JSON.stringify({ results: list, count: list.length }, null, 2),
          },
        ],
      };
    }
  );
}

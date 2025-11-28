import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { z } from 'zod';
import { getAllModules } from '../data/modules.js';

export function registerListModules(server: McpServer): void {
  server.tool(
    'list_modules',
    'List all available Nuna SDK modules with their basic information',
    {},
    async () => {
      const modules = getAllModules();
      const list = modules.map((mod) => ({
        name: mod.name,
        description: mod.description,
        category: mod.category,
      }));

      return {
        content: [
          {
            type: 'text' as const,
            text: JSON.stringify({ modules: list }, null, 2),
          },
        ],
      };
    }
  );
}

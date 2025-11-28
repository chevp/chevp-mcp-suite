import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { z } from 'zod';
import { getModule, getAllModules } from '../data/modules.js';

export function registerGetModule(server: McpServer): void {
  server.tool(
    'get_module',
    'Get detailed information about a specific Nuna SDK module including API, types, and examples',
    {
      name: z.string().describe('Module name, e.g., nuna-core'),
    },
    async ({ name }) => {
      const mod = getModule(name);

      if (!mod) {
        const available = getAllModules()
          .map((m) => m.name)
          .join(', ');
        return {
          content: [
            {
              type: 'text' as const,
              text: `Module "${name}" not found. Available modules: ${available}`,
            },
          ],
          isError: true,
        };
      }

      return {
        content: [
          {
            type: 'text' as const,
            text: JSON.stringify(mod, null, 2),
          },
        ],
      };
    }
  );
}

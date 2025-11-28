import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { z } from 'zod';
import { getModule, getAllModules } from '../data/modules.js';

export function registerGetModuleApi(server: McpServer): void {
  server.tool(
    'get_module_api',
    'Get the API reference for a specific Nuna SDK module (functions, classes, types)',
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

      if (!mod.api) {
        return {
          content: [
            {
              type: 'text' as const,
              text: `No API documentation available for module "${name}"`,
            },
          ],
        };
      }

      return {
        content: [
          {
            type: 'text' as const,
            text: JSON.stringify(
              {
                module: mod.name,
                api: mod.api,
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

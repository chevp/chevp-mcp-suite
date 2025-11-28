import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { categoryConfig, availableColors, materialIcons } from '../data/design-system.js';

export function registerGetCategories(server: McpServer): void {
  server.tool(
    'get_categories',
    'Get all repository categories with their icons and colors for chevp.github.io',
    {},
    async () => {
      return {
        content: [
          {
            type: 'text' as const,
            text: JSON.stringify({
              categories: categoryConfig,
              availableColors,
              availableIcons: materialIcons,
              usage: 'Each category has an icon (Material Symbols) and a color. Use these when adding new categories.',
            }, null, 2),
          },
        ],
      };
    }
  );
}

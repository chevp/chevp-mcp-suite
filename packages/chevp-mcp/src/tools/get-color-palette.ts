import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { designSystem } from '../data/design-system.js';

export function registerGetColorPalette(server: McpServer): void {
  server.tool(
    'get_color_palette',
    'Get the Arctic color palette and category colors used in chevp.github.io',
    {},
    async () => {
      return {
        content: [
          {
            type: 'text' as const,
            text: JSON.stringify({
              arctic: designSystem.colors.arctic,
              categoryColors: designSystem.colors.categoryColors,
              semantic: designSystem.colors.semantic,
              usage: {
                arctic: 'Primary brand colors (arctic blue theme)',
                categoryColors: 'Tailwind gradient/text/border classes for each color',
                semantic: 'Semantic color tokens for background, surface, text, etc.',
              },
            }, null, 2),
          },
        ],
      };
    }
  );
}

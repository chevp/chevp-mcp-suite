import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { designSystem, categoryConfig, materialIcons, availableColors } from '../data/design-system.js';

export function registerGetDesignSystem(server: McpServer): void {
  server.tool(
    'get_design_system',
    'Get the complete design system for chevp.github.io including colors, typography, and component styles',
    {},
    async () => {
      return {
        content: [
          {
            type: 'text' as const,
            text: JSON.stringify({
              designSystem,
              categoryConfig,
              materialIcons,
              availableColors,
            }, null, 2),
          },
        ],
      };
    }
  );
}

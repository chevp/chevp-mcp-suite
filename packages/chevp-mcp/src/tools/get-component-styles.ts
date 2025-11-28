import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { designSystem } from '../data/design-system.js';

export function registerGetComponentStyles(server: McpServer): void {
  server.tool(
    'get_component_styles',
    'Get component styles (cards, buttons, squircles) for chevp.github.io',
    {},
    async () => {
      return {
        content: [
          {
            type: 'text' as const,
            text: JSON.stringify({
              components: designSystem.components,
              layout: designSystem.layout,
              typography: designSystem.typography,
              cssClasses: {
                glass: 'background: rgba(255, 255, 255, 0.05); backdrop-filter: blur(12px); border: 1px solid rgba(255, 255, 255, 0.1);',
                hoverGlow: 'box-shadow: 0 0 20px rgba(59, 130, 246, 0.4); transform: translateY(-2px);',
                gradientText: 'background: linear-gradient(135deg, #60a5fa 0%, #3b82f6 50%, #2563eb 100%); -webkit-background-clip: text; -webkit-text-fill-color: transparent;',
                gridBg: 'background-image: linear-gradient(rgba(59, 130, 246, 0.05) 1px, transparent 1px), linear-gradient(90deg, rgba(59, 130, 246, 0.05) 1px, transparent 1px); background-size: 20px 20px;',
                diagonalStripes: 'background-image: repeating-linear-gradient(45deg, transparent, transparent 10px, rgba(255, 255, 255, 0.02) 10px, rgba(255, 255, 255, 0.02) 20px);',
              },
            }, null, 2),
          },
        ],
      };
    }
  );
}

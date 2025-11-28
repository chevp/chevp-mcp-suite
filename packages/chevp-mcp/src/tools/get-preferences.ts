import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { preferences, guidelines } from '../data/preferences.js';

export function registerGetPreferences(server: McpServer): void {
  server.tool(
    'get_preferences',
    'Get chevp design preferences including dark mode settings, style guidelines, and component patterns',
    {},
    async () => {
      return {
        content: [
          {
            type: 'text' as const,
            text: JSON.stringify({
              preferences,
              guidelines,
              summary: {
                theme: 'ALWAYS use dark mode',
                background: 'bg-slate-950 (almost black)',
                text: 'text-slate-100 (off-white)',
                accent: 'Arctic blue palette (blue-400 to blue-600)',
                cards: 'Use glass effect with subtle borders',
                font: 'Inter font family',
              },
            }, null, 2),
          },
        ],
      };
    }
  );
}

import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { z } from 'zod';
import { preferences, guidelines } from '../data/preferences.js';

export function registerGetHtmlTemplate(server: McpServer): void {
  server.tool(
    'get_html_template',
    'Get a dark-mode HTML boilerplate template with chevp design system styles pre-configured',
    {
      title: z.string().optional().describe('Page title (default: "Prototype")'),
    },
    async ({ title }) => {
      const html = preferences.htmlBoilerplate
        .replace('{{TITLE}}', title || 'Prototype')
        .replace('{{CONTENT}}', `
  <div class="container mx-auto px-4 py-8">
    <h1 class="text-3xl font-bold gradient-text mb-6">${title || 'Prototype'}</h1>

    <!-- Your content here -->
    <div class="glass rounded-xl p-6">
      <p class="text-slate-300">Start building your prototype here.</p>
    </div>
  </div>`);

      return {
        content: [
          {
            type: 'text' as const,
            text: JSON.stringify({
              template: html,
              preferences: {
                theme: preferences.theme,
                defaultStyles: preferences.defaultStyles,
              },
              guidelines,
              componentSnippets: guidelines.components,
            }, null, 2),
          },
        ],
      };
    }
  );
}

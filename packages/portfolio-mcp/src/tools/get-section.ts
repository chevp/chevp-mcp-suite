import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { z } from 'zod';
import { loadPortfolioData, listSectionFiles } from '../data/loader.js';

export function registerGetSection(server: McpServer): void {
  server.tool(
    'get_section',
    'Get details about a specific portfolio section',
    {
      name: z.string().describe('Section name (e.g., architecture, concepts, ecosystems)'),
    },
    async ({ name }) => {
      const data = loadPortfolioData();

      if (!data) {
        return {
          content: [
            {
              type: 'text' as const,
              text: JSON.stringify({
                error: 'Could not load portfolio data',
              }, null, 2),
            },
          ],
        };
      }

      const section = data.sections.find(
        (s) => s.name.toLowerCase() === name.toLowerCase()
      );

      if (!section) {
        return {
          content: [
            {
              type: 'text' as const,
              text: JSON.stringify({
                error: `Section "${name}" not found`,
                availableSections: data.sections.map((s) => s.name),
              }, null, 2),
            },
          ],
        };
      }

      const files = listSectionFiles(section.path);

      return {
        content: [
          {
            type: 'text' as const,
            text: JSON.stringify({
              section: {
                ...section,
                fullPath: `portfolio/${section.path}`,
              },
              files,
              fileCount: files.length,
            }, null, 2),
          },
        ],
      };
    }
  );
}

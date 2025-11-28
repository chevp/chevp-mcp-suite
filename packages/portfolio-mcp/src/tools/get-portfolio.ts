import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { loadPortfolioData, listSectionFiles } from '../data/loader.js';

export function registerGetPortfolio(server: McpServer): void {
  server.tool(
    'get_portfolio',
    'Get portfolio overview including sections, technologies, and highlights - reads from portfolio/.mcp/portfolio.json',
    {},
    async () => {
      const data = loadPortfolioData();

      if (!data) {
        return {
          content: [
            {
              type: 'text' as const,
              text: JSON.stringify({
                error: 'Could not load portfolio data from portfolio/.mcp/portfolio.json',
              }, null, 2),
            },
          ],
        };
      }

      const sectionsWithFiles = data.sections.map((section) => ({
        ...section,
        files: listSectionFiles(section.path),
      }));

      return {
        content: [
          {
            type: 'text' as const,
            text: JSON.stringify({
              source: 'portfolio/.mcp/portfolio.json',
              sections: sectionsWithFiles,
              technologies: data.technologies,
              highlights: data.highlights,
            }, null, 2),
          },
        ],
      };
    }
  );
}

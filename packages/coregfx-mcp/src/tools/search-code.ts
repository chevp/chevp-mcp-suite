/**
 * Tool: search_code
 * Search within coregfx header files
 */

import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { z } from 'zod';
import { classes, modules } from '../data/index.js';
import { searchInHeaders, isCoregfxAvailable } from '../data/loader.js';

export function registerSearchCode(server: McpServer): void {
  server.tool(
    'search_code',
    'Search for patterns in coregfx header files or find classes/methods by keyword',
    {
      query: z
        .string()
        .describe(
          'The search query - can be a class name, method name, or regex pattern'
        ),
      search_type: z
        .enum(['static', 'files'])
        .optional()
        .describe(
          'Search type: "static" searches the known class/method database, "files" searches actual header files (default: static)'
        ),
    },
    async ({ query, search_type = 'static' }) => {
      if (search_type === 'files') {
        if (!isCoregfxAvailable()) {
          return {
            content: [
              {
                type: 'text' as const,
                text: JSON.stringify(
                  {
                    error: 'Coregfx codebase not available for file search',
                    hint: 'Use search_type="static" to search the known class database',
                    codebaseAvailable: false,
                  },
                  null,
                  2
                ),
              },
            ],
          };
        }

        const fileResults = searchInHeaders(query);

        return {
          content: [
            {
              type: 'text' as const,
              text: JSON.stringify(
                {
                  query,
                  searchType: 'files',
                  resultCount: fileResults.length,
                  results: fileResults,
                },
                null,
                2
              ),
            },
          ],
        };
      }

      // Static search through known classes and methods
      const queryLower = query.toLowerCase();

      const matchingClasses = classes.filter(
        (c) =>
          c.name.toLowerCase().includes(queryLower) ||
          c.description.toLowerCase().includes(queryLower)
      );

      const matchingMethods: Array<{
        className: string;
        method: (typeof classes)[0]['publicMethods'][0];
      }> = [];

      for (const cls of classes) {
        for (const method of cls.publicMethods) {
          if (
            method.name.toLowerCase().includes(queryLower) ||
            method.description.toLowerCase().includes(queryLower) ||
            method.signature.toLowerCase().includes(queryLower)
          ) {
            matchingMethods.push({
              className: cls.name,
              method,
            });
          }
        }
      }

      const matchingModules = modules.filter(
        (m) =>
          m.name.toLowerCase().includes(queryLower) ||
          m.description.toLowerCase().includes(queryLower)
      );

      const result = {
        query,
        searchType: 'static',
        matchingClasses: matchingClasses.map((c) => ({
          name: c.name,
          module: c.module,
          description: c.description,
          pattern: c.pattern,
        })),
        matchingMethods: matchingMethods.map((m) => ({
          class: m.className,
          method: m.method.name,
          signature: m.method.signature,
          description: m.method.description,
        })),
        matchingModules: matchingModules.map((m) => ({
          name: m.name,
          description: m.description,
          status: m.status,
        })),
        totalResults:
          matchingClasses.length +
          matchingMethods.length +
          matchingModules.length,
      };

      return {
        content: [
          {
            type: 'text' as const,
            text: JSON.stringify(result, null, 2),
          },
        ],
      };
    }
  );
}

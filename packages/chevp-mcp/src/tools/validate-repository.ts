import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { z } from 'zod';
import { categoryConfig } from '../data/design-system.js';

export function registerValidateRepository(server: McpServer): void {
  server.tool(
    'validate_repository',
    'Validate a repository entry before adding it to chevp.github.io',
    {
      name: z.string().describe('Repository name'),
      desc: z.string().describe('Repository description'),
      category: z.string().describe('Category name (e.g., Projects, Assets, Graphics)'),
      url: z.string().optional().describe('Optional URL to the repository or project page'),
      org: z.string().optional().describe('Organization name (defaults to "projects")'),
    },
    async ({ name, desc, category, url, org }) => {
      const errors: string[] = [];
      const warnings: string[] = [];

      // Validate name
      if (name.length < 2) {
        errors.push('Repository name must be at least 2 characters');
      }
      if (!/^[a-zA-Z0-9-_.]+$/.test(name)) {
        warnings.push('Repository name should use only alphanumeric characters, hyphens, underscores, and dots');
      }

      // Validate description
      if (desc.length < 10) {
        warnings.push('Description is quite short. Consider adding more detail.');
      }
      if (desc === `Organisation: ${org || 'projects'}`) {
        warnings.push('Description is generic. Consider adding a meaningful description.');
      }

      // Validate category
      const validCategories = Object.keys(categoryConfig);
      if (!validCategories.includes(category)) {
        errors.push(`Invalid category "${category}". Valid categories: ${validCategories.join(', ')}`);
      }

      // Validate URL if provided
      if (url) {
        try {
          new URL(url);
        } catch {
          errors.push('Invalid URL format');
        }
      }

      const isValid = errors.length === 0;

      return {
        content: [
          {
            type: 'text' as const,
            text: JSON.stringify({
              valid: isValid,
              repository: { name, desc, category, url, org: org || 'projects' },
              errors,
              warnings,
              suggestion: isValid
                ? `Repository "${name}" is valid and can be added to the "${category}" category.`
                : `Please fix the errors before adding this repository.`,
            }, null, 2),
          },
        ],
      };
    }
  );
}

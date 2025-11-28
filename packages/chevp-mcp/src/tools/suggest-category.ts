import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { z } from 'zod';
import { categoryConfig } from '../data/design-system.js';

const categoryKeywords: Record<string, string[]> = {
  'Projects': ['project', 'tutorial', 'guide', 'site', 'homepage', 'demo'],
  'Assets': ['asset', 'library', 'blender', 'scene', 'image', 'pbr', 'material', 'texture'],
  'Data': ['data', 'morph', 'json', 'genomics', 'biomedical', 'database'],
  'Development': ['sdk', 'dev', 'cli', 'quickstart', 'dashboard', 'configurator'],
  'Engine': ['engine', 'node', 'framework', 'nexus', 'mesh', 'runtime'],
  'Frameworks': ['hub', 'nimbus', 'broker', 'ecs', 'logic'],
  'Gaming': ['game', 'horizon', 'scape', 'sprite', 'axon', 'station'],
  'Graphics': ['render', 'three', 'vulkan', 'opengl', 'grpc', 'shader', 'graphics', 'coregfx'],
  'Platform': ['platform', 'vibes', 'box', 'cloud'],
  'Tools': ['tool', 'dispatch', 'control', 'editor', 'converter', 'mapping', 'verto'],
  'Web': ['web', 'site', 'angular', 'spring', 'shop', 'commerce', 'front'],
};

export function registerSuggestCategory(server: McpServer): void {
  server.tool(
    'suggest_category',
    'Suggest a category for a repository based on its name and description',
    {
      name: z.string().describe('Repository name'),
      desc: z.string().optional().describe('Repository description'),
    },
    async ({ name, desc }) => {
      const text = `${name} ${desc || ''}`.toLowerCase();
      const scores: Record<string, number> = {};

      for (const [category, keywords] of Object.entries(categoryKeywords)) {
        scores[category] = 0;
        for (const keyword of keywords) {
          if (text.includes(keyword)) {
            scores[category] += 1;
          }
        }
      }

      const sorted = Object.entries(scores)
        .filter(([, score]) => score > 0)
        .sort((a, b) => b[1] - a[1]);

      const suggestions = sorted.slice(0, 3).map(([category, score]) => ({
        category,
        confidence: score > 2 ? 'high' : score > 1 ? 'medium' : 'low',
        config: categoryConfig[category],
      }));

      return {
        content: [
          {
            type: 'text' as const,
            text: JSON.stringify({
              input: { name, desc },
              suggestions: suggestions.length > 0 ? suggestions : [
                { category: 'Projects', confidence: 'default', config: categoryConfig['Projects'] }
              ],
              allCategories: Object.keys(categoryConfig),
            }, null, 2),
          },
        ],
      };
    }
  );
}

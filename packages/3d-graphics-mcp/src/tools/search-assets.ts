import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { z } from 'zod';
import { getAllAssets, isCacheValid } from '../data/index-cache.js';
import { performScan } from '../data/scanner.js';
import type { Asset, SearchResult } from '../types/index.js';

function calculateSearchScore(asset: Asset, query: string, fuzzy: boolean): SearchResult | null {
  const queryLower = query.toLowerCase();
  const matches: string[] = [];
  let score = 0;

  // Name match (highest weight)
  const nameLower = asset.name.toLowerCase();
  if (nameLower === queryLower) {
    score += 100;
    matches.push('exact_name');
  } else if (nameLower.includes(queryLower)) {
    score += 50;
    matches.push('name');
  } else if (fuzzy) {
    // Simple fuzzy matching
    const queryChars = queryLower.split('');
    let lastIndex = -1;
    let fuzzyMatch = true;
    for (const char of queryChars) {
      const idx = nameLower.indexOf(char, lastIndex + 1);
      if (idx === -1) {
        fuzzyMatch = false;
        break;
      }
      lastIndex = idx;
    }
    if (fuzzyMatch) {
      score += 20;
      matches.push('fuzzy_name');
    }
  }

  // Path match
  if (asset.path.toLowerCase().includes(queryLower)) {
    score += 30;
    matches.push('path');
  }

  // Category match
  if (asset.category.toLowerCase().includes(queryLower)) {
    score += 25;
    matches.push('category');
  }

  // Tags match
  for (const tag of asset.tags) {
    if (tag.toLowerCase().includes(queryLower)) {
      score += 20;
      matches.push(`tag:${tag}`);
    }
  }

  // Format match
  for (const format of asset.formats) {
    if (format.toLowerCase() === `.${queryLower}` || format.toLowerCase() === queryLower) {
      score += 15;
      matches.push(`format:${format}`);
    }
  }

  if (score === 0) {
    return null;
  }

  return { asset, score, matches };
}

export function registerSearchAssets(server: McpServer): void {
  server.tool(
    'search_assets',
    'Search 3D graphics assets by keyword (searches name, path, tags, formats)',
    {
      query: z.string().describe('Search query'),
      type: z.enum(['model', 'texture', 'material', 'shader', 'scene', 'animation', 'font']).optional()
        .describe('Filter by asset type'),
      category: z.string().optional()
        .describe('Filter by category'),
      format: z.string().optional()
        .describe('Filter by format (e.g., .gltf, .blend)'),
      shader: z.string().optional()
        .describe('Filter by shader compatibility'),
      fuzzy: z.boolean().optional().default(false)
        .describe('Enable fuzzy matching'),
      limit: z.number().optional().default(20)
        .describe('Maximum results'),
    },
    async ({ query, type, category, format, shader, fuzzy, limit }) => {
      // Ensure cache is valid
      if (!isCacheValid()) {
        performScan();
      }

      let assets = getAllAssets();

      // Apply pre-filters
      if (type) {
        assets = assets.filter((a) => a.type === type);
      }
      if (category) {
        assets = assets.filter((a) => a.category === category);
      }
      if (format) {
        const formatLower = format.toLowerCase();
        const normalizedFormat = formatLower.startsWith('.') ? formatLower : `.${formatLower}`;
        assets = assets.filter((a) => a.formats.some((f) => f.toLowerCase() === normalizedFormat));
      }
      if (shader) {
        assets = assets.filter((a) => a.shader_compatible.includes(shader));
      }

      // Search and score
      const results: SearchResult[] = [];
      for (const asset of assets) {
        const result = calculateSearchScore(asset, query, fuzzy);
        if (result) {
          results.push(result);
        }
      }

      // Sort by score
      results.sort((a, b) => b.score - a.score);

      // Apply limit
      const limitedResults = results.slice(0, limit);

      return {
        content: [
          {
            type: 'text' as const,
            text: JSON.stringify({
              query,
              total_matches: results.length,
              results: limitedResults.map((r) => ({
                id: r.asset.id,
                name: r.asset.name,
                type: r.asset.type,
                category: r.asset.category,
                path: r.asset.path,
                score: r.score,
                matches: r.matches,
              })),
              filters_applied: { type, category, format, shader, fuzzy },
            }, null, 2),
          },
        ],
      };
    }
  );
}

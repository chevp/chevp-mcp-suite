import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { z } from 'zod';
import { getAllAssets, getIndexStats, isCacheValid, loadAssetIndex } from '../data/index-cache.js';
import { performScan } from '../data/scanner.js';
import type { AssetType } from '../types/index.js';

export function registerListAssets(server: McpServer): void {
  server.tool(
    'list_assets',
    'List 3D graphics assets by type or category (uses cached index)',
    {
      type: z.enum(['model', 'texture', 'material', 'shader', 'scene', 'animation', 'font']).optional()
        .describe('Filter by asset type'),
      category: z.string().optional()
        .describe('Filter by category (e.g., blender-external, work)'),
      limit: z.number().optional().default(50)
        .describe('Maximum number of assets to return'),
      offset: z.number().optional().default(0)
        .describe('Offset for pagination'),
    },
    async ({ type, category, limit, offset }) => {
      // Ensure cache is valid
      if (!isCacheValid()) {
        performScan();
      }

      let assets = getAllAssets();

      // Apply filters
      if (type) {
        assets = assets.filter((a) => a.type === type);
      }
      if (category) {
        assets = assets.filter((a) => a.category === category);
      }

      // Get total before pagination
      const total = assets.length;

      // Apply pagination
      assets = assets.slice(offset, offset + limit);

      const stats = getIndexStats();
      const index = loadAssetIndex();

      // Get unique categories
      const categories = [...new Set(getAllAssets().map((a) => a.category))];

      return {
        content: [
          {
            type: 'text' as const,
            text: JSON.stringify({
              assets: assets.map((a) => ({
                id: a.id,
                name: a.name,
                type: a.type,
                category: a.category,
                formats: a.formats,
                size_bytes: a.size_bytes,
              })),
              pagination: {
                total,
                limit,
                offset,
                has_more: offset + limit < total,
              },
              stats,
              categories,
              cache_info: {
                generated: index.generated,
                scan_duration_ms: index.scan_duration_ms,
              },
              usage: 'Use get_asset(id) for full asset details',
            }, null, 2),
          },
        ],
      };
    }
  );
}

import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { z } from 'zod';
import { getScenes, getScene, getComponents, getRoutes } from '../data/synth-game.js';

export function registerListSynthGameScenes(server: McpServer): void {
  server.tool(
    'list_synth_game_scenes',
    'List all synth-game scenes with their entities, or get details for a specific scene. Also lists components and routes.',
    {
      view: z.enum(['scenes', 'components', 'routes', 'overview']).optional()
        .describe('What to show: scenes, components, routes, or overview (default: overview)'),
      sceneId: z.string().optional()
        .describe('Get details for a specific scene by ID'),
      componentType: z.string().optional()
        .describe('Filter components by type (e.g., "building", "npc", "ui", "furniture")'),
    },
    async ({ view, sceneId, componentType }) => {
      // Specific scene detail
      if (sceneId) {
        const scene = getScene(sceneId);
        if (!scene) {
          return {
            content: [{ type: 'text' as const, text: `Scene "${sceneId}" not found.` }],
          };
        }
        return {
          content: [{ type: 'text' as const, text: JSON.stringify(scene, null, 2) }],
        };
      }

      const mode = view || 'overview';

      if (mode === 'scenes') {
        return {
          content: [{ type: 'text' as const, text: JSON.stringify(getScenes(), null, 2) }],
        };
      }

      if (mode === 'components') {
        let components = getComponents();
        if (componentType) {
          components = components.filter((c) =>
            c.type.toLowerCase() === componentType.toLowerCase()
          );
        }
        return {
          content: [{ type: 'text' as const, text: JSON.stringify(components, null, 2) }],
        };
      }

      if (mode === 'routes') {
        return {
          content: [{ type: 'text' as const, text: JSON.stringify(getRoutes(), null, 2) }],
        };
      }

      // Overview
      const scenes = getScenes();
      const components = getComponents();
      const routes = getRoutes();

      const overview = {
        scenes: scenes.map((s) => ({
          id: s.id,
          name: s.name,
          entityCount: s.entityCount,
          file: s.file,
        })),
        components: {
          total: components.length,
          byType: groupBy(components, (c) => c.type),
        },
        routes: routes.map((r) => ({
          id: r.id,
          path: r.path,
          isDefault: r.isDefault,
          sceneRef: r.sceneRef,
        })),
      };

      return {
        content: [{ type: 'text' as const, text: JSON.stringify(overview, null, 2) }],
      };
    }
  );
}

function groupBy<T>(items: T[], keyFn: (item: T) => string): Record<string, number> {
  const groups: Record<string, number> = {};
  for (const item of items) {
    const key = keyFn(item);
    groups[key] = (groups[key] || 0) + 1;
  }
  return groups;
}

import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { z } from 'zod';
import { getScenes, getComponents, getRoutes } from '../data/synth-game.js';

export function registerCheckSynthGameRefs(server: McpServer): void {
  server.tool(
    'check_synth_game_refs',
    'Trace cross-references in synth-game: which scenes use which components, which buildings link to which routes, producerId mapping across buildings and shop-interior',
    {
      producerId: z.string().optional()
        .describe('Trace a specific producerId across all files'),
      entityId: z.string().optional()
        .describe('Find an entity by ID across all scenes'),
    },
    async ({ producerId, entityId }) => {
      const scenes = getScenes();
      const components = getComponents();
      const routes = getRoutes();

      // Trace a specific producerId
      if (producerId) {
        const buildingComp = components.find(
          (c) => c.properties['producerId'] === producerId
        );
        const targetRoute = buildingComp?.properties['targetRoute'];
        const matchingRoute = routes.find((r) => r.path === targetRoute);

        const usedInScenes = scenes
          .filter((s) =>
            s.entities.some((e) => {
              if (e.componentRef && buildingComp) {
                return e.componentRef === buildingComp.file;
              }
              return false;
            })
          )
          .map((s) => ({
            sceneId: s.id,
            entityId: s.entities.find((e) => e.componentRef === buildingComp?.file)?.id,
            position: s.entities.find((e) => e.componentRef === buildingComp?.file)?.position,
          }));

        const result = {
          producerId,
          building: buildingComp
            ? { id: buildingComp.id, file: buildingComp.file, shopName: buildingComp.properties['shopName'] }
            : null,
          targetRoute: targetRoute || null,
          routeMatch: matchingRoute
            ? { id: matchingRoute.id, sceneRef: matchingRoute.sceneRef }
            : null,
          placedInScenes: usedInScenes,
        };

        return {
          content: [{ type: 'text' as const, text: JSON.stringify(result, null, 2) }],
        };
      }

      // Find an entity by ID across all scenes
      if (entityId) {
        const found: Array<{
          sceneId: string;
          sceneFile: string;
          entity: unknown;
        }> = [];

        for (const scene of scenes) {
          const entity = scene.entities.find((e) => e.id === entityId);
          if (entity) {
            found.push({
              sceneId: scene.id,
              sceneFile: scene.file,
              entity,
            });
          }
        }

        return {
          content: [
            {
              type: 'text' as const,
              text: found.length > 0
                ? JSON.stringify(found, null, 2)
                : `Entity "${entityId}" not found in any scene.`,
            },
          ],
        };
      }

      // Default: Full reference map
      const buildingComponents = components.filter((c) => c.type === 'building');

      const refMap = {
        buildings: buildingComponents.map((b) => {
          const pid = b.properties['producerId'];
          const targetRoute = b.properties['targetRoute'];

          return {
            componentId: b.id,
            file: b.file,
            producerId: pid,
            shopName: b.properties['shopName'],
            targetRoute,
            routeExists: routes.some((r) => r.path === targetRoute),
            placedIn: scenes
              .filter((s) => s.entities.some((e) => e.componentRef === b.file))
              .map((s) => s.id),
          };
        }),
        shopInterior: {
          sceneId: 'shop-interior',
          usedByRoutes: routes.filter((r) => r.sceneRef.includes('shop-interior')).map((r) => r.id),
          shelves: scenes
            .find((s) => s.id === 'shop-interior')
            ?.entities.filter((e) => e.componentRef.includes('shop-shelf'))
            .map((e) => ({ id: e.id, position: e.position })) || [],
        },
        orphanedComponents: components
          .filter((c) => !scenes.some((s) => s.entities.some((e) => e.componentRef === c.file)))
          .map((c) => ({ id: c.id, file: c.file, type: c.type })),
      };

      return {
        content: [{ type: 'text' as const, text: JSON.stringify(refMap, null, 2) }],
      };
    }
  );
}

/**
 * Tool: get_cryo_relationship
 * Get information about the relationship between coregfx and cryo-protocol
 */

import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { z } from 'zod';
import { cryoRelationships, classes } from '../data/index.js';

export function registerGetCryoRelationship(server: McpServer): void {
  server.tool(
    'get_cryo_relationship',
    'Get information about how coregfx components interact with cryo-protocol messages and services',
    {
      component: z
        .string()
        .optional()
        .describe(
          'The coregfx component name (e.g., "RuntimeContext", "OceanPbrApp"). Leave empty for all relationships.'
        ),
      protocol: z
        .string()
        .optional()
        .describe(
          'The cryo protocol domain (e.g., "cryo.scene", "cryo.render"). Leave empty for all.'
        ),
    },
    async ({ component, protocol }) => {
      let relationships = cryoRelationships;

      // Filter by component if provided
      if (component) {
        relationships = relationships.filter(
          (rel) =>
            rel.coregfxComponent.toLowerCase().includes(component.toLowerCase()) ||
            component.toLowerCase().includes(rel.coregfxComponent.toLowerCase())
        );
      }

      // Filter by protocol if provided
      if (protocol) {
        relationships = relationships.filter(
          (rel) =>
            rel.cryoProtocol.toLowerCase().includes(protocol.toLowerCase()) ||
            protocol.toLowerCase().includes(rel.cryoProtocol.toLowerCase())
        );
      }

      if (relationships.length === 0) {
        return {
          content: [
            {
              type: 'text' as const,
              text: JSON.stringify(
                {
                  error: 'No matching relationships found',
                  filters: { component, protocol },
                  availableComponents: [
                    ...new Set(cryoRelationships.map((r) => r.coregfxComponent)),
                  ],
                  availableProtocols: [
                    ...new Set(cryoRelationships.map((r) => r.cryoProtocol)),
                  ],
                },
                null,
                2
              ),
            },
          ],
        };
      }

      // Enrich with class details if filtering by component
      const enrichedRelationships = relationships.map((rel) => {
        const relatedClass = classes.find(
          (c) => c.name.toLowerCase() === rel.coregfxComponent.toLowerCase()
        );

        return {
          ...rel,
          classInfo: relatedClass
            ? {
                module: relatedClass.module,
                description: relatedClass.description,
                pattern: relatedClass.pattern,
              }
            : null,
        };
      });

      const result = {
        filters: { component, protocol },
        relationships: enrichedRelationships,
        summary: {
          totalRelationships: enrichedRelationships.length,
          directions: {
            'coregfx-to-cryo': enrichedRelationships.filter(
              (r) => r.dataDirection === 'coregfx-to-cryo'
            ).length,
            'cryo-to-coregfx': enrichedRelationships.filter(
              (r) => r.dataDirection === 'cryo-to-coregfx'
            ).length,
            bidirectional: enrichedRelationships.filter(
              (r) => r.dataDirection === 'bidirectional'
            ).length,
          },
        },
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

/**
 * Tool: get_data_flow
 * Get information about data flows in coregfx
 */

import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { z } from 'zod';
import { dataFlows, uriSchemes, shaderFeatures } from '../data/index.js';

export function registerGetDataFlow(server: McpServer): void {
  server.tool(
    'get_data_flow',
    'Get information about data flows, asset URI schemes, and shader features in coregfx',
    {
      flow_name: z
        .string()
        .optional()
        .describe(
          'The data flow name (e.g., "Rendering Initialization", "Asset Loading"). Leave empty to list all.'
        ),
    },
    async ({ flow_name }) => {
      // If no name provided, return overview
      if (!flow_name) {
        return {
          content: [
            {
              type: 'text' as const,
              text: JSON.stringify(
                {
                  dataFlows: dataFlows.map((f) => ({
                    name: f.name,
                    description: f.description,
                    stepCount: f.steps.length,
                  })),
                  uriSchemes,
                  shaderFeatures,
                },
                null,
                2
              ),
            },
          ],
        };
      }

      // Find specific flow
      const flow = dataFlows.find(
        (f) =>
          f.name.toLowerCase().includes(flow_name.toLowerCase()) ||
          flow_name.toLowerCase().includes(f.name.toLowerCase())
      );

      if (!flow) {
        return {
          content: [
            {
              type: 'text' as const,
              text: JSON.stringify(
                {
                  error: `Data flow '${flow_name}' not found`,
                  availableFlows: dataFlows.map((f) => f.name),
                  hint: 'Call without flow_name parameter to see all data flows',
                },
                null,
                2
              ),
            },
          ],
        };
      }

      const result = {
        flow: {
          name: flow.name,
          description: flow.description,
        },
        steps: flow.steps,
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

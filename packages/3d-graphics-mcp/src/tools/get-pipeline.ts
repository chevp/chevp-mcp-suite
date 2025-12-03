import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { z } from 'zod';
import { loadPipelineDefinitions } from '../data/index-cache.js';

export function registerGetPipeline(server: McpServer): void {
  server.tool(
    'get_pipeline',
    'Get detailed information about a specific pipeline',
    {
      id: z.string().describe('Pipeline ID (e.g., blend-to-gltf)'),
    },
    async ({ id }) => {
      const definitions = loadPipelineDefinitions();
      const pipeline = definitions.pipelines[id];

      if (!pipeline) {
        return {
          content: [
            {
              type: 'text' as const,
              text: JSON.stringify({
                error: `Pipeline not found: ${id}`,
                available_pipelines: Object.keys(definitions.pipelines),
              }, null, 2),
            },
          ],
        };
      }

      // Get tool details for each step
      const stepsWithToolInfo = pipeline.steps.map((step) => {
        if (step.tool) {
          const tool = definitions.tools[step.tool];
          return {
            ...step,
            tool_info: tool ? {
              executable: tool.executable,
              version_required: tool.version_required,
            } : null,
          };
        }
        return step;
      });

      return {
        content: [
          {
            type: 'text' as const,
            text: JSON.stringify({
              pipeline: {
                ...pipeline,
                steps: stepsWithToolInfo,
              },
              usage: {
                example: `run_pipeline("${id}", "path/to/input.${pipeline.input_formats[0]?.replace('.', '')}")`,
                options_example: pipeline.options
                  ? Object.entries(pipeline.options).map(([key, opt]) => `${key}: ${opt.default}`)
                  : [],
              },
            }, null, 2),
          },
        ],
      };
    }
  );
}

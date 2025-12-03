import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { z } from 'zod';
import { loadPipelineDefinitions } from '../data/index-cache.js';

export function registerListPipelines(server: McpServer): void {
  server.tool(
    'list_pipelines',
    'List available asset conversion pipelines',
    {
      input_format: z.string().optional()
        .describe('Filter by input format (e.g., .blend)'),
      output_format: z.string().optional()
        .describe('Filter by output format (e.g., .gltf)'),
    },
    async ({ input_format, output_format }) => {
      const definitions = loadPipelineDefinitions();
      let pipelines = Object.values(definitions.pipelines);

      // Apply filters
      if (input_format) {
        const format = input_format.startsWith('.') ? input_format : `.${input_format}`;
        pipelines = pipelines.filter((p) =>
          p.input_formats.some((f) => f.toLowerCase() === format.toLowerCase())
        );
      }
      if (output_format) {
        const format = output_format.startsWith('.') ? output_format : `.${output_format}`;
        pipelines = pipelines.filter((p) =>
          p.output_format.toLowerCase() === format.toLowerCase()
        );
      }

      return {
        content: [
          {
            type: 'text' as const,
            text: JSON.stringify({
              pipelines: pipelines.map((p) => ({
                id: p.id,
                name: p.name,
                description: p.description,
                input_formats: p.input_formats,
                output_format: p.output_format,
                steps_count: p.steps.length,
                options: Object.keys(p.options || {}),
              })),
              available_tools: Object.entries(definitions.tools).map(([id, tool]) => ({
                id,
                executable: tool.executable,
                version_required: tool.version_required,
              })),
              usage: 'Use get_pipeline(id) for full pipeline details, run_pipeline(id, input) to execute',
            }, null, 2),
          },
        ],
      };
    }
  );
}

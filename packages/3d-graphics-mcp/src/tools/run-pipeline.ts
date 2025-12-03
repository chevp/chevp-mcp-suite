import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { z } from 'zod';
import path from 'node:path';
import fs from 'node:fs';
import { loadPipelineDefinitions } from '../data/index-cache.js';

export function registerRunPipeline(server: McpServer): void {
  server.tool(
    'run_pipeline',
    'Execute an asset conversion pipeline (returns command to run)',
    {
      pipeline_id: z.string().describe('Pipeline ID to execute'),
      input: z.string().describe('Input file path'),
      output: z.string().optional().describe('Output file path (auto-generated if not specified)'),
      options: z.record(z.union([z.string(), z.boolean(), z.number()])).optional()
        .describe('Pipeline-specific options'),
    },
    async ({ pipeline_id, input, output, options }) => {
      const definitions = loadPipelineDefinitions();
      const pipeline = definitions.pipelines[pipeline_id];

      if (!pipeline) {
        return {
          content: [
            {
              type: 'text' as const,
              text: JSON.stringify({
                error: `Pipeline not found: ${pipeline_id}`,
                available_pipelines: Object.keys(definitions.pipelines),
              }, null, 2),
            },
          ],
        };
      }

      // Check input file exists
      if (!fs.existsSync(input)) {
        return {
          content: [
            {
              type: 'text' as const,
              text: JSON.stringify({
                error: `Input file not found: ${input}`,
              }, null, 2),
            },
          ],
        };
      }

      // Validate input format
      const inputExt = path.extname(input).toLowerCase();
      if (!pipeline.input_formats.includes(inputExt)) {
        return {
          content: [
            {
              type: 'text' as const,
              text: JSON.stringify({
                error: `Invalid input format: ${inputExt}`,
                expected: pipeline.input_formats,
              }, null, 2),
            },
          ],
        };
      }

      // Generate output path if not specified
      const outputPath = output || input.replace(inputExt, pipeline.output_format);

      // Build command sequence
      const commands: string[] = [];

      for (const step of pipeline.steps) {
        if (step.pipeline) {
          // Nested pipeline - would need recursive handling
          commands.push(`# Execute nested pipeline: ${step.pipeline}`);
          continue;
        }

        if (!step.tool) {
          continue;
        }

        const tool = definitions.tools[step.tool];
        if (!tool) {
          commands.push(`# WARNING: Tool not found: ${step.tool}`);
          continue;
        }

        let command = tool.executable;

        // Add tool args
        if (tool.args) {
          command += ' ' + tool.args.join(' ');
        }

        // Add step args
        if (Array.isArray(step.args)) {
          command += ' ' + step.args.join(' ');
        } else if (step.args) {
          // Build args from object
          for (const [key, value] of Object.entries(step.args)) {
            if (typeof value === 'boolean') {
              if (value) command += ` --${key}`;
            } else {
              command += ` --${key}="${value}"`;
            }
          }
        }

        // Add input/output
        if (step.tool === 'blender') {
          command = `blender --background "${input}" --python-expr "import bpy; bpy.ops.export_scene.gltf(filepath='${outputPath}')"`;
        } else {
          command += ` "${input}" -o "${outputPath}"`;
        }

        commands.push(command);
      }

      return {
        content: [
          {
            type: 'text' as const,
            text: JSON.stringify({
              pipeline: {
                id: pipeline_id,
                name: pipeline.name,
              },
              input,
              output: outputPath,
              options_applied: options || {},
              commands,
              note: 'Execute these commands in order. Some may require specific tools to be installed.',
              tools_required: pipeline.steps
                .filter((s) => s.tool)
                .map((s) => s.tool),
            }, null, 2),
          },
        ],
      };
    }
  );
}

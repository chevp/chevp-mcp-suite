/**
 * Tool: get_proto_schema
 * Get information about coregfx protocol buffer schemas
 */

import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { z } from 'zod';
import { protoSchemas } from '../data/index.js';
import {
  readProtoFile,
  listProtoFilesWithStats,
  isCoregfxAvailable,
} from '../data/loader.js';

export function registerGetProtoSchema(server: McpServer): void {
  server.tool(
    'get_proto_schema',
    'Get information about coregfx protocol buffer schemas and their messages/services',
    {
      name: z
        .string()
        .optional()
        .describe(
          'The proto schema name (e.g., "cgfx", "cgfx_runtime_context"). Leave empty to list all.'
        ),
      include_content: z
        .boolean()
        .optional()
        .describe('Include the proto file content if available (default: false)'),
    },
    async ({ name, include_content }) => {
      // If no name provided, list all schemas
      if (!name) {
        const externalProtoFiles = isCoregfxAvailable()
          ? listProtoFilesWithStats()
          : [];

        return {
          content: [
            {
              type: 'text' as const,
              text: JSON.stringify(
                {
                  codebaseAvailable: isCoregfxAvailable(),
                  schemas: protoSchemas.map((s) => ({
                    name: s.name,
                    description: s.description,
                    filePath: s.filePath,
                    lineCount: s.lineCount,
                    messageCount: s.messages.length,
                    serviceCount: s.services.length,
                  })),
                  externalProtoFiles,
                },
                null,
                2
              ),
            },
          ],
        };
      }

      // Find specific schema
      const schema = protoSchemas.find(
        (s) =>
          s.name.toLowerCase() === name.toLowerCase() ||
          s.name.toLowerCase().includes(name.toLowerCase())
      );

      if (!schema) {
        return {
          content: [
            {
              type: 'text' as const,
              text: JSON.stringify(
                {
                  error: `Proto schema '${name}' not found`,
                  availableSchemas: protoSchemas.map((s) => s.name),
                  hint: 'Call without name parameter to list all schemas',
                },
                null,
                2
              ),
            },
          ],
        };
      }

      let protoContent: string | undefined;
      if (include_content && isCoregfxAvailable()) {
        const fileName = schema.filePath.split('/').pop() ?? '';
        protoContent = readProtoFile(fileName) ?? undefined;
        if (protoContent && protoContent.length > 20000) {
          protoContent = protoContent.substring(0, 20000) + '\n... (truncated)';
        }
      }

      const result = {
        schema: {
          name: schema.name,
          domain: schema.domain,
          description: schema.description,
          filePath: schema.filePath,
          lineCount: schema.lineCount,
        },
        messages: schema.messages,
        services: schema.services,
        protoContent,
        codebaseAvailable: isCoregfxAvailable(),
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

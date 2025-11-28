import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { z } from 'zod';
import { loadProtocolData, readProtoFile } from '../data/loader.js';

export function registerGetProtoFile(server: McpServer): void {
  server.tool(
    'get_proto_file',
    'Read the content of a specific .proto file from arctic-workspace',
    {
      domain: z.string().describe('Protocol domain (e.g., cryo-protocol)'),
      file: z.string().describe('Proto file name (e.g., entity.proto)'),
    },
    async ({ domain, file }) => {
      const externalData = loadProtocolData();

      if (!externalData) {
        return {
          content: [
            {
              type: 'text' as const,
              text: JSON.stringify({
                error: 'Could not load protocol data from arctic-workspace/.mcp/protocols.json',
              }, null, 2),
            },
          ],
        };
      }

      const domainData = externalData.domains.find(
        (d) => d.name.toLowerCase() === domain.toLowerCase()
      );

      if (!domainData) {
        return {
          content: [
            {
              type: 'text' as const,
              text: JSON.stringify({
                error: `Domain "${domain}" not found`,
                availableDomains: externalData.domains.map((d) => d.name),
              }, null, 2),
            },
          ],
        };
      }

      const content = readProtoFile(domainData.path, file);

      if (!content) {
        return {
          content: [
            {
              type: 'text' as const,
              text: JSON.stringify({
                error: `Proto file "${file}" not found in ${domainData.path}`,
                tip: 'Use list_protocols() to see available domains and their paths',
              }, null, 2),
            },
          ],
        };
      }

      return {
        content: [
          {
            type: 'text' as const,
            text: JSON.stringify({
              domain: domain,
              file: file,
              path: `arctic/arctic-workspace/${domainData.path}${file}`,
              content: content,
            }, null, 2),
          },
        ],
      };
    }
  );
}

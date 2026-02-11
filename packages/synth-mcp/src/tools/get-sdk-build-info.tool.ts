import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { z } from 'zod';
import {
  buildFormats,
  deploymentTargets,
  runtimeFormats,
  xmlEntityInfo,
  gameSceneDetection,
  buildWorkflow,
  cliCommands,
} from '../data/sdk-build-info.js';

const GetSdkBuildInfoSchema = z.object({
  section: z
    .enum([
      'all',
      'formats',
      'targets',
      'runtime',
      'xml-entities',
      'detection',
      'workflow',
      'commands',
    ])
    .optional()
    .describe(
      'Which section to return: formats, targets, runtime, xml-entities, detection, workflow, commands, or all (default: all)'
    ),
});

export function registerGetSdkBuildInfo(server: McpServer) {
  server.tool(
    'synth__get_sdk_build_info',
    'Get information about synth SDK build capabilities, runtime formats, and CLI commands',
    GetSdkBuildInfoSchema,
    async (args) => {
      const section = args.section || 'all';

      const response: Record<string, unknown> = {};

      // Build Formats
      if (section === 'all' || section === 'formats') {
        response.buildFormats = {
          title: 'Synth Build Formats',
          description:
            'Available output formats for synth build: XML (human-readable), SQLite (runtime-optimized), JSON Manifest (metadata)',
          formats: buildFormats,
        };
      }

      // Deployment Targets
      if (section === 'all' || section === 'targets') {
        response.deploymentTargets = {
          title: 'Deployment Targets',
          description:
            'synth build supports two deployment targets: dist (server-side) and release (client-side)',
          targets: deploymentTargets,
          comparison: {
            dist: {
              assets: 'None (streaming from CDN/static server)',
              size: 'Small (~KB)',
              format: 'XML/SQLite',
              useCase: 'Backend servers, Game servers',
            },
            release: {
              assets: 'Bundled (all assets included)',
              size: 'Large (~GB)',
              format: 'SQLite + assets',
              useCase: 'Desktop apps, Offline clients',
            },
          },
        };
      }

      // Runtime Formats
      if (section === 'all' || section === 'runtime') {
        response.runtimeFormats = {
          title: 'Runtime Formats',
          description:
            'Runtime formats consumed by different parts of the system: SQLite for C++ clients, XML for Java servers',
          formats: runtimeFormats,
          formatChoice: {
            xml: {
              humanReadable: true,
              gitDiff: 'Excellent',
              queryPerformance: 'Sequential scan',
              size: 'Larger (verbose)',
              parsing: 'DOM/SAX overhead',
              useCase: ['Server', 'Development', 'Debugging'],
            },
            sqlite: {
              humanReadable: false,
              gitDiff: 'Binary-diff difficult',
              queryPerformance: 'Indexed queries (fast)',
              size: 'Compact',
              parsing: 'Direct SQL access',
              useCase: ['Client', 'Production'],
            },
          },
        };
      }

      // XML Entities (synth-game)
      if (section === 'all' || section === 'xml-entities') {
        response.xmlEntities = xmlEntityInfo;
      }

      // Game Scene Auto-Detection
      if (section === 'all' || section === 'detection') {
        response.gameSceneDetection = gameSceneDetection;
      }

      // Build Workflow
      if (section === 'all' || section === 'workflow') {
        response.buildWorkflow = buildWorkflow;
      }

      // CLI Commands
      if (section === 'all' || section === 'commands') {
        response.cliCommands = cliCommands;
      }

      return {
        content: [
          {
            type: 'text' as const,
            text: JSON.stringify(response, null, 2),
          },
        ],
      };
    }
  );
}

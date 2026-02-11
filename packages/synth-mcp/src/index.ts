import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { registerListHubServices } from './tools/list-hub-services.js';
import { registerGetProtoService } from './tools/get-proto-service.js';
import { registerGetHubArchitecture } from './tools/get-hub-architecture.js';
import { registerGetConsumerIntegration } from './tools/get-consumer-integration.js';
import { registerListProtoFiles } from './tools/list-proto-files.js';
import { registerValidateSynthGame } from './tools/validate-synth-game.js';
import { registerListSynthGameScenes } from './tools/list-synth-game-scenes.js';
import { registerCheckSynthGameRefs } from './tools/check-synth-game-refs.js';
import { registerGetArchitectureGovernance } from './tools/get-architecture-governance.tool.js';
import { registerGetSdkBuildInfo } from './tools/get-sdk-build-info.tool.js';

export function createServer(): McpServer {
  const __filename = fileURLToPath(import.meta.url);
  const __dirname = path.dirname(__filename);

  let version = '1.0.0';
  try {
    const packagePath = path.join(__dirname, '../package.json');
    if (fs.existsSync(packagePath)) {
      const pkg = JSON.parse(fs.readFileSync(packagePath, 'utf8')) as { version: string };
      version = pkg.version;
    }
  } catch {
    // Use default version
  }

  const server = new McpServer({
    name: 'synth-mcp',
    version,
  });

  // Register tool modules
  registerListHubServices(server);
  registerGetProtoService(server);
  registerGetHubArchitecture(server);
  registerGetConsumerIntegration(server);
  registerListProtoFiles(server);

  // Synth SDK: Build and runtime information
  registerGetSdkBuildInfo(server);

  // Synth-Game: Live XML analysis tools
  registerValidateSynthGame(server);
  registerListSynthGameScenes(server);
  registerCheckSynthGameRefs(server);

  // Synth-Game: Architecture Governance
  registerGetArchitectureGovernance(server);

  return server;
}
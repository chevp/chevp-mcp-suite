import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';

// Tool registrations
import { registerListAssets } from './tools/list-assets.js';
import { registerSearchAssets } from './tools/search-assets.js';
import { registerGetAsset } from './tools/get-asset.js';
import { registerScanDirectory } from './tools/scan-directory.js';
import { registerGetIndexStatus } from './tools/get-index-status.js';
import { registerListPipelines } from './tools/list-pipelines.js';
import { registerGetPipeline } from './tools/get-pipeline.js';
import { registerRunPipeline } from './tools/run-pipeline.js';
import { registerListShaders } from './tools/list-shaders.js';
import { registerGetShaderCompatibility } from './tools/get-shader-compatibility.js';
import { registerDeployToVkpbr5 } from './tools/deploy-to-vkpbr5.js';

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
    name: '3d-graphics-mcp',
    version,
  });

  // Asset Management
  registerListAssets(server);
  registerSearchAssets(server);
  registerGetAsset(server);

  // Index & Cache
  registerScanDirectory(server);
  registerGetIndexStatus(server);

  // Pipeline & Conversion
  registerListPipelines(server);
  registerGetPipeline(server);
  registerRunPipeline(server);

  // Shader & Compatibility
  registerListShaders(server);
  registerGetShaderCompatibility(server);

  // Deployment
  registerDeployToVkpbr5(server);

  return server;
}

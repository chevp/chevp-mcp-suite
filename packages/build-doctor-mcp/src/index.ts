/**
 * Build Doctor MCP Server
 *
 * Intelligent build error diagnosis and fix suggestions.
 *
 * Responsibilities:
 * - Analyze build errors and match against known patterns
 * - Suggest fixes based on historical success rates
 * - Learn from successful fixes to improve suggestions
 * - Execute builds and auto-diagnose failures
 * - Scan codebase for similar errors after fixing one
 */

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { registerAnalyzeError } from './tools/analyze-error.js';
import { registerGetFix } from './tools/get-fix.js';
import { registerLearnFix } from './tools/learn-fix.js';
import { registerListPatterns } from './tools/list-patterns.js';
import { registerRunBuild } from './tools/run-build.js';
import { registerScanSimilar } from './tools/scan-similar.js';

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
    name: 'build-doctor-mcp',
    version,
  });

  // Register tools
  registerAnalyzeError(server);
  registerGetFix(server);
  registerLearnFix(server);
  registerListPatterns(server);
  registerRunBuild(server);
  registerScanSimilar(server);

  return server;
}

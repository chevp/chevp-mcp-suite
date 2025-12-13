// =============================================================================
// VFP MCP Server - Main Entry
// =============================================================================
//
// MCP server implementing the Synth Virtual File Protocol (VFP)
// Combines FTP, Git, and Realtime State Sync in one unified protocol.
//
// =============================================================================

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';

// FTP-like tools
import { registerGet } from './tools/ftp-get.js';
import { registerPut } from './tools/ftp-put.js';
import { registerList } from './tools/ftp-list.js';
import { registerDelete } from './tools/ftp-delete.js';
import { registerMkdir } from './tools/ftp-mkdir.js';
import { registerStat } from './tools/ftp-stat.js';

// Git-like tools
import { registerCommit } from './tools/git-commit.js';
import { registerDiff } from './tools/git-diff.js';
import { registerLog } from './tools/git-log.js';
import { registerBranch } from './tools/git-branch.js';
import { registerCheckout } from './tools/git-checkout.js';
import { registerRevert } from './tools/git-revert.js';

// Realtime tools
import { registerWatch } from './tools/realtime-watch.js';
import { registerUnwatch } from './tools/realtime-unwatch.js';
import { registerInput } from './tools/realtime-input.js';
import { registerSnapshot } from './tools/realtime-snapshot.js';

// Status
import { registerStatus } from './tools/status.js';

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
    name: 'vfp-mcp',
    version,
  });

  // Register FTP-like tools
  registerGet(server);
  registerPut(server);
  registerList(server);
  registerDelete(server);
  registerMkdir(server);
  registerStat(server);

  // Register Git-like tools
  registerCommit(server);
  registerDiff(server);
  registerLog(server);
  registerBranch(server);
  registerCheckout(server);
  registerRevert(server);

  // Register Realtime tools
  registerWatch(server);
  registerUnwatch(server);
  registerInput(server);
  registerSnapshot(server);

  // Register status
  registerStatus(server);

  return server;
}
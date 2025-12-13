// =============================================================================
// VFP MCP - STATUS Tool
// =============================================================================

import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { getStore } from '../data/store.js';

export function registerStatus(server: McpServer): void {
  server.tool(
    'vfp_status',
    'Get current VFP server status (like FTP SYST)',
    {},
    async () => {
      const store = getStore();

      const branches = store.listBranches();

      return {
        content: [{
          type: 'text' as const,
          text: JSON.stringify({
            status: 'ok',
            server: {
              name: 'Synth VFP Server',
              version: '1.0.0',
              features: ['FTP', 'GIT', 'REALTIME'],
            },
            state: {
              currentTick: store.getCurrentTick(),
              currentBranch: store.getCurrentBranch(),
              branchCount: branches.length,
              branches: branches.map(b => b.name),
            },
            capabilities: {
              ftp: ['GET', 'PUT', 'LIST', 'DELETE', 'MKDIR', 'STAT'],
              git: ['COMMIT', 'DIFF', 'LOG', 'BRANCH', 'CHECKOUT', 'REVERT'],
              realtime: ['WATCH', 'UNWATCH', 'INPUT', 'SNAPSHOT'],
            },
          }, null, 2),
        }],
      };
    }
  );
}
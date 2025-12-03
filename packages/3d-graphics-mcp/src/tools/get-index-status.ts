import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { loadAssetIndex, loadScanStatus, isCacheValid } from '../data/index-cache.js';
import { getGraphicsRoot, getMcpDataPath } from '../data/config.js';

export function registerGetIndexStatus(server: McpServer): void {
  server.tool(
    'get_index_status',
    'Get the current status of the asset index cache',
    {},
    async () => {
      const index = loadAssetIndex();
      const status = loadScanStatus();
      const cacheValid = isCacheValid();

      // Calculate cache age
      let cacheAgeHours: number | null = null;
      if (status.last_full_scan) {
        const lastScan = new Date(status.last_full_scan);
        const now = new Date();
        cacheAgeHours = Math.round((now.getTime() - lastScan.getTime()) / (1000 * 60 * 60) * 10) / 10;
      }

      return {
        content: [
          {
            type: 'text' as const,
            text: JSON.stringify({
              cache_valid: cacheValid,
              graphics_root: getGraphicsRoot(),
              mcp_data_path: getMcpDataPath(),
              index: {
                version: index.version,
                generated: index.generated,
                total_assets: index.stats.total,
                by_type: index.stats.by_type,
                scan_duration_ms: index.scan_duration_ms,
              },
              scan_status: {
                last_full_scan: status.last_full_scan,
                cache_age_hours: cacheAgeHours,
                directories_tracked: Object.keys(status.directories).length,
                directories: status.directories,
                recent_incremental_scans: status.incremental_scans.slice(-5),
              },
              recommendations: !cacheValid ? [
                'Cache is stale or empty. Run scan_directory() to update.',
              ] : [],
            }, null, 2),
          },
        ],
      };
    }
  );
}

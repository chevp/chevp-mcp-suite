// =============================================================================
// VFP MCP - Virtual File Store
// =============================================================================
//
// In-memory store that implements FTP + Git + Realtime semantics
//
// =============================================================================

import type {
  VfpVersion,
  VfpResourceEntry,
  VfpResourceMeta,
  VfpResourceType,
  VfpChange,
  VfpDelta,
  VfpNodeDelta,
  VfpVersionEntry,
  VfpBranch,
  VfpNode,
  VfpSubscription,
  VfpCorrection,
} from '../types/index.js';

// =============================================================================
// STORE STATE
// =============================================================================

interface StoreEntry {
  path: string;
  type: VfpResourceType;
  data: Buffer | null;
  meta: VfpResourceMeta;
  versions: VfpVersion[];
  history: Map<number, Buffer>; // tick -> data snapshot
}

interface PendingInput {
  sequence: number;
  nodeId: string;
  field: string;
  value: unknown;
  timestamp: number;
}

// =============================================================================
// VFP STORE
// =============================================================================

export class VfpStore {
  private entries: Map<string, StoreEntry> = new Map();
  private branches: Map<string, VfpBranch> = new Map();
  private currentBranch = 'main';
  private currentTick = 0;
  private subscriptions: Map<string, VfpSubscription> = new Map();
  private pendingInputs: PendingInput[] = [];
  private deltaListeners: ((delta: VfpDelta) => void)[] = [];

  constructor() {
    // Initialize main branch
    this.branches.set('main', {
      name: 'main',
      head: this.createVersion('Initial'),
      createdAt: Date.now(),
      createdFrom: '',
    });

    // Create root directory
    this.createDirectory('/');
  }

  // ===========================================================================
  // VERSION MANAGEMENT
  // ===========================================================================

  private createVersion(message?: string): VfpVersion {
    this.currentTick++;
    return {
      tick: this.currentTick,
      hash: this.generateHash(),
      branch: this.currentBranch,
      timestamp: Date.now(),
      author: 'system',
    };
  }

  private generateHash(): string {
    return Math.random().toString(36).substring(2, 10);
  }

  getCurrentTick(): number {
    return this.currentTick;
  }

  getCurrentBranch(): string {
    return this.currentBranch;
  }

  // ===========================================================================
  // FTP-LIKE OPERATIONS
  // ===========================================================================

  get(path: string, atVersion?: VfpVersion): { data: Buffer | null; meta: VfpResourceMeta; version: VfpVersion } | null {
    const normalizedPath = this.normalizePath(path);
    const entry = this.entries.get(normalizedPath);

    if (!entry) {
      return null;
    }

    // Get data at specific version if requested
    let data = entry.data;
    if (atVersion && entry.history.has(atVersion.tick)) {
      data = entry.history.get(atVersion.tick) || null;
    }

    const version = entry.versions[entry.versions.length - 1] || this.createVersion();

    return {
      data,
      meta: entry.meta,
      version,
    };
  }

  put(path: string, data: Buffer, options: {
    contentType?: string;
    message?: string;
    expectedVersion?: VfpVersion;
  } = {}): { success: boolean; version: VfpVersion; error?: string } {
    const normalizedPath = this.normalizePath(path);
    const existing = this.entries.get(normalizedPath);

    // Optimistic locking check
    if (options.expectedVersion && existing) {
      const currentVersion = existing.versions[existing.versions.length - 1];
      if (currentVersion && currentVersion.tick !== options.expectedVersion.tick) {
        return {
          success: false,
          version: currentVersion,
          error: `Version conflict: expected tick ${options.expectedVersion.tick}, got ${currentVersion.tick}`,
        };
      }
    }

    const version = this.createVersion(options.message);

    if (existing) {
      // Update existing
      existing.history.set(version.tick, existing.data || Buffer.alloc(0));
      existing.data = data;
      existing.meta.modified = Date.now();
      existing.meta.checksum = this.computeChecksum(data);
      if (options.contentType) {
        existing.meta.contentType = options.contentType;
      }
      existing.versions.push(version);
    } else {
      // Create new
      this.ensureParentExists(normalizedPath);

      const entry: StoreEntry = {
        path: normalizedPath,
        type: 'file',
        data,
        meta: {
          contentType: options.contentType || 'application/octet-stream',
          checksum: this.computeChecksum(data),
          created: Date.now(),
          modified: Date.now(),
          attributes: {},
        },
        versions: [version],
        history: new Map(),
      };
      this.entries.set(normalizedPath, entry);
    }

    // Notify subscribers
    this.notifyChange(normalizedPath, existing ? 'modify' : 'add', version);

    return { success: true, version };
  }

  list(path: string, options: {
    recursive?: boolean;
    pattern?: string;
  } = {}): VfpResourceEntry[] {
    const normalizedPath = this.normalizePath(path);
    const results: VfpResourceEntry[] = [];

    for (const [entryPath, entry] of this.entries) {
      // Check if entry is under the requested path
      if (options.recursive) {
        if (!entryPath.startsWith(normalizedPath)) continue;
      } else {
        const parent = this.getParentPath(entryPath);
        if (parent !== normalizedPath) continue;
      }

      // Skip the path itself
      if (entryPath === normalizedPath) continue;

      // Pattern matching
      if (options.pattern && !this.matchPattern(entryPath, options.pattern)) {
        continue;
      }

      const version = entry.versions[entry.versions.length - 1] || this.createVersion();

      results.push({
        name: this.getBaseName(entryPath),
        path: entryPath,
        type: entry.type,
        size: entry.data?.length || 0,
        modified: entry.meta.modified,
        version,
        meta: entry.meta,
      });
    }

    return results.sort((a, b) => a.name.localeCompare(b.name));
  }

  delete(path: string, options: {
    recursive?: boolean;
    message?: string;
  } = {}): { success: boolean; error?: string } {
    const normalizedPath = this.normalizePath(path);
    const entry = this.entries.get(normalizedPath);

    if (!entry) {
      return { success: false, error: 'Not found' };
    }

    if (entry.type === 'directory' && !options.recursive) {
      // Check if directory is empty
      const children = this.list(normalizedPath);
      if (children.length > 0) {
        return { success: false, error: 'Directory not empty' };
      }
    }

    // Delete recursively if needed
    if (options.recursive) {
      for (const [entryPath] of this.entries) {
        if (entryPath.startsWith(normalizedPath + '/') || entryPath === normalizedPath) {
          this.entries.delete(entryPath);
        }
      }
    } else {
      this.entries.delete(normalizedPath);
    }

    const version = this.createVersion(options.message);
    this.notifyChange(normalizedPath, 'delete', version);

    return { success: true };
  }

  mkdir(path: string): { success: boolean; error?: string } {
    const normalizedPath = this.normalizePath(path);

    if (this.entries.has(normalizedPath)) {
      return { success: false, error: 'Already exists' };
    }

    this.createDirectory(normalizedPath);
    return { success: true };
  }

  stat(path: string): VfpResourceEntry | null {
    const normalizedPath = this.normalizePath(path);
    const entry = this.entries.get(normalizedPath);

    if (!entry) {
      return null;
    }

    const version = entry.versions[entry.versions.length - 1] || this.createVersion();

    return {
      name: this.getBaseName(normalizedPath),
      path: normalizedPath,
      type: entry.type,
      size: entry.data?.length || 0,
      modified: entry.meta.modified,
      version,
      meta: entry.meta,
    };
  }

  // ===========================================================================
  // GIT-LIKE OPERATIONS
  // ===========================================================================

  commit(message: string, paths?: string[]): { version: VfpVersion; changes: VfpChange[] } {
    const version = this.createVersion(message);
    const changes: VfpChange[] = [];

    // Record changes for specified paths or all modified
    const targetPaths = paths || Array.from(this.entries.keys());

    for (const path of targetPaths) {
      const entry = this.entries.get(path);
      if (entry && entry.data) {
        // Save current state to history
        entry.history.set(version.tick, Buffer.from(entry.data));
        changes.push({
          path,
          type: 'modify',
        });
      }
    }

    // Update branch head
    const branch = this.branches.get(this.currentBranch);
    if (branch) {
      branch.head = version;
    }

    return { version, changes };
  }

  diff(from: VfpVersion, to: VfpVersion, path?: string): VfpChange[] {
    const changes: VfpChange[] = [];

    for (const [entryPath, entry] of this.entries) {
      if (path && !entryPath.startsWith(path)) continue;

      const oldData = entry.history.get(from.tick);
      const newData = entry.history.get(to.tick) || entry.data;

      if (!oldData && newData) {
        changes.push({ path: entryPath, type: 'add' });
      } else if (oldData && !newData) {
        changes.push({ path: entryPath, type: 'delete' });
      } else if (oldData && newData && !oldData.equals(newData)) {
        changes.push({
          path: entryPath,
          type: 'modify',
          oldValue: oldData.toString('utf-8').substring(0, 100),
          newValue: newData.toString('utf-8').substring(0, 100),
        });
      }
    }

    return changes;
  }

  log(path?: string, limit = 10): VfpVersionEntry[] {
    const entries: VfpVersionEntry[] = [];
    const seenTicks = new Set<number>();

    // Collect all versions
    for (const [entryPath, entry] of this.entries) {
      if (path && !entryPath.startsWith(path)) continue;

      for (const version of entry.versions) {
        if (!seenTicks.has(version.tick)) {
          seenTicks.add(version.tick);
          entries.push({
            version,
            message: `Changes at tick ${version.tick}`,
            changes: [],
            changeCount: 1,
          });
        }
      }
    }

    return entries
      .sort((a, b) => b.version.tick - a.version.tick)
      .slice(0, limit);
  }

  createBranch(name: string): { success: boolean; branch?: VfpBranch; error?: string } {
    if (this.branches.has(name)) {
      return { success: false, error: 'Branch already exists' };
    }

    const currentBranchInfo = this.branches.get(this.currentBranch);
    if (!currentBranchInfo) {
      return { success: false, error: 'Current branch not found' };
    }

    const branch: VfpBranch = {
      name,
      head: { ...currentBranchInfo.head },
      createdAt: Date.now(),
      createdFrom: this.currentBranch,
    };

    this.branches.set(name, branch);
    return { success: true, branch };
  }

  listBranches(): VfpBranch[] {
    return Array.from(this.branches.values());
  }

  checkout(branchName: string): { success: boolean; error?: string } {
    if (!this.branches.has(branchName)) {
      return { success: false, error: 'Branch not found' };
    }

    this.currentBranch = branchName;
    return { success: true };
  }

  revert(toVersion: VfpVersion, path?: string): { success: boolean; error?: string } {
    for (const [entryPath, entry] of this.entries) {
      if (path && !entryPath.startsWith(path)) continue;

      const historicalData = entry.history.get(toVersion.tick);
      if (historicalData) {
        entry.data = Buffer.from(historicalData);
        entry.meta.modified = Date.now();
        entry.versions.push(this.createVersion(`Reverted to tick ${toVersion.tick}`));
      }
    }

    return { success: true };
  }

  // ===========================================================================
  // REALTIME OPERATIONS
  // ===========================================================================

  subscribe(patterns: string[], fromTick = 0): VfpSubscription {
    const subscription: VfpSubscription = {
      subscriptionId: `sub_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      patterns,
      fromTick,
      active: true,
    };

    this.subscriptions.set(subscription.subscriptionId, subscription);
    return subscription;
  }

  unsubscribe(subscriptionId: string): boolean {
    return this.subscriptions.delete(subscriptionId);
  }

  getSubscription(subscriptionId: string): VfpSubscription | undefined {
    return this.subscriptions.get(subscriptionId);
  }

  input(nodeId: string, field: string, value: unknown, sequence: number): {
    accepted: boolean;
    correction?: VfpCorrection;
  } {
    // Store pending input
    this.pendingInputs.push({
      sequence,
      nodeId,
      field,
      value,
      timestamp: Date.now(),
    });

    // In a real implementation, this would validate the input against server state
    // For now, we accept all inputs
    const nodePath = `/nodes/${nodeId}`;
    const entry = this.entries.get(nodePath);

    if (entry && entry.data) {
      try {
        const nodeData = JSON.parse(entry.data.toString('utf-8')) as Record<string, unknown>;
        nodeData[field] = value;
        entry.data = Buffer.from(JSON.stringify(nodeData, null, 2));
        entry.meta.modified = Date.now();

        const version = this.createVersion();

        // Create delta
        const delta: VfpDelta = {
          tick: version.tick,
          nodes: [{
            nodeId,
            path: nodePath,
            op: 'update',
            fields: [{
              field,
              oldValue: null,
              newValue: value,
            }],
          }],
        };

        // Notify listeners
        this.emitDelta(delta);
      } catch {
        // Invalid JSON, ignore
      }
    }

    return { accepted: true };
  }

  snapshot(path = '/'): { tick: number; nodes: VfpNode[] } {
    const nodes: VfpNode[] = [];
    const normalizedPath = this.normalizePath(path);

    for (const [entryPath, entry] of this.entries) {
      if (!entryPath.startsWith(normalizedPath)) continue;
      if (entry.type !== 'file') continue;

      try {
        const data = entry.data ? JSON.parse(entry.data.toString('utf-8')) as Record<string, unknown> : {};
        const version = entry.versions[entry.versions.length - 1] || this.createVersion();

        nodes.push({
          id: this.getBaseName(entryPath).replace('.state', ''),
          type: (data['type'] as string) || 'unknown',
          data,
          version,
        });
      } catch {
        // Not JSON, skip
      }
    }

    return {
      tick: this.currentTick,
      nodes,
    };
  }

  onDelta(listener: (delta: VfpDelta) => void): void {
    this.deltaListeners.push(listener);
  }

  // ===========================================================================
  // HELPERS
  // ===========================================================================

  private normalizePath(path: string): string {
    let normalized = path.startsWith('/') ? path : `/${path}`;
    normalized = normalized.replace(/\/+/g, '/');
    if (normalized !== '/' && normalized.endsWith('/')) {
      normalized = normalized.slice(0, -1);
    }
    return normalized;
  }

  private getParentPath(path: string): string {
    const parts = path.split('/').filter(Boolean);
    parts.pop();
    return '/' + parts.join('/');
  }

  private getBaseName(path: string): string {
    const parts = path.split('/').filter(Boolean);
    return parts[parts.length - 1] || '';
  }

  private ensureParentExists(path: string): void {
    const parts = path.split('/').filter(Boolean);
    let currentPath = '';

    for (let i = 0; i < parts.length - 1; i++) {
      currentPath += '/' + parts[i];
      if (!this.entries.has(currentPath)) {
        this.createDirectory(currentPath);
      }
    }
  }

  private createDirectory(path: string): void {
    const entry: StoreEntry = {
      path,
      type: 'directory',
      data: null,
      meta: {
        contentType: 'inode/directory',
        checksum: '',
        created: Date.now(),
        modified: Date.now(),
        attributes: {},
      },
      versions: [this.createVersion()],
      history: new Map(),
    };
    this.entries.set(path, entry);
  }

  private computeChecksum(data: Buffer): string {
    // Simple checksum for demo - use crypto in production
    let hash = 0;
    for (let i = 0; i < data.length; i++) {
      hash = ((hash << 5) - hash) + data[i];
      hash = hash & hash;
    }
    return `sha256:${Math.abs(hash).toString(16).padStart(8, '0')}`;
  }

  private matchPattern(path: string, pattern: string): boolean {
    // Simple glob matching
    const regex = new RegExp(
      '^' + pattern
        .replace(/\./g, '\\.')
        .replace(/\*/g, '[^/]*')
        .replace(/\*\*/g, '.*') + '$'
    );
    return regex.test(path);
  }

  private notifyChange(path: string, type: VfpChange['type'], version: VfpVersion): void {
    // Check subscriptions and emit deltas
    for (const subscription of this.subscriptions.values()) {
      if (!subscription.active) continue;

      for (const pattern of subscription.patterns) {
        if (this.matchPattern(path, pattern)) {
          const delta: VfpDelta = {
            tick: version.tick,
            nodes: [{
              nodeId: this.getBaseName(path),
              path,
              op: type === 'add' ? 'create' : type === 'delete' ? 'delete' : 'update',
              fields: [],
            }],
          };
          this.emitDelta(delta);
          break;
        }
      }
    }
  }

  private emitDelta(delta: VfpDelta): void {
    for (const listener of this.deltaListeners) {
      listener(delta);
    }
  }
}

// Singleton instance
let storeInstance: VfpStore | null = null;

export function getStore(): VfpStore {
  if (!storeInstance) {
    storeInstance = new VfpStore();
  }
  return storeInstance;
}
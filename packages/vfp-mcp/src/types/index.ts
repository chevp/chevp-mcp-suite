// =============================================================================
// VFP MCP - Types
// =============================================================================
//
// TypeScript types for the Virtual File Protocol
//
// =============================================================================

// =============================================================================
// OPERATIONS
// =============================================================================

export type VfpOp =
  // FTP-like
  | 'get'
  | 'put'
  | 'list'
  | 'delete'
  | 'mkdir'
  | 'rename'
  | 'stat'
  // Git-like
  | 'fetch'
  | 'push'
  | 'pull'
  | 'diff'
  | 'log'
  | 'commit'
  | 'revert'
  | 'merge'
  | 'branch'
  | 'checkout'
  // Realtime
  | 'watch'
  | 'unwatch'
  | 'input'
  | 'snapshot'
  | 'ack';

export type VfpStatus =
  | 'ok'
  | 'created'
  | 'accepted'
  | 'no_content'
  | 'not_found'
  | 'conflict'
  | 'forbidden'
  | 'locked'
  | 'invalid'
  | 'error'
  | 'unavailable';

// =============================================================================
// VERSION
// =============================================================================

export interface VfpVersion {
  tick: number;
  hash?: string;
  branch: string;
  timestamp: number;
  author?: string;
  parents?: string[];
}

export interface VfpVersionRange {
  from: VfpVersion;
  to: VfpVersion;
}

// =============================================================================
// RESOURCE
// =============================================================================

export type VfpResourceType = 'file' | 'directory' | 'symlink' | 'node';

export interface VfpResourceMeta {
  contentType: string;
  checksum: string;
  created: number;
  modified: number;
  owner?: string;
  attributes: Record<string, string>;
}

export interface VfpResourceEntry {
  name: string;
  path: string;
  type: VfpResourceType;
  size: number;
  modified: number;
  version: VfpVersion;
  meta?: VfpResourceMeta;
}

// =============================================================================
// CHANGES
// =============================================================================

export type VfpChangeType = 'add' | 'modify' | 'delete' | 'rename';

export interface VfpChange {
  path: string;
  type: VfpChangeType;
  oldValue?: unknown;
  newValue?: unknown;
  field?: string;
}

export interface VfpFieldDelta {
  field: string;
  oldValue: unknown;
  newValue: unknown;
}

export type VfpNodeOp = 'update' | 'create' | 'delete';

export interface VfpNodeDelta {
  nodeId: string;
  path: string;
  op: VfpNodeOp;
  fields: VfpFieldDelta[];
}

export interface VfpDelta {
  tick: number;
  nodes: VfpNodeDelta[];
}

// =============================================================================
// CORRECTION
// =============================================================================

export interface VfpCorrection {
  tick: number;
  nodeId: string;
  field: string;
  correctedValue: unknown;
  rejectedInputSeq?: number;
  reason: string;
}

// =============================================================================
// SUBSCRIPTION
// =============================================================================

export interface VfpSubscription {
  subscriptionId: string;
  patterns: string[];
  fromTick: number;
  active: boolean;
}

// =============================================================================
// SESSION
// =============================================================================

export interface VfpSession {
  sessionId: string;
  clientId: string;
  workingPath: string;
  currentBranch: string;
  subscriptions: VfpSubscription[];
  lastTick: number;
  connectedAt: number;
}

// =============================================================================
// STORE
// =============================================================================

export interface VfpStoreConfig {
  rootPath: string;
  enableVersioning: boolean;
  enableRealtime: boolean;
  tickInterval: number;
}

export interface VfpNode {
  id: string;
  type: string;
  data: Record<string, unknown>;
  version: VfpVersion;
}

export interface VfpScene {
  id: string;
  nodes: Map<string, VfpNode>;
  currentTick: number;
  branch: string;
}

// =============================================================================
// VERSION ENTRY (for log)
// =============================================================================

export interface VfpVersionEntry {
  version: VfpVersion;
  message: string;
  changes: VfpChange[];
  changeCount: number;
}

// =============================================================================
// BRANCH
// =============================================================================

export interface VfpBranch {
  name: string;
  head: VfpVersion;
  createdAt: number;
  createdFrom: string;
}
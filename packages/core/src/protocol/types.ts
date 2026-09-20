/**
 * MCP Orchestration Protocol Types
 *
 * Defines the communication protocol for hierarchical MCP server coordination.
 */

// =============================================================================
// Role Definitions
// =============================================================================

export type OrchestrationRole = 'strategy' | 'standards' | 'product' | 'cost' | 'docs' | 'ops';

export type ProductOwnerRole =
  | 'coregfx-po'
  | 'cryo-po'
  | 'nuna-po'
  | 'arctic-po';

export type BusinessAnalystRole =
  | 'coregfx-ba'
  | 'cryo-ba'
  | 'nuna-ba'
  | 'arctic-ba';

export type ArchitectRole =
  | 'coregfx-architect'
  | 'cryo-architect'
  | 'nuna-architect'
  | 'arctic-architect'
  | 'infra-architect';

export type MCPRole =
  | OrchestrationRole
  | ProductOwnerRole
  | BusinessAnalystRole
  | ArchitectRole;

// =============================================================================
// Message Types
// =============================================================================

export type MessageType =
  | 'request' // Ask another MCP to do something
  | 'response' // Reply to a request
  | 'notification' // Fire-and-forget info
  | 'escalation' // Problem that needs higher authority
  | 'directive' // Top-down instruction
  | 'report'; // Bottom-up status update

export type Priority = 'low' | 'normal' | 'high' | 'critical';

export type MessageStatus = 'pending' | 'processing' | 'completed' | 'failed';

// =============================================================================
// Message Interfaces
// =============================================================================

export interface MCPMessage {
  id: string;
  type: MessageType;
  from: MCPRole;
  to: MCPRole | MCPRole[];
  priority: Priority;
  timestamp: string;
  correlationId?: string;
  replyTo?: string;
  payload: MessagePayload;
  context?: SharedContext;
  requiresResponse: boolean;
  deadline?: string;
  status?: MessageStatus;
}

export interface MessagePayload {
  action: string;
  parameters: Record<string, unknown>;
  reason?: string;
}

export interface EscalationPayload extends MessagePayload {
  action: 'escalate';
  parameters: {
    originalRequest: MCPMessage;
    blocker: string;
    attemptedResolution: string;
    options: EscalationOption[];
  };
}

export interface EscalationOption {
  id: string;
  description: string;
  impact: string;
  recommendation: boolean;
}

export interface SharedContext {
  repositories?: string[];
  products?: string[];
  sprint?: string;
  milestone?: string;
  relatedMessages?: string[];
  metadata?: Record<string, unknown>;
}

// =============================================================================
// Response Types
// =============================================================================

export interface MCPResponse {
  messageId: string;
  success: boolean;
  data?: unknown;
  error?: MCPError;
  timestamp: string;
}

export interface MCPError {
  code: string;
  message: string;
  details?: Record<string, unknown>;
}

// =============================================================================
// Role Hierarchy
// =============================================================================

export interface RoleHierarchy {
  role: MCPRole;
  reportsTo?: MCPRole;
  delegatesTo: MCPRole[];
  collaboratesWith: MCPRole[];
}

export const ROLE_HIERARCHY: Record<MCPRole, RoleHierarchy> = {
  // Orchestration Layer
  strategy: {
    role: 'strategy',
    delegatesTo: ['standards', 'product', 'cost', 'docs', 'ops'],
    collaboratesWith: [],
  },
  standards: {
    role: 'standards',
    reportsTo: 'strategy',
    delegatesTo: [
      'coregfx-architect',
      'cryo-architect',
      'nuna-architect',
      'arctic-architect',
      'infra-architect',
    ],
    collaboratesWith: ['product'],
  },
  product: {
    role: 'product',
    reportsTo: 'strategy',
    delegatesTo: ['coregfx-po', 'cryo-po', 'nuna-po', 'arctic-po'],
    collaboratesWith: ['standards'],
  },
  cost: {
    role: 'cost',
    reportsTo: 'strategy',
    delegatesTo: [],
    collaboratesWith: ['standards', 'ops'],
  },
  docs: {
    role: 'docs',
    reportsTo: 'strategy',
    delegatesTo: [],
    collaboratesWith: ['product'],
  },
  ops: {
    role: 'ops',
    reportsTo: 'strategy',
    delegatesTo: [],
    collaboratesWith: ['standards', 'cost'],
  },

  // Product Owner Layer
  'coregfx-po': {
    role: 'coregfx-po',
    reportsTo: 'product',
    delegatesTo: ['coregfx-ba'],
    collaboratesWith: ['coregfx-architect', 'standards'],
  },
  'cryo-po': {
    role: 'cryo-po',
    reportsTo: 'product',
    delegatesTo: ['cryo-ba'],
    collaboratesWith: ['cryo-architect', 'standards'],
  },
  'nuna-po': {
    role: 'nuna-po',
    reportsTo: 'product',
    delegatesTo: ['nuna-ba'],
    collaboratesWith: ['nuna-architect', 'standards'],
  },
  'arctic-po': {
    role: 'arctic-po',
    reportsTo: 'product',
    delegatesTo: ['arctic-ba'],
    collaboratesWith: ['arctic-architect', 'standards'],
  },

  // Business Analyst Layer
  'coregfx-ba': {
    role: 'coregfx-ba',
    reportsTo: 'coregfx-po',
    delegatesTo: [],
    collaboratesWith: ['coregfx-architect', 'coregfx-po'],
  },
  'cryo-ba': {
    role: 'cryo-ba',
    reportsTo: 'cryo-po',
    delegatesTo: [],
    collaboratesWith: ['cryo-architect', 'cryo-po'],
  },
  'nuna-ba': {
    role: 'nuna-ba',
    reportsTo: 'nuna-po',
    delegatesTo: [],
    collaboratesWith: ['nuna-architect', 'nuna-po'],
  },
  'arctic-ba': {
    role: 'arctic-ba',
    reportsTo: 'arctic-po',
    delegatesTo: [],
    collaboratesWith: ['arctic-architect', 'arctic-po'],
  },

  // Architect Layer
  'coregfx-architect': {
    role: 'coregfx-architect',
    reportsTo: 'standards',
    delegatesTo: [],
    collaboratesWith: ['coregfx-po', 'coregfx-ba', 'infra-architect'],
  },
  'cryo-architect': {
    role: 'cryo-architect',
    reportsTo: 'standards',
    delegatesTo: [],
    collaboratesWith: ['cryo-po', 'cryo-ba', 'infra-architect'],
  },
  'nuna-architect': {
    role: 'nuna-architect',
    reportsTo: 'standards',
    delegatesTo: [],
    collaboratesWith: ['nuna-po', 'nuna-ba', 'infra-architect'],
  },
  'arctic-architect': {
    role: 'arctic-architect',
    reportsTo: 'standards',
    delegatesTo: [],
    collaboratesWith: ['arctic-po', 'arctic-ba', 'infra-architect'],
  },
  'infra-architect': {
    role: 'infra-architect',
    reportsTo: 'standards',
    delegatesTo: [],
    collaboratesWith: [
      'coregfx-architect',
      'cryo-architect',
      'nuna-architect',
      'arctic-architect',
    ],
  },
};

// =============================================================================
// Product Types
// =============================================================================

export type ProductId = 'coregfx' | 'cryo' | 'nuna' | 'arctic' | 'nexus' | 'axon' | 'infrastructure';

export type ProductStatus = 'active' | 'maintenance' | 'deprecated' | 'archived';

export interface Product {
  id: ProductId;
  name: string;
  description: string;
  owner: ProductOwnerRole | OrchestrationRole;
  architect: ArchitectRole;
  analyst?: BusinessAnalystRole;
  status: ProductStatus;
  repositoryCount: number;
  primaryLanguages: string[];
}

// =============================================================================
// Repository Types
// =============================================================================

export type RepositoryStatus = 'active' | 'maintenance' | 'deprecated' | 'archived';

export interface Repository {
  id: string;
  path: string;
  owner: MCPRole;
  architect?: ArchitectRole;
  analyst?: BusinessAnalystRole;
  product: ProductId | string;
  category: string;
  status: RepositoryStatus;
  tags: string[];
}

// =============================================================================
// Utility Functions
// =============================================================================

export function canDelegate(from: MCPRole, to: MCPRole): boolean {
  const hierarchy = ROLE_HIERARCHY[from];
  return hierarchy.delegatesTo.includes(to);
}

export function canEscalateTo(from: MCPRole, to: MCPRole): boolean {
  const hierarchy = ROLE_HIERARCHY[from];
  return hierarchy.reportsTo === to;
}

export function getReportingChain(role: MCPRole): MCPRole[] {
  const chain: MCPRole[] = [];
  let current: MCPRole | undefined = role;

  while (current) {
    const h: RoleHierarchy = ROLE_HIERARCHY[current];
    if (h.reportsTo) {
      chain.push(h.reportsTo);
      current = h.reportsTo;
    } else {
      current = undefined;
    }
  }

  return chain;
}

export function getProductForRole(role: MCPRole): ProductId | null {
  if (role.startsWith('coregfx')) return 'coregfx';
  if (role.startsWith('cryo')) return 'cryo';
  if (role.startsWith('nuna')) return 'nuna';
  if (role.startsWith('arctic')) return 'arctic';
  if (role === 'infra-architect') return 'infrastructure';
  return null;
}

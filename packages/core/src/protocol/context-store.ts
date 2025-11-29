/**
 * Context Store Access Layer
 *
 * Provides typed access to the shared context store for all MCPs.
 */

import fs from 'node:fs';
import path from 'node:path';
import type {
  Product,
  ProductId,
  Repository,
  MCPRole,
} from './types.js';

export interface ContextStoreConfig {
  rootPath: string;
}

// =============================================================================
// Portfolio Types
// =============================================================================

export interface StrategicPriority {
  id: string;
  title: string;
  description: string;
  owner: MCPRole;
  status: 'planned' | 'in_progress' | 'completed' | 'blocked';
  priority: number;
  products: string[];
  deliverables: string[];
  targetCompletion: string;
}

export interface PrioritiesData {
  version: string;
  lastUpdated: string;
  currentQuarter: string;
  strategicPriorities: StrategicPriority[];
  quarterlyGoals: Record<string, { theme: string; goals: string[] }>;
}

export interface ProductsData {
  version: string;
  lastUpdated: string;
  products: Record<string, Product & { roadmapLink?: string | null }>;
}

// =============================================================================
// Repository Registry Types
// =============================================================================

export interface OwnershipData {
  version: string;
  lastUpdated: string;
  repositories: Record<string, Repository>;
}

// =============================================================================
// Context Store Class
// =============================================================================

export class ContextStore {
  private rootPath: string;

  constructor(config: ContextStoreConfig) {
    this.rootPath = config.rootPath;
  }

  // ---------------------------------------------------------------------------
  // Portfolio Access
  // ---------------------------------------------------------------------------

  getProducts(): ProductsData {
    return this.readJson<ProductsData>('portfolio/products.json');
  }

  getProduct(id: ProductId): (Product & { roadmapLink?: string | null }) | null {
    const data = this.getProducts();
    return data.products[id] ?? null;
  }

  getPriorities(): PrioritiesData {
    return this.readJson<PrioritiesData>('portfolio/priorities.json');
  }

  updatePriority(id: string, updates: Partial<StrategicPriority>): void {
    const data = this.getPriorities();
    const index = data.strategicPriorities.findIndex((p) => p.id === id);

    if (index === -1) {
      throw new Error(`Priority ${id} not found`);
    }

    data.strategicPriorities[index] = {
      ...data.strategicPriorities[index],
      ...updates,
    };
    data.lastUpdated = new Date().toISOString();

    this.writeJson('portfolio/priorities.json', data);
  }

  // ---------------------------------------------------------------------------
  // Repository Registry Access
  // ---------------------------------------------------------------------------

  getOwnership(): OwnershipData {
    return this.readJson<OwnershipData>('repo-registry/ownership.json');
  }

  getRepository(id: string): Repository | null {
    const data = this.getOwnership();
    return data.repositories[id] ?? null;
  }

  getRepositoriesByOwner(owner: MCPRole): Repository[] {
    const data = this.getOwnership();
    return Object.values(data.repositories).filter((repo) => repo.owner === owner);
  }

  getRepositoriesByProduct(product: ProductId | string): Repository[] {
    const data = this.getOwnership();
    return Object.values(data.repositories).filter((repo) => repo.product === product);
  }

  getRepositoriesByArchitect(architect: MCPRole): Repository[] {
    const data = this.getOwnership();
    return Object.values(data.repositories).filter((repo) => repo.architect === architect);
  }

  updateRepository(id: string, updates: Partial<Repository>): void {
    const data = this.getOwnership();

    if (!data.repositories[id]) {
      throw new Error(`Repository ${id} not found`);
    }

    data.repositories[id] = {
      ...data.repositories[id],
      ...updates,
    };
    data.lastUpdated = new Date().toISOString();

    this.writeJson('repo-registry/ownership.json', data);
  }

  addRepository(id: string, repo: Repository): void {
    const data = this.getOwnership();

    if (data.repositories[id]) {
      throw new Error(`Repository ${id} already exists`);
    }

    data.repositories[id] = repo;
    data.lastUpdated = new Date().toISOString();

    this.writeJson('repo-registry/ownership.json', data);
  }

  // ---------------------------------------------------------------------------
  // Product-Specific Data
  // ---------------------------------------------------------------------------

  getProductBacklog(product: ProductId): unknown {
    const filepath = `products/${product}/backlog.json`;
    if (this.exists(filepath)) {
      return this.readJson(filepath);
    }
    return { items: [] };
  }

  getProductArchitecture(product: ProductId): unknown {
    const filepath = `products/${product}/architecture.json`;
    if (this.exists(filepath)) {
      return this.readJson(filepath);
    }
    return { modules: [], decisions: [] };
  }

  // ---------------------------------------------------------------------------
  // Technical Data
  // ---------------------------------------------------------------------------

  getTechnicalStandards(): unknown {
    const filepath = 'technical/standards.json';
    if (this.exists(filepath)) {
      return this.readJson(filepath);
    }
    return { standards: [] };
  }

  getTechnicalDebt(): unknown {
    const filepath = 'technical/debt-registry.json';
    if (this.exists(filepath)) {
      return this.readJson(filepath);
    }
    return { items: [] };
  }

  // ---------------------------------------------------------------------------
  // Utility Methods
  // ---------------------------------------------------------------------------

  private exists(relativePath: string): boolean {
    return fs.existsSync(path.join(this.rootPath, relativePath));
  }

  private readJson<T>(relativePath: string): T {
    const filepath = path.join(this.rootPath, relativePath);
    const content = fs.readFileSync(filepath, 'utf8');
    return JSON.parse(content) as T;
  }

  private writeJson(relativePath: string, data: unknown): void {
    const filepath = path.join(this.rootPath, relativePath);
    fs.writeFileSync(filepath, JSON.stringify(data, null, 2));
  }
}

/**
 * Create a context store instance with default configuration
 */
export function createContextStore(rootPath?: string): ContextStore {
  const defaultPath =
    rootPath ??
    process.env.MCP_CONTEXT_STORE ??
    'c:/chevp/tools/chevp-mcp-suite/context-store';

  return new ContextStore({ rootPath: defaultPath });
}

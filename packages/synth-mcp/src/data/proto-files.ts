/**
 * Proto Files Registry
 *
 * ARCHITECTURE CLARIFICATION:
 * The synth-protocol proto files serve TWO distinct purposes:
 *
 * 1. DOMAIN DATA SCHEMAS (majority) - Define message types for XML serialization/transport.
 *    These are NOT gRPC services. They define the data structures that flow through the system
 *    as XML (source format) or SQLite (runtime format). Examples: scene_state, plugin, asset, model.
 *
 * 2. HUB SERVICE DEFINITION (single file) - synth-core-hub.proto defines the actual gRPC service
 *    that synth-core-hub exposes. This is the ONLY proto with gRPC service{} blocks for the Hub.
 *
 * The Hub primarily uses REST API (Durchstich V1). gRPC is optional for high-performance consumers.
 */

export interface ProtoFileInfo {
  domain: string;
  file: string;
  role: 'domain-data' | 'hub-service';
  description: string;
}

export const PROTO_FILES: ProtoFileInfo[] = [
  // === HUB SERVICE (the only gRPC service proto for synth-core-hub) ===
  { domain: 'synth-hub', file: 'synth-core-hub.proto', role: 'hub-service', description: 'Hub gRPC service: registry, messaging, health (single service definition)' },

  // === DOMAIN DATA SCHEMAS (messages only, used for XML/SQLite transport) ===
  { domain: 'synth-core', file: 'plugin.proto', role: 'domain-data', description: 'Plugin lifecycle states and metadata' },
  { domain: 'synth-core', file: 'model.proto', role: 'domain-data', description: 'Core model/entity type definitions' },
  { domain: 'synth-core', file: 'asset.proto', role: 'domain-data', description: 'Asset metadata and references' },
  { domain: 'synth-core', file: 'common.proto', role: 'domain-data', description: 'Shared types (health, error, tensor)' },
  { domain: 'synth-core', file: 'content.proto', role: 'domain-data', description: 'Content generation request/response types' },
  { domain: 'synth-endpoint', file: 'node-registry.proto', role: 'domain-data', description: 'Node info, status, capabilities messages' },
  { domain: 'synth-endpoint', file: 'messaging.proto', role: 'domain-data', description: 'Message, topic, subscription data types' },
  { domain: 'synth-endpoint', file: 'endpoint.proto', role: 'domain-data', description: 'URI schemes and resource metadata' },
  { domain: 'synth-endpoint', file: 'composition.proto', role: 'domain-data', description: 'Scene composition and resource references' },
  { domain: 'synth-events', file: 'event.proto', role: 'domain-data', description: 'Event envelope, URI routing, typed payloads' },
  { domain: 'synth-wire', file: 'envelope.proto', role: 'domain-data', description: 'Wire message envelope format' },
  { domain: 'synth-wire', file: 'vfp.proto', role: 'domain-data', description: 'VFP command/response data types' },
  { domain: 'synth-state-sync', file: 'scene_state.proto', role: 'domain-data', description: 'Scene state snapshot and delta messages' },
  { domain: 'synth-agent', file: 'agent.proto', role: 'domain-data', description: 'Agent task definition types' },
  { domain: 'nuna', file: 'core.proto', role: 'domain-data', description: 'Nuna SDK core types' },
  { domain: 'nuna', file: 'mcp.proto', role: 'domain-data', description: 'Nuna MCP integration types' },
];

export function getProtoFiles(domain?: string): { basePath: string; note: string; files: ProtoFileInfo[] } {
  const filtered = !domain || domain === 'all'
    ? PROTO_FILES
    : PROTO_FILES.filter((p) => p.domain === domain);

  return {
    basePath: 'synth/synth-protocol/docs/proto/',
    note: 'Most proto files are DOMAIN DATA for XML transport. Only synth-core-hub.proto defines gRPC services.',
    files: filtered,
  };
}

export function getProtoDomains(): string[] {
  return [...new Set(PROTO_FILES.map((p) => p.domain))];
}
/**
 * Synth Core Hub - Service & Proto Architecture
 *
 * IMPORTANT DISTINCTION:
 * - Most synth-protocol .proto files define DOMAIN DATA MESSAGES only (for XML transport)
 * - gRPC SERVICE definitions exist ONLY in synth-core-hub.proto (the Hub's single service file)
 * - The Hub exposes a REST API (primary) and optionally gRPC services
 * - Producers/Consumers connect to the Hub via REST (Durchstich V1) or gRPC (later)
 */

export interface ProtoService {
  name: string;
  protoFile: string;
  package: string;
  type: 'grpc' | 'rest';
  description: string;
  rpcs: ProtoRpc[];
  usedBy: string[];
}

export interface ProtoRpc {
  name: string;
  requestType: string;
  responseType: string;
  streaming: 'none' | 'server' | 'client' | 'bidirectional';
  httpBinding?: string;
  description: string;
}

/**
 * HUB_SERVICES defines the actual services exposed by synth-core-hub.
 *
 * The Hub is a minimal broker (~500 LOC). It provides:
 * 1. REST API for registry, events, health (primary interface, used by all consumers)
 * 2. gRPC SynthCoreHub service (optional, for high-performance consumers like frost-runtime)
 *
 * All other proto files (synth-core/, synth-wire/, synth-state-sync/, synth-events/, etc.)
 * are DOMAIN DATA schemas used for XML serialization/transport - they do NOT run as gRPC services.
 */
export const HUB_SERVICES: ProtoService[] = [
  {
    name: 'SynthCoreHubService',
    protoFile: 'synth-core-hub.proto',
    package: 'synth.hub',
    type: 'grpc',
    description: 'The single gRPC service of synth-core-hub. Registry, messaging, and health in one service definition.',
    rpcs: [
      { name: 'RegisterProducer', requestType: 'RegisterProducerRequest', responseType: 'RegisterProducerResponse', streaming: 'none', description: 'Register a producer service' },
      { name: 'RegisterConsumer', requestType: 'RegisterConsumerRequest', responseType: 'RegisterConsumerResponse', streaming: 'none', description: 'Register a consumer' },
      { name: 'Unregister', requestType: 'UnregisterRequest', responseType: 'UnregisterResponse', streaming: 'none', description: 'Unregister producer or consumer' },
      { name: 'Heartbeat', requestType: 'HeartbeatRequest', responseType: 'HeartbeatResponse', streaming: 'none', description: 'Health check heartbeat' },
      { name: 'Publish', requestType: 'PublishRequest', responseType: 'PublishResponse', streaming: 'none', description: 'Publish event to topic' },
      { name: 'Subscribe', requestType: 'SubscribeRequest', responseType: 'Event', streaming: 'server', description: 'Subscribe to event topics' },
      { name: 'ListProducers', requestType: 'ListRequest', responseType: 'ProducerList', streaming: 'none', description: 'List registered producers' },
      { name: 'ListConsumers', requestType: 'ListRequest', responseType: 'ConsumerList', streaming: 'none', description: 'List registered consumers' },
    ],
    usedBy: ['frost-runtime (C++ gRPC client)', 'synth-scene-service', 'synth-asset-builder'],
  },
  {
    name: 'SynthCoreHubRestApi',
    protoFile: 'N/A (REST-only, no proto)',
    package: 'synth.hub',
    type: 'rest',
    description: 'Primary HTTP/REST interface of synth-core-hub. Used by all consumers and producers for the Durchstich V1.',
    rpcs: [
      { name: 'RegisterProducer', requestType: 'JSON', responseType: 'JSON', streaming: 'none', httpBinding: 'POST /api/registry/producers', description: 'Register producer' },
      { name: 'ListProducers', requestType: '-', responseType: 'JSON', streaming: 'none', httpBinding: 'GET /api/registry/producers', description: 'List producers' },
      { name: 'UnregisterProducer', requestType: '-', responseType: 'JSON', streaming: 'none', httpBinding: 'DELETE /api/registry/producers/:id', description: 'Unregister producer' },
      { name: 'ProducerHeartbeat', requestType: '-', responseType: 'JSON', streaming: 'none', httpBinding: 'POST /api/registry/producers/:id/heartbeat', description: 'Producer heartbeat' },
      { name: 'RegisterConsumer', requestType: 'JSON', responseType: 'JSON', streaming: 'none', httpBinding: 'POST /api/registry/consumers', description: 'Register consumer' },
      { name: 'ListConsumers', requestType: '-', responseType: 'JSON', streaming: 'none', httpBinding: 'GET /api/registry/consumers', description: 'List consumers' },
      { name: 'PublishEvent', requestType: 'JSON', responseType: 'JSON', streaming: 'none', httpBinding: 'POST /api/events', description: 'Publish event' },
      { name: 'GetEvents', requestType: '-', responseType: 'JSON', streaming: 'none', httpBinding: 'GET /api/events/:topic', description: 'Get events by topic' },
      { name: 'HealthCheck', requestType: '-', responseType: 'JSON', streaming: 'none', httpBinding: 'GET /health', description: 'Health check' },
    ],
    usedBy: ['synth-game-server (Quarkus)', 'frost-runtime (REST fallback)', 'synth-cluster-editor', 'HTML test client'],
  },
];

export function getServices(filter?: { type?: string; usedBy?: string }): ProtoService[] {
  let services = [...HUB_SERVICES];

  if (filter?.type && filter.type !== 'all') {
    services = services.filter((s) => s.type === filter.type);
  }

  if (filter?.usedBy) {
    services = services.filter((s) =>
      s.usedBy.some((u) => u.toLowerCase().includes(filter.usedBy!.toLowerCase()))
    );
  }

  return services;
}

export function getService(name: string): ProtoService | undefined {
  return HUB_SERVICES.find((s) => s.name.toLowerCase() === name.toLowerCase());
}
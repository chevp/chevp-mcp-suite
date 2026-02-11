/**
 * Hub Architecture Data - Components, REST API, and Integration
 *
 * Proto files are DOMAIN DATA for XML transport.
 * Only synth-core-hub.proto defines gRPC services.
 * The Hub primarily exposes REST API (Durchstich V1).
 */

export const HUB_ARCHITECTURE = {
  principle: 'Hub = Broker, NOT Processor. Minimal message router (~500 LOC), no business logic. REST-first (Durchstich V1), gRPC optional.',
  protoNote: 'synth-protocol proto files are domain data schemas for XML/SQLite serialization. Only synth-core-hub.proto defines gRPC services.',
  components: {
    hub: {
      name: 'synth-core-hub',
      package: '@synth/core-hub',
      port: 8180,
      responsibilities: [
        'REST API (primary interface)',
        'Event Bus (Pub/Sub)',
        'Producer/Consumer Registry',
        'Message Routing',
        'Health Monitoring',
        'gRPC service (optional, via synth-core-hub.proto)',
      ],
      notResponsible: [
        'Asset Processing',
        'Build Pipelines',
        'Job Scheduling',
        'Compression',
        'File Scanning',
        'Game Logic',
      ],
    },
    producers: [
      { name: 'synth-scene-service', port: 8181, responsibility: 'Scene/Entity CRUD, Persistence' },
      { name: 'synth-asset-builder', port: 8182, responsibility: 'Asset Processing, .assetlib Build, Jobs' },
      { name: 'synth-mcp-server', port: 8183, responsibility: 'AI Content Generation via MCP' },
    ],
    consumers: [
      { name: 'synth-game-server', type: 'Java Quarkus', port: 8090, connection: 'REST', description: 'Game logic server (synth-playground/synth-game/backend)' },
      { name: 'frost-runtime', type: 'C++ Vulkan', connection: 'REST (V1) or gRPC (later)' },
      { name: 'synth-cluster-editor', type: 'Electron', connection: 'WebSocket + REST' },
      { name: 'HTML test client', type: 'Browser', connection: 'REST', description: 'synth-playground/synth-game/frontend' },
    ],
  },
  restApi: {
    baseUrl: 'http://localhost:8180',
    endpoints: [
      { method: 'POST', path: '/api/registry/producers', description: 'Register producer' },
      { method: 'GET', path: '/api/registry/producers', description: 'List producers' },
      { method: 'DELETE', path: '/api/registry/producers/:id', description: 'Unregister producer' },
      { method: 'POST', path: '/api/registry/producers/:id/heartbeat', description: 'Producer heartbeat' },
      { method: 'POST', path: '/api/registry/consumers', description: 'Register consumer' },
      { method: 'GET', path: '/api/registry/consumers', description: 'List consumers' },
      { method: 'POST', path: '/api/events', description: 'Publish event' },
      { method: 'GET', path: '/api/events/:topic', description: 'Get events by topic' },
      { method: 'GET', path: '/api/topics', description: 'List all topics' },
      { method: 'GET', path: '/health', description: 'Health check' },
    ],
    websocket: {
      path: '/ws',
      messages: [
        { type: 'subscribe', description: 'Subscribe to topics: { type: "subscribe", topic: "synth.entity.*" }' },
        { type: 'publish', description: 'Publish event: { type: "publish", event: { topic, payload, source } }' },
        { type: 'event', description: 'Received event: { type: "event", event: { topic, payload, source } }' },
      ],
    },
  },
  clusterEditorIntegration: {
    autoStart: true,
    hubServicePath: 'synth-cluster-editor/src/main/services/hub-service.ts',
    startupFlow: [
      '1. App startup triggers hub-service.ts',
      '2. Check if hub already running (external instance) via /health',
      '3. If not, spawn synth-core-hub as child process',
      '4. Wait for health check to pass (10s timeout)',
      '5. Hub runs on port 8180',
    ],
  },
};

export function getArchitecture(section?: string): unknown {
  switch (section) {
    case 'components':
      return HUB_ARCHITECTURE.components;
    case 'rest-api':
      return HUB_ARCHITECTURE.restApi;
    case 'websocket':
      return HUB_ARCHITECTURE.restApi.websocket;
    case 'cluster-editor':
      return HUB_ARCHITECTURE.clusterEditorIntegration;
    default:
      return HUB_ARCHITECTURE;
  }
}
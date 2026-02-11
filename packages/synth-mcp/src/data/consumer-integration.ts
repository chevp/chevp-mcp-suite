/**
 * C++ Consumer Integration Guide Data
 */

export const CPP_CONSUMER_INTEGRATION = {
  title: 'C++ Vulkan Consumer Integration Guide',
  approaches: [
    {
      name: 'REST API (Recommended for Simplicity)',
      pros: ['Simple HTTP client', 'Works everywhere', 'Easy debugging'],
      cons: ['No streaming', 'Polling required for events'],
      cppLibraries: ['libcurl', 'cpp-httplib', 'Boost.Beast'],
      example: `// Using cpp-httplib
#include <httplib.h>
httplib::Client cli("localhost", 8180);

// Register as consumer
auto res = cli.Post("/api/registry/consumers",
  R"({"id":"vulkan-renderer-1","type":"frost-runtime","subscriptions":["synth.entity.*"]})",
  "application/json");

// Poll for events
auto events = cli.Get("/api/events/synth.entity.created?limit=10");

// Publish event
cli.Post("/api/events",
  R"({"topic":"render.frame.complete","payload":{"frameId":123},"source":"frost-runtime"})",
  "application/json");`,
    },
    {
      name: 'gRPC (Recommended for Performance)',
      pros: ['Streaming support', 'Strong typing', 'Efficient binary protocol'],
      cons: ['Proto compilation required', 'More setup'],
      cppLibraries: ['grpc++', 'protobuf'],
      example: `// Generated from synth-core-hub.proto (the ONLY Hub gRPC service)
#include "synth/hub/synth_core_hub.grpc.pb.h"

auto channel = grpc::CreateChannel("localhost:8180", grpc::InsecureChannelCredentials());
auto stub = synth::hub::SynthCoreHubService::NewStub(channel);

// Register as consumer
grpc::ClientContext ctx;
synth::hub::RegisterConsumerRequest req;
req.set_id("frost-vulkan-1");
req.set_type("frost-runtime");
req.add_subscriptions("synth.entity.*");
synth::hub::RegisterConsumerResponse res;
stub->RegisterConsumer(&ctx, req, &res);

// Subscribe to events
grpc::ClientContext stream_ctx;
synth::hub::SubscribeRequest sub_req;
sub_req.add_topics("synth.entity.*");
auto reader = stub->Subscribe(&stream_ctx, sub_req);
synth::hub::Event event;
while (reader->Read(&event)) {
  // Handle event
}`,
    },
    {
      name: 'WebSocket (For Real-time)',
      pros: ['Real-time events', 'Bidirectional'],
      cons: ['WebSocket library needed'],
      cppLibraries: ['Boost.Beast', 'websocketpp', 'libwebsockets'],
      example: `// Using Boost.Beast WebSocket
ws.connect("localhost", "8180", "/ws");

// Subscribe to topics
ws.write(R"({"type":"subscribe","topics":["synth.entity.*","build.*"]})");

// Receive events
ws.read(buffer);
auto msg = parse_json(buffer);
if (msg["type"] == "event") {
  handle_event(msg["event"]);
}`,
    },
  ],
  protoFiles: {
    location: 'synth/synth-protocol/docs/proto/',
    note: 'Only synth-core-hub.proto defines gRPC services. All other proto files are domain data schemas for XML transport.',
    forGrpcConsumers: [
      'synth-hub/synth-core-hub.proto',
    ],
  },
};

export interface IntegrationApproach {
  name: string;
  pros: string[];
  cons: string[];
  cppLibraries: string[];
  example: string;
}

export function getConsumerIntegration(approach?: string): unknown {
  if (!approach || approach === 'all') {
    return CPP_CONSUMER_INTEGRATION;
  }

  const found = CPP_CONSUMER_INTEGRATION.approaches.find((a) =>
    a.name.toLowerCase().includes(approach.toLowerCase())
  );

  if (!found) {
    return {
      error: 'Approach not found',
      available: CPP_CONSUMER_INTEGRATION.approaches.map((a) => a.name),
    };
  }

  return {
    ...found,
    protoFiles: CPP_CONSUMER_INTEGRATION.protoFiles,
  };
}
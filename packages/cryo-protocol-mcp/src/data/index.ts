import type { ProtocolDomain, ProtocolMessage, GrpcService } from '../types/index.js';

/**
 * Protocol domains in Arctic Workspace
 */
export const protocolDomains: ProtocolDomain[] = [
  {
    name: 'cryo-protocol',
    description: 'Main game protocol - ECS, networking, game logic (30,478 lines)',
    protoFiles: [
      'cryo.proto',
      'cryo_entity.proto',
      'cryo_component.proto',
      'cryo_network.proto',
      'cryo_game.proto',
    ],
    messageCount: 150,
    serviceCount: 12,
  },
  {
    name: 'arctic-protocol',
    description: 'Scene authoring and data formats (4,259 lines)',
    protoFiles: [
      'arctic.proto',
      'arctic_scene.proto',
      'arctic_asset.proto',
      'arctic_material.proto',
    ],
    messageCount: 45,
    serviceCount: 5,
  },
  {
    name: 'coregfx-protocol',
    description: 'Core graphics and rendering protocols',
    protoFiles: [
      'cgfx.proto',
      'cgfx_nyx1.proto',
      'cgfx_runtime_context.proto',
      'cgfx_ui_forms.proto',
      'cgfx_coregfx_control.proto',
      'cgfx_context_engine.proto',
    ],
    messageCount: 80,
    serviceCount: 8,
  },
  {
    name: 'studio-ui-protocol',
    description: 'Studio UI panel and tool communication',
    protoFiles: [
      'studio_ui.proto',
      'studio_panel.proto',
      'studio_tool.proto',
    ],
    messageCount: 35,
    serviceCount: 4,
  },
  {
    name: 'webgl-protocol',
    description: 'WebGL adapter protocol (125 lines)',
    protoFiles: ['webgl.proto'],
    messageCount: 12,
    serviceCount: 2,
  },
  {
    name: 'cryo-validation-protocol',
    description: 'Validation message protocol for asset and scene validation',
    protoFiles: ['validation.proto'],
    messageCount: 20,
    serviceCount: 3,
  },
];

/**
 * Key protocol messages
 */
export const keyMessages: ProtocolMessage[] = [
  {
    name: 'Entity',
    description: 'Core ECS entity with components',
    domain: 'cryo-protocol',
    protoFile: 'cryo_entity.proto',
    fields: [
      { name: 'id', type: 'uint64', number: 1, repeated: false, optional: false },
      { name: 'name', type: 'string', number: 2, repeated: false, optional: true },
      { name: 'components', type: 'Component', number: 3, repeated: true, optional: false },
      { name: 'children', type: 'Entity', number: 4, repeated: true, optional: false },
      { name: 'parent_id', type: 'uint64', number: 5, repeated: false, optional: true },
    ],
  },
  {
    name: 'Component',
    description: 'Base component with type and data',
    domain: 'cryo-protocol',
    protoFile: 'cryo_component.proto',
    fields: [
      { name: 'type', type: 'ComponentType', number: 1, repeated: false, optional: false },
      { name: 'data', type: 'bytes', number: 2, repeated: false, optional: false },
    ],
  },
  {
    name: 'Scene',
    description: 'Scene container with entities and metadata',
    domain: 'arctic-protocol',
    protoFile: 'arctic_scene.proto',
    fields: [
      { name: 'id', type: 'string', number: 1, repeated: false, optional: false },
      { name: 'name', type: 'string', number: 2, repeated: false, optional: false },
      { name: 'entities', type: 'Entity', number: 3, repeated: true, optional: false },
      { name: 'environment', type: 'Environment', number: 4, repeated: false, optional: true },
    ],
  },
  {
    name: 'Material',
    description: 'PBR material definition',
    domain: 'arctic-protocol',
    protoFile: 'arctic_material.proto',
    fields: [
      { name: 'id', type: 'string', number: 1, repeated: false, optional: false },
      { name: 'name', type: 'string', number: 2, repeated: false, optional: false },
      { name: 'albedo', type: 'Color', number: 3, repeated: false, optional: false },
      { name: 'metallic', type: 'float', number: 4, repeated: false, optional: false },
      { name: 'roughness', type: 'float', number: 5, repeated: false, optional: false },
      { name: 'normal_map', type: 'string', number: 6, repeated: false, optional: true },
    ],
  },
  {
    name: 'RenderCommand',
    description: 'Rendering command for coregfx',
    domain: 'coregfx-protocol',
    protoFile: 'cgfx.proto',
    fields: [
      { name: 'type', type: 'RenderCommandType', number: 1, repeated: false, optional: false },
      { name: 'mesh_id', type: 'uint32', number: 2, repeated: false, optional: true },
      { name: 'material_id', type: 'uint32', number: 3, repeated: false, optional: true },
      { name: 'transform', type: 'Matrix4', number: 4, repeated: false, optional: false },
    ],
  },
];

/**
 * Key gRPC services
 */
export const keyServices: GrpcService[] = [
  {
    name: 'SceneService',
    description: 'Scene management operations',
    domain: 'arctic-protocol',
    protoFile: 'arctic_scene.proto',
    methods: [
      { name: 'CreateScene', inputType: 'CreateSceneRequest', outputType: 'Scene', clientStreaming: false, serverStreaming: false },
      { name: 'GetScene', inputType: 'GetSceneRequest', outputType: 'Scene', clientStreaming: false, serverStreaming: false },
      { name: 'UpdateScene', inputType: 'UpdateSceneRequest', outputType: 'Scene', clientStreaming: false, serverStreaming: false },
      { name: 'DeleteScene', inputType: 'DeleteSceneRequest', outputType: 'Empty', clientStreaming: false, serverStreaming: false },
      { name: 'ListScenes', inputType: 'ListScenesRequest', outputType: 'ListScenesResponse', clientStreaming: false, serverStreaming: false },
    ],
  },
  {
    name: 'EntityService',
    description: 'Entity CRUD operations',
    domain: 'cryo-protocol',
    protoFile: 'cryo_entity.proto',
    methods: [
      { name: 'CreateEntity', inputType: 'CreateEntityRequest', outputType: 'Entity', clientStreaming: false, serverStreaming: false },
      { name: 'GetEntity', inputType: 'GetEntityRequest', outputType: 'Entity', clientStreaming: false, serverStreaming: false },
      { name: 'UpdateEntity', inputType: 'UpdateEntityRequest', outputType: 'Entity', clientStreaming: false, serverStreaming: false },
      { name: 'DeleteEntity', inputType: 'DeleteEntityRequest', outputType: 'Empty', clientStreaming: false, serverStreaming: false },
      { name: 'StreamEntities', inputType: 'StreamEntitiesRequest', outputType: 'Entity', clientStreaming: false, serverStreaming: true },
    ],
  },
  {
    name: 'RenderService',
    description: 'Rendering control and streaming',
    domain: 'coregfx-protocol',
    protoFile: 'cgfx_coregfx_control.proto',
    methods: [
      { name: 'Render', inputType: 'RenderRequest', outputType: 'RenderResponse', clientStreaming: false, serverStreaming: false },
      { name: 'StreamFrames', inputType: 'StreamFramesRequest', outputType: 'Frame', clientStreaming: false, serverStreaming: true },
      { name: 'SetCamera', inputType: 'SetCameraRequest', outputType: 'Empty', clientStreaming: false, serverStreaming: false },
    ],
  },
  {
    name: 'MaterialService',
    description: 'Material management',
    domain: 'arctic-protocol',
    protoFile: 'arctic_material.proto',
    methods: [
      { name: 'CreateMaterial', inputType: 'CreateMaterialRequest', outputType: 'Material', clientStreaming: false, serverStreaming: false },
      { name: 'GetMaterial', inputType: 'GetMaterialRequest', outputType: 'Material', clientStreaming: false, serverStreaming: false },
      { name: 'UpdateMaterial', inputType: 'UpdateMaterialRequest', outputType: 'Material', clientStreaming: false, serverStreaming: false },
      { name: 'ListMaterials', inputType: 'ListMaterialsRequest', outputType: 'ListMaterialsResponse', clientStreaming: false, serverStreaming: false },
    ],
  },
];

/**
 * Protocol statistics
 */
export const protocolStats = {
  totalProtoFiles: 240,
  totalLOC: 72046,
  totalMessages: 342,
  totalServices: 34,
  totalMethods: 156,
};

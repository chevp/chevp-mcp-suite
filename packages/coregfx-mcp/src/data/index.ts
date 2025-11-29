/**
 * Static data for CoreGFX MCP
 * Contains comprehensive knowledge about the coregfx graphics foundation library
 */

import type {
  CoreGfxModule,
  CoreGfxClass,
  ProtoSchema,
  DataFlow,
  CryoRelationship,
} from '../types/index.js';

export const modules: CoreGfxModule[] = [
  {
    name: 'core',
    description:
      'Low-level Vulkan foundation providing context management, device handling, command buffers, and memory allocation',
    path: 'include/coregfx/core',
    status: 'stable',
    classes: [
      'VulkanContext',
      'VulkanDevice',
      'Camera',
      'CommandBuffer',
      'MemoryAllocator',
    ],
    dependencies: ['Vulkan', 'glm'],
    headerFiles: [
      'ocean_core.hpp',
      'ocean_base.hpp',
      'ocean_dependencies.hpp',
      'ocean_buffer.hpp',
      'RuntimeContextLoader.hpp',
      'ConfigProvider.hpp',
    ],
  },
  {
    name: 'gltf',
    description:
      'GLTF 2.0 and GLB model loading with caching, using TinyGLTF library',
    path: 'include/coregfx/gltf',
    status: 'stable',
    classes: ['GltfLoader', 'GltfService', 'GltfModifier'],
    dependencies: ['tinygltf', 'core'],
    headerFiles: ['gltf_loader.hpp', 'gltf_service.hpp', 'gltf_modifier.hpp'],
  },
  {
    name: 'rsc',
    description:
      'Resource management with URI resolution (asset://, pak://) and flexible asset loading',
    path: 'include/coregfx/rsc',
    status: 'stable',
    classes: ['AssetLoader', 'AssetResolver', 'AssetPathResolver'],
    dependencies: ['gltf', 'pak', 'core'],
    headerFiles: ['AssetLoader.hpp', 'AssetPathResolver.hpp', 'rsc.hpp'],
  },
  {
    name: 'pbr',
    description:
      'Physically-Based Rendering pipeline with material system, animation support, and frame synchronization',
    path: 'include/coregfx/pbr',
    status: 'stable',
    classes: [
      'OceanPbrApp',
      'Textures',
      'Pipelines',
      'DescriptorSetLayouts',
      'UniformBufferSet',
    ],
    dependencies: ['core', 'gltf', 'rsc', 'shader_codegen'],
    headerFiles: ['pbr_app.hpp', 'pbr.hpp'],
  },
  {
    name: 'material_atlas',
    description:
      'Texture atlasing for GPU memory optimization, packing multiple PBR textures into shared atlases',
    path: 'include/coregfx/material_atlas',
    status: 'stable',
    classes: ['PbrMaterialAtlas', 'AtlasBuilder', 'AtlasEntry'],
    dependencies: ['core', 'gltf'],
    headerFiles: ['PbrMaterialAtlas.hpp'],
  },
  {
    name: 'shader_codegen',
    description:
      'Runtime GLSL to SPIR-V compilation using glslang with validation and error reporting',
    path: 'include/coregfx/shader_codegen',
    status: 'stable',
    classes: ['SPIRVCompiler', 'ShaderGenerationLogger', 'PbrSceneCapture'],
    dependencies: ['glslang'],
    headerFiles: ['SPIRVCompiler.hpp', 'ShaderGenerationLogger.hpp'],
  },
  {
    name: 'shader_merge',
    description:
      'Shader variant merging for runtime feature switching with 12+ shader features',
    path: 'include/coregfx/shader_merge',
    status: 'stable',
    classes: ['ShaderMerger', 'ShaderVariant', 'MergedShader'],
    dependencies: ['shader_codegen'],
    headerFiles: ['ShaderMerger.hpp'],
  },
  {
    name: 'platform',
    description:
      'Cross-platform abstraction for window/surface creation (Windows, Android, Headless)',
    path: 'include/coregfx/platform',
    status: 'partial',
    classes: [
      'IPlatformBootstrapper',
      'HeadlessBootstrapper',
      'Win32Bootstrapper',
    ],
    dependencies: ['core'],
    headerFiles: [
      'IPlatformBootstrapper.hpp',
      'HeadlessBootstrapper.hpp',
      'windows_platform.hpp',
    ],
  },
  {
    name: 'overlay',
    description: 'ImGui-based debug UI with performance monitoring and shader debugging',
    path: 'include/coregfx/overlay',
    status: 'stable',
    classes: ['OverlayManager', 'PerformanceOverlay', 'ShaderDebugOverlay'],
    dependencies: ['imgui', 'core'],
    headerFiles: ['overlay_imgui.hpp', 'overlay.hpp'],
  },
  {
    name: 'api',
    description:
      'Public API layer exposing coregfx functionality via direct C++ calls (no network)',
    path: 'include/coregfx/api',
    status: 'stable',
    classes: ['ArcticApiService', 'CryoApiService'],
    dependencies: ['pbr', 'rsc', 'core'],
    headerFiles: ['ArcticApiService.hpp', 'CryoApiService.hpp'],
  },
  {
    name: 'util',
    description: 'Utility functions including logging, command-line parsing, and helpers',
    path: 'include/coregfx/util',
    status: 'stable',
    classes: ['Logger', 'CommandParser', 'StringUtils'],
    dependencies: [],
    headerFiles: ['logger.hpp', 'command_parser.hpp', 'string_utils.hpp'],
  },
  {
    name: 'pak',
    description: 'PAK archive format support for packaged asset deployment',
    path: 'include/coregfx/pak',
    status: 'stable',
    classes: ['PakArchive', 'PakReader'],
    dependencies: [],
    headerFiles: ['pak.hpp', 'pak_reader.hpp'],
  },
  {
    name: 'imstudio',
    description: 'ImGui Studio integration for development tools',
    path: 'include/coregfx/imstudio',
    status: 'stable',
    classes: ['ImStudio', 'ImStudioWindow'],
    dependencies: ['imgui', 'overlay'],
    headerFiles: ['imstudio.hpp'],
  },
];

export const classes: CoreGfxClass[] = [
  {
    name: 'VulkanContext',
    module: 'core',
    description:
      'Singleton managing Vulkan instance, physical/logical devices, and command pools',
    headerFile: 'ocean_core.hpp',
    pattern: 'singleton',
    publicMethods: [
      {
        name: 'getInstance',
        signature: 'static VulkanContext& getInstance()',
        description: 'Get the singleton instance',
        isStatic: true,
      },
      {
        name: 'initialize',
        signature: 'void initialize()',
        description: 'Initialize Vulkan context with validation layers',
      },
      {
        name: 'cleanup',
        signature: 'void cleanup()',
        description: 'Clean up all Vulkan resources',
      },
      {
        name: 'getDevice',
        signature: 'VkDevice getDevice() const',
        description: 'Get the logical Vulkan device',
      },
      {
        name: 'getPhysicalDevice',
        signature: 'VkPhysicalDevice getPhysicalDevice() const',
        description: 'Get the physical device',
      },
      {
        name: 'getGraphicsQueue',
        signature: 'VkQueue getGraphicsQueue() const',
        description: 'Get the graphics queue',
      },
      {
        name: 'getCommandPool',
        signature: 'VkCommandPool getCommandPool() const',
        description: 'Get the command pool for buffer allocation',
      },
    ],
    relatedClasses: ['VulkanDevice', 'Camera'],
  },
  {
    name: 'GltfLoader',
    module: 'gltf',
    description: 'Singleton for GLTF/GLB model loading with internal caching',
    headerFile: 'gltf_loader.hpp',
    pattern: 'singleton',
    publicMethods: [
      {
        name: 'getInstance',
        signature: 'static GltfLoader& getInstance()',
        description: 'Get the singleton instance',
        isStatic: true,
      },
      {
        name: 'loadGltfRsc',
        signature:
          'tinygltf::Model loadGltfRsc(uint32_t id, const std::string_view path)',
        description: 'Load GLTF model with caching by ID',
      },
      {
        name: 'clearCache',
        signature: 'void clearCache()',
        description: 'Clear the model cache',
      },
    ],
    relatedClasses: ['GltfService', 'AssetLoader'],
  },
  {
    name: 'AssetResolver',
    module: 'rsc',
    description: 'Resolves asset:// and pak:// URIs to filesystem or archive paths',
    headerFile: 'AssetPathResolver.hpp',
    publicMethods: [
      {
        name: 'openPakArchive',
        signature: 'bool openPakArchive(const std::string& pakPath)',
        description: 'Open a PAK archive for pak:// URI resolution',
      },
      {
        name: 'resolveAssetUri',
        signature: 'std::string resolveAssetUri(const std::string& uri) const',
        description: 'Resolve asset:// URI to absolute filesystem path',
      },
      {
        name: 'loadFromPak',
        signature:
          'bool loadFromPak(const std::string& uri, std::vector<uint8_t>& outData)',
        description: 'Load binary data from pak:// URI',
      },
    ],
    relatedClasses: ['AssetLoader', 'AssetPathResolver'],
  },
  {
    name: 'AssetLoader',
    module: 'rsc',
    description:
      'High-level asset loading for GLTF models and textures with flexible storage',
    headerFile: 'AssetLoader.hpp',
    publicMethods: [
      {
        name: 'loadGltfModel',
        signature:
          'bool loadGltfModel(const std::string& assetId, const std::string& filePath)',
        description: 'Load and store a GLTF model by asset ID',
      },
      {
        name: 'getGltfModel',
        signature:
          'const tinygltf::Model* getGltfModel(const std::string& assetId) const',
        description: 'Retrieve a loaded model by ID',
      },
      {
        name: 'loadTexture',
        signature:
          'bool loadTexture(const std::string& binding, const std::string& filePath)',
        description: 'Load a texture with a named binding',
      },
    ],
    relatedClasses: ['GltfLoader', 'AssetResolver'],
  },
  {
    name: 'OceanPbrApp',
    module: 'pbr',
    description:
      'Main PBR application class extending VulkanExampleBase with full rendering pipeline',
    headerFile: 'pbr_app.hpp',
    publicMethods: [
      {
        name: 'prepare',
        signature: 'void prepare()',
        description: 'Prepare all resources for rendering',
      },
      {
        name: 'render',
        signature: 'void render()',
        description: 'Render a single frame',
      },
      {
        name: 'setupDescriptors',
        signature: 'void setupDescriptors()',
        description: 'Setup Vulkan descriptor sets',
      },
      {
        name: 'buildCommandBuffers',
        signature: 'void buildCommandBuffers()',
        description: 'Build rendering command buffers',
      },
    ],
    relatedClasses: ['Pipelines', 'Textures', 'DescriptorSetLayouts'],
  },
  {
    name: 'PbrMaterialAtlas',
    module: 'material_atlas',
    description:
      'Packs multiple material textures into optimized GPU atlases for batch rendering',
    headerFile: 'PbrMaterialAtlas.hpp',
    publicMethods: [
      {
        name: 'buildFromModels',
        signature: 'void buildFromModels(const std::vector<oceangltf::Model*>& models)',
        description: 'Build atlases from a set of GLTF models',
      },
      {
        name: 'uploadToGPU',
        signature:
          'void uploadToGPU(VkDevice, VkPhysicalDevice, VkCommandPool, VkQueue)',
        description: 'Upload all atlas textures to GPU memory',
      },
      {
        name: 'getStats',
        signature: 'const AtlasStats& getStats() const',
        description: 'Get atlas packing statistics',
      },
      {
        name: 'getAtlasEntry',
        signature: 'const AtlasEntry& getAtlasEntry(uint32_t materialIndex) const',
        description: 'Get UV bounds for a specific material in the atlas',
      },
    ],
  },
  {
    name: 'SPIRVCompiler',
    module: 'shader_codegen',
    description: 'Compiles GLSL shaders to SPIR-V using glslang with validation',
    headerFile: 'SPIRVCompiler.hpp',
    publicMethods: [
      {
        name: 'compileFragmentShader',
        signature:
          'std::vector<uint32_t> compileFragmentShader(const std::string& glslCode)',
        description: 'Compile fragment shader GLSL to SPIR-V',
      },
      {
        name: 'compileVertexShader',
        signature:
          'std::vector<uint32_t> compileVertexShader(const std::string& glslCode)',
        description: 'Compile vertex shader GLSL to SPIR-V',
      },
      {
        name: 'validateSPIRV',
        signature: 'bool validateSPIRV(const std::vector<uint32_t>& spirv)',
        description: 'Validate compiled SPIR-V bytecode',
      },
    ],
  },
  {
    name: 'ShaderMerger',
    module: 'shader_merge',
    description:
      'Merges shader variants into unified shaders with runtime feature branching',
    headerFile: 'ShaderMerger.hpp',
    publicMethods: [
      {
        name: 'mergeVariants',
        signature:
          'MergedShader mergeVariants(const std::vector<ShaderVariant>& variants)',
        description: 'Merge multiple shader variants into one',
      },
      {
        name: 'setFeature',
        signature: 'void setFeature(ShaderFeature feature, bool enabled)',
        description: 'Enable or disable a shader feature',
      },
    ],
  },
  {
    name: 'RuntimeContextManager',
    module: 'core',
    description: 'Singleton providing global access to RuntimeContext configuration',
    headerFile: 'RuntimeContextLoader.hpp',
    pattern: 'singleton',
    publicMethods: [
      {
        name: 'Instance',
        signature: 'static RuntimeContextManager& Instance()',
        description: 'Get singleton instance',
        isStatic: true,
      },
      {
        name: 'GetContext',
        signature: 'RuntimeContext& GetContext()',
        description: 'Get current runtime context',
      },
      {
        name: 'SetContext',
        signature: 'void SetContext(const RuntimeContext& ctx)',
        description: 'Set the global runtime context',
      },
    ],
  },
  {
    name: 'IPlatformBootstrapper',
    module: 'platform',
    description: 'Interface for platform-specific window and surface creation',
    headerFile: 'IPlatformBootstrapper.hpp',
    pattern: 'interface',
    publicMethods: [
      {
        name: 'initializeSurface',
        signature:
          'virtual PlatformSurface initializeSurface(const WindowConfig& config) = 0',
        description: 'Create platform-specific window and Vulkan surface',
        isVirtual: true,
      },
      {
        name: 'runMessageLoop',
        signature: 'virtual int runMessageLoop() = 0',
        description: 'Run the platform message loop',
        isVirtual: true,
      },
      {
        name: 'pollEvents',
        signature: 'virtual void pollEvents() = 0',
        description: 'Poll for platform events',
        isVirtual: true,
      },
    ],
    relatedClasses: ['HeadlessBootstrapper', 'Win32Bootstrapper'],
  },
];

export const protoSchemas: ProtoSchema[] = [
  {
    name: 'cgfx',
    domain: 'coregfx',
    description: 'Main graphics protocol with error codes, materials, and mesh definitions',
    filePath: 'proto/cgfx.proto',
    lineCount: 49576,
    messages: [
      {
        name: 'Material',
        description: 'PBR material definition',
        fields: [
          { name: 'name', type: 'string', number: 1, repeated: false, optional: false },
          {
            name: 'base_color_factor',
            type: 'Vec4',
            number: 2,
            repeated: false,
            optional: true,
          },
          {
            name: 'metallic_factor',
            type: 'float',
            number: 3,
            repeated: false,
            optional: true,
          },
          {
            name: 'roughness_factor',
            type: 'float',
            number: 4,
            repeated: false,
            optional: true,
          },
          {
            name: 'base_color_texture',
            type: 'TextureInfo',
            number: 5,
            repeated: false,
            optional: true,
          },
        ],
      },
      {
        name: 'Mesh',
        description: 'Mesh geometry with vertices and indices',
        fields: [
          { name: 'name', type: 'string', number: 1, repeated: false, optional: false },
          {
            name: 'primitives',
            type: 'Primitive',
            number: 2,
            repeated: true,
            optional: false,
          },
          { name: 'weights', type: 'float', number: 3, repeated: true, optional: true },
        ],
      },
    ],
    services: [],
  },
  {
    name: 'cgfx_runtime_context',
    domain: 'coregfx',
    description: 'Configuration schema for RuntimeContext with scene and app settings',
    filePath: 'proto/cgfx_runtime_context.proto',
    lineCount: 16690,
    messages: [
      {
        name: 'RuntimeContext',
        description: 'Main configuration container',
        fields: [
          { name: 'scene', type: 'SceneConfig', number: 1, repeated: false, optional: true },
          {
            name: 'settings',
            type: 'ApplicationSettings',
            number: 2,
            repeated: false,
            optional: true,
          },
          { name: 'camera', type: 'CameraConfig', number: 3, repeated: false, optional: true },
          {
            name: 'http_server',
            type: 'HttpServerConfig',
            number: 4,
            repeated: false,
            optional: true,
          },
          { name: 'debug', type: 'DebugConfig', number: 5, repeated: false, optional: true },
        ],
      },
      {
        name: 'ApplicationSettings',
        description: 'Application-level settings',
        fields: [
          {
            name: 'rendering_model',
            type: 'RenderingModel',
            number: 1,
            repeated: false,
            optional: true,
          },
          {
            name: 'headless_mode',
            type: 'bool',
            number: 2,
            repeated: false,
            optional: true,
          },
          { name: 'studio_mode', type: 'bool', number: 3, repeated: false, optional: true },
          { name: 'log_level', type: 'LogLevel', number: 4, repeated: false, optional: true },
        ],
      },
      {
        name: 'CameraConfig',
        description: 'Camera configuration with position and projection',
        fields: [
          {
            name: 'default_position',
            type: 'Vec3',
            number: 1,
            repeated: false,
            optional: true,
          },
          {
            name: 'default_rotation',
            type: 'Vec3',
            number: 2,
            repeated: false,
            optional: true,
          },
          { name: 'default_fov', type: 'float', number: 3, repeated: false, optional: true },
          { name: 'near_plane', type: 'float', number: 4, repeated: false, optional: true },
          { name: 'far_plane', type: 'float', number: 5, repeated: false, optional: true },
        ],
      },
    ],
    services: [],
  },
  {
    name: 'cgfx_coregfx_control',
    domain: 'coregfx',
    description: 'CoreGFX API control with command/response pairs',
    filePath: 'proto/cgfx_coregfx_control.proto',
    lineCount: 17300,
    messages: [],
    services: [
      {
        name: 'CoreGfxControl',
        description: 'Control service for coregfx operations',
        methods: [
          {
            name: 'LoadScene',
            inputType: 'LoadSceneRequest',
            outputType: 'LoadSceneResponse',
            clientStreaming: false,
            serverStreaming: false,
          },
          {
            name: 'UpdateCamera',
            inputType: 'UpdateCameraRequest',
            outputType: 'UpdateCameraResponse',
            clientStreaming: false,
            serverStreaming: false,
          },
        ],
      },
    ],
  },
];

export const dataFlows: DataFlow[] = [
  {
    name: 'Rendering Initialization',
    description: 'Flow from application startup to first frame',
    steps: [
      {
        order: 1,
        component: 'Application',
        action: 'Load config file (JSON/PBTXT)',
        details: 'Parse to RuntimeContext proto message',
      },
      {
        order: 2,
        component: 'RuntimeContextManager',
        action: 'Apply command-line overrides',
        details: 'Merge CLI args with loaded config',
      },
      {
        order: 3,
        component: 'VulkanContext',
        action: 'Initialize Vulkan',
        details: 'Create instance, debug messenger, device, command pool',
      },
      {
        order: 4,
        component: 'IPlatformBootstrapper',
        action: 'Create surface',
        details: 'Platform-specific window and VkSurfaceKHR creation',
      },
      {
        order: 5,
        component: 'OceanPbrApp',
        action: 'Prepare rendering',
        details: 'Setup pipelines, descriptors, framebuffers',
      },
    ],
  },
  {
    name: 'Asset Loading',
    description: 'Flow from asset URI to loaded model',
    steps: [
      {
        order: 1,
        component: 'Application',
        action: 'Request asset by URI',
        details: 'e.g., asset://models/character.gltf',
      },
      {
        order: 2,
        component: 'AssetResolver',
        action: 'Resolve URI to path',
        details: 'Check protocol (asset:// or pak://)',
      },
      {
        order: 3,
        component: 'AssetPathResolver',
        action: 'Apply asset root',
        details: 'Convert relative to absolute path',
      },
      {
        order: 4,
        component: 'AssetLoader',
        action: 'Load model',
        details: 'Delegate to GltfLoader with caching',
      },
      {
        order: 5,
        component: 'GltfLoader',
        action: 'Parse GLTF/GLB',
        details: 'Use TinyGLTF, cache by ID',
      },
    ],
  },
  {
    name: 'Material Atlasing',
    description: 'Flow for optimizing material textures',
    steps: [
      {
        order: 1,
        component: 'Application',
        action: 'Collect models for atlasing',
        details: 'Gather all GLTF models with materials',
      },
      {
        order: 2,
        component: 'PbrMaterialAtlas',
        action: 'Extract materials',
        details: 'Collect all unique materials from models',
      },
      {
        order: 3,
        component: 'PbrMaterialAtlas',
        action: 'Load texture data',
        details: 'Read all PBR textures (base color, normal, etc.)',
      },
      {
        order: 4,
        component: 'PbrMaterialAtlas',
        action: 'Pack into atlases',
        details: 'Calculate optimal tile size, pack textures',
      },
      {
        order: 5,
        component: 'PbrMaterialAtlas',
        action: 'Upload to GPU',
        details: 'Create VkImages, allocate memory, generate mipmaps',
      },
    ],
  },
];

export const cryoRelationships: CryoRelationship[] = [
  {
    coregfxComponent: 'RuntimeContext',
    cryoProtocol: 'cryo.scene',
    description:
      'RuntimeContext receives scene configuration from Cryo protocol messages',
    dataDirection: 'cryo-to-coregfx',
    usedMessages: ['SceneConfig', 'SceneLoadRequest'],
  },
  {
    coregfxComponent: 'OceanPbrApp',
    cryoProtocol: 'cryo.render',
    description:
      'PBR rendering state is controlled via Cryo render commands',
    dataDirection: 'cryo-to-coregfx',
    usedMessages: ['RenderCommand', 'CameraUpdate', 'MaterialOverride'],
  },
  {
    coregfxComponent: 'AssetLoader',
    cryoProtocol: 'cryo.asset',
    description:
      'Asset loading requests come from Cryo asset protocol',
    dataDirection: 'cryo-to-coregfx',
    usedMessages: ['AssetLoadRequest', 'AssetReference'],
  },
  {
    coregfxComponent: 'VulkanContext',
    cryoProtocol: 'cryo.frame',
    description:
      'Frame sync and render results are sent back via Cryo frame protocol',
    dataDirection: 'coregfx-to-cryo',
    usedMessages: ['FrameComplete', 'RenderStats', 'FrameBuffer'],
  },
  {
    coregfxComponent: 'CryoApiService',
    cryoProtocol: 'cryo.api',
    description:
      'Bidirectional API communication between Cryo protocol and coregfx',
    dataDirection: 'bidirectional',
    usedMessages: ['ApiRequest', 'ApiResponse', 'EventNotification'],
  },
];

export const architectureStats = {
  totalModules: modules.length,
  totalClasses: classes.length,
  totalProtoFiles: 8,
  linesOfCode: 500000,
  vulkanVersion: '1.3.231.1',
  targetPlatforms: ['Windows x64', 'Android (planned)', 'Headless/Server'],
  buildSystem: 'CMake 3.20+',
  cppStandard: 'C++17',
};

export const shaderFeatures = [
  { name: 'SKINNING', description: 'Skeletal animation with bone matrices' },
  { name: 'NORMAL_MAPPING', description: 'Tangent-space normal maps' },
  { name: 'EMISSIVE', description: 'Emissive material channel' },
  { name: 'OCCLUSION', description: 'Ambient occlusion maps' },
  { name: 'IBL', description: 'Image-based lighting with environment maps' },
  { name: 'ALPHA_MASK', description: 'Alpha cutoff for transparency' },
  { name: 'ALPHA_BLEND', description: 'Alpha blending for transparency' },
  { name: 'DOUBLE_SIDED', description: 'Two-sided rendering' },
  { name: 'VERTEX_COLORS', description: 'Per-vertex color attributes' },
  { name: 'MORPH_TARGETS', description: 'Blend shape animation' },
  { name: 'CLEARCOAT', description: 'Clearcoat material extension' },
  { name: 'TRANSMISSION', description: 'Refraction/transmission extension' },
];

export const uriSchemes = [
  {
    scheme: 'asset://',
    description: 'Filesystem assets relative to asset root',
    example: 'asset://models/cube.gltf',
    resolver: 'AssetResolver → AssetPathResolver → filesystem',
  },
  {
    scheme: 'pak://',
    description: 'Assets packed in PAK archive',
    example: 'pak://models/cube.gltf',
    resolver: 'AssetResolver → PakArchive → memory buffer',
  },
];

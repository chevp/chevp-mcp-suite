/**
 * Nuna SDK Architecture Strategy
 *
 * Defines what belongs in C++ vs Node.js/TypeScript
 * Used by governance tools to warn developers about misplaced code
 */

export interface ArchitectureRule {
  id: string;
  description: string;
  scope: 'cpp' | 'nodejs' | 'either';
  keywords: string[];
  antiPatterns?: string[];
  warningMessage: string;
}

export interface ComponentClassification {
  name: string;
  currentLocation: string;
  classification: 'MUST_STAY_CPP' | 'CAN_MIGRATE' | 'SHOULD_MIGRATE' | 'HYBRID';
  reason: string;
  migrationEffort?: 'low' | 'medium' | 'high';
  migrationTarget?: string;
}

/**
 * Core principle: C++ only for rendering, runtime-critical, or platform-specific code
 */
export const architectureStrategy = {
  principles: {
    cppScope: [
      'Rendering and GPU operations (Vulkan, shaders, frame management)',
      'Runtime-critical performance code (physics, ECS core loop, animation)',
      'Platform-specific native code (window management, mobile surfaces)',
    ],
    nodejsScope: [
      'Business logic (game logic, state sync, templates)',
      'Studio and content creation tools',
      'Configuration management',
      'HTTP/REST communication',
      'Data transformation and preprocessing',
      'GUI and editor functionality',
    ],
  },

  /**
   * Rules for architecture governance
   */
  rules: [
    // C++ Only Rules
    {
      id: 'vulkan-in-cpp',
      description: 'Vulkan API calls must be in C++',
      scope: 'cpp',
      keywords: ['vk', 'VkInstance', 'VkDevice', 'VkSwapchain', 'VkCommandBuffer'],
      warningMessage: 'Vulkan code detected. This MUST be in C++.',
    },
    {
      id: 'shader-runtime-in-cpp',
      description: 'Shader runtime operations must be in C++',
      scope: 'cpp',
      keywords: ['VkShaderModule', 'VkPipeline', 'SPIR-V', 'spv'],
      warningMessage: 'Shader runtime code detected. This MUST be in C++.',
    },
    {
      id: 'gpu-sync-in-cpp',
      description: 'GPU synchronization must be in C++',
      scope: 'cpp',
      keywords: ['VkSemaphore', 'VkFence', 'vkWaitForFences', 'vkQueueSubmit'],
      warningMessage: 'GPU synchronization code detected. This MUST be in C++.',
    },
    {
      id: 'physics-core-in-cpp',
      description: 'Physics simulation core must be in C++',
      scope: 'cpp',
      keywords: ['CollisionDetection', 'Raycast', 'RigidBody', 'PhysicsWorld'],
      warningMessage: 'Physics core code detected. This MUST be in C++.',
    },
    {
      id: 'ecs-iteration-in-cpp',
      description: 'ECS archetype iteration must be in C++',
      scope: 'cpp',
      keywords: ['Archetype', 'ComponentMask', 'EntityQuery', 'forEach'],
      warningMessage: 'ECS iteration code detected. This should be in C++ for performance.',
    },
    {
      id: 'bone-animation-in-cpp',
      description: 'Skeletal animation calculations must be in C++',
      scope: 'cpp',
      keywords: ['BoneTransform', 'SkeletonPose', 'KeyframeInterpolation'],
      warningMessage: 'Skeletal animation code detected. This MUST be in C++.',
    },

    // Node.js Only Rules
    {
      id: 'http-client-in-nodejs',
      description: 'HTTP client code should be in Node.js',
      scope: 'nodejs',
      keywords: ['HttpClient', 'RestApi', 'fetch', 'axios'],
      antiPatterns: ['curl', 'libcurl', 'cpr::'],
      warningMessage:
        'HTTP client code detected in C++. Consider migrating to Node.js.',
    },
    {
      id: 'config-in-nodejs',
      description: 'Configuration management should be in Node.js',
      scope: 'nodejs',
      keywords: ['ConfigProvider', 'ConfigManager', 'loadConfig'],
      warningMessage:
        'Configuration code detected in C++. Consider migrating to Node.js.',
    },
    {
      id: 'business-logic-in-nodejs',
      description: 'Business logic should be in Node.js',
      scope: 'nodejs',
      keywords: [
        'GameLogic',
        'StateSync',
        'TemplateService',
        'TriggerService',
      ],
      warningMessage:
        'Business logic detected in C++. This should be in Node.js.',
    },
    {
      id: 'logging-in-nodejs',
      description: 'Structured logging should be in Node.js',
      scope: 'nodejs',
      keywords: ['LogManager', 'Logger', 'spdlog'],
      warningMessage:
        'Logging infrastructure detected in C++. Consider Node.js for observability.',
    },
    {
      id: 'json-parsing-in-nodejs',
      description: 'Heavy JSON parsing should be in Node.js',
      scope: 'nodejs',
      keywords: ['nlohmann::json', 'rapidjson', 'JsonParser'],
      warningMessage:
        'JSON parsing detected in C++. Consider preprocessing in Node.js.',
    },
    {
      id: 'sqlite-in-nodejs',
      description: 'SQLite operations should be in Node.js',
      scope: 'nodejs',
      keywords: ['sqlite3', 'SQLiteDatabase', 'sqlite_'],
      warningMessage:
        'SQLite code detected in C++. Consider migrating to Node.js.',
    },
  ] as ArchitectureRule[],

  /**
   * Component classifications for migration planning
   */
  componentClassifications: [
    // MUST_STAY_CPP
    {
      name: 'vulkan-desktop-plugin',
      currentLocation: 'plugins/rendering/vulkan-desktop-plugin/',
      classification: 'MUST_STAY_CPP',
      reason: 'Direct Vulkan API, platform window management',
    },
    {
      name: 'vulkan-mobile-plugin',
      currentLocation: 'plugins/rendering/vulkan-mobile-plugin/',
      classification: 'MUST_STAY_CPP',
      reason: 'Direct Vulkan API, mobile surface management',
    },
    {
      name: 'renderer-plugin',
      currentLocation: 'plugins/rendering/renderer-plugin/',
      classification: 'MUST_STAY_CPP',
      reason: 'GPU command recording, render graph execution',
    },
    {
      name: 'physics-core',
      currentLocation: 'plugins/game/physics-core/',
      classification: 'MUST_STAY_CPP',
      reason: 'Real-time collision detection, raycasting',
    },
    {
      name: 'game-ecs',
      currentLocation: 'plugins/game/game-ecs/',
      classification: 'HYBRID',
      reason: 'Core iteration in C++, metadata/serialization can migrate',
    },
    {
      name: 'game-character',
      currentLocation: 'plugins/game/game-character/',
      classification: 'HYBRID',
      reason: 'Bone transforms in C++, skin registry can migrate',
    },
    {
      name: 'scheduler',
      currentLocation: 'plugins/core/scheduler/',
      classification: 'MUST_STAY_CPP',
      reason: 'Precise frame timing, game loop synchronization',
    },
    {
      name: 'plugin-system',
      currentLocation: 'foundation/plugin-system/',
      classification: 'MUST_STAY_CPP',
      reason: 'Native DLL/SO loading, plugin lifecycle',
    },

    // SHOULD_MIGRATE
    {
      name: 'config-provider',
      currentLocation: 'plugins/core/config-provider/',
      classification: 'SHOULD_MIGRATE',
      reason: 'Pure configuration logic, no C++ dependency',
      migrationEffort: 'low',
      migrationTarget: 'Node.js config library (dotenv, config)',
    },
    {
      name: 'http-client',
      currentLocation: 'plugins/core/http-client/',
      classification: 'SHOULD_MIGRATE',
      reason: 'Standard HTTP operations, better in Node.js',
      migrationEffort: 'low',
      migrationTarget: 'Node.js axios/node-fetch',
    },
    {
      name: 'logging-plugin',
      currentLocation: 'plugins/core/logging-plugin/',
      classification: 'SHOULD_MIGRATE',
      reason: 'Better observability in Node.js ecosystem',
      migrationEffort: 'low',
      migrationTarget: 'Node.js Winston/Pino',
    },
    {
      name: 'game-logic',
      currentLocation: 'plugins/core/game-logic/',
      classification: 'SHOULD_MIGRATE',
      reason: 'Pure algorithms (prediction, interpolation), no GPU',
      migrationEffort: 'medium',
      migrationTarget: 'Node.js service',
    },
    {
      name: 'cryo-agent',
      currentLocation: 'plugins/core/cryo-agent/',
      classification: 'SHOULD_MIGRATE',
      reason: 'Business logic (templates, triggers, sync)',
      migrationEffort: 'high',
      migrationTarget: 'Node.js microservice',
    },
    {
      name: 'cryo-asset',
      currentLocation: 'plugins/core/cryo-asset/',
      classification: 'SHOULD_MIGRATE',
      reason: 'Asset caching, SQLite operations',
      migrationEffort: 'medium',
      migrationTarget: 'Node.js + SQLite3',
    },
    {
      name: 'cryo-client',
      currentLocation: 'plugins/core/cryo-client/',
      classification: 'SHOULD_MIGRATE',
      reason: 'HTTP client for remote data',
      migrationEffort: 'low',
      migrationTarget: 'Node.js HTTP',
    },
    {
      name: 'studio-task',
      currentLocation: 'plugins/tasks/studio-task/',
      classification: 'SHOULD_MIGRATE',
      reason: '3D scene editor with HTTP API',
      migrationEffort: 'high',
      migrationTarget: 'Express.js + React',
    },
    {
      name: 'converter-task',
      currentLocation: 'plugins/tasks/converter-task/',
      classification: 'SHOULD_MIGRATE',
      reason: 'Format conversion, preprocessing',
      migrationEffort: 'medium',
      migrationTarget: 'Node.js asset pipeline',
    },
    {
      name: 'state-sync-task',
      currentLocation: 'plugins/tasks/state-sync-task/',
      classification: 'SHOULD_MIGRATE',
      reason: 'Data synchronization logic',
      migrationEffort: 'medium',
      migrationTarget: 'Node.js service',
    },

    // CAN_MIGRATE (optional, lower priority)
    {
      name: 'agent',
      currentLocation: 'plugins/core/agent/',
      classification: 'CAN_MIGRATE',
      reason: 'Server communication, service registry',
      migrationEffort: 'medium',
      migrationTarget: 'Node.js microservice',
    },
    {
      name: 'network-proto',
      currentLocation: 'plugins/core/network-proto/',
      classification: 'HYBRID',
      reason: 'Protobuf on hot paths stays C++, schema management migrates',
    },
    {
      name: 'headless-task',
      currentLocation: 'plugins/tasks/headless-task/',
      classification: 'HYBRID',
      reason: 'Batch processing wrapper in Node.js, rendering stays C++',
    },
  ] as ComponentClassification[],

  /**
   * Migration phases
   */
  migrationPhases: [
    {
      phase: 1,
      name: 'Foundation',
      duration: '1 week',
      components: ['config-provider', 'http-client', 'logging-plugin'],
      description: 'Migrate infrastructure services to Node.js',
    },
    {
      phase: 2,
      name: 'Business Logic',
      duration: '2-3 weeks',
      components: ['game-logic', 'cryo-agent', 'cryo-asset', 'cryo-client'],
      description: 'Migrate core business logic to Node.js microservices',
    },
    {
      phase: 3,
      name: 'Studio',
      duration: '3-4 weeks',
      components: ['studio-task', 'converter-task', 'state-sync-task'],
      description: 'Migrate content creation tools to Node.js/Electron',
    },
  ],
};

/**
 * Check if a code pattern violates architecture rules
 */
export function checkArchitectureViolation(
  code: string,
  targetLanguage: 'cpp' | 'nodejs'
): ArchitectureRule[] {
  const violations: ArchitectureRule[] = [];

  for (const rule of architectureStrategy.rules) {
    // Check if code contains keywords
    const hasKeyword = rule.keywords.some((keyword) =>
      code.includes(keyword)
    );

    if (hasKeyword) {
      // If the code is in the wrong scope
      if (rule.scope !== targetLanguage && rule.scope !== 'either') {
        violations.push(rule);
      }

      // Check anti-patterns (code that shouldn't exist in either)
      if (rule.antiPatterns && targetLanguage === 'cpp') {
        const hasAntiPattern = rule.antiPatterns.some((pattern) =>
          code.includes(pattern)
        );
        if (hasAntiPattern) {
          violations.push(rule);
        }
      }
    }
  }

  return violations;
}

/**
 * Get migration recommendation for a component
 */
export function getMigrationRecommendation(
  componentName: string
): ComponentClassification | undefined {
  return architectureStrategy.componentClassifications.find(
    (c) => c.name === componentName
  );
}

/**
 * Get all components that should be migrated
 */
export function getComponentsToMigrate(): ComponentClassification[] {
  return architectureStrategy.componentClassifications.filter(
    (c) =>
      c.classification === 'SHOULD_MIGRATE' ||
      c.classification === 'CAN_MIGRATE'
  );
}

/**
 * Get all components that must stay in C++
 */
export function getComponentsMustStayCpp(): ComponentClassification[] {
  return architectureStrategy.componentClassifications.filter(
    (c) => c.classification === 'MUST_STAY_CPP'
  );
}

import type { Layer, Project, BuildCommand } from '../types/index.js';

/**
 * Arctic Workspace 6-Layer Architecture
 */
export const layers: Layer[] = [
  {
    name: 'foundation',
    description: 'Core protocols and graphics libraries (CMake)',
    technology: 'CMake, C++',
    path: 'foundation/',
    projects: [
      'coregfx',
      'arctic-protocol',
      'cryo-protocol',
      'cryo-validation-protocol',
      'studio-ui-protocol',
      'webgl-protocol',
      'rendering-interface',
    ],
  },
  {
    name: 'domain',
    description: 'Business logic, SDKs, asset systems (CMake)',
    technology: 'CMake, C++',
    path: 'domain/',
    projects: [
      'cryo-tooling',
      'cryo-asset',
      'cryo-pipeline',
      'cryo-cache',
      'cryo-game-sdk',
      'cryo-compute-engine',
      'qinu-game-sdk',
      'cryo-deploy',
    ],
  },
  {
    name: 'apps',
    description: 'Renderers, servers, CLI tools (CMake)',
    technology: 'CMake, C++',
    path: 'apps/',
    projects: [
      'arctic-renderer',
      'shader-graph-renderer',
      'data-driven-renderer',
      'cryo-studio',
      'game-server',
      'cryo-broadcast-server',
      'cryo-container-server',
      'coregfx-stream',
      'coregfx-headless',
      'cryo-build-lab-v0.1',
      'pak-tool',
      'arctic-cli',
      'arctic-gltf',
    ],
  },
  {
    name: 'agents',
    description: 'Protocol adapters and bridges (CMake + npm)',
    technology: 'CMake, C++, TypeScript',
    path: 'agents/',
    projects: [
      'webgl-protocol-adapter',
      'cryo-engine-bridge',
      'webgl-cryo-bridge',
      'gltf-cryo-bridge',
      'vulkan-cryo-bridge',
      'opengl-cryo-bridge',
      'fbx-cryo-bridge',
      'gnm-cryo-bridge',
    ],
  },
  {
    name: 'java',
    description: 'Server backends, mobile platforms (Maven)',
    technology: 'Maven, Java 21',
    path: 'java/',
    projects: [
      'game-server-backend',
      'android-platform',
      'cloud-services',
      's3-asset-server',
    ],
  },
  {
    name: 'web',
    description: 'Angular apps, Electron studio, WebGL (npm/Nx)',
    technology: 'Nx, Angular, Electron',
    path: 'web/',
    projects: [
      'cryo-platform-web',
      'cryo-build-lab-tools',
      'cryo-web-sdk',
      'cryo-cli',
      'cryo-quickstarts',
      'studio-ui-core',
      'shader-graph-component',
      'web-components-scene-editor',
      'cryo-studio-webapp',
    ],
  },
];

/**
 * Key projects with detailed information
 */
export const projects: Project[] = [
  // Foundation
  {
    name: 'coregfx',
    description: 'Vulkan graphics core library - foundation for all rendering',
    layer: 'foundation',
    path: 'foundation/coregfx/',
    technology: 'cmake',
    type: 'library',
    dependencies: ['Vulkan SDK 1.3.231.1', 'GLM', 'ImGui', 'TinyGLTF'],
    buildCommand: 'cmake --build build --config Release --target coregfx',
  },
  {
    name: 'arctic-protocol',
    description: 'Scene authoring and data format protocols',
    layer: 'foundation',
    path: 'foundation/arctic-protocol/',
    technology: 'cmake',
    type: 'protocol',
    dependencies: ['protobuf'],
  },
  {
    name: 'cryo-protocol',
    description: 'Main game protocol definition (30,478 lines)',
    layer: 'foundation',
    path: 'foundation/cryo-protocol/',
    technology: 'cmake',
    type: 'protocol',
    dependencies: ['protobuf', 'grpc'],
  },
  // Apps
  {
    name: 'cryo-studio',
    description: 'HTTP/gRPC studio server - bridges web UI to rendering backend',
    layer: 'apps',
    path: 'apps/cryo-studio/',
    technology: 'cmake',
    type: 'application',
    dependencies: ['coregfx', 'arctic-protocol', 'cryo-tooling'],
    buildCommand: 'cmake --build build --config Release --target cryo_studio',
    outputs: ['cryo-studio.exe', 'cryo-studio-server-desktop.exe'],
  },
  {
    name: 'arctic-renderer',
    description: 'Main Vulkan PBR renderer',
    layer: 'apps',
    path: 'apps/core/arctic-renderer/',
    technology: 'cmake',
    type: 'application',
    dependencies: ['coregfx'],
    buildCommand: 'cmake --build build --config Release --target arctic_renderer',
  },
  // Web
  {
    name: 'cryo-studio-webapp',
    description: 'Angular 18 visual development environment',
    layer: 'web',
    path: 'web/apps/cryo-studio-webapp/',
    technology: 'nx',
    type: 'application',
    dependencies: ['Angular 18', 'Firebase', 'TailwindCSS'],
    buildCommand: 'npx nx build cryo-studio-webapp --configuration=production',
  },
];

/**
 * Common build commands
 */
export const buildCommands: BuildCommand[] = [
  {
    name: 'build-all',
    command: 'cmake -B build -DCMAKE_TOOLCHAIN_FILE=C:\\vcpkg\\scripts\\buildsystems\\vcpkg.cmake && cmake --build build --config Release',
    description: 'Full ecosystem build (all 6 layers)',
    workingDir: 'arctic/arctic-workspace',
  },
  {
    name: 'build-foundation',
    command: 'scripts\\build-foundation.bat',
    description: 'Build foundation layer only (2-5 min)',
    workingDir: 'arctic/arctic-workspace',
  },
  {
    name: 'build-domain',
    command: 'scripts\\build-domain.bat',
    description: 'Build domain layer only (3-7 min)',
    workingDir: 'arctic/arctic-workspace',
    dependencies: ['build-foundation'],
  },
  {
    name: 'build-apps',
    command: 'scripts\\build-apps.bat',
    description: 'Build apps layer only (5-10 min)',
    workingDir: 'arctic/arctic-workspace',
    dependencies: ['build-foundation', 'build-domain'],
  },
  {
    name: 'build-web',
    command: 'cd web && npm install && npx nx run-many -t build',
    description: 'Build web layer (npm/Nx)',
    workingDir: 'arctic/arctic-workspace',
  },
  {
    name: 'serve-webapp',
    command: 'cd web && npx nx serve cryo-studio-webapp',
    description: 'Start cryo-studio-webapp dev server on http://localhost:4200',
    workingDir: 'arctic/arctic-workspace',
  },
];

/**
 * Workspace statistics
 */
export const workspaceStats = {
  protoFiles: 240,
  protoLOC: 72046,
  cmakeProjects: 61,
  mavenProjects: 12,
  npmPackages: 74,
  executables: 14,
  submodules: 14,
};

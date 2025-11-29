/**
 * Pre-seeded CMake Error Patterns
 */

import type { ErrorPattern } from '../types/index.js';

export const CMAKE_PATTERNS: ErrorPattern[] = [
  {
    id: 'cmake-target-not-found',
    category: 'cmake',
    regex: 'CMake Error.*[Tt]arget "([^"]+)" (?:was )?not found',
    extractors: { target: '$1' },
    description: 'CMake cannot find a referenced target',
    commonCauses: [
      'Target defined in a CMakeLists.txt that was not added via add_subdirectory()',
      'Typo in target name',
      'Missing add_subdirectory() call for the directory containing the target',
      'Target defined after it is referenced',
    ],
    fixes: [
      {
        id: 'add-subdirectory',
        description: 'Add missing add_subdirectory() for the target',
        type: 'cmake_change',
        steps: [
          "Search for CMakeLists.txt containing 'add_library(${target}' or 'add_executable(${target}'",
          'Add add_subdirectory(path/to/target/dir) in the parent CMakeLists.txt before the reference',
        ],
        appliedCount: 0,
        successCount: 0,
      },
      {
        id: 'fix-target-typo',
        description: 'Fix typo in target name',
        type: 'cmake_change',
        steps: [
          'Search for similar target names in the project',
          'Correct the target name in target_link_libraries() or add_dependencies()',
        ],
        appliedCount: 0,
        successCount: 0,
      },
    ],
    occurrences: 0,
    lastSeen: '',
    successRate: 0,
  },
  {
    id: 'cmake-package-not-found',
    category: 'cmake',
    regex: 'CMake Error.*Could (?:NOT|not) find (?:a )?package.*"?([A-Za-z0-9_-]+)"?',
    extractors: { package: '$1' },
    description: 'CMake cannot find a required package',
    commonCauses: [
      'Package is not installed on the system',
      'Package is installed but not in CMAKE_PREFIX_PATH',
      'vcpkg/Conan package not installed',
      'Wrong package name (case sensitive)',
    ],
    fixes: [
      {
        id: 'install-vcpkg-package',
        description: 'Install package via vcpkg',
        type: 'dependency',
        steps: [
          'Run: vcpkg install ${package}',
          'Ensure CMAKE_TOOLCHAIN_FILE points to vcpkg.cmake',
        ],
        appliedCount: 0,
        successCount: 0,
      },
      {
        id: 'add-cmake-prefix-path',
        description: 'Add package location to CMAKE_PREFIX_PATH',
        type: 'cmake_change',
        steps: [
          'Find where the package is installed',
          'Add -DCMAKE_PREFIX_PATH=/path/to/package to cmake command',
          'Or set CMAKE_PREFIX_PATH environment variable',
        ],
        appliedCount: 0,
        successCount: 0,
      },
    ],
    occurrences: 0,
    lastSeen: '',
    successRate: 0,
  },
  {
    id: 'cmake-syntax-error',
    category: 'cmake',
    regex: 'CMake Error at ([^:]+):(\\d+)',
    extractors: { file: '$1', line: '$2' },
    description: 'Syntax error in CMakeLists.txt',
    commonCauses: [
      'Missing closing parenthesis',
      'Unquoted string with spaces',
      'Invalid command name',
      'Missing argument',
    ],
    fixes: [
      {
        id: 'check-syntax',
        description: 'Check CMake syntax at the specified line',
        type: 'file_edit',
        steps: [
          'Open ${file} at line ${line}',
          'Check for missing parentheses, quotes, or arguments',
          'Verify command name spelling',
        ],
        appliedCount: 0,
        successCount: 0,
      },
    ],
    occurrences: 0,
    lastSeen: '',
    successRate: 0,
  },
  {
    id: 'cmake-version-required',
    category: 'cmake',
    regex: 'CMake (\\d+\\.\\d+(?:\\.\\d+)?) or higher is required',
    extractors: { version: '$1' },
    description: 'CMake version is too old',
    commonCauses: [
      'System CMake is outdated',
      'Project requires newer CMake features',
    ],
    fixes: [
      {
        id: 'upgrade-cmake',
        description: 'Upgrade CMake to required version',
        type: 'manual',
        steps: [
          'Download CMake ${version} or newer from cmake.org',
          'Or use: choco upgrade cmake (Windows)',
          'Or use: brew upgrade cmake (macOS)',
        ],
        appliedCount: 0,
        successCount: 0,
      },
      {
        id: 'lower-cmake-requirement',
        description: 'Lower the cmake_minimum_required version',
        type: 'cmake_change',
        steps: [
          'Check if newer CMake features are actually used',
          'If not, lower cmake_minimum_required() to match installed version',
        ],
        appliedCount: 0,
        successCount: 0,
      },
    ],
    occurrences: 0,
    lastSeen: '',
    successRate: 0,
  },
  {
    id: 'cmake-add-subdirectory-missing',
    category: 'cmake',
    regex: 'add_subdirectory.*does not contain a CMakeLists\\.txt',
    description: 'Subdirectory does not contain CMakeLists.txt',
    commonCauses: [
      'Wrong directory path in add_subdirectory()',
      'CMakeLists.txt was not created in the subdirectory',
      'Directory does not exist',
    ],
    fixes: [
      {
        id: 'create-cmakelists',
        description: 'Create CMakeLists.txt in the subdirectory',
        type: 'file_edit',
        steps: [
          'Create a new CMakeLists.txt file in the referenced subdirectory',
          'Add appropriate add_library() or add_executable() commands',
        ],
        appliedCount: 0,
        successCount: 0,
      },
      {
        id: 'fix-subdirectory-path',
        description: 'Fix the subdirectory path',
        type: 'cmake_change',
        steps: [
          'Verify the directory path exists',
          'Correct the path in add_subdirectory() if needed',
        ],
        appliedCount: 0,
        successCount: 0,
      },
    ],
    occurrences: 0,
    lastSeen: '',
    successRate: 0,
  },
  {
    id: 'cmake-generator-mismatch',
    category: 'cmake',
    regex: 'CMAKE_GENERATOR.*does not match.*generator',
    description: 'CMake generator mismatch in build directory',
    commonCauses: [
      'Trying to use different generator than initially configured',
      'Build directory was configured with different Visual Studio version',
    ],
    fixes: [
      {
        id: 'clear-build-dir',
        description: 'Clear build directory and reconfigure',
        type: 'manual',
        steps: [
          'Delete the build directory (or its CMakeCache.txt)',
          'Re-run cmake with the desired generator',
        ],
        appliedCount: 0,
        successCount: 0,
      },
    ],
    occurrences: 0,
    lastSeen: '',
    successRate: 0,
  },
  {
    id: 'cmake-policy-warning',
    category: 'cmake',
    regex: 'CMake Warning.*Policy (CMP\\d+)',
    extractors: { policy: '$1' },
    description: 'CMake policy warning',
    commonCauses: [
      'Using deprecated CMake behavior',
      'cmake_minimum_required is set too low',
    ],
    fixes: [
      {
        id: 'set-policy',
        description: 'Set the CMake policy explicitly',
        type: 'cmake_change',
        steps: [
          'Add cmake_policy(SET ${policy} NEW) after cmake_minimum_required()',
          'Or update cmake_minimum_required() to a version where the policy defaults to NEW',
        ],
        appliedCount: 0,
        successCount: 0,
      },
    ],
    occurrences: 0,
    lastSeen: '',
    successRate: 0,
  },
  {
    id: 'cmake-source-not-found',
    category: 'cmake',
    regex: 'Cannot find source file:\\s*([^\\s]+)',
    extractors: { file: '$1' },
    description: 'Source file listed in CMakeLists.txt does not exist',
    commonCauses: [
      'File was renamed or moved',
      'Typo in filename',
      'File was deleted but not removed from CMakeLists.txt',
    ],
    fixes: [
      {
        id: 'remove-source',
        description: 'Remove the missing source file from CMakeLists.txt',
        type: 'cmake_change',
        steps: [
          'Find the add_library() or add_executable() containing ${file}',
          'Remove ${file} from the source list',
        ],
        appliedCount: 0,
        successCount: 0,
      },
      {
        id: 'create-source',
        description: 'Create the missing source file',
        type: 'file_edit',
        steps: [
          'Create the file ${file}',
          'Add appropriate content based on other files in the project',
        ],
        appliedCount: 0,
        successCount: 0,
      },
    ],
    occurrences: 0,
    lastSeen: '',
    successRate: 0,
  },
  {
    id: 'cmake-include-not-found',
    category: 'cmake',
    regex: 'include could not find.*file:\\s*([^\\s]+)',
    extractors: { file: '$1' },
    description: 'CMake include() file not found',
    commonCauses: [
      'Module path not set correctly',
      'File path is wrong',
      'Custom CMake module not installed',
    ],
    fixes: [
      {
        id: 'add-module-path',
        description: 'Add directory to CMAKE_MODULE_PATH',
        type: 'cmake_change',
        steps: [
          'Find where ${file} is located',
          'Add list(APPEND CMAKE_MODULE_PATH /path/to/modules) before include()',
        ],
        appliedCount: 0,
        successCount: 0,
      },
    ],
    occurrences: 0,
    lastSeen: '',
    successRate: 0,
  },
  {
    id: 'cmake-variable-not-set',
    category: 'cmake',
    regex: 'CMake Error:.*variable.*"([^"]+)".*not set',
    extractors: { variable: '$1' },
    description: 'Required CMake variable is not set',
    commonCauses: [
      'Missing -D flag in cmake command',
      'Dependency not found that should set the variable',
      'find_package() failed silently',
    ],
    fixes: [
      {
        id: 'set-variable',
        description: 'Set the variable in cmake command',
        type: 'cmake_change',
        steps: [
          'Add -D${variable}=/path/or/value to cmake command',
        ],
        appliedCount: 0,
        successCount: 0,
      },
    ],
    occurrences: 0,
    lastSeen: '',
    successRate: 0,
  },
];

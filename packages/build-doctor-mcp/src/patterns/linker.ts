/**
 * Pre-seeded GCC/Clang Compiler and Linker Error Patterns
 */

import type { ErrorPattern } from '../types/index.js';

export const GCC_CLANG_PATTERNS: ErrorPattern[] = [
  // ============================================================================
  // GCC/Clang Compiler Errors
  // ============================================================================
  {
    id: 'gcc-undeclared-identifier',
    category: 'compiler',
    compiler: 'gcc',
    regex: "error:\\s*'([^']+)'\\s*(?:was not declared|undeclared)\\s*(?:in this scope)?",
    extractors: { identifier: '$1' },
    description: 'Undeclared identifier',
    commonCauses: [
      'Missing #include directive',
      'Typo in identifier name',
      'Missing namespace qualification',
      'Identifier defined after use',
    ],
    fixes: [
      {
        id: 'add-include',
        description: 'Add missing #include directive',
        type: 'file_edit',
        steps: [
          'Search for header file declaring ${identifier}',
          'Add #include "header.h" or #include <header>',
        ],
        appliedCount: 0,
        successCount: 0,
      },
      {
        id: 'add-namespace',
        description: 'Add namespace qualification',
        type: 'file_edit',
        steps: [
          'Check which namespace ${identifier} belongs to',
          'Use namespace::${identifier} or add using directive',
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
    id: 'gcc-no-member',
    category: 'compiler',
    compiler: 'gcc',
    regex: "error:\\s*(?:'([^']+)'\\s*)?(?:class|struct)\\s*'([^']+)'\\s*has no member named\\s*'([^']+)'",
    extractors: { context: '$1', type: '$2', member: '$3' },
    description: 'No member with given name in class/struct',
    commonCauses: [
      'Typo in member name',
      'Member is private (different error usually)',
      'Using wrong type or overload',
      'Member was renamed or removed',
    ],
    fixes: [
      {
        id: 'check-member',
        description: 'Check correct member name',
        type: 'manual',
        steps: [
          'Open header defining ${type}',
          'Find correct member name',
          'Update code to use correct name',
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
    id: 'gcc-expected-token',
    category: 'compiler',
    compiler: 'gcc',
    regex: "error:\\s*expected\\s*'([^']+)'\\s*(?:before|after)?\\s*'?([^']*)'?",
    extractors: { expected: '$1', context: '$2' },
    description: 'Expected token not found',
    commonCauses: [
      'Missing semicolon',
      'Missing closing brace/parenthesis',
      'Syntax error in previous line',
    ],
    fixes: [
      {
        id: 'add-token',
        description: 'Add expected token',
        type: 'file_edit',
        steps: [
          "Add '${expected}' at appropriate location",
          'Check previous line for missing semicolon',
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
    id: 'gcc-incomplete-type',
    category: 'compiler',
    compiler: 'gcc',
    regex: "error:\\s*(?:invalid use of )?incomplete type\\s*'(?:class|struct)?\\s*([^']+)'",
    extractors: { type: '$1' },
    description: 'Using incomplete (forward-declared) type',
    commonCauses: [
      'Only forward declaration available',
      'Header with full definition not included',
      'Circular dependency',
    ],
    fixes: [
      {
        id: 'include-definition',
        description: 'Include full type definition',
        type: 'file_edit',
        steps: [
          'Include header that fully defines ${type}',
          'Replace forward declaration with #include',
        ],
        appliedCount: 0,
        successCount: 0,
      },
      {
        id: 'use-pointer',
        description: 'Use pointer/reference instead',
        type: 'file_edit',
        steps: [
          'Change ${type} value to ${type}* pointer',
          'Forward declaration works with pointers/references',
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
    id: 'gcc-no-matching-function',
    category: 'compiler',
    compiler: 'gcc',
    regex: "error:\\s*no matching function for call to\\s*'([^']+)'",
    extractors: { function: '$1' },
    description: 'No matching function found for call',
    commonCauses: [
      'Wrong argument types',
      'Wrong number of arguments',
      'Function is template and cannot deduce types',
      'Function does not exist',
    ],
    fixes: [
      {
        id: 'check-signature',
        description: 'Check function signature',
        type: 'manual',
        steps: [
          'Look at available overloads (shown in error)',
          'Match argument types to expected parameters',
          'Add explicit template arguments if needed',
        ],
        appliedCount: 0,
        successCount: 0,
      },
      {
        id: 'add-conversion',
        description: 'Add type conversion',
        type: 'file_edit',
        steps: [
          'Convert arguments to expected types',
          'Use static_cast or constructor conversion',
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
    id: 'gcc-cannot-convert',
    category: 'compiler',
    compiler: 'gcc',
    regex: "error:\\s*cannot convert\\s*'([^']+)'\\s*to\\s*'([^']+)'",
    extractors: { fromType: '$1', toType: '$2' },
    description: 'Type conversion not possible',
    commonCauses: [
      'Incompatible types',
      'Missing conversion operator',
      'const/volatile mismatch',
    ],
    fixes: [
      {
        id: 'add-cast',
        description: 'Add explicit cast',
        type: 'file_edit',
        steps: [
          'Use static_cast<${toType}>(value)',
          'Or implement conversion operator/constructor',
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
    id: 'gcc-redefinition',
    category: 'compiler',
    compiler: 'gcc',
    regex: "error:\\s*redefinition of\\s*'([^']+)'",
    extractors: { symbol: '$1' },
    description: 'Symbol redefined',
    commonCauses: [
      'Same header included multiple times without guards',
      'Function/variable defined in header without inline/extern',
      'Copy-paste error',
    ],
    fixes: [
      {
        id: 'add-include-guard',
        description: 'Add include guards to header',
        type: 'file_edit',
        steps: [
          'Add #pragma once at top of header',
          'Or use #ifndef/#define/#endif guards',
        ],
        appliedCount: 0,
        successCount: 0,
      },
      {
        id: 'make-inline',
        description: 'Make function inline',
        type: 'file_edit',
        steps: [
          'If ${symbol} is a function in header, add inline keyword',
          'Or move definition to .cpp file',
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
    id: 'clang-unknown-type',
    category: 'compiler',
    compiler: 'clang',
    regex: "error:\\s*unknown type name\\s*'([^']+)'",
    extractors: { type: '$1' },
    description: 'Unknown type name',
    commonCauses: [
      'Missing #include for type definition',
      'Missing forward declaration',
      'Typo in type name',
    ],
    fixes: [
      {
        id: 'add-include',
        description: 'Add #include for type',
        type: 'file_edit',
        steps: [
          'Find header that defines ${type}',
          'Add appropriate #include directive',
        ],
        appliedCount: 0,
        successCount: 0,
      },
    ],
    occurrences: 0,
    lastSeen: '',
    successRate: 0,
  },

  // ============================================================================
  // GCC/Clang Linker Errors
  // ============================================================================
  {
    id: 'gcc-undefined-reference',
    category: 'linker',
    compiler: 'gcc',
    regex: "undefined reference to\\s*[`']([^'`]+)[`']",
    extractors: { symbol: '$1' },
    description: 'Undefined reference - linker cannot find symbol',
    commonCauses: [
      'Source file not compiled/linked',
      'Library not linked',
      'Function declared but not defined',
      'Name mangling issue (missing extern "C")',
    ],
    fixes: [
      {
        id: 'add-source',
        description: 'Add source file to build',
        type: 'cmake_change',
        steps: [
          'Find .cpp file that defines ${symbol}',
          'Add it to target_sources() or add_library()/add_executable()',
        ],
        appliedCount: 0,
        successCount: 0,
      },
      {
        id: 'link-library',
        description: 'Link required library',
        type: 'cmake_change',
        steps: [
          'Find library that provides ${symbol}',
          'Add target_link_libraries(target PRIVATE library)',
        ],
        appliedCount: 0,
        successCount: 0,
      },
      {
        id: 'implement-function',
        description: 'Implement the function',
        type: 'file_edit',
        steps: [
          '${symbol} is declared but not defined',
          'Add implementation in a .cpp file',
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
    id: 'gcc-multiple-definition',
    category: 'linker',
    compiler: 'gcc',
    regex: "multiple definition of\\s*[`']([^'`]+)[`']",
    extractors: { symbol: '$1' },
    description: 'Symbol defined multiple times',
    commonCauses: [
      'Function defined in header without inline',
      'Global variable defined in header',
      'Same file compiled/linked twice',
    ],
    fixes: [
      {
        id: 'make-inline',
        description: 'Make function inline',
        type: 'file_edit',
        steps: [
          'Add inline keyword to ${symbol} if defined in header',
          'Or move definition to single .cpp file',
        ],
        appliedCount: 0,
        successCount: 0,
      },
      {
        id: 'extern-variable',
        description: 'Use extern for global variable',
        type: 'file_edit',
        steps: [
          'Header: extern Type ${symbol};',
          'Single .cpp: Type ${symbol} = value;',
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
    id: 'gcc-library-not-found',
    category: 'linker',
    compiler: 'gcc',
    regex: 'cannot find -l([a-zA-Z0-9_-]+)',
    extractors: { library: '$1' },
    description: 'Library not found',
    commonCauses: [
      'Library not installed',
      'Library path not in search path',
      'Wrong library name',
    ],
    fixes: [
      {
        id: 'install-library',
        description: 'Install the library',
        type: 'dependency',
        steps: [
          'Install lib${library}-dev package (Debian/Ubuntu)',
          'Or ${library}-devel (Fedora/RHEL)',
          'Or use vcpkg: vcpkg install ${library}',
        ],
        appliedCount: 0,
        successCount: 0,
      },
      {
        id: 'add-library-path',
        description: 'Add library search path',
        type: 'cmake_change',
        steps: [
          'Use target_link_directories() or link_directories()',
          'Or set CMAKE_LIBRARY_PATH',
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
    id: 'ld-file-not-recognized',
    category: 'linker',
    compiler: 'gcc',
    regex: '([^:]+):\\s*file not recognized:\\s*(.+)',
    extractors: { file: '$1', reason: '$2' },
    description: 'Linker cannot recognize file format',
    commonCauses: [
      'Trying to link incompatible object file',
      'Object file corrupted or truncated',
      'Wrong architecture (32 vs 64 bit)',
    ],
    fixes: [
      {
        id: 'rebuild-object',
        description: 'Rebuild the object file',
        type: 'manual',
        steps: [
          'Delete ${file} and rebuild',
          'Ensure consistent compiler flags',
          'Check architecture matches (-m32/-m64)',
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
    id: 'gcc-vtable-undefined',
    category: 'linker',
    compiler: 'gcc',
    regex: "undefined reference to\\s*[`']vtable for ([^'`]+)[`']",
    extractors: { class: '$1' },
    description: 'Vtable undefined - virtual function not implemented',
    commonCauses: [
      'Pure virtual function not implemented in derived class',
      'Virtual destructor declared but not defined',
      'First virtual function not defined',
    ],
    fixes: [
      {
        id: 'implement-virtual',
        description: 'Implement virtual functions',
        type: 'file_edit',
        steps: [
          'Check ${class} for virtual functions without definitions',
          'Implement all pure virtual functions from base class',
          'Ensure virtual destructor is defined (not just declared)',
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
    id: 'gcc-typeinfo-undefined',
    category: 'linker',
    compiler: 'gcc',
    regex: "undefined reference to\\s*[`']typeinfo for ([^'`]+)[`']",
    extractors: { class: '$1' },
    description: 'Typeinfo undefined - RTTI issue',
    commonCauses: [
      'Class has virtual functions but no defined virtual destructor',
      'Mixing RTTI enabled/disabled code',
      'Library compiled without RTTI',
    ],
    fixes: [
      {
        id: 'define-destructor',
        description: 'Define virtual destructor',
        type: 'file_edit',
        steps: [
          'Add virtual ~${class}() = default; in header',
          'Or define destructor in .cpp file',
        ],
        appliedCount: 0,
        successCount: 0,
      },
      {
        id: 'enable-rtti',
        description: 'Enable RTTI consistently',
        type: 'cmake_change',
        steps: [
          'Ensure -fno-rtti is not set, or is set consistently',
          'All linked code must use same RTTI setting',
        ],
        appliedCount: 0,
        successCount: 0,
      },
    ],
    occurrences: 0,
    lastSeen: '',
    successRate: 0,
  },

  // ============================================================================
  // Common Build System Errors
  // ============================================================================
  {
    id: 'ninja-build-stopped',
    category: 'runtime',
    regex: 'ninja: build stopped:\\s*(\\d+)\\s*(?:target|targets)',
    extractors: { targets: '$1' },
    description: 'Ninja build stopped due to errors',
    commonCauses: [
      'Compilation errors in one or more targets',
      'Dependency resolution failed',
    ],
    fixes: [
      {
        id: 'fix-errors-above',
        description: 'Fix compilation errors listed above',
        type: 'manual',
        steps: [
          'Look at error messages above this line',
          'Fix each compilation/linking error',
          'Re-run build',
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
    id: 'make-error-target',
    category: 'runtime',
    regex: "make(?:\\[\\d+\\])?:\\s*\\*\\*\\*\\s*\\[([^\\]]+)\\]\\s*Error\\s*(\\d+)",
    extractors: { target: '$1', code: '$2' },
    description: 'Make target failed with error',
    commonCauses: [
      'Command in recipe failed',
      'Compilation or linking error',
    ],
    fixes: [
      {
        id: 'check-recipe',
        description: 'Check the failed command',
        type: 'manual',
        steps: [
          'Look at the command that failed for target ${target}',
          'Error code ${code} from the command',
          'Fix the underlying issue',
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

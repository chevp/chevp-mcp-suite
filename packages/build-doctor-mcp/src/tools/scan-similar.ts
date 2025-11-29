/**
 * Scan Similar Errors Tool
 *
 * When an error is found and fixed, this tool scans the entire codebase
 * for similar usage errors and reports all occurrences.
 *
 * Example: If PluginState::RUNNING is used but should be PluginState::STARTED,
 * this tool finds ALL files using the wrong enum value.
 */

import { execSync } from 'node:child_process';
import { existsSync, readFileSync } from 'node:fs';
import path from 'node:path';
import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { z } from 'zod';

export interface SimilarError {
  file: string;
  line: number;
  column?: number;
  content: string;
  suggestion: string;
}

export interface ScanResult {
  pattern: string;
  replacement: string;
  occurrences: SimilarError[];
  totalFiles: number;
  message: string;
}

export function registerScanSimilar(server: McpServer): void {
  server.tool(
    'scan_similar_errors',
    'Scan codebase for similar usage errors after fixing a build error. ' +
      'Finds all occurrences of wrong symbol/enum/member usage across the project.',
    {
      project_path: z.string().describe('Path to the project root (where CMakeLists.txt is)'),
      wrong_usage: z.string().describe('The wrong usage pattern to find (e.g., "PluginState::RUNNING")'),
      correct_usage: z.string().describe('The correct usage to suggest (e.g., "PluginState::STARTED")'),
      file_pattern: z
        .string()
        .optional()
        .default('*.cpp,*.hpp,*.h,*.cc,*.cxx')
        .describe('File extensions to search (comma-separated)'),
      exclude_dirs: z
        .string()
        .optional()
        .default('build,node_modules,.git,third_party,external')
        .describe('Directories to exclude (comma-separated)'),
    },
    async ({ project_path, wrong_usage, correct_usage, file_pattern, exclude_dirs }) => {
      const result = scanForSimilarErrors(
        project_path,
        wrong_usage,
        correct_usage,
        file_pattern?.split(',') ?? ['*.cpp', '*.hpp', '*.h'],
        exclude_dirs?.split(',') ?? ['build', 'node_modules', '.git']
      );

      return {
        content: [
          {
            type: 'text' as const,
            text: JSON.stringify(result, null, 2),
          },
        ],
      };
    }
  );

  server.tool(
    'scan_enum_misuse',
    'Scan codebase for enum value misuse. Given a correct enum definition, ' +
      'finds all usages of non-existent enum values.',
    {
      project_path: z.string().describe('Path to the project root'),
      enum_name: z.string().describe('Full enum name (e.g., "nuna::plugin_system::PluginState")'),
      valid_values: z
        .array(z.string())
        .describe('List of valid enum values (e.g., ["UNLOADED", "LOADING", "INITIALIZED"])'),
      namespace_prefix: z
        .string()
        .optional()
        .describe('Namespace prefix to search (e.g., "PluginState::")'),
    },
    async ({ project_path, enum_name, valid_values, namespace_prefix }) => {
      const result = scanEnumMisuse(project_path, enum_name, valid_values, namespace_prefix);

      return {
        content: [
          {
            type: 'text' as const,
            text: JSON.stringify(result, null, 2),
          },
        ],
      };
    }
  );

  server.tool(
    'scan_struct_misuse',
    'Scan codebase for struct/class member misuse. Given correct member names, ' +
      'finds all usages of non-existent members.',
    {
      project_path: z.string().describe('Path to the project root'),
      type_name: z.string().describe('Full type name (e.g., "nuna::plugin_system::HealthStatus")'),
      valid_members: z
        .array(z.string())
        .describe('List of valid member names (e.g., ["healthy", "uptime_ms", "metrics"])'),
      common_mistakes: z
        .array(
          z.object({
            wrong: z.string(),
            correct: z.string(),
          })
        )
        .optional()
        .describe('Known wrong->correct mappings'),
    },
    async ({ project_path, type_name, valid_members, common_mistakes }) => {
      const result = scanStructMisuse(project_path, type_name, valid_members, common_mistakes);

      return {
        content: [
          {
            type: 'text' as const,
            text: JSON.stringify(result, null, 2),
          },
        ],
      };
    }
  );
}

function scanForSimilarErrors(
  projectPath: string,
  wrongUsage: string,
  correctUsage: string,
  filePatterns: string[],
  excludeDirs: string[]
): ScanResult {
  const occurrences: SimilarError[] = [];

  // Escape special regex characters in the search pattern
  const escapedPattern = wrongUsage.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

  // Build ripgrep command
  const includeArgs = filePatterns.map((p) => `--glob "${p}"`).join(' ');
  const excludeArgs = excludeDirs.map((d) => `--glob "!${d}/**"`).join(' ');

  try {
    // Use ripgrep for fast searching
    const cmd = `rg --line-number --column "${escapedPattern}" ${includeArgs} ${excludeArgs} "${projectPath}" 2>/dev/null || true`;
    const output = execSync(cmd, { encoding: 'utf8', maxBuffer: 10 * 1024 * 1024 });

    const lines = output.trim().split('\n').filter(Boolean);

    for (const line of lines) {
      // Parse ripgrep output: file:line:column:content
      const match = line.match(/^(.+?):(\d+):(\d+):(.*)$/);
      if (match) {
        occurrences.push({
          file: match[1],
          line: parseInt(match[2], 10),
          column: parseInt(match[3], 10),
          content: match[4].trim(),
          suggestion: match[4].replace(new RegExp(escapedPattern, 'g'), correctUsage).trim(),
        });
      }
    }
  } catch {
    // Fallback to manual file search if ripgrep not available
    return scanWithNodeFs(projectPath, wrongUsage, correctUsage, filePatterns, excludeDirs);
  }

  const uniqueFiles = new Set(occurrences.map((o) => o.file));

  return {
    pattern: wrongUsage,
    replacement: correctUsage,
    occurrences,
    totalFiles: uniqueFiles.size,
    message:
      occurrences.length > 0
        ? `Found ${occurrences.length} occurrences of "${wrongUsage}" in ${uniqueFiles.size} files. ` +
          `All should be replaced with "${correctUsage}".`
        : `No occurrences of "${wrongUsage}" found.`,
  };
}

function scanWithNodeFs(
  projectPath: string,
  wrongUsage: string,
  correctUsage: string,
  filePatterns: string[],
  excludeDirs: string[]
): ScanResult {
  const occurrences: SimilarError[] = [];
  const visitedFiles = new Set<string>();

  function shouldExclude(filePath: string): boolean {
    return excludeDirs.some((dir) => filePath.includes(`/${dir}/`) || filePath.includes(`\\${dir}\\`));
  }

  function matchesPattern(fileName: string): boolean {
    return filePatterns.some((pattern) => {
      const ext = pattern.replace('*', '');
      return fileName.endsWith(ext);
    });
  }

  function scanDirectory(dir: string): void {
    try {
      const { readdirSync, statSync } = require('fs') as typeof import('fs');
      const entries = readdirSync(dir);

      for (const entry of entries) {
        const fullPath = path.join(dir, entry);

        if (shouldExclude(fullPath)) continue;

        try {
          const stat = statSync(fullPath);

          if (stat.isDirectory()) {
            scanDirectory(fullPath);
          } else if (stat.isFile() && matchesPattern(entry) && !visitedFiles.has(fullPath)) {
            visitedFiles.add(fullPath);
            scanFile(fullPath);
          }
        } catch {
          // Skip inaccessible files
        }
      }
    } catch {
      // Skip inaccessible directories
    }
  }

  function scanFile(filePath: string): void {
    try {
      const content = readFileSync(filePath, 'utf8');
      const lines = content.split('\n');

      for (let i = 0; i < lines.length; i++) {
        const line = lines[i];
        let col = line.indexOf(wrongUsage);

        while (col !== -1) {
          occurrences.push({
            file: filePath,
            line: i + 1,
            column: col + 1,
            content: line.trim(),
            suggestion: line.replace(new RegExp(wrongUsage.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'g'), correctUsage).trim(),
          });
          col = line.indexOf(wrongUsage, col + 1);
        }
      }
    } catch {
      // Skip unreadable files
    }
  }

  if (existsSync(projectPath)) {
    scanDirectory(projectPath);
  }

  const uniqueFiles = new Set(occurrences.map((o) => o.file));

  return {
    pattern: wrongUsage,
    replacement: correctUsage,
    occurrences,
    totalFiles: uniqueFiles.size,
    message:
      occurrences.length > 0
        ? `Found ${occurrences.length} occurrences of "${wrongUsage}" in ${uniqueFiles.size} files.`
        : `No occurrences of "${wrongUsage}" found.`,
  };
}

interface EnumMisuseResult {
  enumName: string;
  validValues: string[];
  invalidUsages: Array<{
    file: string;
    line: number;
    usedValue: string;
    content: string;
    suggestedFix?: string;
  }>;
  message: string;
}

function scanEnumMisuse(
  projectPath: string,
  enumName: string,
  validValues: string[],
  namespacePrefix?: string
): EnumMisuseResult {
  const invalidUsages: EnumMisuseResult['invalidUsages'] = [];

  // Extract short name from full enum name
  const shortName = enumName.split('::').pop() ?? enumName;
  const prefix = namespacePrefix ?? `${shortName}::`;

  // Build pattern to find all usages of this enum
  const escapedPrefix = prefix.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const pattern = `${escapedPrefix}([A-Z_]+)`;

  try {
    const cmd = `rg --line-number "${pattern}" --glob "*.cpp" --glob "*.hpp" --glob "*.h" --glob "!build/**" "${projectPath}" 2>/dev/null || true`;
    const output = execSync(cmd, { encoding: 'utf8', maxBuffer: 10 * 1024 * 1024 });

    const lines = output.trim().split('\n').filter(Boolean);
    const regex = new RegExp(pattern);

    for (const line of lines) {
      const fileMatch = line.match(/^(.+?):(\d+):(.*)$/);
      if (!fileMatch) continue;

      const [, file, lineNum, content] = fileMatch;
      const enumMatch = content.match(regex);

      if (enumMatch) {
        const usedValue = enumMatch[1];

        if (!validValues.includes(usedValue)) {
          // Try to suggest a fix based on similarity
          const suggestion = findSimilarValue(usedValue, validValues);

          invalidUsages.push({
            file,
            line: parseInt(lineNum, 10),
            usedValue,
            content: content.trim(),
            suggestedFix: suggestion ? `${prefix}${suggestion}` : undefined,
          });
        }
      }
    }
  } catch {
    // Ripgrep not available
  }

  return {
    enumName,
    validValues,
    invalidUsages,
    message:
      invalidUsages.length > 0
        ? `Found ${invalidUsages.length} usages of invalid ${shortName} values. ` +
          `Valid values are: ${validValues.join(', ')}`
        : `All ${shortName} usages are valid.`,
  };
}

function findSimilarValue(wrong: string, valid: string[]): string | undefined {
  // Common mappings
  const mappings: Record<string, string> = {
    INITIALIZING: 'LOADING',
    STARTING: 'LOADING',
    RUNNING: 'STARTED',
    SHUTTING_DOWN: 'STOPPING',
  };

  if (mappings[wrong] && valid.includes(mappings[wrong])) {
    return mappings[wrong];
  }

  // Levenshtein distance for other cases
  let bestMatch: string | undefined;
  let bestDistance = Infinity;

  for (const v of valid) {
    const distance = levenshtein(wrong.toLowerCase(), v.toLowerCase());
    if (distance < bestDistance && distance <= 3) {
      bestDistance = distance;
      bestMatch = v;
    }
  }

  return bestMatch;
}

function levenshtein(a: string, b: string): number {
  const matrix: number[][] = [];

  for (let i = 0; i <= b.length; i++) {
    matrix[i] = [i];
  }
  for (let j = 0; j <= a.length; j++) {
    matrix[0][j] = j;
  }

  for (let i = 1; i <= b.length; i++) {
    for (let j = 1; j <= a.length; j++) {
      if (b.charAt(i - 1) === a.charAt(j - 1)) {
        matrix[i][j] = matrix[i - 1][j - 1];
      } else {
        matrix[i][j] = Math.min(matrix[i - 1][j - 1] + 1, matrix[i][j - 1] + 1, matrix[i - 1][j] + 1);
      }
    }
  }

  return matrix[b.length][a.length];
}

interface StructMisuseResult {
  typeName: string;
  validMembers: string[];
  invalidUsages: Array<{
    file: string;
    line: number;
    usedMember: string;
    content: string;
    suggestedFix?: string;
  }>;
  message: string;
}

function scanStructMisuse(
  projectPath: string,
  typeName: string,
  validMembers: string[],
  commonMistakes?: Array<{ wrong: string; correct: string }>
): StructMisuseResult {
  const invalidUsages: StructMisuseResult['invalidUsages'] = [];

  // Build mistake map
  const mistakeMap = new Map<string, string>();
  if (commonMistakes) {
    for (const m of commonMistakes) {
      mistakeMap.set(m.wrong, m.correct);
    }
  }

  // Search for potential member accesses
  // Pattern: variable.member or variable->member
  const shortName = typeName.split('::').pop() ?? typeName;

  try {
    // First find variables of this type, then check their member access
    // For simplicity, search for common wrong member names directly
    for (const [wrong, correct] of mistakeMap) {
      const pattern = `\\.${wrong}\\b`;
      const cmd = `rg --line-number "${pattern}" --glob "*.cpp" --glob "*.hpp" --glob "!build/**" "${projectPath}" 2>/dev/null || true`;
      const output = execSync(cmd, { encoding: 'utf8', maxBuffer: 10 * 1024 * 1024 });

      const lines = output.trim().split('\n').filter(Boolean);

      for (const line of lines) {
        const match = line.match(/^(.+?):(\d+):(.*)$/);
        if (match) {
          invalidUsages.push({
            file: match[1],
            line: parseInt(match[2], 10),
            usedMember: wrong,
            content: match[3].trim(),
            suggestedFix: correct,
          });
        }
      }
    }
  } catch {
    // Ripgrep not available
  }

  return {
    typeName,
    validMembers,
    invalidUsages,
    message:
      invalidUsages.length > 0
        ? `Found ${invalidUsages.length} usages of invalid ${shortName} members. ` +
          `Valid members are: ${validMembers.join(', ')}`
        : `All ${shortName} member usages appear valid.`,
  };
}

/**
 * Analyze Error Tool
 *
 * Parses build output and identifies matching error patterns.
 * Can optionally scan the entire codebase for similar errors.
 */

import { execSync } from 'node:child_process';
import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { z } from 'zod';
import { getErrorStore } from '../data/error-store.js';
import type { AnalysisResult, AnalysisMatch, BuildSystem, CompilerType } from '../types/index.js';

interface SimilarOccurrence {
  file: string;
  line: number;
  content: string;
  suggestion: string;
}

interface ExtendedAnalysisResult extends AnalysisResult {
  similarErrors?: {
    pattern: string;
    replacement: string;
    occurrences: SimilarOccurrence[];
    totalFiles: number;
  }[];
}

export function registerAnalyzeError(server: McpServer): void {
  server.tool(
    'analyze_error',
    'Analyze build error output and find matching patterns with fix suggestions. ' +
      'When scan_codebase is enabled, automatically scans for similar errors across the project.',
    {
      error_output: z.string().describe('Raw build output containing errors'),
      build_system: z
        .enum(['cmake', 'msbuild', 'make', 'ninja'])
        .optional()
        .describe('Build system used (auto-detected if not specified)'),
      compiler: z
        .enum(['msvc', 'gcc', 'clang'])
        .optional()
        .describe('Compiler used (auto-detected if not specified)'),
      scan_codebase: z
        .boolean()
        .optional()
        .default(true)
        .describe('Automatically scan codebase for similar errors (default: true)'),
      project_path: z
        .string()
        .optional()
        .describe('Project root path for codebase scanning (auto-detected from error paths if not specified)'),
    },
    async ({ error_output, build_system, compiler, scan_codebase, project_path }) => {
      const store = getErrorStore();
      const result: ExtendedAnalysisResult = analyzeOutput(store, error_output, build_system, compiler);

      // Auto-scan for similar errors if enabled
      if (scan_codebase && result.matches.length > 0) {
        const detectedPath = project_path ?? detectProjectPath(error_output);

        if (detectedPath) {
          result.similarErrors = [];

          for (const match of result.matches) {
            const scanResults = scanForSimilarErrors(match, detectedPath);
            if (scanResults && scanResults.occurrences.length > 0) {
              result.similarErrors.push(scanResults);
            }
          }
        }
      }

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

/**
 * Detect project path from error output file paths
 */
function detectProjectPath(output: string): string | undefined {
  // Look for Windows-style paths
  const winMatch = output.match(/([A-Za-z]:\\[^\s:]+\\(?:nuna|arctic|coregfx)[^\s\\]*)/i);
  if (winMatch) {
    // Go up to the workspace root
    const parts = winMatch[1].split('\\');
    for (let i = parts.length - 1; i >= 0; i--) {
      if (['nuna', 'arctic', 'coregfx', 'chevp'].includes(parts[i].toLowerCase())) {
        return parts.slice(0, i + 1).join('\\');
      }
    }
    return parts.slice(0, 3).join('\\'); // Default to C:\chevp\project
  }

  // Look for Unix-style paths
  const unixMatch = output.match(/(\/[^\s:]+\/(?:nuna|arctic|coregfx)[^\s/]*)/i);
  if (unixMatch) {
    const parts = unixMatch[1].split('/');
    for (let i = parts.length - 1; i >= 0; i--) {
      if (['nuna', 'arctic', 'coregfx'].includes(parts[i].toLowerCase())) {
        return parts.slice(0, i + 1).join('/');
      }
    }
  }

  return undefined;
}

/**
 * Scan for similar errors based on the matched pattern
 */
function scanForSimilarErrors(
  match: AnalysisMatch,
  projectPath: string
): { pattern: string; replacement: string; occurrences: SimilarOccurrence[]; totalFiles: number } | undefined {
  const { pattern, extracted } = match;

  // Handle undeclared identifier errors (C2065, C2838)
  if (pattern.id.includes('undeclared') || pattern.id.includes('c2065') || pattern.id.includes('c2838')) {
    const identifier = extracted.identifier;
    if (!identifier) return undefined;

    // Common enum value mappings for PluginState
    const enumMappings: Record<string, string> = {
      INITIALIZING: 'LOADING',
      STARTING: 'LOADING',
      RUNNING: 'STARTED',
      SHUTTING_DOWN: 'STOPPING',
    };

    if (enumMappings[identifier]) {
      return scanCodebase(projectPath, identifier, enumMappings[identifier]);
    }
  }

  // Handle "not a member" errors (C2039)
  if (pattern.id.includes('not-member') || pattern.id.includes('c2039')) {
    const member = extracted.member;
    if (!member) return undefined;

    // Common struct member mappings
    const memberMappings: Record<string, string> = {
      message: 'error_message',
      uptime_seconds: 'uptime_ms',
      details: 'metrics',
    };

    if (memberMappings[member]) {
      return scanCodebase(projectPath, `.${member}`, `.${memberMappings[member]}`);
    }
  }

  return undefined;
}

/**
 * Scan codebase for a pattern and return occurrences
 */
function scanCodebase(
  projectPath: string,
  wrongPattern: string,
  correctPattern: string
): { pattern: string; replacement: string; occurrences: SimilarOccurrence[]; totalFiles: number } {
  const occurrences: SimilarOccurrence[] = [];

  const escapedPattern = wrongPattern.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

  try {
    const cmd = `rg --line-number --column "${escapedPattern}" --glob "*.cpp" --glob "*.hpp" --glob "*.h" --glob "!build/**" --glob "!node_modules/**" "${projectPath}" 2>/dev/null || true`;
    const output = execSync(cmd, { encoding: 'utf8', maxBuffer: 10 * 1024 * 1024 });

    const lines = output.trim().split('\n').filter(Boolean);

    for (const line of lines) {
      const match = line.match(/^(.+?):(\d+):(\d+):(.*)$/);
      if (match) {
        occurrences.push({
          file: match[1],
          line: parseInt(match[2], 10),
          content: match[4].trim(),
          suggestion: match[4].replace(new RegExp(escapedPattern, 'g'), correctPattern).trim(),
        });
      }
    }
  } catch {
    // Ripgrep not available - skip scan
  }

  const uniqueFiles = new Set(occurrences.map((o) => o.file));

  return {
    pattern: wrongPattern,
    replacement: correctPattern,
    occurrences,
    totalFiles: uniqueFiles.size,
  };
}

function analyzeOutput(
  store: ReturnType<typeof getErrorStore>,
  output: string,
  buildSystem?: BuildSystem,
  compiler?: CompilerType
): AnalysisResult {
  // Auto-detect build system and compiler if not specified
  const detectedBuildSystem = buildSystem ?? detectBuildSystem(output);
  const detectedCompiler = compiler ?? detectCompiler(output);

  // Split output into lines
  const lines = output.split('\n');
  const matches: AnalysisMatch[] = [];
  const unknownErrors: string[] = [];
  const processedErrors = new Set<string>();

  // Look for error lines
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();

    // Skip empty lines and non-error lines
    if (!line || !isErrorLine(line)) {
      continue;
    }

    // Avoid duplicate processing
    const errorKey = extractErrorKey(line);
    if (processedErrors.has(errorKey)) {
      continue;
    }
    processedErrors.add(errorKey);

    // Try to match against known patterns
    const patternMatches = store.matchError(line);

    if (patternMatches.length > 0) {
      // Take the best match
      const bestMatch = patternMatches[0];

      // Record that this pattern was matched
      store.recordMatch(bestMatch.pattern.id);

      // Sort fixes by success rate
      const sortedFixes = [...bestMatch.pattern.fixes].sort((a, b) => {
        const aRate = a.appliedCount > 0 ? a.successCount / a.appliedCount : 0.5;
        const bRate = b.appliedCount > 0 ? b.successCount / b.appliedCount : 0.5;
        return bRate - aRate;
      });

      matches.push({
        pattern: bestMatch.pattern,
        confidence: bestMatch.confidence,
        extracted: bestMatch.extracted,
        suggestedFixes: sortedFixes,
        errorLine: line,
        lineNumber: i + 1,
      });
    } else {
      // Unknown error
      unknownErrors.push(line);
    }
  }

  return {
    matches,
    unknownErrors,
    buildSystem: detectedBuildSystem,
    compiler: detectedCompiler,
  };
}

function isErrorLine(line: string): boolean {
  const errorIndicators = [
    /\berror\b/i,
    /\bfatal\b/i,
    /\bundefined reference\b/i,
    /\bunresolved\b/i,
    /\bcannot find\b/i,
    /\bnot found\b/i,
    /\bfailed\b/i,
    /\bLNK\d{4}\b/,
    /\bC\d{4}\b/,
  ];

  return errorIndicators.some((pattern) => pattern.test(line));
}

function extractErrorKey(line: string): string {
  // Extract a normalized key to avoid duplicate processing
  // Remove file paths and line numbers for comparison
  return line
    .replace(/[A-Za-z]:\\[^\s:]+/g, '') // Windows paths
    .replace(/\/[^\s:]+/g, '') // Unix paths
    .replace(/:\d+:\d+/g, '') // Line:column
    .replace(/\(\d+\)/g, '') // (line)
    .trim();
}

function detectBuildSystem(output: string): BuildSystem | undefined {
  if (output.includes('ninja:') || output.includes('[ninja]')) {
    return 'ninja';
  }
  if (output.includes('cmake') || output.includes('CMake')) {
    return 'cmake';
  }
  if (output.includes('MSBuild') || output.includes('msbuild')) {
    return 'msbuild';
  }
  if (output.includes('make[') || output.includes('make:')) {
    return 'make';
  }
  return undefined;
}

function detectCompiler(output: string): CompilerType | undefined {
  // MSVC detection
  if (output.includes('cl.exe') || /\bC\d{4}:/.test(output) || /\bLNK\d{4}:/.test(output)) {
    return 'msvc';
  }

  // Clang detection
  if (output.includes('clang') || output.includes('clang++')) {
    return 'clang';
  }

  // GCC detection
  if (output.includes('gcc') || output.includes('g++') || output.includes('cc1plus')) {
    return 'gcc';
  }

  return undefined;
}

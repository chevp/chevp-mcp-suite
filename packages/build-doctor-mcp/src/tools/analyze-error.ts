/**
 * Analyze Error Tool
 *
 * Parses build output and identifies matching error patterns.
 */

import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { z } from 'zod';
import { getErrorStore } from '../data/error-store.js';
import type { AnalysisResult, AnalysisMatch, BuildSystem, CompilerType } from '../types/index.js';

export function registerAnalyzeError(server: McpServer): void {
  server.tool(
    'analyze_error',
    'Analyze build error output and find matching patterns with fix suggestions',
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
    },
    async ({ error_output, build_system, compiler }) => {
      const store = getErrorStore();
      const result = analyzeOutput(store, error_output, build_system, compiler);

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

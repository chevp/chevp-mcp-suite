/**
 * Run Build Tool
 *
 * Executes a build command and automatically analyzes any errors.
 */

import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { z } from 'zod';
import { spawn } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import { getErrorStore } from '../data/error-store.js';
import type { BuildResult, BuildSystem } from '../types/index.js';

export function registerRunBuild(server: McpServer): void {
  server.tool(
    'run_build',
    'Run build command and auto-analyze errors',
    {
      project_path: z.string().describe('Path to the project directory'),
      build_command: z
        .string()
        .optional()
        .describe('Build command to run (auto-detected if not specified)'),
      build_type: z
        .enum(['debug', 'release'])
        .default('debug')
        .describe('Build configuration'),
      timeout_ms: z
        .number()
        .default(300000)
        .describe('Build timeout in milliseconds (default: 5 minutes)'),
    },
    async ({ project_path, build_command, build_type, timeout_ms }) => {
      // Validate project path
      if (!fs.existsSync(project_path)) {
        return {
          content: [
            {
              type: 'text' as const,
              text: JSON.stringify({
                success: false,
                error: 'Project path does not exist',
                projectPath: project_path,
              }),
            },
          ],
        };
      }

      // Detect build system and command if not specified
      const detectedSystem = detectBuildSystem(project_path);
      const command =
        build_command ?? getDefaultBuildCommand(project_path, detectedSystem, build_type);

      if (!command) {
        return {
          content: [
            {
              type: 'text' as const,
              text: JSON.stringify({
                success: false,
                error: 'Could not determine build command',
                suggestion: 'Please specify build_command parameter',
                detectedSystem,
              }),
            },
          ],
        };
      }

      // Execute build
      const result = await executeBuild(project_path, command, timeout_ms);

      // Analyze errors if build failed
      if (!result.success && result.output) {
        const store = getErrorStore();
        const lines = result.output.split('\n');
        const errors: BuildResult['errors'] = [];
        let autoFixable = 0;

        for (let i = 0; i < lines.length; i++) {
          const line = lines[i].trim();

          // Check if this looks like an error line
          if (isErrorLine(line)) {
            const matches = store.matchError(line);

            if (matches.length > 0) {
              const bestMatch = matches[0];
              store.recordMatch(bestMatch.pattern.id);

              const bestFix =
                bestMatch.pattern.fixes.length > 0 ? bestMatch.pattern.fixes[0] : undefined;

              if (bestFix?.autoFix) {
                autoFixable++;
              }

              errors.push({
                line: i + 1,
                message: line,
                matchedPattern: bestMatch.pattern,
                suggestedFix: bestFix,
              });
            } else {
              errors.push({
                line: i + 1,
                message: line,
              });
            }
          }
        }

        result.errors = errors;
        result.autoFixable = autoFixable;
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

function detectBuildSystem(projectPath: string): BuildSystem | null {
  // Check for CMake
  if (
    fs.existsSync(path.join(projectPath, 'CMakeLists.txt')) ||
    fs.existsSync(path.join(projectPath, 'build', 'CMakeCache.txt'))
  ) {
    return 'cmake';
  }

  // Check for Ninja
  if (fs.existsSync(path.join(projectPath, 'build.ninja'))) {
    return 'ninja';
  }

  // Check for Makefile
  if (fs.existsSync(path.join(projectPath, 'Makefile'))) {
    return 'make';
  }

  // Check for MSBuild
  const files = fs.readdirSync(projectPath);
  if (files.some((f) => f.endsWith('.sln') || f.endsWith('.vcxproj'))) {
    return 'msbuild';
  }

  return null;
}

function getDefaultBuildCommand(
  projectPath: string,
  buildSystem: BuildSystem | null,
  buildType: string
): string | null {
  const buildDir = path.join(projectPath, 'build');
  const config = buildType === 'release' ? 'Release' : 'Debug';

  switch (buildSystem) {
    case 'cmake':
      // Check if already configured
      if (fs.existsSync(path.join(buildDir, 'CMakeCache.txt'))) {
        return `cmake --build "${buildDir}" --config ${config}`;
      }
      // Need to configure first
      return `cmake -B "${buildDir}" -DCMAKE_BUILD_TYPE=${config} && cmake --build "${buildDir}" --config ${config}`;

    case 'ninja':
      return 'ninja';

    case 'make':
      return 'make';

    case 'msbuild': {
      // Find solution file
      const files = fs.readdirSync(projectPath);
      const sln = files.find((f) => f.endsWith('.sln'));
      if (sln) {
        return `msbuild "${path.join(projectPath, sln)}" /p:Configuration=${config}`;
      }
      return null;
    }

    default:
      return null;
  }
}

function isErrorLine(line: string): boolean {
  const errorIndicators = [
    /\berror\b/i,
    /\bfatal\b/i,
    /\bundefined reference\b/i,
    /\bunresolved\b/i,
    /\bLNK\d{4}\b/,
    /\bC\d{4}\b/,
  ];

  return errorIndicators.some((pattern) => pattern.test(line));
}

async function executeBuild(
  projectPath: string,
  command: string,
  timeoutMs: number
): Promise<BuildResult> {
  const startTime = Date.now();

  return new Promise((resolve) => {
    // Determine shell based on platform
    const isWindows = process.platform === 'win32';
    const shell = isWindows ? 'cmd.exe' : '/bin/sh';
    const shellArgs = isWindows ? ['/c', command] : ['-c', command];

    const proc = spawn(shell, shellArgs, {
      cwd: projectPath,
      stdio: ['pipe', 'pipe', 'pipe'],
      env: { ...process.env },
    });

    let stdout = '';
    let stderr = '';

    proc.stdout.on('data', (data: Buffer) => {
      stdout += data.toString();
    });

    proc.stderr.on('data', (data: Buffer) => {
      stderr += data.toString();
    });

    // Set timeout
    const timeout = setTimeout(() => {
      proc.kill('SIGKILL');
      resolve({
        success: false,
        output: stdout + '\n' + stderr + '\n[BUILD TIMEOUT]',
        exitCode: -1,
        autoFixable: 0,
        durationMs: Date.now() - startTime,
      });
    }, timeoutMs);

    proc.on('close', (code) => {
      clearTimeout(timeout);

      const output = stdout + (stderr ? '\n' + stderr : '');

      resolve({
        success: code === 0,
        output,
        exitCode: code ?? -1,
        autoFixable: 0,
        durationMs: Date.now() - startTime,
      });
    });

    proc.on('error', (err) => {
      clearTimeout(timeout);

      resolve({
        success: false,
        output: `Failed to start build: ${err.message}`,
        exitCode: -1,
        autoFixable: 0,
        durationMs: Date.now() - startTime,
      });
    });
  });
}

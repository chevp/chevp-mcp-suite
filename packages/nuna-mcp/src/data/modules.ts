import type { NunaModule } from '../types/module.js';

export const modules: Record<string, NunaModule> = {
  'nuna-core': {
    name: 'nuna-core',
    description: 'Core functionality and base types for the Nuna SDK',
    category: 'core',
    api: {
      classes: [
        {
          name: 'NunaApplication',
          description: 'Main application class for Nuna-based applications',
          methods: [
            {
              name: 'initialize',
              description: 'Initializes the Nuna application with configuration',
              signature: 'initialize(config: NunaConfig): Promise<void>',
              parameters: [
                { name: 'config', type: 'NunaConfig', description: 'Application configuration object' }
              ],
              returnType: 'Promise<void>'
            },
            {
              name: 'run',
              description: 'Starts the main application loop',
              signature: 'run(): void',
              returnType: 'void'
            },
            {
              name: 'shutdown',
              description: 'Gracefully shuts down the application',
              signature: 'shutdown(): Promise<void>',
              returnType: 'Promise<void>'
            }
          ],
          properties: [
            { name: 'isRunning', type: 'boolean', description: 'Indicates if the application is currently running', readonly: true },
            { name: 'version', type: 'string', description: 'Current version of the Nuna SDK', readonly: true }
          ]
        }
      ],
      types: [
        {
          name: 'NunaConfig',
          description: 'Configuration options for NunaApplication',
          definition: `interface NunaConfig {
  appName: string;
  version?: string;
  debug?: boolean;
  plugins?: PluginConfig[];
}`
        }
      ]
    },
    examples: [
      `// Initialize a Nuna application
import { NunaApplication } from 'nuna-core';

const app = new NunaApplication();
await app.initialize({
  appName: 'MyApp',
  debug: true
});
app.run();`
    ]
  },

  'nuna-plugin-system': {
    name: 'nuna-plugin-system',
    description: 'Plugin architecture and lifecycle management for Nuna',
    category: 'core',
    api: {
      classes: [
        {
          name: 'PluginManager',
          description: 'Manages plugin lifecycle and dependencies',
          methods: [
            {
              name: 'register',
              description: 'Registers a new plugin',
              signature: 'register(plugin: Plugin): void',
              parameters: [
                { name: 'plugin', type: 'Plugin', description: 'Plugin instance to register' }
              ],
              returnType: 'void'
            },
            {
              name: 'load',
              description: 'Loads all registered plugins',
              signature: 'load(): Promise<void>',
              returnType: 'Promise<void>'
            },
            {
              name: 'unload',
              description: 'Unloads a specific plugin',
              signature: 'unload(pluginId: string): Promise<void>',
              parameters: [
                { name: 'pluginId', type: 'string', description: 'Unique identifier of the plugin' }
              ],
              returnType: 'Promise<void>'
            }
          ]
        },
        {
          name: 'Plugin',
          description: 'Base class for creating Nuna plugins',
          methods: [
            {
              name: 'onLoad',
              description: 'Called when the plugin is loaded',
              signature: 'onLoad(): Promise<void>',
              returnType: 'Promise<void>'
            },
            {
              name: 'onUnload',
              description: 'Called when the plugin is unloaded',
              signature: 'onUnload(): Promise<void>',
              returnType: 'Promise<void>'
            }
          ],
          properties: [
            { name: 'id', type: 'string', description: 'Unique plugin identifier', readonly: true },
            { name: 'name', type: 'string', description: 'Human-readable plugin name', readonly: true },
            { name: 'version', type: 'string', description: 'Plugin version', readonly: true }
          ]
        }
      ]
    },
    examples: [
      `// Create a custom plugin
import { Plugin } from 'nuna-plugin-system';

class MyPlugin extends Plugin {
  readonly id = 'my-plugin';
  readonly name = 'My Custom Plugin';
  readonly version = '1.0.0';

  async onLoad(): Promise<void> {
    console.log('Plugin loaded!');
  }

  async onUnload(): Promise<void> {
    console.log('Plugin unloaded!');
  }
}`
    ]
  },

  'nuna-events': {
    name: 'nuna-events',
    description: 'Event system for inter-module communication',
    category: 'core',
    api: {
      classes: [
        {
          name: 'EventEmitter',
          description: 'Type-safe event emitter for Nuna applications',
          methods: [
            {
              name: 'on',
              description: 'Subscribe to an event',
              signature: 'on<T>(event: string, handler: EventHandler<T>): Unsubscribe',
              parameters: [
                { name: 'event', type: 'string', description: 'Event name' },
                { name: 'handler', type: 'EventHandler<T>', description: 'Handler function' }
              ],
              returnType: 'Unsubscribe'
            },
            {
              name: 'emit',
              description: 'Emit an event',
              signature: 'emit<T>(event: string, data: T): void',
              parameters: [
                { name: 'event', type: 'string', description: 'Event name' },
                { name: 'data', type: 'T', description: 'Event payload' }
              ],
              returnType: 'void'
            },
            {
              name: 'once',
              description: 'Subscribe to an event once',
              signature: 'once<T>(event: string, handler: EventHandler<T>): Unsubscribe',
              returnType: 'Unsubscribe'
            }
          ]
        }
      ],
      types: [
        {
          name: 'EventHandler',
          description: 'Event handler function type',
          definition: 'type EventHandler<T> = (data: T) => void | Promise<void>;'
        },
        {
          name: 'Unsubscribe',
          description: 'Function to unsubscribe from an event',
          definition: 'type Unsubscribe = () => void;'
        }
      ]
    },
    examples: [
      `// Using the event system
import { EventEmitter } from 'nuna-events';

const emitter = new EventEmitter();

const unsubscribe = emitter.on<{ message: string }>('notification', (data) => {
  console.log(data.message);
});

emitter.emit('notification', { message: 'Hello!' });
unsubscribe();`
    ]
  },

  'nuna-logging': {
    name: 'nuna-logging',
    description: 'Structured logging for Nuna applications',
    category: 'utility',
    api: {
      classes: [
        {
          name: 'Logger',
          description: 'Configurable logger with multiple output targets',
          methods: [
            {
              name: 'info',
              description: 'Log an info message',
              signature: 'info(message: string, ...args: unknown[]): void',
              returnType: 'void'
            },
            {
              name: 'warn',
              description: 'Log a warning message',
              signature: 'warn(message: string, ...args: unknown[]): void',
              returnType: 'void'
            },
            {
              name: 'error',
              description: 'Log an error message',
              signature: 'error(message: string, ...args: unknown[]): void',
              returnType: 'void'
            },
            {
              name: 'debug',
              description: 'Log a debug message',
              signature: 'debug(message: string, ...args: unknown[]): void',
              returnType: 'void'
            }
          ]
        }
      ],
      functions: [
        {
          name: 'createLogger',
          description: 'Create a new logger instance',
          signature: 'createLogger(name: string, options?: LoggerOptions): Logger',
          parameters: [
            { name: 'name', type: 'string', description: 'Logger name/context' },
            { name: 'options', type: 'LoggerOptions', description: 'Logger configuration', optional: true }
          ],
          returnType: 'Logger'
        }
      ]
    },
    examples: [
      `// Create and use a logger
import { createLogger } from 'nuna-logging';

const logger = createLogger('MyModule', { level: 'debug' });
logger.info('Application started');
logger.debug('Debug info', { userId: 123 });`
    ]
  },

  'nuna-config': {
    name: 'nuna-config',
    description: 'Configuration management with validation and hot-reload',
    category: 'utility',
    api: {
      classes: [
        {
          name: 'ConfigManager',
          description: 'Manages application configuration with schema validation',
          methods: [
            {
              name: 'load',
              description: 'Load configuration from file or environment',
              signature: 'load<T>(schema: Schema<T>): T',
              returnType: 'T'
            },
            {
              name: 'get',
              description: 'Get a configuration value by path',
              signature: 'get<T>(path: string, defaultValue?: T): T',
              returnType: 'T'
            },
            {
              name: 'watch',
              description: 'Watch for configuration changes',
              signature: 'watch(callback: (config: unknown) => void): Unsubscribe',
              returnType: 'Unsubscribe'
            }
          ]
        }
      ]
    },
    examples: [
      `// Load and use configuration
import { ConfigManager } from 'nuna-config';
import { z } from 'zod';

const schema = z.object({
  port: z.number().default(3000),
  database: z.object({
    host: z.string(),
    port: z.number()
  })
});

const config = new ConfigManager();
const appConfig = config.load(schema);
console.log(appConfig.port);`
    ]
  }
};

export function getModule(name: string): NunaModule | undefined {
  return modules[name];
}

export function getAllModules(): NunaModule[] {
  return Object.values(modules);
}

export function searchModules(query: string): NunaModule[] {
  const lowerQuery = query.toLowerCase();
  return getAllModules().filter(
    (mod) =>
      mod.name.toLowerCase().includes(lowerQuery) ||
      mod.description.toLowerCase().includes(lowerQuery) ||
      mod.category.toLowerCase().includes(lowerQuery)
  );
}

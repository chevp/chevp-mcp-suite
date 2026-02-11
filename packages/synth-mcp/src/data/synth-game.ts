/**
 * Synth Game - Live XML Scanner
 *
 * Reads synth-game XML files from the filesystem to provide
 * AI-assisted debugging and validation for scene/component definitions.
 */

import fs from 'node:fs';
import path from 'node:path';

const ASSETS_ROOT = 'c:/chevp/synth/synth-playground/synth-game/assets/src';

// ── Types ──

export interface SynthScene {
  id: string;
  file: string;
  name: string;
  description: string;
  entityCount: number;
  entities: SynthEntity[];
}

export interface SynthComponent {
  id: string;
  file: string;
  name: string;
  type: string;
  meshRef: string;
  properties: Record<string, string>;
}

export interface SynthRoute {
  id: string;
  path: string;
  isDefault: boolean;
  sceneRef: string;
  spawnPoints: { id: string; x: string; y: string; z: string }[];
}

export interface SynthEntity {
  id: string;
  name: string;
  componentRef: string;
  position: { x: string; y: string; z: string } | null;
  meshRef: string;
  hasLight: boolean;
  properties: Record<string, string>;
}

export interface ValidationIssue {
  severity: 'error' | 'warning';
  file: string;
  message: string;
  entityId?: string;
}

// ── XML Parsing Helpers (regex-based, no dependency) ──

function readXml(filePath: string): string | null {
  const fullPath = path.isAbsolute(filePath) ? filePath : path.join(ASSETS_ROOT, filePath);
  try {
    return fs.readFileSync(fullPath, 'utf8');
  } catch {
    return null;
  }
}

function attr(xml: string, tag: string, name: string): string {
  const tagMatch = xml.match(new RegExp(`<${tag}[^>]*>`));
  if (!tagMatch) return '';
  const attrMatch = tagMatch[0].match(new RegExp(`${name}="([^"]*)"`));
  return attrMatch ? attrMatch[1] : '';
}

function innerText(xml: string, tag: string): string {
  const match = xml.match(new RegExp(`<${tag}[^>]*>([^<]*)</${tag}>`));
  return match ? match[1].trim() : '';
}

function findAll(xml: string, tag: string): string[] {
  const results: string[] = [];
  const regex = new RegExp(`<${tag}\\b[^>]*(?:/>|>[\\s\\S]*?</${tag}>)`, 'g');
  let match;
  while ((match = regex.exec(xml)) !== null) {
    results.push(match[0]);
  }
  return results;
}

function attrFrom(fragment: string, name: string): string {
  const match = fragment.match(new RegExp(`${name}="([^"]*)"`));
  return match ? match[1] : '';
}

// ── Data Access Functions ──

export function getScenes(): SynthScene[] {
  const scenes: SynthScene[] = [];
  const scenesDir = path.join(ASSETS_ROOT, 'scenes');

  if (!fs.existsSync(scenesDir)) return scenes;

  for (const dir of fs.readdirSync(scenesDir)) {
    const sceneFile = path.join(scenesDir, dir, 'scene.synth.xml');
    const xml = readXml(sceneFile);
    if (!xml) continue;

    const entities = parseEntities(xml);

    scenes.push({
      id: attr(xml, 'synthScene', 'id'),
      file: `scenes/${dir}/scene.synth.xml`,
      name: innerText(xml, 'name'),
      description: innerText(xml, 'description'),
      entityCount: entities.length,
      entities,
    });
  }

  return scenes;
}

export function getScene(sceneId: string): SynthScene | undefined {
  return getScenes().find((s) => s.id === sceneId);
}

export function getComponents(): SynthComponent[] {
  const components: SynthComponent[] = [];
  const compDir = path.join(ASSETS_ROOT, 'components');

  if (!fs.existsSync(compDir)) return components;

  walkDir(compDir, (filePath) => {
    if (!filePath.endsWith('.synth.xml')) return;
    const xml = readXml(filePath);
    if (!xml || !xml.includes('<synthComponent')) return;

    const props: Record<string, string> = {};
    for (const propXml of findAll(xml, 'property')) {
      const name = attrFrom(propXml, 'name');
      const value = attrFrom(propXml, 'value');
      if (name) props[name] = value;
    }

    const relativePath = path.relative(ASSETS_ROOT, filePath).replace(/\\/g, '/');

    components.push({
      id: attr(xml, 'synthComponent', 'id'),
      file: relativePath,
      name: innerText(xml, 'name'),
      type: innerText(xml, 'type'),
      meshRef: attrFrom(findAll(xml, 'mesh')[0] || '', 'ref'),
      properties: props,
    });
  });

  return components;
}

export function getComponent(componentId: string): SynthComponent | undefined {
  return getComponents().find((c) => c.id === componentId);
}

export function getRoutes(): SynthRoute[] {
  const xml = readXml('routes.synth.xml');
  if (!xml) return [];

  const routes: SynthRoute[] = [];

  for (const routeXml of findAll(xml, 'route')) {
    const spawnPoints: SynthRoute['spawnPoints'] = [];
    for (const sp of findAll(routeXml, 'spawnPoint')) {
      spawnPoints.push({
        id: attrFrom(sp, 'id'),
        x: attrFrom(sp, 'x'),
        y: attrFrom(sp, 'y'),
        z: attrFrom(sp, 'z'),
      });
    }

    routes.push({
      id: attrFrom(routeXml, 'id'),
      path: attrFrom(routeXml, 'path'),
      isDefault: attrFrom(routeXml, 'default') === 'true',
      sceneRef: attrFrom(routeXml.match(/<scene[^>]*>/)?.[0] || '', 'ref'),
      spawnPoints,
    });
  }

  return routes;
}

export function validate(): ValidationIssue[] {
  const issues: ValidationIssue[] = [];
  const scenes = getScenes();
  const components = getComponents();
  const routes = getRoutes();

  const componentFiles = new Set(components.map((c) => c.file));
  const sceneIds = new Set(scenes.map((s) => s.id));

  // Check: Routes reference existing scenes
  for (const route of routes) {
    if (route.sceneRef) {
      const sceneDir = route.sceneRef.replace('/scene.synth.xml', '').split('/').pop();
      if (!sceneIds.has(route.id) && !scenes.some((s) => s.file === route.sceneRef)) {
        // Check if the file actually exists
        const fullPath = path.join(ASSETS_ROOT, route.sceneRef);
        if (!fs.existsSync(fullPath)) {
          issues.push({
            severity: 'error',
            file: 'routes.synth.xml',
            message: `Route "${route.id}" references non-existent scene file: ${route.sceneRef}`,
          });
        }
      }
    }

    // Check: At least one spawn point per route
    if (route.spawnPoints.length === 0) {
      issues.push({
        severity: 'warning',
        file: 'routes.synth.xml',
        message: `Route "${route.id}" has no spawn points defined`,
      });
    }
  }

  // Check: Exactly one default route
  const defaultRoutes = routes.filter((r) => r.isDefault);
  if (defaultRoutes.length === 0) {
    issues.push({
      severity: 'error',
      file: 'routes.synth.xml',
      message: 'No default route defined (need default="true" on one route)',
    });
  } else if (defaultRoutes.length > 1) {
    issues.push({
      severity: 'error',
      file: 'routes.synth.xml',
      message: `Multiple default routes: ${defaultRoutes.map((r) => r.id).join(', ')}`,
    });
  }

  // Check: Config default scene matches a route
  const configXml = readXml('config.synth.xml');
  if (configXml) {
    const defaultSceneId = innerText(configXml, 'defaultSceneId');
    if (defaultSceneId && !routes.some((r) => r.id === defaultSceneId)) {
      issues.push({
        severity: 'error',
        file: 'config.synth.xml',
        message: `defaultSceneId "${defaultSceneId}" does not match any route ID`,
      });
    }

    const defaultSpawn = innerText(configXml, 'defaultSpawnPoint');
    if (defaultSceneId && defaultSpawn) {
      const targetRoute = routes.find((r) => r.id === defaultSceneId);
      if (targetRoute && !targetRoute.spawnPoints.some((sp) => sp.id === defaultSpawn)) {
        issues.push({
          severity: 'error',
          file: 'config.synth.xml',
          message: `defaultSpawnPoint "${defaultSpawn}" not found in route "${defaultSceneId}"`,
        });
      }
    }
  }

  // Check: Entity component refs point to existing files
  for (const scene of scenes) {
    const seenIds = new Set<string>();

    for (const entity of scene.entities) {
      // Duplicate entity IDs
      if (seenIds.has(entity.id)) {
        issues.push({
          severity: 'error',
          file: scene.file,
          message: `Duplicate entity ID "${entity.id}"`,
          entityId: entity.id,
        });
      }
      seenIds.add(entity.id);

      // Component ref exists
      if (entity.componentRef) {
        if (!componentFiles.has(entity.componentRef)) {
          const fullPath = path.join(ASSETS_ROOT, entity.componentRef);
          if (!fs.existsSync(fullPath)) {
            issues.push({
              severity: 'error',
              file: scene.file,
              message: `Entity "${entity.id}" references missing component: ${entity.componentRef}`,
              entityId: entity.id,
            });
          }
        }
      }

      // Entity has no transform (warning) - skip lights and ambient elements
      if (!entity.position && !entity.meshRef && !entity.componentRef && !entity.hasLight) {
        issues.push({
          severity: 'warning',
          file: scene.file,
          message: `Entity "${entity.id}" has no transform, mesh, or component reference`,
          entityId: entity.id,
        });
      }
    }
  }

  // Check: Components reference mesh files
  for (const comp of components) {
    if (!comp.meshRef && comp.type !== 'ui') {
      issues.push({
        severity: 'warning',
        file: comp.file,
        message: `Component "${comp.id}" (type: ${comp.type}) has no mesh reference`,
      });
    }
  }

  // Check: Building components have required properties (skip base/abstract components)
  for (const comp of components) {
    if (comp.type === 'building' && comp.id !== 'shop-building') {
      if (!comp.properties['producerId']) {
        issues.push({
          severity: 'error',
          file: comp.file,
          message: `Building "${comp.id}" is missing required property "producerId"`,
        });
      }
      if (!comp.properties['targetRoute']) {
        issues.push({
          severity: 'warning',
          file: comp.file,
          message: `Building "${comp.id}" has no "targetRoute" property - players cannot enter`,
        });
      }
    }
  }

  // Check: ProducerIds are unique across buildings
  const producerIds = new Map<string, string>();
  for (const comp of components) {
    const pid = comp.properties['producerId'];
    if (pid && comp.type === 'building') {
      if (producerIds.has(pid)) {
        issues.push({
          severity: 'warning',
          file: comp.file,
          message: `producerId "${pid}" is also used by ${producerIds.get(pid)}`,
        });
      }
      producerIds.set(pid, comp.file);
    }
  }

  return issues;
}

// ── Helpers ──

function parseEntities(xml: string): SynthEntity[] {
  const entities: SynthEntity[] = [];

  for (const entityXml of findAll(xml, 'entity')) {
    // Skip nested entities within entities (only top-level)
    const id = attrFrom(entityXml, 'id');
    const name = attrFrom(entityXml, 'name');

    const compRefMatch = entityXml.match(/<component[^>]*ref="([^"]*)"/);
    const meshRefMatch = entityXml.match(/<mesh[^>]*ref="([^"]*)"/);

    const posMatch = entityXml.match(/<position[^>]*>/);
    const rotMatch = entityXml.match(/<rotation[^>]*>/);
    const hasTransform = entityXml.includes('<transform>');
    let position: SynthEntity['position'] = null;
    if (posMatch) {
      position = {
        x: attrFrom(posMatch[0], 'x'),
        y: attrFrom(posMatch[0], 'y'),
        z: attrFrom(posMatch[0], 'z'),
      };
    } else if (rotMatch && hasTransform) {
      // Entity has transform with rotation only (e.g. lights)
      position = { x: '0', y: '0', z: '0' };
    }

    const props: Record<string, string> = {};
    for (const propXml of findAll(entityXml, 'property')) {
      const pName = attrFrom(propXml, 'name');
      const pValue = attrFrom(propXml, 'value');
      if (pName) props[pName] = pValue;
    }

    const hasLight = /Light|<pointLight|<directionalLight|<ambientLight/.test(entityXml);

    entities.push({
      id,
      name,
      componentRef: compRefMatch ? compRefMatch[1] : '',
      position,
      meshRef: meshRefMatch ? meshRefMatch[1] : '',
      hasLight,
      properties: props,
    });
  }

  return entities;
}

function walkDir(dir: string, callback: (filePath: string) => void): void {
  if (!fs.existsSync(dir)) return;
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      walkDir(fullPath, callback);
    } else {
      callback(fullPath);
    }
  }
}

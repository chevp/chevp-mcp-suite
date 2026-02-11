/**
 * Synth SDK Build Information
 * Data for synth CLI build capabilities and runtime formats
 */

export interface BuildFormat {
  name: string;
  extension: string;
  description: string;
  useCase: string[];
  consumers: string[];
}

export interface DeploymentTarget {
  name: string;
  purpose: string;
  outputFormat: string[];
  includesAssets: boolean;
  useCase: string[];
}

export interface RuntimeFormat {
  format: string;
  fileExtension: string;
  description: string;
  consumers: string[];
  features: string[];
  example: string;
}

// =============================================================================
// SYNTH BUILD FORMATS
// =============================================================================

export const buildFormats: BuildFormat[] = [
  {
    name: 'XML',
    extension: '.synth.xml',
    description: 'Human-readable XML format for version control and debugging',
    useCase: [
      'Source files (development)',
      'Server deployment (Java Quarkus)',
      'Git versioning',
      'Debugging and inspection',
    ],
    consumers: ['Game Server (Java)', 'Developers', 'Claude AI'],
  },
  {
    name: 'SQLite',
    extension: '.synth.db',
    description: 'Binary database format optimized for runtime performance',
    useCase: [
      'Client deployment (C++ Vulkan)',
      'Production runtime',
      'Fast query access',
      'Framework editors',
    ],
    consumers: ['C++ Vulkan Client (arctic-renderer)', 'Desktop Apps', 'Framework Editors'],
  },
  {
    name: 'JSON Manifest',
    extension: 'manifest.json',
    description: 'Build metadata with asset registry and versioning',
    useCase: ['Build metadata', 'Asset registry', 'Version tracking', 'CI/CD pipelines'],
    consumers: ['Build tools', 'CI/CD', 'Asset managers'],
  },
];

// =============================================================================
// DEPLOYMENT TARGETS
// =============================================================================

export const deploymentTargets: DeploymentTarget[] = [
  {
    name: 'dist',
    purpose: 'Server-side deployment for backend services and game servers',
    outputFormat: ['XML', 'SQLite (optional)', 'JSON Manifest'],
    includesAssets: false,
    useCase: [
      'imkaluk-game-runtime (Java Quarkus)',
      'Backend services with asset streaming',
      'Development servers with hot-reload',
      'State machine initialization',
    ],
  },
  {
    name: 'release',
    purpose: 'Client-side deployment for desktop applications with bundled assets',
    outputFormat: ['SQLite', 'XML (fallback)', 'JSON Manifest', 'All Assets'],
    includesAssets: true,
    useCase: [
      'Desktop apps with arctic-renderer (C++ Vulkan)',
      'Offline-capable clients',
      'Distribution packages (installer, archive)',
      'Initial scene loading',
    ],
  },
];

// =============================================================================
// RUNTIME FORMATS
// =============================================================================

export const runtimeFormats: RuntimeFormat[] = [
  {
    format: 'SQLite Database',
    fileExtension: '.synth.db',
    description: 'Structured database with indexed queries for fast runtime access',
    consumers: ['C++ Vulkan Client (arctic-renderer)', 'frost-coregfx', 'Desktop Apps'],
    features: [
      'Indexed queries via SQL',
      'Fast entity lookup',
      'Embedded asset URIs',
      'Scene graph stored as BLOB',
      'No external dependencies',
    ],
    example: `
// C++ Client: Load scene from SQLite
#include <sqlite3.h>

sqlite3* db;
sqlite3_open("scene.synth.db", &db);

const char* sql = "SELECT xml_data FROM entities WHERE scene_id=?";
sqlite3_stmt* stmt;
sqlite3_prepare_v2(db, sql, -1, &stmt, nullptr);
sqlite3_bind_text(stmt, 1, "scene_outdoor", -1, SQLITE_STATIC);

while (sqlite3_step(stmt) == SQLITE_ROW) {
    const char* entityXml = (const char*)sqlite3_column_text(stmt, 0);
    // Parse entity XML and spawn in Vulkan scene
}
`,
  },
  {
    format: 'XML Document',
    fileExtension: '.synth.xml',
    description: 'Human-readable XML with full scene definition and entity components',
    consumers: [
      'Game Server (Java Quarkus)',
      'imkaluk-game-runtime',
      'State Machine Processor',
      'Developers',
    ],
    features: [
      'Human-readable for debugging',
      'XPath/XQuery support',
      'Git-diff friendly',
      'Direct DOM/SAX parsing',
      'Schema validation via XSD',
    ],
    example: `
// Java Server: Load XML scene
import javax.xml.parsers.DocumentBuilder;
import org.w3c.dom.*;

DocumentBuilder builder = DocumentBuilderFactory
    .newInstance()
    .newDocumentBuilder();
Document doc = builder.parse("scene.synth.xml");

NodeList entities = doc.getElementsByTagName("entity");
for (int i = 0; i < entities.getLength(); i++) {
    Element entity = (Element) entities.item(i);
    String entityId = entity.getAttribute("id");
    String entityType = entity.getAttribute("type");

    // Initialize state machine
    GameEntity gameEntity = new GameEntity(entityId, EntityType.valueOf(entityType));
    world.spawn(gameEntity);
}
`,
  },
];

// =============================================================================
// XML ENTITIES (synth-game)
// =============================================================================

export const xmlEntityInfo = {
  title: 'XML-Based Entities in synth-game',
  description:
    'synth-game uses XML-based entity definitions (no YAML transformation required)',
  features: [
    'Direct XML parsing in Java (DOM/JAXB)',
    'Direct XML parsing in C++ (pugixml/tinyxml)',
    'Schema validation via XSD',
    'XPath for selective queries',
    'No YAML → JSON build step',
  ],
  structure: `
<?xml version="1.0" encoding="UTF-8"?>
<entity id="npc_vendor_01" type="ENTITY_NPC"
        xmlns="https://chevp.github.io/synth-protocol/schema/synth/entity/1.0">

    <metadata>
        <name>Vendor Karl</name>
        <description>Friendly shop owner</description>
    </metadata>

    <components>
        <transform>
            <position x="10" y="0" z="5"/>
            <rotation x="0" y="45" z="0" w="1"/>
        </transform>

        <movement moveSpeed="2.0" turnSpeed="90"/>
        <health maxHealth="100" currentHealth="100"/>
        <interaction interactionType="shop" interactionRadius="3.0"/>

        <ai behaviorTree="vendor_idle">
            <patrolPath>
                <waypoint x="10" y="0" z="5"/>
                <waypoint x="12" y="0" z="5"/>
            </patrolPath>
        </ai>
    </components>

    <model asset="assets/models/npc_vendor.glb">
        <animations>
            <animation state="idle" file="animations/npc_idle.glb"/>
            <animation state="talking" file="animations/npc_talk.glb"/>
        </animations>
    </model>

    <stateMachine ref="state-machines/npc_vendor.xml"/>
</entity>
`,
  advantages: [
    'No transformation overhead',
    'Direct schema validation',
    'Native XML tooling support',
    'Consistent format across pipeline',
  ],
};

// =============================================================================
// GAME SCENE AUTO-DETECTION
// =============================================================================

export const gameSceneDetection = {
  title: 'Game Scene Auto-Detection',
  description: 'synth CLI automatically detects game scene projects',
  detectionCriteria: [
    'Presence of manifest.json',
    'Presence of scene.synth.xml',
    'Existence of entities/ directory',
    'Existence of state-machines/ directory',
  ],
  expectedStructure: `
assets/
├── manifest.json         # Optional build manifest
├── scene.synth.xml       # Main scene definition
├── entities/             # Entity definitions (XML)
│   └── npc_vendor.xml
├── state-machines/       # State machine definitions (XML)
│   └── npc_idle.xml
└── assets/               # Binary assets
    ├── models/
    ├── textures/
    └── audio/
`,
  buildCommand: 'synth build -f sqlite -o ../dist',
  output: `
dist/
├── scene.synth.db          # SQLite runtime format
├── scene.synth.xml         # XML scene definition
├── manifest.json           # Build manifest
├── entities/               # Entity definitions (XML)
├── state-machines/         # State machine definitions (XML)
└── assets/                 # Copied assets
`,
};

// =============================================================================
// BUILD WORKFLOW
// =============================================================================

export const buildWorkflow = {
  title: 'Synth Build Workflow',
  steps: [
    {
      step: 1,
      name: 'Source (XML)',
      location: 'src/',
      description: 'Human-editable XML files in version control',
      files: ['project.synth.xml', 'scenes/*.synth.xml', 'entities/*.xml'],
    },
    {
      step: 2,
      name: 'Build',
      command: 'synth build',
      description: 'Transform XML to runtime formats',
      options: ['-f xml', '-f sqlite', '-f both', '--dist', '--release'],
    },
    {
      step: 3,
      name: 'Runtime (Server)',
      location: 'dist/',
      description: 'Server-side deployment (Java Quarkus)',
      files: ['scene.synth.xml', 'entities/*.xml', 'manifest.json'],
    },
    {
      step: 4,
      name: 'Runtime (Client)',
      location: 'release/',
      description: 'Client-side deployment (C++ Vulkan)',
      files: ['scene.synth.db', 'assets/**/*', 'manifest.json'],
    },
  ],
  integration: {
    server: {
      language: 'Java',
      runtime: 'Quarkus',
      format: 'XML',
      purpose: 'State machine initialization and game logic',
    },
    client: {
      language: 'C++',
      renderer: 'Vulkan (arctic-renderer)',
      format: 'SQLite',
      purpose: 'Scene loading and asset management',
    },
  },
};

// =============================================================================
// CLI COMMANDS
// =============================================================================

export const cliCommands = {
  build: {
    command: 'synth build',
    description: 'Build project files from XML to runtime formats',
    options: [
      { flag: '-f, --format <format>', description: 'Output format: xml, sqlite, both' },
      { flag: '-o, --output <dir>', description: 'Output directory' },
      { flag: '-w, --watch', description: 'Watch for changes and rebuild' },
      { flag: '-c, --clean', description: 'Clean output directory before build' },
      { flag: '-v, --verbose', description: 'Verbose output' },
      { flag: '-m, --minify', description: 'Minify XML output' },
      { flag: '--copy-xml', description: 'Copy original XML to dist' },
      { flag: '--split', description: 'Split XML into separate files per section' },
      { flag: '--dist', description: 'Build for server deployment (no assets)' },
      { flag: '--release', description: 'Build for client deployment (with assets)' },
    ],
    examples: [
      {
        command: 'synth build',
        description: 'Build with default settings (SQLite to ./dist)',
      },
      {
        command: 'synth build -f xml -o dist',
        description: 'Build XML format to dist directory',
      },
      {
        command: 'synth build --dist -f xml -v',
        description: 'Server deployment (XML, verbose)',
      },
      {
        command: 'synth build --release -f sqlite --compress',
        description: 'Client deployment (SQLite, compressed assets)',
      },
      {
        command: 'synth build -w -v',
        description: 'Watch mode with verbose output',
      },
    ],
  },
  create: {
    command: 'synth create',
    description: 'Create new Synth project with templates',
    examples: [
      { command: 'synth create my-project', description: 'Create basic project' },
      { command: 'synth create my-scene -t scene', description: 'Create scene project' },
    ],
  },
  export: {
    command: 'synth export',
    description: 'Export SQLite database back to XML for Git versioning',
    examples: [
      { command: 'synth export', description: 'Export dist/*.synth.db → src/*.synth.xml' },
      { command: 'synth export -m', description: 'Export with minified XML' },
    ],
  },
  validate: {
    command: 'synth validate',
    description: 'Validate Synth XML files against schema',
    examples: [
      { command: 'synth validate', description: 'Validate ./src files' },
      { command: 'synth validate --strict', description: 'Strict validation mode' },
    ],
  },
};

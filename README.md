<a name="readme-top"></a>

<div align="center">

<h1>Chevp MCP Suite</h1>

An Nx monorepo containing MCP (Model Context Protocol) servers for the **chevp workspace** ecosystem

[![][github-license-shield]][github-license-link]
[![][node-shield]][node-link]
[![][typescript-shield]][typescript-link]
[![][nx-shield]][nx-link]

</div>

<details>
<summary><kbd>Table of contents</kbd></summary>

#### TOC

- [📦 Packages](#-packages)
- [🚀 Installation](#-installation)
- [🔧 Configuration](#-configuration)
  - [Claude Code Integration](#claude-code-integration)
  - [Claude Desktop Integration](#claude-desktop-integration)
- [⌨️ Development](#️-development)
- [📁 Project Structure](#-project-structure)
- [🔗 Links](#-links)

####

</details>

## 📦 Packages

### Orchestration MCPs (Executive Layer)

| Package | Description |
|---------|-------------|
| `@mcp-suite/ceo` | CEO MCP - Strategic direction and cross-cutting decisions |
| `@mcp-suite/cto` | CTO MCP - Technical excellence and architecture coordination |
| `@mcp-suite/infra-architect` | Infrastructure Architect MCP - Shared infrastructure and MCP orchestration |

### Domain MCPs

| Package | Description |
|---------|-------------|
| `@mcp-suite/core` | Shared utilities, protocol types, and message queue for MCP servers |
| `@mcp-suite/arctic` | MCP server for Arctic Workspace architecture and build system |
| `@mcp-suite/chevp` | MCP server for chevp.github.io design system |
| `@mcp-suite/cryo-protocol` | MCP server for Cryo Protocol definitions and gRPC services |
| `@mcp-suite/portfolio` | MCP server for portfolio information |

<div align="right">

[![][back-to-top]](#readme-top)

</div>

## 🚀 Installation

> \[!IMPORTANT]\
> This package requires Node.js 18.0.0 or higher.

```bash
$ git clone https://github.com/chevp/chevp-mcp-suite.git
$ cd chevp-mcp-suite
$ npm install
$ npm run build
```

<div align="right">

[![][back-to-top]](#readme-top)

</div>

## 🔧 Configuration

### Claude Code Integration

Add the following to your Claude Code MCP configuration (`~/.claude/settings.json` or `.mcp.json`):

```json
{
  "mcpServers": {
    "arctic": {
      "command": "node",
      "args": ["/path/to/chevp-mcp-suite/packages/arctic-mcp/dist/stdio.js"]
    },
    "cryo-protocol": {
      "command": "node",
      "args": ["/path/to/chevp-mcp-suite/packages/cryo-protocol-mcp/dist/stdio.js"]
    }
  }
}
```

### Claude Desktop Integration

Add to your Claude Desktop configuration file:

**Windows:** `%APPDATA%\Claude\claude_desktop_config.json`
**macOS:** `~/Library/Application Support/Claude/claude_desktop_config.json`

```json
{
  "mcpServers": {
    "arctic": {
      "command": "node",
      "args": ["C:/chevp/tools/chevp-mcp-suite/packages/arctic-mcp/dist/stdio.js"]
    },
    "cryo-protocol": {
      "command": "node",
      "args": ["C:/chevp/tools/chevp-mcp-suite/packages/cryo-protocol-mcp/dist/stdio.js"]
    },
    "chevp": {
      "command": "node",
      "args": ["C:/chevp/tools/chevp-mcp-suite/packages/chevp-mcp/dist/stdio.js"]
    },
    "portfolio": {
      "command": "node",
      "args": ["C:/chevp/tools/chevp-mcp-suite/packages/portfolio-mcp/dist/stdio.js"]
    }
  }
}
```

<div align="right">

[![][back-to-top]](#readme-top)

</div>

## ⌨️ Development

This project uses [Nx](https://nx.dev) for monorepo management.

```bash
# Install dependencies
$ npm install

# Build all packages
$ npm run build

# Build only affected packages
$ npm run build:affected

# Watch mode for development
$ npm run dev

# Run linting
$ npm run lint

# Run tests
$ npm run test
```

### Building Individual Packages

```bash
# Build a specific package
$ npx nx build @mcp-suite/arctic

# Run a specific package
$ npx nx start @mcp-suite/arctic
```

<div align="right">

[![][back-to-top]](#readme-top)

</div>

## 📁 Project Structure

```
chevp-mcp-suite/
├── packages/
│   ├── core/                  # Shared utilities and protocol types
│   │   └── src/
│   │       └── protocol/      # Message queue, context store, types
│   ├── ceo-mcp/               # CEO MCP (Strategic direction)
│   │   └── src/tools/
│   ├── cto-mcp/               # CTO MCP (Technical excellence)
│   │   └── src/tools/
│   ├── infra-architect-mcp/   # Infra Architect MCP (Orchestration)
│   │   └── src/tools/
│   ├── arctic-mcp/            # Arctic Workspace MCP
│   ├── chevp-mcp/             # Design System MCP
│   ├── cryo-protocol-mcp/     # Cryo Protocol MCP
│   └── portfolio-mcp/         # Portfolio MCP
├── context-store/             # Shared state for MCP orchestration
│   ├── portfolio/             # Strategic priorities, products
│   ├── technical/             # Standards, debt registry, ADRs
│   ├── products/              # Per-product backlogs, architecture
│   ├── messages/              # Message queue (pending, processed)
│   └── repo-registry/         # Repository ownership mapping
├── docs/                      # Architecture documentation
├── nx.json                    # Nx configuration
├── package.json               # Root package.json
└── tsconfig.base.json         # Base TypeScript config
```

<div align="right">

[![][back-to-top]](#readme-top)

</div>

## 🔗 Links

### Related Projects

- **[Arctic Workspace](../../playground/arctic-cpp-playground)** - C++ development workspace
- **[Nuna SDK](../../nuna/nuna-sdk-cpp)** - Core C++ SDK
- **[Cryo Protocol](../../cryo)** - gRPC protocol definitions
- **[Portfolio](../../portfolio)** - Portfolio website

<div align="right">

[![][back-to-top]](#readme-top)

</div>

---

<details><summary><h4>📝 License</h4></summary>

This project is [MIT](./LICENSE) licensed.

</details>

Copyright © 2025 chevp

<!-- LINK GROUP -->

[back-to-top]: https://img.shields.io/badge/-BACK_TO_TOP-151515?style=flat-square
[github-license-link]: https://github.com/chevp/chevp-mcp-suite/blob/main/LICENSE
[github-license-shield]: https://img.shields.io/badge/license-MIT-white?labelColor=black&style=flat-square
[node-link]: https://nodejs.org/
[node-shield]: https://img.shields.io/badge/node-%3E%3D18.0.0-43853d?labelColor=black&logo=node.js&logoColor=white&style=flat-square
[nx-link]: https://nx.dev/
[nx-shield]: https://img.shields.io/badge/nx-monorepo-143055?labelColor=black&logo=nx&logoColor=white&style=flat-square
[typescript-link]: https://www.typescriptlang.org/
[typescript-shield]: https://img.shields.io/badge/typescript-5.4-3178c6?labelColor=black&logo=typescript&logoColor=white&style=flat-square

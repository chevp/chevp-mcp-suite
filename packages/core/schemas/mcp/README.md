# MCP Communication Channel Schemas

One [JSON Schema](https://json-schema.org/) (draft-07) per MCP server, defining
the messages that server accepts: who may send them (`from`), that the message
is addressed to it (`to`), and which of its own tools may be invoked
(`payload.action`).

- `roles.schema.json` — the canonical `MCPRole` enum, mirrors
  `packages/core/src/protocol/types.ts#MCPRole`.
- `_envelope.schema.json` — the shared `MCPMessage` envelope (id, type,
  priority, timestamp, payload shape, ...), mirrors
  `packages/core/src/protocol/types.ts#MCPMessage`. Every per-server schema
  extends this via `allOf`.
- `<role>.schema.json` — one file per MCP server (e.g. `strategy.schema.json`,
  `coregfx-po.schema.json`). `from` is restricted to the servers that role
  reports to, delegates to, or collaborates with
  (`ROLE_HIERARCHY` in `types.ts`); `payload.action` is restricted to that
  server's own tool names as documented in
  `docs/mcp-orchestration-architecture.md` and `docs/safe-6-workflow.md`.

`cost.schema.json`, `docs.schema.json`, and `ops.schema.json` have no tools
defined yet (Phase 4, not yet implemented) — their `payload.action` stays an
open string until those servers ship real tools.

## Validating a message

```js
import Ajv from 'ajv';
import envelope from './_envelope.schema.json' with { type: 'json' };
import roles from './roles.schema.json' with { type: 'json' };
import strategy from './strategy.schema.json' with { type: 'json' };

const ajv = new Ajv({ schemas: [envelope, roles, strategy] });
const validate = ajv.getSchema(strategy.$id);
validate(message); // -> boolean; validate.errors on failure
```

Adding a tool to a server means adding its name to that server's
`payload.action` enum here, and to the corresponding `tools` list in the
architecture docs — keep both in sync.

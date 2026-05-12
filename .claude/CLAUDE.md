# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Overview

kbac (knowledge base as code) — a Neo4j 2026.x graph database in Docker with TypeScript tooling and `.env`-based credential management. No build step — TypeScript runs directly via `tsx`.

## Commands

| Task | Command |
|------|---------|
| Start Neo4j | `yarn db:up` |
| Stop Neo4j | `yarn db:down` |
| Destroy + recreate + seed | `yarn db:reset` (requires typing "reset graph") |
| Wait for Neo4j ready | `yarn db:wait` |
| Run .cypher file | `yarn cypher cypher/file.cypher` |
| Seed all data | `yarn db:seed` |
| Backup graph to file | `yarn db:backup` |
| Introspect graph schema | `yarn db:introspect` |
| Type check | `yarn type-check` |
| Run tests | `yarn test` |
| Ad-hoc Cypher query | `source .env && cypher-shell -a "$NEO4J_URI" -u "$NEO4J_USERNAME" -p "$NEO4J_PASSWORD" "QUERY;"` |
| `kbac search "<term>"` | Fulltext search via the CLI (after symlink install). Use `--type Tool\|Concept\|Domain\|System` to filter, `--limit 1-100`, `--json` for machine-readable output. |

All `db:*` commands require `NEO4J_PASSWORD` to be set. Load it with `source .env` or prefix the command: `NEO4J_PASSWORD=... yarn db:up`.

Uses **yarn 3.7.0** (Berry) — set via `packageManager` in `package.json`. No test runner or linter is configured yet.

## Credential Management

Credentials are loaded from a gitignored `.env` file using Node 22+'s native `--env-file-if-exists` flag:

- `.env.example` is committed — contains the canonical key list with no actual values
- Copy to `.env` and fill in `NEO4J_PASSWORD` (and optionally the other keys)
- `src/env.d.ts` is a hand-maintained ProcessEnv augmentation for the four NEO4J_* keys; edit directly when the env-var contract changes
- Real environment variables always take precedence over `.env` file values

**No `.env` at all** is supported — `--env-file-if-exists` is a graceful no-op when the file is missing. Prefix commands with `NEO4J_PASSWORD=...` for one-off overrides or CI environments.

## Architecture

- **Neo4j 2026.02.3-community** — exact image pin, Cypher 25 default, APOC Core + Extended, 1G heap + 512m pagecache + query logging
- **Bolt port 7688, HTTP port 7475** — offset by 1 from the existing `neo4j-memory` container on 7687/7474
- **`bin/run-cypher.ts`** — reads `.cypher` files, splits on semicolons, executes via neo4j-driver over Bolt, prints structured results. Runs via `tsx` (no compile step)
- **`src/db/neo4j-service.ts`** — typed service layer wrapping `executeRead`/`executeWrite` with automatic retry on transient failures and optional TypeBox+AJV output validation
- **`src/schemas/`** — TypeBox schemas define node/relationship shapes. Source of truth for both compile-time types (`Static<typeof Schema>`) and runtime AJV validators
- **`src/validation/validator.ts`** — `createValidator(schema)` factory compiles TypeBox schemas into AJV validators
- **`cypher/`** — source of truth for graph data. Files are numbered (`00-smoke-test.cypher` through `07-seed-meta-frameworks.cypher`) and idempotent. `cypher/queries/` has parameterized query templates for the service layer
- **Named volume `neo4j-2026-data`** — persists across container stop/start. Destroyed only by `db:reset` or `docker volume rm`
- **TypeScript** — ES2022 target, Node16 module resolution, strict mode. See `tsconfig.json`

## Graph Domain Model

| Label | Key Properties | Purpose |
|-------|---------------|---------|
| Tool | id, name, version?, type? | Library, framework, CLI tool |
| Concept | id, name | Technique or pattern |
| Domain | id, name, category? | High-level area |
| System | id, name, version? | Composed meta-framework |

Relationships: `IMPLEMENTS` (Tool→Concept), `DEPENDS_ON` (Tool→Tool), `BELONGS_TO` (Tool/Concept→Domain), `USES` (System→Tool), `APPLIES` (System→Concept), `COMPOSES_WITH` (Tool→Tool)

See `docs/ARCHITECTURE.md` for design decisions, credential flow diagrams, and known constraints in detail.

## Key Constraints

- **APOC Core + Extended** are both installed via `NEO4J_PLUGINS: '["apoc", "apoc-extended"]'`. Core provides `apoc.export.cypher.all` (used by `db:backup`). Extended provides arrow/parquet/xls export + community procedures. Both must be version-compatible with the Neo4j image.
- `apoc.version()` and `apoc.help()` do not exist in APOC Extended 2026.x. Use `SHOW PROCEDURES YIELD name WHERE name STARTS WITH 'apoc'` instead.
- Neo4j fulltext indexes are single-label only. Cross-label search uses UNION across separate indexes (`tool_search`, `concept_search`).
- Homebrew `cypher-shell` (2026.03.1) is one minor ahead of the container (2026.02.3). Bolt is backward compatible. Fallback: `docker exec neo4j-2026 cypher-shell`.
- `.env` is gitignored. Never commit it. `.env.example` is the canonical template — keep it in sync with the actual keys consumed by the code.

## Plugin (austdx-cc-mkpl marketplace)

This repo is a Claude Code marketplace (`austdx-cc-mkpl`) containing the `kbac` plugin at `plugins/kbac/`.

**Install:** `/plugin marketplace add ./` then `/plugin install kbac@austdx-cc-mkpl` then `/reload-plugins`

**Update after changes:** `/plugin marketplace update austdx-cc-mkpl` then `/reload-plugins`

**Other commands:** `/plugin` (interactive manager), `/plugin disable kbac@austdx-cc-mkpl`, `/plugin uninstall kbac@austdx-cc-mkpl`, `/plugin marketplace list`

**Skills** (auto-triggered by task context, in `plugins/kbac/skills/`):

- `cypher-authoring` — MERGE patterns, timestamps, relationship conventions, file naming
- `typebox-schema` — Nullable helpers, Static types, AJV validators, barrel exports
- `graph-query-design` — Five query patterns (lookup, DFS, BFS, progressive-disclosure, cross-domain)
- `repo-setup` — Prerequisites checklist, bootstrap flow, auth boundary, troubleshooting
- `cli-toolchain` — Modern CLI tool detection (rg, fd, sd, jq, yq) and usage patterns

**Agents** (autonomous subagents, in `plugins/kbac/agents/`):

- `cypher-reviewer` — Reviews .cypher files for convention compliance
- `schema-sync-checker` — Validates TypeBox schemas match graph state

**Rules** (always-on via `.claude/rules/`):

- `cypher-conventions` — MERGE idempotency, timestamps, semicolons
- `credential-safety` — `.env` workflow, no plaintext credentials
- `prefer-modern-cli` — Use rg/fd/sd/jq/yq over grep/find/sed when available

**Hooks** (in `plugins/kbac/hooks/`):

- `SessionStart` — Injects graph schema context and detected CLI tools into every session

## Contributing — Repository Structure

North Star layout (locked in by the mature-structure refactor):

- **`bin/`** — executable scripts only. Each file has `main()` + `process.exit()`. Imports library code from `src/`.
- **`src/config/`** — app config schemas + loaders. `env.ts` is the canonical example.
- **`src/cypher/`** — Cypher-language tooling: parsing, formatting, running statements. Pure where possible.
- **`src/db/`** — anything that imports `neo4j-driver`. The driver coupling is encapsulated here only.
- **`src/schemas/`** — TypeBox schemas for graph entities (Tool, Concept, Domain, System, relationships). Source of truth.
- **`src/utils/`** — narrowly-scoped helpers that don't fit a domain folder. One file per category. Never a kitchen-sink `utils.ts`.
- **`src/validation/`** — AJV factory + shared validation infrastructure.

Where does new code go?

- New `yarn` script entry point? → `bin/<name>.ts`
- New env var or config? → `src/config/env.ts` (extend `EnvSchema`)
- New Cypher parser / formatter / linter? → `src/cypher/<name>.ts`
- New Neo4j driver-coupled helper? → `src/db/<name>.ts`
- New graph node/relationship schema? → `src/schemas/nodes.ts` or `relationships.ts` (per `kbac:typebox-schema` skill)
- New small generic helper? → `src/utils/<category>.ts` (e.g. `utils/cli.ts`, `utils/string.ts`)
- Anywhere else? Add a new subdir under `src/` with its own `index.ts` barrel.

Import rules (NodeNext + barrel discipline):

```typescript
// In bin/ or another src/ module — ALWAYS import from the barrel:
import { loadEnv } from "../src/config/index.js";
import { withSession, closeDriver } from "../src/db/index.js";
import { splitCypherStatements, runStatement } from "../src/cypher/index.js";
import { fatal } from "../src/utils/index.js";

// Within the same module (sibling files), import directly:
// (e.g., from src/db/session.ts)
import { getDriver } from "./driver.js";
```

Note the mandatory `.js` extensions on every relative import — this is NodeNext ESM, not a typo. The build runs straight from `.ts` via `tsx`; the `.js` is what Node resolves at runtime.

Tests live next to the unit under test (`splitter.ts` ↔ `splitter.test.ts`). Run with `yarn test` (all) or `yarn test src/cypher/splitter.test.ts` (one file).

Tests policy — when tests are required:

- REQUIRED for every pure function exported from `src/` (no I/O, no Neo4j, no env). The splitter is the canonical example.
- REQUIRED for every TypeBox `*Schema` const — at minimum a smoke test that validates one valid and one invalid sample.
- OPTIONAL for thin glue in `bin/` (the `main()` wiring) — covered by integration verification.
- OPTIONAL for modules whose only behavior is a `neo4j-driver` call — covered by live seed-load verification.
- Rule of thumb: if a future contributor could realistically break this without anyone noticing, write the test.

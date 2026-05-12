# Architecture

## Overview

kbac (knowledge base as code) runs a Neo4j 2026.x graph database in Docker, interacted with via host-installed `cypher-shell` and a TypeScript project using `neo4j-driver`. Credentials are loaded from a gitignored `.env` file using Node 22+'s native `--env-file-if-exists` flag, with real environment variables taking precedence — no plaintext secrets in the repo.

## Stack

| Component | Version | Purpose |
|-----------|---------|---------|
| Neo4j | `2026.02.3-community` (exact pin) | Graph database |
| APOC Core | `2026.03` | Officially supported procedures (cypher/json/csv export) |
| APOC Extended | `2026.02.0` | Community-maintained procedures (arrow/parquet/xls export) |
| Cypher | 25 (default) | Query language |
| neo4j-driver | `6.x` | TypeScript Bolt client |
| TypeBox | `1.x` | JSON Schema type builder — compile-time + runtime types |
| AJV | `8.x` | JSON Schema validator — compiles TypeBox schemas |
| @clack/prompts | `1.x` | Interactive CLI prompts for confirmation gates |
| tsx | `4.x` | TypeScript runner (no build step) |
| yarn | `3.7.0` | Package manager (Berry) |
| cypher-shell | `2026.03.1` (Homebrew) | CLI Bolt client |

## Project Structure

```
kbac/
├── .env.example                    # Template (committed); cp to .env (gitignored)
├── .yarnrc.yml                     # Yarn 3.7.0 config (node-modules linker)
├── docker/
│   └── docker-compose.yml          # Neo4j 2026.02.3-community (1G heap, query logging)
├── cypher/                         # .cypher files (source of truth for graph data)
│   ├── 00-smoke-test.cypher        # Validates Cypher 25 + APOC
│   ├── 01-constraints.cypher       # Uniqueness constraints (O(1) lookup)
│   ├── 02-indexes.cypher           # Range, composite, fulltext indexes
│   ├── 03-seed-domains.cypher      # Domain nodes
│   ├── 04-seed-tools.cypher        # Tool nodes + BELONGS_TO, DEPENDS_ON, COMPOSES_WITH
│   ├── 05-seed-concepts.cypher     # Concept nodes + IMPLEMENTS, BELONGS_TO
│   ├── 06-seed-systems.cypher      # System nodes + USES, APPLIES
│   ├── 07-seed-meta-frameworks.cypher  # Meta-framework systems + new tools/concepts
│   └── queries/                    # Parameterized query templates (for service layer)
│       ├── lookup.cypher           # O(1) by id
│       ├── dfs-traversal.cypher    # Depth-first dependency chains
│       ├── bfs-traversal.cypher    # Breadth-first nearest neighbors
│       ├── progressive-disclosure.cypher  # Domain → Concept → Tool drill-down
│       └── cross-domain.cypher     # Fulltext search across labels
├── bin/
│   ├── confirm-destructive.ts      # Two-step confirmation gate for destructive ops
│   ├── db-backup.ts                # Streams graph export via APOC to backups/
│   ├── db-introspect.ts            # Dumps graph schema to stdout
│   └── db-wait.ts                  # Polls until Neo4j accepts Bolt connections
├── src/
│   ├── db/
│   │   ├── driver.ts               # Neo4j driver singleton (disableLosslessIntegers, pooling)
│   │   └── neo4j-service.ts        # executeRead/executeWrite + TypeBox/AJV validation
│   ├── schemas/
│   │   ├── nodes.ts                # TypeBox schemas: Tool, Concept, Domain, System
│   │   ├── relationships.ts        # TypeBox schemas: DEPENDS_ON, USES, etc.
│   │   └── index.ts                # Barrel re-export
│   ├── validation/
│   │   └── validator.ts            # createValidator(schema) → AJV compiled validator
│   ├── env.d.ts                    # ProcessEnv augmentation for NEO4J_* keys
│   └── run-cypher.ts               # Reads .cypher files, executes via Bolt
├── package.json
├── tsconfig.json
└── .gitignore
```

## Credential Flow

Credentials live in a gitignored `.env` file at the repo root, loaded
by Node 22+'s native `--env-file-if-exists` flag. The application
reads `process.env.NEO4J_PASSWORD` directly — no resolver layer.

```
.env.example (committed, no secrets)
    │
    │  cp .env.example .env  → fill in NEO4J_PASSWORD
    │
    ▼
.env (gitignored)
    │
    │  node --env-file-if-exists=.env --import tsx ...
    │  docker compose --env-file=.env ...
    │
    ▼
process.env.NEO4J_PASSWORD
    │
    ├──► docker compose (NEO4J_AUTH=neo4j/${NEO4J_PASSWORD})
    ├──► cypher-shell -p "$NEO4J_PASSWORD"
    └──► tsx bin/*.ts (process.env.NEO4J_PASSWORD)
```

**Precedence:** real environment variables (exported in shell or set
inline like `NEO4J_PASSWORD=foo yarn db:up`) win over the `.env` file.
`--env-file-if-exists` only sets keys that aren't already in
`process.env`, which gives free support for inline overrides and CI
environments where credentials come from the runner's secret store.

**No `.env` at all** is supported — `--env-file-if-exists` is a
graceful no-op when the file is missing. The process then runs with
whatever real env vars the caller supplied. Useful for CI and for
running individual commands with `NEO4J_PASSWORD=...` prefixed.

**Historical note:** before this design, credentials were resolved at
runtime by `varlock` from 1Password references in a committed
`.env.schema`. That gave AI-safe credential management but required
biometric re-auth every few hours, which created a dark-factory
anti-pattern (tools silently broke when the session expired).

## Docker Container

| Setting | Value |
|---------|-------|
| Image | `neo4j:2026.02.3-community` |
| Container | `neo4j-2026` |
| HTTP | `127.0.0.1:7475` (offset from existing `neo4j-memory` on 7474) |
| Bolt | `127.0.0.1:7688` (offset from existing `neo4j-memory` on 7687) |
| Bolt TLS | Disabled (local dev) |
| Restart | `no` (user-controlled) |
| Volume | `neo4j-2026-data` (named, persistent) |
| APOC | Core + Extended, with export/import/triggers enabled |

## Client Tooling

### cypher-shell (ad-hoc queries, .cypher file piping)

```bash
# Source .env so cypher-shell sees the password
set -a; source .env; set +a

# Ad-hoc query
cypher-shell -a "$NEO4J_URI" -u "$NEO4J_USERNAME" -p "$NEO4J_PASSWORD" "MATCH (n) RETURN count(n);"

# Run a .cypher file
cypher-shell -a "$NEO4J_URI" -u "$NEO4J_USERNAME" -p "$NEO4J_PASSWORD" < cypher/file.cypher
```

Homebrew `cypher-shell` is 2026.03.1 (one minor ahead of container). Bolt is backward compatible. Fallback: `docker exec neo4j-2026 cypher-shell` for a version-matched client.

### neo4j-driver (TypeScript, structured results)

```bash
yarn cypher cypher/file.cypher
```

`bin/run-cypher.ts` reads `.cypher` files from disk, splits on semicolons, executes each statement via Bolt, and prints structured results. `src/env.d.ts` is a hand-maintained `ProcessEnv` augmentation for the four `NEO4J_*` keys.

## Graph Domain Model

The graph documents meta-frameworks and development systems — how tools, libraries, and patterns compose together.

### Node Labels

| Label | Purpose | Key Properties |
|-------|---------|----------------|
| Tool | Library, framework, CLI | id, name, version, type, description |
| Concept | Technique or pattern | id, name, description |
| Domain | High-level area | id, name, category, description |
| System | Composed meta-framework | id, name, version, purpose, description |

### Relationships

| Type | From | To | Properties | Example |
|------|------|----|------------|---------|
| IMPLEMENTS | Tool | Concept | — | TypeBox IMPLEMENTS schema-validation |
| DEPENDS_ON | Tool | Tool | type (runtime/dev/peer) | AJV DEPENDS_ON TypeBox |
| BELONGS_TO | Tool/Concept | Domain | — | Neo4j BELONGS_TO Graph Databases |
| USES | System | Tool | role | kbac USES Neo4j (graph-storage) |
| APPLIES | System | Concept | — | kbac APPLIES data-as-code |
| COMPOSES_WITH | Tool | Tool | pattern | TypeBox COMPOSES_WITH AJV (schema-to-validator) |

### Navigational Index Strategy

| Pattern | Index Support | Query Shape |
|---------|--------------|-------------|
| O(1) lookup | Unique constraint on `id` per label | `MATCH (t:Tool {id: $id})` |
| Depth-first | Variable-length paths | `(start)-[:DEPENDS_ON*1..5]->(dep)` |
| Breadth-first | `shortestPath()` | Level-by-level neighbor expansion |
| Progressive disclosure | Composite index on Domain | Domain → Concept → Tool drill-down |
| Cross-domain | Fulltext index on Tool\|Concept | `db.index.fulltext.queryNodes()` |

## TypeScript Validation Architecture

TypeBox schemas are the single source of truth for the graph's type system:

```
TypeBox Schema (e.g. ToolSchema)
    │
    ├──► Static<typeof ToolSchema>  →  compile-time type (Tool)
    │
    └──► createValidator(ToolSchema) →  AJV-compiled runtime validator
                                         │
                                         ├──► validateParams (input to Cypher)
                                         └──► validateResult (output from Neo4j)
```

The service layer (`src/db/neo4j-service.ts`) wraps `session.executeRead()` / `session.executeWrite()` with:
- Automatic retry on transient failures (leader switches, connection drops)
- Neo4j type conversion (DateTime → ISO string, Node → properties)
- Optional TypeBox schema validation on query results

## yarn Scripts

```bash
yarn db:up                              # Start container (reads .env via docker compose --env-file)
yarn db:down                            # Stop container
yarn db:reset                           # Destroy volume + recreate + wait + seed
yarn db:wait                            # Poll until Neo4j accepts Bolt connections
yarn cypher cypher/file.cypher          # Run .cypher file via TypeScript runner
yarn db:seed                            # Run cypher files 01-07 in order
yarn db:backup                          # Export graph to backups/<timestamp>.cypher
yarn db:introspect                      # Dump graph schema to stdout
```

## Data Strategy

- **Persistent volume** `neo4j-2026-data` survives container stop/start and recreation
- **`.cypher` files in git** are the source of truth — can rebuild from scratch via `yarn db:reset`
- `docker volume rm neo4j-2026-data` destroys all data — use with intent

## Design Decisions

| Decision | Choice | Why |
|----------|--------|-----|
| 2026.x over 5.26 LTS | Security + modern defaults | Debian 13 base (A health grade), Cypher 25, cleaner image. Accepted trade-off: no LTS, rolling monthly releases |
| Cypher 25 default | Fix breakage early | Fresh container with no data — best time to find Cypher 25 incompatibilities |
| Exact image pin (`2026.02.3`) | Prevent surprise upgrades | Learned from prior incident where `neo4j:latest` auto-upgraded and broke MCP |
| Plain .env via Node --env-file | Zero-dep credential loading | Node 22+ ships --env-file-if-exists; real env vars override file values; no external auth service required. Migrated away from Varlock+1Password (dark-factory: biometric re-auth every ~4 hours). |
| APOC Core + Extended | Both installed | Core for officially supported procedures (cypher export). Extended for community procedures (arrow/parquet). Both coexist via NEO4J_PLUGINS. |
| Separate repo from dotfiles | Separation of concerns | This is a project, not shell config |
| No MCP | CLI-first workflow | Interact via scripts and tooling, not through AI agent memory layer |

## Known Constraints

1. **APOC Extended version lag** — Community-maintained, currently at 2026.02.0. Must verify compatibility before upgrading Neo4j past 2026.02.
2. **No LTS** — Neo4j 2026.02 is only supported until 2026.03 ships. Pinned and upgraded on our own schedule.
3. **cypher-shell version mismatch** — Homebrew ships 2026.03.1 vs container 2026.02.3. Bolt protocol handles this, but `docker exec` fallback exists.
4. **.env discipline** — `.env` is gitignored. Never commit it. `.env.example` is the canonical template; keep it in sync with the actual keys consumed by the code.

## Fast Follows

- **Nightly backup at 3am EST** — Explore Docker-native scheduling (cron sidecar container). Keeps backup inside Docker rather than depending on host machine state.

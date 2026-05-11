# Architecture

## Overview

kbac (knowledge base as code) runs a Neo4j 2026.x graph database in Docker, interacted with via host-installed `cypher-shell` and a TypeScript project using `neo4j-driver`. Credentials are managed by Varlock with 1Password — no plaintext secrets anywhere.

## Stack

| Component | Version | Purpose |
|-----------|---------|---------|
| Neo4j | `2026.02.3-community` (exact pin) | Graph database |
| APOC Core | `2026.03` | Officially supported procedures (cypher/json/csv export) |
| APOC Extended | `2026.02.0` | Community-maintained procedures (arrow/parquet/xls export) |
| Cypher | 25 (default) | Query language |
| Varlock | `0.7.x` | Credential injection from `.env.schema` |
| @varlock/1password-plugin | `0.3.x` | Resolves `op()` references via desktop app auth |
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
├── .env.schema                     # Varlock schema (committed, no secrets)
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
│   ├── env.d.ts                    # Generated types from .env.schema (varlock typegen)
│   └── run-cypher.ts               # Reads .cypher files, executes via Bolt
├── package.json
├── tsconfig.json
└── .gitignore
```

## Credential Flow

Varlock resolves credentials at process launch — the application never sees `op://` references.

```
.env.schema (committed)
    │
    │  op("op://vault/Neo4j 2026/password")
    │
    ▼
varlock run ──► 1Password desktop app (biometric) ──► resolved NEO4J_PASSWORD
    │
    ├──► docker compose (NEO4J_AUTH=neo4j/${NEO4J_PASSWORD})
    ├──► cypher-shell -p "$NEO4J_PASSWORD"
    └──► tsx bin/run-cypher.ts (process.env.NEO4J_PASSWORD)
```

The `.env.schema` is safe to commit — it contains only `op()` references and static config values. AI agents see the schema shape but never credential values. The `@sensitive` annotation enables automatic stdout masking.

The 1Password item was created via:

```bash
op item create --category=password --title='Neo4j 2026' \
  --vault='4clfbn6i66sfhekqleb3fitgia' \
  --generate-password='20,letters,digits,symbols'
```

**Fallback if Varlock breaks:** Replace `varlock run` with `op run --env-file` and convert `.env.schema` to a plain `.env` with `op://` references. The Docker Compose config and TypeScript code are Varlock-independent — they just read `process.env`.

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
# Ad-hoc query
npx varlock run -- sh -c 'cypher-shell -a bolt://localhost:7688 -u neo4j -p "$NEO4J_PASSWORD" "MATCH (n) RETURN count(n);"'

# Run a .cypher file
npx varlock run -- sh -c 'cypher-shell -a bolt://localhost:7688 -u neo4j -p "$NEO4J_PASSWORD" < cypher/file.cypher'
```

Homebrew `cypher-shell` is 2026.03.1 (one minor ahead of container). Bolt is backward compatible. Fallback: `docker exec neo4j-2026 cypher-shell` for a version-matched client.

### neo4j-driver (TypeScript, structured results)

```bash
yarn cypher cypher/file.cypher
```

`bin/run-cypher.ts` reads `.cypher` files from disk, splits on semicolons, executes each statement via Bolt, and prints structured results. Varlock generates `src/env.d.ts` which augments `NodeJS.ProcessEnv` — so `process.env.NEO4J_PASSWORD` is typed as `string` (not `string | undefined`).

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
yarn db:up                              # Start container (varlock injects credentials)
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
| Varlock over plain .env | AI-safe credential management | Schema committed, values never in repo. Type generation bonus |
| APOC Core + Extended | Both installed | Core for officially supported procedures (cypher export). Extended for community procedures (arrow/parquet). Both coexist via NEO4J_PLUGINS. |
| Separate repo from dotfiles | Separation of concerns | This is a project, not shell config |
| No MCP | CLI-first workflow | Interact via scripts and tooling, not through AI agent memory layer |

## Known Constraints

1. **APOC Extended version lag** — Community-maintained, currently at 2026.02.0. Must verify compatibility before upgrading Neo4j past 2026.02.
2. **No LTS** — Neo4j 2026.02 is only supported until 2026.03 ships. Pinned and upgraded on our own schedule.
3. **cypher-shell version mismatch** — Homebrew ships 2026.03.1 vs container 2026.02.3. Bolt protocol handles this, but `docker exec` fallback exists.
4. **Varlock is v0.7.x** — New tool, API may change. Migration path: `op run` + plain `.env` file.
5. **Varlock `op()` parser** — Spaces in 1Password item names require quoted arguments: `op("op://vault/Neo4j 2026/password")` not `op(op://vault/Neo4j 2026/password)`.

## Fast Follows

- **Nightly backup at 3am EST** — Explore Docker-native scheduling (cron sidecar container). Keeps backup inside Docker rather than depending on host machine state.

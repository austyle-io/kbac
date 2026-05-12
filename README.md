# KBaC

Knowledge base as code. A Neo4j 2026.x graph database that documents meta-frameworks and development systems, used as a shared knowledge base for AI coding agents.

## Prerequisites

- Docker
- Node.js 22+ (Node's native `--env-file-if-exists` is used for credentials — no extra deps needed)
- Yarn 3.7.0 (set via `packageManager` in package.json, auto-installed by corepack)

## Setup

```bash
yarn install
cp .env.example .env             # Copy the template
# Edit .env and set NEO4J_PASSWORD to any strong password.
# The Neo4j container picks it up on first launch; subsequent runs
# must use the SAME password or auth will fail.
yarn db:up                       # Start Neo4j
yarn db:wait                     # Wait until it's healthy
yarn db:seed                     # Load constraints, indexes, and seed data
yarn db:introspect               # Verify the graph loaded correctly
```

**Env precedence:** real environment variables (exported in shell or
set inline like `NEO4J_PASSWORD=foo yarn db:up`) win over the `.env`
file. CI environments can skip `.env` entirely and provide credentials
through real env vars — the `--env-file-if-exists` flag is a graceful
no-op when the file is absent.

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

All `db:*` commands read credentials from `.env` (or your shell environment if no `.env` exists).

## Graph Domain Model

The graph models how tools, libraries, and patterns compose into reusable systems.

| Label | Purpose | Examples |
|-------|---------|---------|
| Tool | Library, framework, CLI | Neo4j, TypeBox, AJV, Docker |
| Concept | Technique or pattern | Schema Validation, Data as Code |
| Domain | High-level area | Graph Databases, TypeScript, Validation |
| System | Composed meta-framework | kbac, TypeBox+AJV Validation Stack |

Relationships: `IMPLEMENTS`, `DEPENDS_ON`, `BELONGS_TO`, `USES`, `APPLIES`, `COMPOSES_WITH`

## Stack

Neo4j 2026.02.3-community, APOC Core + Extended, Cypher 25, neo4j-driver 6.x, TypeBox + AJV (schema-first validation), Node 22+ `--env-file` for credentials, TypeScript 6.x via tsx, yarn 3.7.0.

## Ports

| Service | Port |
|---------|------|
| Neo4j Browser | <http://localhost:7475> |
| Bolt | bolt://localhost:7688 |

## Documentation

- `CLAUDE.md` — AI agent guidance for this repo
- `docs/ARCHITECTURE.md` — Design decisions, credential flow, project structure
- `docs/META-FRAMEWORKS.md` — Architecture of the four meta-framework subsystems

# Meta-Frameworks & Systems

kbac incorporates four reusable meta-frameworks. Each is a System node in the knowledge graph with its own tools, concepts, and architectural pattern.

```
                              ┌─────────┐
                              │  kbac   │
                              └────┬────┘
                 DEPENDS_ON (incorporates)
           ┌──────────┬──────────┬──────────┐
           ▼          ▼          ▼          ▼
  ┌────────────┐ ┌──────────┐ ┌─────────┐ ┌──────────┐
  │ TypeBox+AJV│ │ Varlock+ │ │Neo4j+   │ │ Cypher   │
  │ Validation │ │1Password │ │Docker   │ │ as Code  │
  └────────────┘ └──────────┘ └─────────┘ └──────────┘
```

---

## 1. TypeBox+AJV Validation Stack

**Purpose:** Schema-first type safety with runtime validation.

**The pattern:** One schema definition produces three artifacts — a JSON Schema (for AJV runtime validation), a TypeScript type (via `Static<>`), and a type guard (via `validate()`). Zero drift between compile-time and runtime.

```
TypeBox Schema
    │
    ├── Static<typeof Schema>  →  TypeScript type (compile-time)
    │
    ├── ajv.compile(Schema)    →  Validator function (runtime)
    │
    └── validator.validate()   →  Type guard (narrows unknown → T)
```

**Tools:**

| Tool | Role |
|------|------|
| TypeBox | Schema definition — produces JSON Schema + TS types from one source |
| AJV | Runtime validator — JIT-compiles schemas into optimized check functions |
| TypeScript | Static type inference — `Static<typeof Schema>` extracts the type |

**Concepts applied:**
- **Schema Validation** — data checked against declared shapes
- **Runtime Validation** — types verified at execution time, not just compile time
- **Type Guards** — `validate()` narrows `unknown` to the schema's type
- **Compile-Time / Runtime Unification** — one definition, both worlds

**Data flow in kbac:**

```
Cypher query params (unknown)
    │
    ├── validateParams(ParamsSchema, data)  →  typed params or throw
    │
    ▼
neo4j-driver tx.run(cypher, params)
    │
    ▼
Neo4j records (unknown shape)
    │
    ├── recordToObject()  →  plain JS objects (DateTime → string, Node → properties)
    │
    └── validateResult(ResultSchema, row)  →  typed result or throw
```

**Key file:** `src/schemas/nodes.ts` — the schema registry. Every node label has a TypeBox schema that is the single source of truth.

---

## 2. Varlock+1Password Credential Pipeline

**Purpose:** Zero-plaintext secret management for development.

**The pattern:** Committed `.env.schema` contains `op()` references to 1Password — not actual secrets. At runtime, `varlock run` resolves these via 1Password desktop app biometric auth and injects real values as environment variables into the subprocess. AI agents see the schema shape but never credential values.

```
.env.schema (committed to git)
    │
    │  NEO4J_PASSWORD=op("op://vault/Neo4j 2026/password")
    │
    ▼
varlock run ──► 1Password desktop app
    │                    │
    │              biometric auth
    │                    │
    │              ◄─── resolved value
    │
    ▼
Subprocess environment
    │
    ├── docker compose  (NEO4J_AUTH=neo4j/${NEO4J_PASSWORD})
    ├── cypher-shell    (-p "$NEO4J_PASSWORD")
    └── tsx / node      (process.env.NEO4J_PASSWORD)
```

**Tools:**

| Tool | Role |
|------|------|
| Varlock | Env resolver — reads `.env.schema`, resolves `op()` references, injects env vars |
| 1Password | Secret store — biometric-gated credential vault with CLI (`op`) |

**Concepts applied:**
- **Credential Injection** — secrets resolved at process launch, never stored on disk
- **Biometric Auth** — fingerprint/face required to decrypt secrets

**Key constraint:** The `op` CLI requires 1Password desktop app connectivity. In sandboxed environments (CI, Claude Code sandbox), commands that resolve `op()` references must be run by the user via `!` prefix.

**Gotcha:** Spaces in 1Password item names require quoted arguments: `op("op://vault/Neo4j 2026/password")` not `op(op://vault/Neo4j 2026/password)`.

---

## 3. Neo4j+Docker Graph Infrastructure

**Purpose:** Reproducible graph database with pinned versions.

**The pattern:** Exact-pinned Neo4j image in Docker Compose with named volumes for persistence, JVM memory tuning, query logging for observability, and a Bolt healthcheck. The database can be destroyed and rebuilt from cypher files via `yarn db:reset`. Port offsets avoid collisions with other Neo4j containers on the host.

```
docker-compose.yml
    │
    ├── neo4j:2026.02.3-community  (exact pin, never :latest)
    │       │
    │       ├── 1G heap + 512m pagecache  (tuned, not defaults)
    │       ├── APOC Core + Extended      (official + community procedures)
    │       ├── query logging: INFO       (debug agentic queries)
    │       └── Bolt healthcheck          (proves queries work, not just JVM up)
    │
    ├── neo4j-2026-data:/data  (persists across restart)
    └── neo4j-2026-logs:/logs  (query log observability)
```

**Tools:**

| Tool | Role |
|------|------|
| Neo4j | Graph engine — native graph storage, Cypher 25 |
| Docker Compose | Orchestration — declarative container config |
| Docker | Containerization — isolated runtime |
| APOC Core + Extended | Official procedures (cypher export) + community procedures (arrow/parquet) |

**Concepts applied:**
- **Image Pinning** — `neo4j:2026.02.3-community` not `:latest`. Learned from prior incident where auto-upgrade broke MCP.
- **Data as Code** — the graph is fully rebuildable from `cypher/` files

**Port allocation:**

| Port | Service | Why offset |
|------|---------|------------|
| 7475 | HTTP/Browser | Avoids collision with `neo4j-memory` on 7474 |
| 7688 | Bolt | Avoids collision with `neo4j-memory` on 7687 |

---

## 4. Cypher as Code

**Purpose:** Version-controlled graph schema, data, and queries.

**The pattern:** Numbered `.cypher` files are the source of truth for the graph's structure and content. Execution order is alphabetical. All statements are idempotent — safe to re-run at any time.

```
cypher/
    │
    ├── 01-constraints.cypher     Schema: uniqueness (O(1) lookup)
    ├── 02-indexes.cypher         Schema: range, composite, fulltext
    ├── 03-seed-domains.cypher    Data: top-level categories
    ├── 04-seed-tools.cypher      Data: libraries, frameworks, CLIs
    ├── 05-seed-concepts.cypher   Data: patterns and techniques
    ├── 06-seed-systems.cypher    Data: composed meta-frameworks
    ├── 07-seed-meta-frameworks.cypher  Data: subsystem architectures
    │
    └── queries/                  Templates: parameterized for service layer
        ├── lookup.cypher             O(1)  — index-backed by id
        ├── dfs-traversal.cypher      DFS   — dependency chains
        ├── bfs-traversal.cypher      BFS   — nearest neighbors
        ├── progressive-disclosure.cypher  Drill-down — Domain→Concept→Tool
        └── cross-domain.cypher       Search — fulltext across labels
```

**Idempotency guarantees:**
- Constraints/indexes: `IF NOT EXISTS`
- Seed data: `MERGE` + `ON CREATE SET` / `ON MATCH SET`
- Re-running `yarn db:seed` is always safe

**Tools:**

| Tool | Role |
|------|------|
| Cypher | Query language — declarative graph operations |
| cypher-shell | CLI executor — pipes `.cypher` files, ad-hoc queries |
| neo4j-driver | Programmatic executor — TypeScript service layer with typed results |

**Concepts applied:**
- **Idempotent Migrations** — re-apply any file at any time without side effects
- **Schema as Code** — constraints and indexes defined in version-controlled files
- **Data as Code** — seed data is code, not manual entry
- **Navigational Indexes** — each index type maps to a traversal pattern
- **Graph Traversal** — DFS/BFS query patterns in `queries/`
- **Progressive Disclosure** — multi-level drill-down queries

**Navigational index strategy:**

| Traversal Pattern | Index Type | Cypher Technique |
|-------------------|------------|-----------------|
| O(1) lookup | Unique constraint on `id` | `MATCH (t:Tool {id: $id})` |
| Depth-first | No special index needed | `(start)-[:DEPENDS_ON*1..5]->(dep)` |
| Breadth-first | No special index needed | `shortestPath()` |
| Progressive disclosure | Composite on Domain | `MATCH (d:Domain)` → drill into children |
| Cross-domain search | Fulltext on name+description | `db.index.fulltext.queryNodes()` |

---

## How They Compose

kbac is the top-level System that incorporates all four meta-frameworks:

```
kbac
 ├── DEPENDS_ON (incorporates) → TypeBox+AJV Validation Stack
 │     └── validates data at the neo4j-driver boundary
 │
 ├── DEPENDS_ON (incorporates) → Varlock+1Password Credential Pipeline
 │     └── injects NEO4J_PASSWORD into all subprocesses
 │
 ├── DEPENDS_ON (incorporates) → Neo4j+Docker Graph Infrastructure
 │     └── provides the containerized graph database
 │
 └── DEPENDS_ON (incorporates) → Cypher as Code
       └── defines the schema, data, and query patterns
```

The meta-frameworks are independently reusable. TypeBox+AJV works in any TypeScript project. Varlock+1Password works with any secret-consuming tool. Neo4j+Docker works with any Cypher-based workflow. Cypher as Code works with any Neo4j deployment.

What makes kbac unique is the composition: the validation stack validates data flowing through the graph infrastructure, using credentials injected by the pipeline, with schema and data defined in cypher files.

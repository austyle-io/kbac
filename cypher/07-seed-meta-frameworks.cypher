// Meta-framework System nodes — reusable architectural patterns
// composed from tools and concepts. These are subsystems that kbac incorporates.
//
// Run: yarn cypher cypher/07-seed-meta-frameworks.cypher

// ============================================================================
// Meta-Frameworks domain
// ============================================================================

MERGE (d:Domain {id: 'meta-frameworks'})
ON CREATE SET
  d.name = 'Meta-Frameworks',
  d.category = 'architecture',
  d.description = 'Reusable architectural patterns composed from tools and concepts',
  d.created = datetime(),
  d.updated = datetime()
ON MATCH SET
  d.updated = datetime();

// ============================================================================
// Additional tools needed by meta-frameworks
// ============================================================================

MERGE (t:Tool {id: '1password'})
ON CREATE SET
  t.name = '1Password',
  t.type = 'platform',
  t.description = 'Password manager with biometric auth and CLI (op)',
  t.created = datetime(),
  t.updated = datetime()
ON MATCH SET
  t.updated = datetime();

MERGE (t:Tool {id: 'docker-compose'})
ON CREATE SET
  t.name = 'Docker Compose',
  t.type = 'cli',
  t.description = 'Multi-container Docker orchestration via YAML',
  t.created = datetime(),
  t.updated = datetime()
ON MATCH SET
  t.updated = datetime();

MERGE (t:Tool {id: 'cypher'})
ON CREATE SET
  t.name = 'Cypher',
  t.type = 'language',
  t.version = '25',
  t.description = 'Declarative graph query language for Neo4j',
  t.created = datetime(),
  t.updated = datetime()
ON MATCH SET
  t.updated = datetime();

// Tool domain memberships
MATCH (t:Tool {id: '1password'}), (d:Domain {id: 'credential-management'})
MERGE (t)-[:BELONGS_TO]->(d)
RETURN t.id + ' -> ' + d.id AS belongs_to;

MATCH (t:Tool {id: 'docker-compose'}), (d:Domain {id: 'infrastructure'})
MERGE (t)-[:BELONGS_TO]->(d)
RETURN t.id + ' -> ' + d.id AS belongs_to;

MATCH (t:Tool {id: 'cypher'}), (d:Domain {id: 'graph-databases'})
MERGE (t)-[:BELONGS_TO]->(d)
RETURN t.id + ' -> ' + d.id AS belongs_to;

// Tool dependencies
MATCH (a:Tool {id: 'docker-compose'}), (b:Tool {id: 'docker'})
MERGE (a)-[r:DEPENDS_ON]->(b)
ON CREATE SET r.type = 'runtime'
RETURN a.id + ' -[DEPENDS_ON]-> ' + b.id AS depends_on;

MATCH (a:Tool {id: 'varlock'}), (b:Tool {id: '1password'})
MERGE (a)-[r:DEPENDS_ON]->(b)
ON CREATE SET r.type = 'runtime'
RETURN a.id + ' -[DEPENDS_ON]-> ' + b.id AS depends_on;

MATCH (a:Tool {id: 'cypher'}), (b:Tool {id: 'neo4j'})
MERGE (a)-[r:DEPENDS_ON]->(b)
ON CREATE SET r.type = 'runtime'
RETURN a.id + ' -[DEPENDS_ON]-> ' + b.id AS depends_on;

// ============================================================================
// Additional concepts needed by meta-frameworks
// ============================================================================

MERGE (c:Concept {id: 'idempotent-migrations'})
ON CREATE SET
  c.name = 'Idempotent Migrations',
  c.description = 'Schema changes that can be re-applied safely (IF NOT EXISTS, MERGE)',
  c.created = datetime(),
  c.updated = datetime()
ON MATCH SET
  c.updated = datetime();

MERGE (c:Concept {id: 'schema-as-code'})
ON CREATE SET
  c.name = 'Schema as Code',
  c.description = 'Database schemas defined in version-controlled files',
  c.created = datetime(),
  c.updated = datetime()
ON MATCH SET
  c.updated = datetime();

MERGE (c:Concept {id: 'navigational-indexes'})
ON CREATE SET
  c.name = 'Navigational Indexes',
  c.description = 'Index strategies optimized for specific traversal patterns (DFS, BFS, progressive disclosure, O(1) lookup)',
  c.created = datetime(),
  c.updated = datetime()
ON MATCH SET
  c.updated = datetime();

MERGE (c:Concept {id: 'image-pinning'})
ON CREATE SET
  c.name = 'Image Pinning',
  c.description = 'Locking container images to exact versions to prevent surprise upgrades',
  c.created = datetime(),
  c.updated = datetime()
ON MATCH SET
  c.updated = datetime();

MERGE (c:Concept {id: 'biometric-auth'})
ON CREATE SET
  c.name = 'Biometric Auth',
  c.description = 'Using fingerprint or face recognition for secret resolution at runtime',
  c.created = datetime(),
  c.updated = datetime()
ON MATCH SET
  c.updated = datetime();

MERGE (c:Concept {id: 'compile-time-runtime-unification'})
ON CREATE SET
  c.name = 'Compile-Time / Runtime Unification',
  c.description = 'Single schema definition that produces both static types and runtime validators',
  c.created = datetime(),
  c.updated = datetime()
ON MATCH SET
  c.updated = datetime();

// Concept domain memberships
MATCH (c:Concept {id: 'idempotent-migrations'}), (d:Domain {id: 'infrastructure'})
MERGE (c)-[:BELONGS_TO]->(d)
RETURN c.id + ' -> ' + d.id AS belongs_to;

MATCH (c:Concept {id: 'schema-as-code'}), (d:Domain {id: 'infrastructure'})
MERGE (c)-[:BELONGS_TO]->(d)
RETURN c.id + ' -> ' + d.id AS belongs_to;

MATCH (c:Concept {id: 'navigational-indexes'}), (d:Domain {id: 'graph-databases'})
MERGE (c)-[:BELONGS_TO]->(d)
RETURN c.id + ' -> ' + d.id AS belongs_to;

MATCH (c:Concept {id: 'image-pinning'}), (d:Domain {id: 'infrastructure'})
MERGE (c)-[:BELONGS_TO]->(d)
RETURN c.id + ' -> ' + d.id AS belongs_to;

MATCH (c:Concept {id: 'biometric-auth'}), (d:Domain {id: 'credential-management'})
MERGE (c)-[:BELONGS_TO]->(d)
RETURN c.id + ' -> ' + d.id AS belongs_to;

MATCH (c:Concept {id: 'compile-time-runtime-unification'}), (d:Domain {id: 'validation'})
MERGE (c)-[:BELONGS_TO]->(d)
RETURN c.id + ' -> ' + d.id AS belongs_to;

// Concept implementations
MATCH (t:Tool {id: 'typebox'}), (c:Concept {id: 'compile-time-runtime-unification'})
MERGE (t)-[:IMPLEMENTS]->(c)
RETURN t.id + ' -[IMPLEMENTS]-> ' + c.id AS implements;

MATCH (t:Tool {id: '1password'}), (c:Concept {id: 'biometric-auth'})
MERGE (t)-[:IMPLEMENTS]->(c)
RETURN t.id + ' -[IMPLEMENTS]-> ' + c.id AS implements;

MATCH (t:Tool {id: 'docker'}), (c:Concept {id: 'image-pinning'})
MERGE (t)-[:IMPLEMENTS]->(c)
RETURN t.id + ' -[IMPLEMENTS]-> ' + c.id AS implements;

MATCH (t:Tool {id: 'cypher'}), (c:Concept {id: 'navigational-indexes'})
MERGE (t)-[:IMPLEMENTS]->(c)
RETURN t.id + ' -[IMPLEMENTS]-> ' + c.id AS implements;

// ============================================================================
// System: TypeBox+AJV Validation Stack
// ============================================================================
// Pattern: TypeBox defines schemas → AJV compiles validators → TypeScript
// infers static types via Static<>. One schema, three uses.

MERGE (s:System {id: 'typebox-ajv-validation'})
ON CREATE SET
  s.name = 'TypeBox+AJV Validation Stack',
  s.purpose = 'Schema-first type safety with runtime validation',
  s.description = 'TypeBox schemas produce JSON Schema (for AJV runtime validation) and TypeScript types (via Static<>) from a single definition. Eliminates drift between compile-time types and runtime checks.',
  s.created = datetime(),
  s.updated = datetime()
ON MATCH SET
  s.updated = datetime();

MATCH (s:System {id: 'typebox-ajv-validation'}), (t:Tool {id: 'typebox'})
MERGE (s)-[r:USES]->(t)
ON CREATE SET r.role = 'schema-definition'
RETURN s.id + ' -[USES]-> ' + t.id AS uses;

MATCH (s:System {id: 'typebox-ajv-validation'}), (t:Tool {id: 'ajv'})
MERGE (s)-[r:USES]->(t)
ON CREATE SET r.role = 'runtime-validator'
RETURN s.id + ' -[USES]-> ' + t.id AS uses;

MATCH (s:System {id: 'typebox-ajv-validation'}), (t:Tool {id: 'typescript'})
MERGE (s)-[r:USES]->(t)
ON CREATE SET r.role = 'static-type-inference'
RETURN s.id + ' -[USES]-> ' + t.id AS uses;

MATCH (s:System {id: 'typebox-ajv-validation'}), (c:Concept {id: 'schema-validation'})
MERGE (s)-[:APPLIES]->(c)
RETURN s.id + ' -[APPLIES]-> ' + c.id AS applies;

MATCH (s:System {id: 'typebox-ajv-validation'}), (c:Concept {id: 'runtime-validation'})
MERGE (s)-[:APPLIES]->(c)
RETURN s.id + ' -[APPLIES]-> ' + c.id AS applies;

MATCH (s:System {id: 'typebox-ajv-validation'}), (c:Concept {id: 'type-guards'})
MERGE (s)-[:APPLIES]->(c)
RETURN s.id + ' -[APPLIES]-> ' + c.id AS applies;

MATCH (s:System {id: 'typebox-ajv-validation'}), (c:Concept {id: 'compile-time-runtime-unification'})
MERGE (s)-[:APPLIES]->(c)
RETURN s.id + ' -[APPLIES]-> ' + c.id AS applies;

// ============================================================================
// System: Varlock+1Password Credential Pipeline
// ============================================================================
// Pattern: .env.schema (committed) → op() references → varlock run →
// 1Password biometric auth → env vars injected into subprocess.
// Secrets never touch disk or git.

MERGE (s:System {id: 'varlock-1password-pipeline'})
ON CREATE SET
  s.name = 'Varlock+1Password Credential Pipeline',
  s.purpose = 'Zero-plaintext secret management for development',
  s.description = 'Committed .env.schema with op() references is resolved at runtime via 1Password biometric auth. Varlock injects secrets as environment variables into subprocesses. AI agents see the schema shape but never credential values. @sensitive annotation enables stdout masking.',
  s.created = datetime(),
  s.updated = datetime()
ON MATCH SET
  s.updated = datetime();

MATCH (s:System {id: 'varlock-1password-pipeline'}), (t:Tool {id: 'varlock'})
MERGE (s)-[r:USES]->(t)
ON CREATE SET r.role = 'env-resolver'
RETURN s.id + ' -[USES]-> ' + t.id AS uses;

MATCH (s:System {id: 'varlock-1password-pipeline'}), (t:Tool {id: '1password'})
MERGE (s)-[r:USES]->(t)
ON CREATE SET r.role = 'secret-store'
RETURN s.id + ' -[USES]-> ' + t.id AS uses;

MATCH (s:System {id: 'varlock-1password-pipeline'}), (c:Concept {id: 'credential-injection'})
MERGE (s)-[:APPLIES]->(c)
RETURN s.id + ' -[APPLIES]-> ' + c.id AS applies;

MATCH (s:System {id: 'varlock-1password-pipeline'}), (c:Concept {id: 'biometric-auth'})
MERGE (s)-[:APPLIES]->(c)
RETURN s.id + ' -[APPLIES]-> ' + c.id AS applies;

// ============================================================================
// System: Neo4j+Docker Graph Infrastructure
// ============================================================================
// Pattern: docker-compose.yml (pinned image) → named volumes → memory tuning →
// healthcheck → cypher files rebuild from scratch via db:reset.

MERGE (s:System {id: 'neo4j-docker-infra'})
ON CREATE SET
  s.name = 'Neo4j+Docker Graph Infrastructure',
  s.purpose = 'Reproducible graph database with pinned versions',
  s.description = 'Exact-pinned Neo4j image in Docker Compose with named volumes, memory tuning (heap + pagecache), query logging, Bolt healthcheck, and APOC Extended. Destroyed and rebuilt from cypher files via db:reset. Port-offset pattern avoids collisions with other Neo4j containers.',
  s.created = datetime(),
  s.updated = datetime()
ON MATCH SET
  s.updated = datetime();

MATCH (s:System {id: 'neo4j-docker-infra'}), (t:Tool {id: 'neo4j'})
MERGE (s)-[r:USES]->(t)
ON CREATE SET r.role = 'graph-engine'
RETURN s.id + ' -[USES]-> ' + t.id AS uses;

MATCH (s:System {id: 'neo4j-docker-infra'}), (t:Tool {id: 'docker-compose'})
MERGE (s)-[r:USES]->(t)
ON CREATE SET r.role = 'orchestration'
RETURN s.id + ' -[USES]-> ' + t.id AS uses;

MATCH (s:System {id: 'neo4j-docker-infra'}), (t:Tool {id: 'docker'})
MERGE (s)-[r:USES]->(t)
ON CREATE SET r.role = 'containerization'
RETURN s.id + ' -[USES]-> ' + t.id AS uses;

MATCH (s:System {id: 'neo4j-docker-infra'}), (t:Tool {id: 'apoc-extended'})
MERGE (s)-[r:USES]->(t)
ON CREATE SET r.role = 'extended-procedures'
RETURN s.id + ' -[USES]-> ' + t.id AS uses;

MATCH (s:System {id: 'neo4j-docker-infra'}), (c:Concept {id: 'image-pinning'})
MERGE (s)-[:APPLIES]->(c)
RETURN s.id + ' -[APPLIES]-> ' + c.id AS applies;

MATCH (s:System {id: 'neo4j-docker-infra'}), (c:Concept {id: 'data-as-code'})
MERGE (s)-[:APPLIES]->(c)
RETURN s.id + ' -[APPLIES]-> ' + c.id AS applies;

// ============================================================================
// System: Cypher as Code
// ============================================================================
// Pattern: Numbered .cypher files are the source of truth for the graph.
// 01-constraints → 02-indexes → 03-06-seed-data → queries/.
// All idempotent (MERGE, IF NOT EXISTS). Rebuild from scratch via db:reset.

MERGE (s:System {id: 'cypher-as-code'})
ON CREATE SET
  s.name = 'Cypher as Code',
  s.purpose = 'Version-controlled graph schema, data, and queries',
  s.description = 'Numbered .cypher files define constraints (01), indexes (02), seed data (03-06), and parameterized query templates (queries/). Files are idempotent via MERGE and IF NOT EXISTS. Navigational index strategy maps index types to traversal patterns: O(1) lookup, DFS, BFS, progressive disclosure, cross-domain search.',
  s.created = datetime(),
  s.updated = datetime()
ON MATCH SET
  s.updated = datetime();

MATCH (s:System {id: 'cypher-as-code'}), (t:Tool {id: 'cypher'})
MERGE (s)-[r:USES]->(t)
ON CREATE SET r.role = 'query-language'
RETURN s.id + ' -[USES]-> ' + t.id AS uses;

MATCH (s:System {id: 'cypher-as-code'}), (t:Tool {id: 'cypher-shell'})
MERGE (s)-[r:USES]->(t)
ON CREATE SET r.role = 'cli-executor'
RETURN s.id + ' -[USES]-> ' + t.id AS uses;

MATCH (s:System {id: 'cypher-as-code'}), (t:Tool {id: 'neo4j-driver'})
MERGE (s)-[r:USES]->(t)
ON CREATE SET r.role = 'programmatic-executor'
RETURN s.id + ' -[USES]-> ' + t.id AS uses;

MATCH (s:System {id: 'cypher-as-code'}), (c:Concept {id: 'idempotent-migrations'})
MERGE (s)-[:APPLIES]->(c)
RETURN s.id + ' -[APPLIES]-> ' + c.id AS applies;

MATCH (s:System {id: 'cypher-as-code'}), (c:Concept {id: 'schema-as-code'})
MERGE (s)-[:APPLIES]->(c)
RETURN s.id + ' -[APPLIES]-> ' + c.id AS applies;

MATCH (s:System {id: 'cypher-as-code'}), (c:Concept {id: 'data-as-code'})
MERGE (s)-[:APPLIES]->(c)
RETURN s.id + ' -[APPLIES]-> ' + c.id AS applies;

MATCH (s:System {id: 'cypher-as-code'}), (c:Concept {id: 'navigational-indexes'})
MERGE (s)-[:APPLIES]->(c)
RETURN s.id + ' -[APPLIES]-> ' + c.id AS applies;

MATCH (s:System {id: 'cypher-as-code'}), (c:Concept {id: 'graph-traversal'})
MERGE (s)-[:APPLIES]->(c)
RETURN s.id + ' -[APPLIES]-> ' + c.id AS applies;

MATCH (s:System {id: 'cypher-as-code'}), (c:Concept {id: 'progressive-disclosure'})
MERGE (s)-[:APPLIES]->(c)
RETURN s.id + ' -[APPLIES]-> ' + c.id AS applies;

// ============================================================================
// kbac incorporates all meta-frameworks
// ============================================================================

MATCH (kbac:System {id: 'kbac'}), (sub:System {id: 'typebox-ajv-validation'})
MERGE (kbac)-[r:DEPENDS_ON]->(sub)
ON CREATE SET r.type = 'incorporates'
RETURN kbac.id + ' -[DEPENDS_ON]-> ' + sub.id AS depends_on;

MATCH (kbac:System {id: 'kbac'}), (sub:System {id: 'varlock-1password-pipeline'})
MERGE (kbac)-[r:DEPENDS_ON]->(sub)
ON CREATE SET r.type = 'incorporates'
RETURN kbac.id + ' -[DEPENDS_ON]-> ' + sub.id AS depends_on;

MATCH (kbac:System {id: 'kbac'}), (sub:System {id: 'neo4j-docker-infra'})
MERGE (kbac)-[r:DEPENDS_ON]->(sub)
ON CREATE SET r.type = 'incorporates'
RETURN kbac.id + ' -[DEPENDS_ON]-> ' + sub.id AS depends_on;

MATCH (kbac:System {id: 'kbac'}), (sub:System {id: 'cypher-as-code'})
MERGE (kbac)-[r:DEPENDS_ON]->(sub)
ON CREATE SET r.type = 'incorporates'
RETURN kbac.id + ' -[DEPENDS_ON]-> ' + sub.id AS depends_on;

// kbac applies the new concepts
MATCH (s:System {id: 'kbac'}), (c:Concept {id: 'idempotent-migrations'})
MERGE (s)-[:APPLIES]->(c)
RETURN s.id + ' -[APPLIES]-> ' + c.id AS applies;

MATCH (s:System {id: 'kbac'}), (c:Concept {id: 'schema-as-code'})
MERGE (s)-[:APPLIES]->(c)
RETURN s.id + ' -[APPLIES]-> ' + c.id AS applies;

MATCH (s:System {id: 'kbac'}), (c:Concept {id: 'navigational-indexes'})
MERGE (s)-[:APPLIES]->(c)
RETURN s.id + ' -[APPLIES]-> ' + c.id AS applies;

MATCH (s:System {id: 'kbac'}), (c:Concept {id: 'compile-time-runtime-unification'})
MERGE (s)-[:APPLIES]->(c)
RETURN s.id + ' -[APPLIES]-> ' + c.id AS applies;

// ============================================================================
// All systems belong to the meta-frameworks domain
// ============================================================================

MATCH (s:System {id: 'typebox-ajv-validation'}), (d:Domain {id: 'meta-frameworks'})
MERGE (s)-[:BELONGS_TO]->(d)
RETURN s.id + ' -> ' + d.id AS belongs_to;

MATCH (s:System {id: 'varlock-1password-pipeline'}), (d:Domain {id: 'meta-frameworks'})
MERGE (s)-[:BELONGS_TO]->(d)
RETURN s.id + ' -> ' + d.id AS belongs_to;

MATCH (s:System {id: 'neo4j-docker-infra'}), (d:Domain {id: 'meta-frameworks'})
MERGE (s)-[:BELONGS_TO]->(d)
RETURN s.id + ' -> ' + d.id AS belongs_to;

MATCH (s:System {id: 'cypher-as-code'}), (d:Domain {id: 'meta-frameworks'})
MERGE (s)-[:BELONGS_TO]->(d)
RETURN s.id + ' -> ' + d.id AS belongs_to;

MATCH (s:System {id: 'kbac'}), (d:Domain {id: 'meta-frameworks'})
MERGE (s)-[:BELONGS_TO]->(d)
RETURN s.id + ' -> ' + d.id AS belongs_to;

// Composition-oriented concepts also belong to meta-frameworks
MATCH (c:Concept {id: 'compile-time-runtime-unification'}), (d:Domain {id: 'meta-frameworks'})
MERGE (c)-[:BELONGS_TO]->(d)
RETURN c.id + ' -> ' + d.id AS belongs_to;

MATCH (c:Concept {id: 'idempotent-migrations'}), (d:Domain {id: 'meta-frameworks'})
MERGE (c)-[:BELONGS_TO]->(d)
RETURN c.id + ' -> ' + d.id AS belongs_to;

MATCH (c:Concept {id: 'schema-as-code'}), (d:Domain {id: 'meta-frameworks'})
MERGE (c)-[:BELONGS_TO]->(d)
RETURN c.id + ' -> ' + d.id AS belongs_to;

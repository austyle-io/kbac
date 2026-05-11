// Seed tool nodes — the tools that compose the kbac stack
// Also establishes BELONGS_TO, DEPENDS_ON, and COMPOSES_WITH relationships.
// Uses MERGE for idempotency: safe to run multiple times without duplicates.
//
// Run: npm run cypher -- cypher/04-seed-tools.cypher

// --- Tool nodes ---

MERGE (t:Tool {id: 'neo4j'})
ON CREATE SET
  t.name = 'Neo4j',
  t.type = 'database',
  t.version = '2026.02.3',
  t.description = 'Graph database with native graph storage and Cypher query language',
  t.created = datetime(),
  t.updated = datetime()
ON MATCH SET
  t.updated = datetime()
RETURN t.id AS id, t.name AS name;

MERGE (t:Tool {id: 'apoc-extended'})
ON CREATE SET
  t.name = 'APOC Extended',
  t.type = 'plugin',
  t.version = '2026.02.0',
  t.description = 'Community-maintained procedures and functions for Neo4j',
  t.created = datetime(),
  t.updated = datetime()
ON MATCH SET
  t.updated = datetime()
RETURN t.id AS id, t.name AS name;

MERGE (t:Tool {id: 'neo4j-driver'})
ON CREATE SET
  t.name = 'neo4j-driver',
  t.type = 'library',
  t.version = '6.0.1',
  t.description = 'Official Neo4j JavaScript/TypeScript driver for Bolt protocol',
  t.created = datetime(),
  t.updated = datetime()
ON MATCH SET
  t.updated = datetime()
RETURN t.id AS id, t.name AS name;

MERGE (t:Tool {id: 'typebox'})
ON CREATE SET
  t.name = 'TypeBox',
  t.type = 'library',
  t.description = 'JSON Schema type builder with static TypeScript inference',
  t.created = datetime(),
  t.updated = datetime()
ON MATCH SET
  t.updated = datetime()
RETURN t.id AS id, t.name AS name;

MERGE (t:Tool {id: 'ajv'})
ON CREATE SET
  t.name = 'Ajv',
  t.type = 'library',
  t.description = 'High-performance JSON Schema validator',
  t.created = datetime(),
  t.updated = datetime()
ON MATCH SET
  t.updated = datetime()
RETURN t.id AS id, t.name AS name;

MERGE (t:Tool {id: 'varlock'})
ON CREATE SET
  t.name = 'Varlock',
  t.type = 'cli',
  t.version = '0.7.x',
  t.description = 'Environment variable manager with 1Password integration',
  t.created = datetime(),
  t.updated = datetime()
ON MATCH SET
  t.updated = datetime()
RETURN t.id AS id, t.name AS name;

MERGE (t:Tool {id: 'tsx'})
ON CREATE SET
  t.name = 'tsx',
  t.type = 'cli',
  t.description = 'TypeScript execute — runs .ts files directly via esbuild',
  t.created = datetime(),
  t.updated = datetime()
ON MATCH SET
  t.updated = datetime()
RETURN t.id AS id, t.name AS name;

MERGE (t:Tool {id: 'typescript'})
ON CREATE SET
  t.name = 'TypeScript',
  t.type = 'language',
  t.version = '6.0.2',
  t.description = 'Typed superset of JavaScript with static analysis',
  t.created = datetime(),
  t.updated = datetime()
ON MATCH SET
  t.updated = datetime()
RETURN t.id AS id, t.name AS name;

MERGE (t:Tool {id: 'docker'})
ON CREATE SET
  t.name = 'Docker',
  t.type = 'platform',
  t.description = 'Container platform for packaging and running applications',
  t.created = datetime(),
  t.updated = datetime()
ON MATCH SET
  t.updated = datetime()
RETURN t.id AS id, t.name AS name;

MERGE (t:Tool {id: 'cypher-shell'})
ON CREATE SET
  t.name = 'cypher-shell',
  t.type = 'cli',
  t.version = '2026.03.1',
  t.description = 'Command-line tool for executing Cypher queries against Neo4j',
  t.created = datetime(),
  t.updated = datetime()
ON MATCH SET
  t.updated = datetime()
RETURN t.id AS id, t.name AS name;

// --- BELONGS_TO relationships (Tool -> Domain) ---

// neo4j -> graph-databases
MATCH (t:Tool {id: 'neo4j'}), (d:Domain {id: 'graph-databases'})
MERGE (t)-[:BELONGS_TO]->(d)
RETURN t.id + ' -> ' + d.id AS belongs_to;

// apoc-extended -> graph-databases
MATCH (t:Tool {id: 'apoc-extended'}), (d:Domain {id: 'graph-databases'})
MERGE (t)-[:BELONGS_TO]->(d)
RETURN t.id + ' -> ' + d.id AS belongs_to;

// neo4j-driver -> graph-databases
MATCH (t:Tool {id: 'neo4j-driver'}), (d:Domain {id: 'graph-databases'})
MERGE (t)-[:BELONGS_TO]->(d)
RETURN t.id + ' -> ' + d.id AS belongs_to;

// typebox -> validation
MATCH (t:Tool {id: 'typebox'}), (d:Domain {id: 'validation'})
MERGE (t)-[:BELONGS_TO]->(d)
RETURN t.id + ' -> ' + d.id AS belongs_to;

// typebox -> typescript
MATCH (t:Tool {id: 'typebox'}), (d:Domain {id: 'typescript'})
MERGE (t)-[:BELONGS_TO]->(d)
RETURN t.id + ' -> ' + d.id AS belongs_to;

// ajv -> validation
MATCH (t:Tool {id: 'ajv'}), (d:Domain {id: 'validation'})
MERGE (t)-[:BELONGS_TO]->(d)
RETURN t.id + ' -> ' + d.id AS belongs_to;

// varlock -> credential-management
MATCH (t:Tool {id: 'varlock'}), (d:Domain {id: 'credential-management'})
MERGE (t)-[:BELONGS_TO]->(d)
RETURN t.id + ' -> ' + d.id AS belongs_to;

// tsx -> typescript
MATCH (t:Tool {id: 'tsx'}), (d:Domain {id: 'typescript'})
MERGE (t)-[:BELONGS_TO]->(d)
RETURN t.id + ' -> ' + d.id AS belongs_to;

// typescript -> typescript domain
MATCH (t:Tool {id: 'typescript'}), (d:Domain {id: 'typescript'})
MERGE (t)-[:BELONGS_TO]->(d)
RETURN t.id + ' -> ' + d.id AS belongs_to;

// docker -> infrastructure
MATCH (t:Tool {id: 'docker'}), (d:Domain {id: 'infrastructure'})
MERGE (t)-[:BELONGS_TO]->(d)
RETURN t.id + ' -> ' + d.id AS belongs_to;

// cypher-shell -> graph-databases
MATCH (t:Tool {id: 'cypher-shell'}), (d:Domain {id: 'graph-databases'})
MERGE (t)-[:BELONGS_TO]->(d)
RETURN t.id + ' -> ' + d.id AS belongs_to;

// --- DEPENDS_ON relationships (Tool -> Tool) ---
// MERGE the relationship first, then set properties to avoid duplicate creation

// apoc-extended depends on neo4j (runtime)
MATCH (a:Tool {id: 'apoc-extended'}), (b:Tool {id: 'neo4j'})
MERGE (a)-[r:DEPENDS_ON]->(b)
ON CREATE SET r.type = 'runtime'
RETURN a.id + ' -[DEPENDS_ON]-> ' + b.id AS depends_on;

// neo4j-driver depends on neo4j (runtime)
MATCH (a:Tool {id: 'neo4j-driver'}), (b:Tool {id: 'neo4j'})
MERGE (a)-[r:DEPENDS_ON]->(b)
ON CREATE SET r.type = 'runtime'
RETURN a.id + ' -[DEPENDS_ON]-> ' + b.id AS depends_on;

// tsx depends on typescript (runtime)
MATCH (a:Tool {id: 'tsx'}), (b:Tool {id: 'typescript'})
MERGE (a)-[r:DEPENDS_ON]->(b)
ON CREATE SET r.type = 'runtime'
RETURN a.id + ' -[DEPENDS_ON]-> ' + b.id AS depends_on;

// cypher-shell depends on neo4j (runtime)
MATCH (a:Tool {id: 'cypher-shell'}), (b:Tool {id: 'neo4j'})
MERGE (a)-[r:DEPENDS_ON]->(b)
ON CREATE SET r.type = 'runtime'
RETURN a.id + ' -[DEPENDS_ON]-> ' + b.id AS depends_on;

// ajv depends on typebox (runtime) — ajv compiles typebox schemas
MATCH (a:Tool {id: 'ajv'}), (b:Tool {id: 'typebox'})
MERGE (a)-[r:DEPENDS_ON]->(b)
ON CREATE SET r.type = 'runtime'
RETURN a.id + ' -[DEPENDS_ON]-> ' + b.id AS depends_on;

// varlock depends on docker (optional) — varlock can inject into docker compose
MATCH (a:Tool {id: 'varlock'}), (b:Tool {id: 'docker'})
MERGE (a)-[r:DEPENDS_ON]->(b)
ON CREATE SET r.type = 'optional'
RETURN a.id + ' -[DEPENDS_ON]-> ' + b.id AS depends_on;

// --- COMPOSES_WITH relationships (Tool -> Tool) ---

// typebox composes with ajv (schema-to-validator pattern)
MATCH (a:Tool {id: 'typebox'}), (b:Tool {id: 'ajv'})
MERGE (a)-[r:COMPOSES_WITH]->(b)
ON CREATE SET r.pattern = 'schema-to-validator'
RETURN a.id + ' -[COMPOSES_WITH]-> ' + b.id AS composes_with;

// neo4j-driver composes with typebox (typed-query-results pattern)
MATCH (a:Tool {id: 'neo4j-driver'}), (b:Tool {id: 'typebox'})
MERGE (a)-[r:COMPOSES_WITH]->(b)
ON CREATE SET r.pattern = 'typed-query-results'
RETURN a.id + ' -[COMPOSES_WITH]-> ' + b.id AS composes_with;

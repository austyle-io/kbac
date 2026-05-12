// Seed concept nodes — abstract patterns and practices in the knowledge graph
// Also establishes IMPLEMENTS and BELONGS_TO relationships.
// Uses MERGE for idempotency: safe to run multiple times without duplicates.
//
// Run: npm run cypher -- cypher/05-seed-concepts.cypher

// --- Concept nodes ---

MERGE (c:Concept {id: 'schema-validation'})
ON CREATE SET
  c.name = 'Schema Validation',
  c.description = 'Validating data against defined schemas',
  c.created = datetime(),
  c.updated = datetime()
ON MATCH SET
  c.updated = datetime()
RETURN c.id AS id, c.name AS name;

MERGE (c:Concept {id: 'runtime-validation'})
ON CREATE SET
  c.name = 'Runtime Validation',
  c.description = 'Checking types at execution time',
  c.created = datetime(),
  c.updated = datetime()
ON MATCH SET
  c.updated = datetime()
RETURN c.id AS id, c.name AS name;

MERGE (c:Concept {id: 'type-guards'})
ON CREATE SET
  c.name = 'Type Guards',
  c.description = 'TypeScript narrowing via runtime checks',
  c.created = datetime(),
  c.updated = datetime()
ON MATCH SET
  c.updated = datetime()
RETURN c.id AS id, c.name AS name;

MERGE (c:Concept {id: 'knowledge-graph'})
ON CREATE SET
  c.name = 'Knowledge Graph',
  c.description = 'Structured knowledge in graph form',
  c.created = datetime(),
  c.updated = datetime()
ON MATCH SET
  c.updated = datetime()
RETURN c.id AS id, c.name AS name;

MERGE (c:Concept {id: 'data-as-code'})
ON CREATE SET
  c.name = 'Data as Code',
  c.description = 'Managing data through version-controlled files',
  c.created = datetime(),
  c.updated = datetime()
ON MATCH SET
  c.updated = datetime()
RETURN c.id AS id, c.name AS name;

MERGE (c:Concept {id: 'graph-traversal'})
ON CREATE SET
  c.name = 'Graph Traversal',
  c.description = 'Navigating graph structures (DFS, BFS)',
  c.created = datetime(),
  c.updated = datetime()
ON MATCH SET
  c.updated = datetime()
RETURN c.id AS id, c.name AS name;

MERGE (c:Concept {id: 'progressive-disclosure'})
ON CREATE SET
  c.name = 'Progressive Disclosure',
  c.description = 'Layered information revealing',
  c.created = datetime(),
  c.updated = datetime()
ON MATCH SET
  c.updated = datetime()
RETURN c.id AS id, c.name AS name;

// --- IMPLEMENTS relationships (Tool -> Concept) ---

// typebox implements schema-validation
MATCH (t:Tool {id: 'typebox'}), (c:Concept {id: 'schema-validation'})
MERGE (t)-[:IMPLEMENTS]->(c)
RETURN t.id + ' -[IMPLEMENTS]-> ' + c.id AS implements;

// ajv implements runtime-validation
MATCH (t:Tool {id: 'ajv'}), (c:Concept {id: 'runtime-validation'})
MERGE (t)-[:IMPLEMENTS]->(c)
RETURN t.id + ' -[IMPLEMENTS]-> ' + c.id AS implements;

// typebox implements type-guards
MATCH (t:Tool {id: 'typebox'}), (c:Concept {id: 'type-guards'})
MERGE (t)-[:IMPLEMENTS]->(c)
RETURN t.id + ' -[IMPLEMENTS]-> ' + c.id AS implements;

// neo4j implements knowledge-graph
MATCH (t:Tool {id: 'neo4j'}), (c:Concept {id: 'knowledge-graph'})
MERGE (t)-[:IMPLEMENTS]->(c)
RETURN t.id + ' -[IMPLEMENTS]-> ' + c.id AS implements;

// neo4j-driver implements graph-traversal
MATCH (t:Tool {id: 'neo4j-driver'}), (c:Concept {id: 'graph-traversal'})
MERGE (t)-[:IMPLEMENTS]->(c)
RETURN t.id + ' -[IMPLEMENTS]-> ' + c.id AS implements;

// --- BELONGS_TO relationships (Concept -> Domain) ---

// schema-validation -> validation
MATCH (c:Concept {id: 'schema-validation'}), (d:Domain {id: 'validation'})
MERGE (c)-[:BELONGS_TO]->(d)
RETURN c.id + ' -> ' + d.id AS belongs_to;

// runtime-validation -> validation
MATCH (c:Concept {id: 'runtime-validation'}), (d:Domain {id: 'validation'})
MERGE (c)-[:BELONGS_TO]->(d)
RETURN c.id + ' -> ' + d.id AS belongs_to;

// type-guards -> typescript
MATCH (c:Concept {id: 'type-guards'}), (d:Domain {id: 'typescript'})
MERGE (c)-[:BELONGS_TO]->(d)
RETURN c.id + ' -> ' + d.id AS belongs_to;

// knowledge-graph -> graph-databases
MATCH (c:Concept {id: 'knowledge-graph'}), (d:Domain {id: 'graph-databases'})
MERGE (c)-[:BELONGS_TO]->(d)
RETURN c.id + ' -> ' + d.id AS belongs_to;

// data-as-code -> infrastructure
MATCH (c:Concept {id: 'data-as-code'}), (d:Domain {id: 'infrastructure'})
MERGE (c)-[:BELONGS_TO]->(d)
RETURN c.id + ' -> ' + d.id AS belongs_to;

// graph-traversal -> graph-databases
MATCH (c:Concept {id: 'graph-traversal'}), (d:Domain {id: 'graph-databases'})
MERGE (c)-[:BELONGS_TO]->(d)
RETURN c.id + ' -> ' + d.id AS belongs_to;

// progressive-disclosure -> ai-tooling
MATCH (c:Concept {id: 'progressive-disclosure'}), (d:Domain {id: 'ai-tooling'})
MERGE (c)-[:BELONGS_TO]->(d)
RETURN c.id + ' -> ' + d.id AS belongs_to;

// Seed system node — kbac itself, the self-referential entry point
// Establishes USES and APPLIES relationships connecting the system to its tools and concepts.
// Uses MERGE for idempotency: safe to run multiple times without duplicates.
//
// Run: npm run cypher -- cypher/06-seed-systems.cypher

// --- System node ---

MERGE (s:System {id: 'kbac'})
ON CREATE SET
  s.name = 'kbac',
  s.version = '0.1.0',
  s.purpose = 'AI agent context sharing via graph',
  s.description = 'Knowledge base as code — Neo4j graph for AI agent context sharing',
  s.created = datetime(),
  s.updated = datetime()
ON MATCH SET
  s.updated = datetime()
RETURN s.id AS id, s.name AS name;

// --- USES relationships (System -> Tool, with role) ---

// kbac uses neo4j for graph storage
MATCH (s:System {id: 'kbac'}), (t:Tool {id: 'neo4j'})
MERGE (s)-[r:USES]->(t)
ON CREATE SET r.role = 'graph-storage'
RETURN s.id + ' -[USES]-> ' + t.id AS uses;

// kbac uses neo4j-driver as bolt client
MATCH (s:System {id: 'kbac'}), (t:Tool {id: 'neo4j-driver'})
MERGE (s)-[r:USES]->(t)
ON CREATE SET r.role = 'bolt-client'
RETURN s.id + ' -[USES]-> ' + t.id AS uses;

// kbac uses typebox for schema definitions
MATCH (s:System {id: 'kbac'}), (t:Tool {id: 'typebox'})
MERGE (s)-[r:USES]->(t)
ON CREATE SET r.role = 'schema-definitions'
RETURN s.id + ' -[USES]-> ' + t.id AS uses;

// kbac uses ajv for runtime validation
MATCH (s:System {id: 'kbac'}), (t:Tool {id: 'ajv'})
MERGE (s)-[r:USES]->(t)
ON CREATE SET r.role = 'runtime-validation'
RETURN s.id + ' -[USES]-> ' + t.id AS uses;

// kbac uses varlock for credential management
MATCH (s:System {id: 'kbac'}), (t:Tool {id: 'varlock'})
MERGE (s)-[r:USES]->(t)
ON CREATE SET r.role = 'credential-management'
RETURN s.id + ' -[USES]-> ' + t.id AS uses;

// kbac uses tsx as typescript runner
MATCH (s:System {id: 'kbac'}), (t:Tool {id: 'tsx'})
MERGE (s)-[r:USES]->(t)
ON CREATE SET r.role = 'typescript-runner'
RETURN s.id + ' -[USES]-> ' + t.id AS uses;

// kbac uses docker for containerization
MATCH (s:System {id: 'kbac'}), (t:Tool {id: 'docker'})
MERGE (s)-[r:USES]->(t)
ON CREATE SET r.role = 'containerization'
RETURN s.id + ' -[USES]-> ' + t.id AS uses;

// --- APPLIES relationships (System -> Concept) ---

// kbac applies the knowledge-graph concept
MATCH (s:System {id: 'kbac'}), (c:Concept {id: 'knowledge-graph'})
MERGE (s)-[:APPLIES]->(c)
RETURN s.id + ' -[APPLIES]-> ' + c.id AS applies;

// kbac applies schema-validation
MATCH (s:System {id: 'kbac'}), (c:Concept {id: 'schema-validation'})
MERGE (s)-[:APPLIES]->(c)
RETURN s.id + ' -[APPLIES]-> ' + c.id AS applies;

// kbac applies runtime-validation
MATCH (s:System {id: 'kbac'}), (c:Concept {id: 'runtime-validation'})
MERGE (s)-[:APPLIES]->(c)
RETURN s.id + ' -[APPLIES]-> ' + c.id AS applies;

// kbac applies credential-injection
MATCH (s:System {id: 'kbac'}), (c:Concept {id: 'credential-injection'})
MERGE (s)-[:APPLIES]->(c)
RETURN s.id + ' -[APPLIES]-> ' + c.id AS applies;

// kbac applies data-as-code
MATCH (s:System {id: 'kbac'}), (c:Concept {id: 'data-as-code'})
MERGE (s)-[:APPLIES]->(c)
RETURN s.id + ' -[APPLIES]-> ' + c.id AS applies;

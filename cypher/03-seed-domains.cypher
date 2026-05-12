// Seed domain nodes — top-level categories that organize the knowledge graph
// Uses MERGE for idempotency: safe to run multiple times without duplicates.
//
// Run: npm run cypher -- cypher/03-seed-domains.cypher

// Graph Databases — Neo4j, Cypher, graph storage and query systems
MERGE (d:Domain {id: 'graph-databases'})
ON CREATE SET
  d.name = 'Graph Databases',
  d.category = 'data',
  d.description = 'Graph storage and query systems',
  d.created = datetime(),
  d.updated = datetime()
ON MATCH SET
  d.updated = datetime()
RETURN d.id AS id, d.name AS name;

// TypeScript — typed JavaScript ecosystem
MERGE (d:Domain {id: 'typescript'})
ON CREATE SET
  d.name = 'TypeScript',
  d.category = 'language',
  d.description = 'Typed JavaScript ecosystem',
  d.created = datetime(),
  d.updated = datetime()
ON MATCH SET
  d.updated = datetime()
RETURN d.id AS id, d.name AS name;

// AI Tooling — AI agent frameworks and tools
MERGE (d:Domain {id: 'ai-tooling'})
ON CREATE SET
  d.name = 'AI Tooling',
  d.category = 'ai',
  d.description = 'AI agent frameworks and tools',
  d.created = datetime(),
  d.updated = datetime()
ON MATCH SET
  d.updated = datetime()
RETURN d.id AS id, d.name AS name;

// Infrastructure — Docker, containers, CI/CD
MERGE (d:Domain {id: 'infrastructure'})
ON CREATE SET
  d.name = 'Infrastructure',
  d.category = 'ops',
  d.description = 'Docker, containers, CI/CD',
  d.created = datetime(),
  d.updated = datetime()
ON MATCH SET
  d.updated = datetime()
RETURN d.id AS id, d.name AS name;


// Validation — data validation and type checking
MERGE (d:Domain {id: 'validation'})
ON CREATE SET
  d.name = 'Validation',
  d.category = 'data',
  d.description = 'Data validation and type checking',
  d.created = datetime(),
  d.updated = datetime()
ON MATCH SET
  d.updated = datetime()
RETURN d.id AS id, d.name AS name;

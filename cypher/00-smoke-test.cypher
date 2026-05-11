// Smoke test: validates Cypher 25 + APOC on Neo4j 2026.x
// Run: npx varlock run -- sh -c 'cypher-shell -a bolt://localhost:7688 -u neo4j -p "$NEO4J_PASSWORD" < cypher/00-smoke-test.cypher'

// 1. Basic Cypher 25 syntax
RETURN 1 AS smoke_test;

// 2. APOC availability
SHOW PROCEDURES YIELD name WHERE name STARTS WITH 'apoc' RETURN count(*) AS apoc_procedures;

// 3. Create and clean up a test node
CREATE (t:SmokeTest {created: datetime(), engine: 'cypher25'})
RETURN t.created AS created, t.engine AS engine;

// 4. Verify and delete
MATCH (t:SmokeTest) DELETE t
RETURN count(*) AS deleted;

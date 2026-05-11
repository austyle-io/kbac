// Uniqueness constraints for all node labels
// Enables O(1) lookup by id on every core label, preventing duplicate nodes
// and allowing MERGE operations to match on id efficiently.
//
// Cypher 25 syntax: FOR ... REQUIRE (not ASSERT)
// Run: npm run cypher -- cypher/01-constraints.cypher

// Tool nodes — uniquely identified by id
CREATE CONSTRAINT tool_id_unique IF NOT EXISTS
FOR (t:Tool) REQUIRE t.id IS UNIQUE;

// Concept nodes — uniquely identified by id
CREATE CONSTRAINT concept_id_unique IF NOT EXISTS
FOR (c:Concept) REQUIRE c.id IS UNIQUE;

// Domain nodes — uniquely identified by id
CREATE CONSTRAINT domain_id_unique IF NOT EXISTS
FOR (d:Domain) REQUIRE d.id IS UNIQUE;

// System nodes — uniquely identified by id
CREATE CONSTRAINT system_id_unique IF NOT EXISTS
FOR (s:System) REQUIRE s.id IS UNIQUE;

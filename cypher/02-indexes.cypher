// Indexes for efficient graph navigation and search
// Each index serves a specific navigational purpose for AI agent queries.
//
// Run: npm run cypher -- cypher/02-indexes.cypher

// Range index on Tool.name — enables fast lookup when agents search tools by name
// (e.g., "find the neo4j tool" or listing tools alphabetically)
CREATE INDEX tool_name_range IF NOT EXISTS
FOR (t:Tool) ON (t.name);

// Range index on Concept.name — enables fast lookup when agents search concepts by name
// (e.g., "what is schema-validation" or browsing concepts)
CREATE INDEX concept_name_range IF NOT EXISTS
FOR (c:Concept) ON (c.name);

// Composite index on Domain (name, category) — supports progressive disclosure queries
// where agents first filter by category then drill into specific domains
// (e.g., "show me all domains in the validation category")
CREATE INDEX domain_name_category_composite IF NOT EXISTS
FOR (d:Domain) ON (d.name, d.category);

// Fulltext index on Tool — powers natural language search for tools
// (e.g., "find tools related to runtime type checking")
CREATE FULLTEXT INDEX tool_search IF NOT EXISTS
FOR (t:Tool) ON EACH [t.name, t.description];

// Fulltext index on Concept — powers natural language search for concepts
// (e.g., "find concepts related to validation")
CREATE FULLTEXT INDEX concept_search IF NOT EXISTS
FOR (c:Concept) ON EACH [c.name, c.description];

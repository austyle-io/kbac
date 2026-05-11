// ============================================================================
// O(1) Lookup — Index-Backed Direct Access
// ============================================================================
//
// Pattern: Single-node retrieval by unique id property.
//
// When to use:
//   - Entry point for all graph queries — resolve a known id to its node
//   - API endpoints that receive a node id and need its properties
//   - First step before any traversal (anchor the starting node)
//
// Index support:
//   - Backed by uniqueness constraints from 01-constraints.cypher
//   - Each constraint creates a RANGE index on (Label.id)
//   - Planner uses NodeUniqueIndexSeek — O(1) regardless of graph size
//
// NOTE: These are parameterized templates for the TypeScript service layer
// ($param syntax). They are NOT for direct use with run-cypher.ts, which
// does not support parameter injection. Use neo4j-driver's session.run()
// with a parameters object: session.run(query, { id: "neo4j" })
//
// Cypher cannot parameterize labels, so each label requires its own query.
// ============================================================================

// ---------------------------------------------------------------------------
// Variant 1: Direct lookup by label
// ---------------------------------------------------------------------------

// Lookup a Tool by id
MATCH (t:Tool {id: $id})
RETURN t;

// Lookup a Concept by id
MATCH (c:Concept {id: $id})
RETURN c;

// Lookup a Domain by id
MATCH (d:Domain {id: $id})
RETURN d;

// Lookup a System by id
MATCH (s:System {id: $id})
RETURN s;

// ---------------------------------------------------------------------------
// Variant 2: Lookup with immediate neighborhood
// ---------------------------------------------------------------------------
// Returns the node plus all directly connected neighbors with relationship
// metadata. Useful for rendering a detail view with context.

// Tool with full neighborhood
MATCH (t:Tool {id: $id})
OPTIONAL MATCH (t)-[r]-(neighbor)
RETURN t,
       collect({
         type: type(r),
         direction: CASE WHEN startNode(r) = t THEN 'outgoing' ELSE 'incoming' END,
         node: neighbor
       }) AS connections;

// Concept with full neighborhood
MATCH (c:Concept {id: $id})
OPTIONAL MATCH (c)-[r]-(neighbor)
RETURN c,
       collect({
         type: type(r),
         direction: CASE WHEN startNode(r) = c THEN 'outgoing' ELSE 'incoming' END,
         node: neighbor
       }) AS connections;

// Domain with full neighborhood
MATCH (d:Domain {id: $id})
OPTIONAL MATCH (d)-[r]-(neighbor)
RETURN d,
       collect({
         type: type(r),
         direction: CASE WHEN startNode(r) = d THEN 'outgoing' ELSE 'incoming' END,
         node: neighbor
       }) AS connections;

// System with full neighborhood
MATCH (s:System {id: $id})
OPTIONAL MATCH (s)-[r]-(neighbor)
RETURN s,
       collect({
         type: type(r),
         direction: CASE WHEN startNode(r) = s THEN 'outgoing' ELSE 'incoming' END,
         node: neighbor
       }) AS connections;

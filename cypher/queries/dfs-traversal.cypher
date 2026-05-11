// ============================================================================
// Depth-First Traversal — Variable-Length Path Queries
// ============================================================================
//
// Pattern: Follow relationship chains to arbitrary depth using *min..max
// variable-length patterns. Neo4j's traversal framework explores depth-first
// by default for variable-length path expressions.
//
// When to use:
//   - Dependency resolution: what does this tool transitively depend on?
//   - Impact analysis: what breaks if this tool changes?
//   - Ancestry/lineage: trace a concept back through its composition chain
//
// Index support:
//   - Start node resolved via uniqueness constraint index (O(1) anchor)
//   - Traversal itself is O(V+E) over the reachable subgraph
//   - Relationship type filtering (:DEPENDS_ON) prunes irrelevant edges
//   - Depth cap (*1..5) bounds worst-case expansion
//
// NOTE: These are parameterized templates for the TypeScript service layer
// ($param syntax). They are NOT for direct use with run-cypher.ts, which
// does not support parameter injection. Use neo4j-driver's session.run()
// with a parameters object: session.run(query, { id: "neo4j" })
// ============================================================================

// ---------------------------------------------------------------------------
// Variant 1: Forward dependency chain
// ---------------------------------------------------------------------------
// What does this tool depend on, transitively?
// Returns each chain as an ordered list of names with its depth.

MATCH path = (start:Tool {id: $id})-[:DEPENDS_ON*1..5]->(dep)
RETURN [n IN nodes(path) | n.name] AS chain,
       length(path) AS depth
ORDER BY depth;

// ---------------------------------------------------------------------------
// Variant 2: Full dependency tree with per-node depth
// ---------------------------------------------------------------------------
// Unwinds every path into individual nodes with their distance from start.
// Deduplicates nodes that appear at multiple depths (keeps the shallowest).

MATCH path = (start:Tool {id: $id})-[:DEPENDS_ON*1..5]->(dep)
WITH start, nodes(path) AS chain
UNWIND range(1, size(chain) - 1) AS idx
WITH chain[idx] AS node, idx AS depth
RETURN DISTINCT node.id AS id,
       node.name AS name,
       labels(node) AS labels,
       min(depth) AS shallowest_depth
ORDER BY shallowest_depth, name;

// ---------------------------------------------------------------------------
// Variant 3: Reverse dependency chain (impact analysis)
// ---------------------------------------------------------------------------
// Who depends on this tool, transitively? If this tool breaks, what is affected?

MATCH path = (dependent)-[:DEPENDS_ON*1..5]->(target:Tool {id: $id})
RETURN [n IN nodes(path) | n.name] AS chain,
       length(path) AS depth
ORDER BY depth;

// ---------------------------------------------------------------------------
// Variant 4: Mixed-relationship depth traversal
// ---------------------------------------------------------------------------
// Follow DEPENDS_ON and USES relationships to find the full downstream tree
// of a tool — everything it relies on, directly or transitionally.

MATCH path = (start:Tool {id: $id})-[:DEPENDS_ON|USES*1..5]->(downstream)
RETURN [n IN nodes(path) | n.name] AS chain,
       [r IN relationships(path) | type(r)] AS relationship_types,
       length(path) AS depth
ORDER BY depth;

// ---------------------------------------------------------------------------
// Variant 5: Concept composition depth
// ---------------------------------------------------------------------------
// Trace how a concept is composed from other concepts.

MATCH path = (start:Concept {id: $id})-[:COMPOSES_WITH*1..5]->(composed)
RETURN [n IN nodes(path) | n.name] AS composition_chain,
       length(path) AS depth
ORDER BY depth;

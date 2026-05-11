// ============================================================================
// Breadth-First Traversal — Nearest-Neighbor Exploration
// ============================================================================
//
// Pattern: Expand outward from an anchor node level by level, visiting
// nearer nodes before farther ones. Uses shortestPath() and bounded
// variable-length patterns grouped by distance.
//
// When to use:
//   - "What is closest to X?" — find the nearest related tools/concepts
//   - Shortest connection between two nodes in the graph
//   - Level-by-level exploration for UI drill-down
//   - Relevance ranking: closer = more relevant
//
// Index support:
//   - Start/end nodes resolved via uniqueness constraint index (O(1) anchor)
//   - shortestPath() uses BFS internally — O(V+E) bounded by max depth
//   - Neo4j's ShortestPath planner optimizes bidirectional BFS for
//     single-pair shortest path queries
//
// NOTE: These are parameterized templates for the TypeScript service layer
// ($param syntax). They are NOT for direct use with run-cypher.ts, which
// does not support parameter injection. Use neo4j-driver's session.run()
// with a parameters object: session.run(query, { id: "neo4j" })
// ============================================================================

// ---------------------------------------------------------------------------
// Variant 1: Shortest path between two nodes (any relationship type)
// ---------------------------------------------------------------------------
// Find the shortest connection between any two nodes regardless of label
// or relationship type. Useful for "how are X and Y related?"

MATCH (start:Tool {id: $startId}),
      (end:Tool {id: $endId}),
      path = shortestPath((start)-[*..10]-(end))
RETURN [n IN nodes(path) | n.name] AS node_names,
       [n IN nodes(path) | labels(n)] AS node_labels,
       [r IN relationships(path) | type(r)] AS relationship_types,
       length(path) AS distance;

// ---------------------------------------------------------------------------
// Variant 2: Level-by-level expansion (1, 2, 3 hops)
// ---------------------------------------------------------------------------
// Returns all nodes reachable at each distance from the start node.
// Groups results by hop count for progressive UI rendering.

MATCH (start:Tool {id: $id})
OPTIONAL MATCH (start)-[r1]-(n1)
WITH start, collect(DISTINCT n1) AS level1
OPTIONAL MATCH (start)-[*2]-(n2)
  WHERE NOT n2 = start AND NOT n2 IN level1
WITH start, level1, collect(DISTINCT n2) AS level2
OPTIONAL MATCH (start)-[*3]-(n3)
  WHERE NOT n3 = start AND NOT n3 IN level1 AND NOT n3 IN level2
WITH start, level1, level2, collect(DISTINCT n3) AS level3
RETURN start.name AS origin,
       [n IN level1 | {name: n.name, labels: labels(n)}] AS hop_1,
       [n IN level2 | {name: n.name, labels: labels(n)}] AS hop_2,
       [n IN level3 | {name: n.name, labels: labels(n)}] AS hop_3;

// ---------------------------------------------------------------------------
// Variant 3: Generic BFS with distance annotation
// ---------------------------------------------------------------------------
// Uses a single variable-length pattern and computes the shortest distance
// to each reachable node. More flexible than Variant 2 for deeper graphs.

MATCH (start:Tool {id: $id}),
      path = shortestPath((start)-[*..5]-(other))
WHERE other <> start
RETURN other.id AS id,
       other.name AS name,
       labels(other) AS labels,
       length(path) AS distance
ORDER BY distance, name;

// ---------------------------------------------------------------------------
// Variant 4: Filtered BFS — follow only specific relationship types
// ---------------------------------------------------------------------------
// Restrict traversal to DEPENDS_ON and IMPLEMENTS relationships.
// Useful when you want technical dependencies, not domain associations.

MATCH (start:Tool {id: $id}),
      path = shortestPath((start)-[:DEPENDS_ON|IMPLEMENTS*..5]-(other))
WHERE other <> start
RETURN other.id AS id,
       other.name AS name,
       labels(other) AS labels,
       [r IN relationships(path) | type(r)] AS via_relationships,
       length(path) AS distance
ORDER BY distance, name;

// ---------------------------------------------------------------------------
// Variant 5: Cross-label shortest path
// ---------------------------------------------------------------------------
// Find the shortest path from a Tool to a Concept, regardless of what
// intermediate nodes are traversed.

MATCH (tool:Tool {id: $toolId}),
      (concept:Concept {id: $conceptId}),
      path = shortestPath((tool)-[*..8]-(concept))
RETURN [n IN nodes(path) | {name: n.name, labels: labels(n)}] AS path_nodes,
       [r IN relationships(path) | type(r)] AS relationship_types,
       length(path) AS distance;

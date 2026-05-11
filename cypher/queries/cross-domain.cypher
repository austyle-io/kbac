// ============================================================================
// Cross-Domain Search — Fulltext Search and Boundary Traversal
// ============================================================================
//
// Pattern: Find nodes by text similarity, then traverse across domain
// boundaries to discover connections that span organizational divisions.
//
// When to use:
//   - Free-text search: user types a keyword, find matching nodes
//   - Cross-pollination: which tools/concepts bridge two domains?
//   - Serendipity: discover unexpected connections between domains
//   - Integration planning: what connects domain A to domain B?
//
// Index support:
//   - Fulltext indexes: tool_search (Tool name+description),
//     concept_search (Concept name+description)
//     Neo4j doesn't support multi-label fulltext indexes, so we query both
//   - shortestPath() for cross-domain path finding
//   - Domain anchor via uniqueness constraint index
//
// NOTE: These are parameterized templates for the TypeScript service layer
// ($param syntax). They are NOT for direct use with run-cypher.ts, which
// does not support parameter injection. Use neo4j-driver's session.run()
// with a parameters object: session.run(query, { searchTerm: "graph" })
// ============================================================================

// ---------------------------------------------------------------------------
// Variant 1: Fulltext search across all node types
// ---------------------------------------------------------------------------
// Searches name and description fields using Lucene query syntax.
// Supports fuzzy matching (append ~), phrase matching ("quoted terms"),
// and boolean operators (AND, OR, NOT).

CALL {
  CALL db.index.fulltext.queryNodes('tool_search', $searchTerm)
  YIELD node, score
  RETURN node, score
  UNION
  CALL db.index.fulltext.queryNodes('concept_search', $searchTerm)
  YIELD node, score
  RETURN node, score
}
RETURN node.id AS id,
       node.name AS name,
       labels(node) AS type,
       node.description AS description,
       score
ORDER BY score DESC
LIMIT 20;

// ---------------------------------------------------------------------------
// Variant 2: Fulltext search with domain context
// ---------------------------------------------------------------------------
// Same as Variant 1 but enriches each result with its domain membership.

CALL {
  CALL db.index.fulltext.queryNodes('tool_search', $searchTerm)
  YIELD node, score
  RETURN node, score
  UNION
  CALL db.index.fulltext.queryNodes('concept_search', $searchTerm)
  YIELD node, score
  RETURN node, score
}
OPTIONAL MATCH (node)-[:BELONGS_TO]->(d:Domain)
RETURN node.id AS id,
       node.name AS name,
       labels(node) AS type,
       node.description AS description,
       collect(d.name) AS domains,
       score
ORDER BY score DESC
LIMIT 20;

// ---------------------------------------------------------------------------
// Variant 3: Cross-domain path
// ---------------------------------------------------------------------------
// Find the shortest path between two nodes that live in different domains.
// Useful for answering "how does X in domain A relate to Y in domain B?"

MATCH (a {id: $startId}),
      (b {id: $endId}),
      path = shortestPath((a)-[*..8]-(b))
RETURN [n IN nodes(path) | {
         name: n.name,
         labels: labels(n),
         id: n.id
       }] AS path_nodes,
       [r IN relationships(path) | type(r)] AS relationship_types,
       length(path) AS distance;

// ---------------------------------------------------------------------------
// Variant 4: Domain bridge — what connects two domains?
// ---------------------------------------------------------------------------
// Find all nodes that have direct relationships to nodes in both domains.
// These are the "bridge" nodes that connect organizational boundaries.

MATCH (d1:Domain {id: $domainAId})<-[:BELONGS_TO]-(bridge)-[:BELONGS_TO]->(d2:Domain {id: $domainBId})
RETURN bridge.id AS id,
       bridge.name AS name,
       labels(bridge) AS type,
       bridge.description AS description;

// ---------------------------------------------------------------------------
// Variant 4b: Domain bridge via relationships (not co-membership)
// ---------------------------------------------------------------------------
// Find nodes in domain A that directly connect to nodes in domain B,
// even if the bridge node itself only belongs to one domain.

MATCH (d1:Domain {id: $domainAId})<-[:BELONGS_TO]-(nodeA)-[r]-(nodeB)-[:BELONGS_TO]->(d2:Domain {id: $domainBId})
WHERE d1 <> d2
RETURN nodeA.id AS from_id,
       nodeA.name AS from_name,
       labels(nodeA) AS from_type,
       type(r) AS relationship,
       CASE WHEN startNode(r) = nodeA THEN 'outgoing' ELSE 'incoming' END AS direction,
       nodeB.id AS to_id,
       nodeB.name AS to_name,
       labels(nodeB) AS to_type
ORDER BY type(r), nodeA.name;

// ---------------------------------------------------------------------------
// Variant 5: Domain overlap analysis
// ---------------------------------------------------------------------------
// For every pair of domains, count how many cross-domain relationships exist.
// Useful for visualizing which domains are tightly vs loosely coupled.

MATCH (d1:Domain)<-[:BELONGS_TO]-(n1)-[r]-(n2)-[:BELONGS_TO]->(d2:Domain)
WHERE d1.id < d2.id
RETURN d1.name AS domain_a,
       d2.name AS domain_b,
       count(r) AS cross_domain_relationships,
       collect(DISTINCT type(r)) AS relationship_types
ORDER BY cross_domain_relationships DESC;

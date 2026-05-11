// ============================================================================
// Progressive Disclosure — Multi-Level Drill-Down
// ============================================================================
//
// Pattern: Layered queries from abstract overview to concrete detail.
// Each level adds specificity, allowing a UI to start with a high-level
// summary and drill into detail on demand.
//
// When to use:
//   - Dashboard/explorer UIs: show domains first, then contents, then detail
//   - API design: coarse-grained list endpoints -> fine-grained detail
//   - Reducing cognitive load: don't dump the whole graph at once
//
// Index support:
//   - Level 0: Full label scan on :Domain (fast for small label sets)
//   - Level 1: Index-backed anchor on Domain.id, then single-hop expansion
//   - Level 2: Index-backed anchor on Tool.id, then multi-hop expansion
//   - Level 3: Index-backed anchor on Tool.id, full neighborhood scan
//
// NOTE: These are parameterized templates for the TypeScript service layer
// ($param syntax). They are NOT for direct use with run-cypher.ts, which
// does not support parameter injection. Use neo4j-driver's session.run()
// with a parameters object: session.run(query, { id: "graph-theory" })
// ============================================================================

// ---------------------------------------------------------------------------
// Level 0: Domain overview
// ---------------------------------------------------------------------------
// All domains with a count of items belonging to each.
// No parameters needed — this is the entry point.

MATCH (d:Domain)
OPTIONAL MATCH (d)<-[:BELONGS_TO]-(n)
RETURN d.id AS id,
       d.name AS name,
       d.description AS description,
       count(n) AS item_count
ORDER BY item_count DESC;

// ---------------------------------------------------------------------------
// Level 1: Domain contents
// ---------------------------------------------------------------------------
// Concepts and tools that belong to a specific domain, grouped by label.

MATCH (d:Domain {id: $domainId})<-[:BELONGS_TO]-(member)
RETURN d.name AS domain,
       member.id AS id,
       member.name AS name,
       labels(member) AS type,
       member.description AS description
ORDER BY labels(member), member.name;

// ---------------------------------------------------------------------------
// Level 1b: Domain summary with relationship counts
// ---------------------------------------------------------------------------
// A richer domain view showing how many of each relationship type exist.

MATCH (d:Domain {id: $domainId})<-[:BELONGS_TO]-(member)
OPTIONAL MATCH (member)-[r]-()
WITH d, member, type(r) AS rel_type, count(r) AS rel_count
WITH d, member, collect({type: rel_type, count: rel_count}) AS relationships
RETURN d.name AS domain,
       member.id AS id,
       member.name AS name,
       labels(member) AS type,
       relationships
ORDER BY labels(member), member.name;

// ---------------------------------------------------------------------------
// Level 2: Tool detail with all relationships
// ---------------------------------------------------------------------------
// Full detail on a single tool: properties plus every direct relationship.

MATCH (t:Tool {id: $toolId})
OPTIONAL MATCH (t)-[r]-(related)
WITH t, r, related,
     CASE WHEN startNode(r) = t THEN 'outgoing' ELSE 'incoming' END AS direction
RETURN t {.id, .name, .description, .version, .url} AS tool,
       collect({
         relationship: type(r),
         direction: direction,
         target_id: related.id,
         target_name: related.name,
         target_labels: labels(related)
       }) AS relationships;

// ---------------------------------------------------------------------------
// Level 3: Tool full context
// ---------------------------------------------------------------------------
// A tool's complete context: what system uses it, what concepts it
// implements, what it depends on, what domain it belongs to, and what
// it composes with.

MATCH (t:Tool {id: $toolId})

// System that uses this tool
OPTIONAL MATCH (sys:System)-[:USES]->(t)

// Concepts this tool implements
OPTIONAL MATCH (t)-[:IMPLEMENTS]->(concept:Concept)

// Dependencies (outgoing)
OPTIONAL MATCH (t)-[:DEPENDS_ON]->(dep)

// Reverse dependencies (incoming)
OPTIONAL MATCH (consumer)-[:DEPENDS_ON]->(t)

// Domain membership
OPTIONAL MATCH (t)-[:BELONGS_TO]->(domain:Domain)

// Compositions
OPTIONAL MATCH (t)-[:COMPOSES_WITH]-(companion)

RETURN t.id AS id,
       t.name AS name,
       t.description AS description,
       collect(DISTINCT sys.name) AS used_by_systems,
       collect(DISTINCT concept.name) AS implements_concepts,
       collect(DISTINCT dep.name) AS depends_on,
       collect(DISTINCT consumer.name) AS depended_on_by,
       collect(DISTINCT domain.name) AS belongs_to_domains,
       collect(DISTINCT companion.name) AS composes_with;

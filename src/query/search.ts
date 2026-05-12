import neo4j from "neo4j-driver";
import { executeRead } from "../db/neo4j-service.js";
import { createValidator } from "../validation/validator.js";
import { escapeLucene } from "./escape.js";
import { redactEntity } from "./redact.js";
import {
  type SearchOptions,
  type SearchResult,
  type Entity,
  type NodeLabel,
  type NodeRow,
  NodeRowSchema,
  SearchResultSchema,
} from "./schemas.js";

const NODE_LABELS: NodeLabel[] = ["Tool", "Concept", "Domain", "System"];
const FULLTEXT_INDEXES: Record<NodeLabel, string> = {
  Tool: "tool_search",
  Concept: "concept_search",
  Domain: "domain_search",
  System: "system_search",
};

function buildCypher(opts: SearchOptions): { cypher: string; params: Record<string, unknown> } {
  const targets: NodeLabel[] = opts.type ? [opts.type] : NODE_LABELS;

  const unionBranches = targets.map(
    (label) => `
      CALL db.index.fulltext.queryNodes('${FULLTEXT_INDEXES[label]}', $term)
      YIELD node, score
      RETURN
        { id: node.id, name: coalesce(node.name, node.id), properties: properties(node) } AS node,
        '${label}' AS label,
        score
    `,
  );

  const cypher = `
    CALL {
      ${unionBranches.join("\n      UNION\n      ")}
    }
    RETURN node, label, score
    ORDER BY score DESC
    LIMIT $limit
  `;

  return {
    cypher,
    params: { term: escapeLucene(opts.term), limit: neo4j.int(opts.limit) },
  };
}

/**
 * Fulltext search over the kbac graph. Escapes user input, runs the
 * appropriate per-label fulltext index queries (UNION'd if --type is
 * unset), redacts sensitive properties on each row, and returns a
 * Typebox-validated SearchResult.
 *
 * The caller is responsible for ensuring varlock-injected NEO4J_*
 * environment variables are present.
 */
export async function search(opts: SearchOptions): Promise<SearchResult> {
  const startedAt = Date.now();
  const { cypher, params } = buildCypher(opts);

  const rows = await executeRead<NodeRow>(cypher, params, NodeRowSchema);

  const results: Entity[] = rows.map((row) => ({
    id: row.node.id,
    name: row.node.name,
    label: row.label,
    score: row.score,
    properties: redactEntity(row.node.properties),
  }));

  const result: SearchResult = {
    term: opts.term,
    type: opts.type ?? null,
    limit: opts.limit,
    totalCount: results.length,
    results,
    durationMs: Date.now() - startedAt,
  };

  return createValidator<SearchResult>(SearchResultSchema).assertValid(
    result,
    "search result",
  );
}

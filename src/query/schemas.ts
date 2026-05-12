import { Type, type Static } from "typebox";

/** Valid node labels users can filter by. Matches kbac graph schema. */
export const NodeLabelEnum = Type.Union([
  Type.Literal("Tool"),
  Type.Literal("Concept"),
  Type.Literal("Domain"),
  Type.Literal("System"),
]);
export type NodeLabel = Static<typeof NodeLabelEnum>;

/** Search-time options after argv parsing and validation. */
export const SearchOptionsSchema = Type.Object({
  term: Type.String({ minLength: 1, maxLength: 256 }),
  type: Type.Optional(NodeLabelEnum),
  limit: Type.Integer({ minimum: 1, maximum: 100 }),
});
export type SearchOptions = Static<typeof SearchOptionsSchema>;

/** Shape of one entity returned from a query, after redaction. */
export const EntitySchema = Type.Object({
  id: Type.String(),
  name: Type.String(),
  label: NodeLabelEnum,
  score: Type.Number(),
  properties: Type.Record(Type.String(), Type.Unknown()),
});
export type Entity = Static<typeof EntitySchema>;

/** Full search response. */
export const SearchResultSchema = Type.Object({
  term: Type.String(),
  type: Type.Union([NodeLabelEnum, Type.Null()]),
  limit: Type.Integer(),
  totalCount: Type.Integer({ minimum: 0 }),
  results: Type.Array(EntitySchema),
  durationMs: Type.Integer({ minimum: 0 }),
});
export type SearchResult = Static<typeof SearchResultSchema>;

/** Raw row before redaction, as projected from Cypher. */
export const NodeRowSchema = Type.Object({
  node: Type.Object({
    id: Type.String(),
    name: Type.String(),
    properties: Type.Record(Type.String(), Type.Unknown()),
  }),
  label: NodeLabelEnum,
  score: Type.Number(),
});
export type NodeRow = Static<typeof NodeRowSchema>;

/** Structured error payload emitted on stdout when --json is set. */
export const ErrorPayloadSchema = Type.Object({
  error: Type.Union([
    Type.Literal("invalid_input"),
    Type.Literal("neo4j_unreachable"),
    Type.Literal("neo4j_timeout"),
    Type.Literal("schema_mismatch"),
    Type.Literal("unexpected"),
  ]),
  message: Type.String(),
  details: Type.Optional(Type.Unknown()),
});
export type ErrorPayload = Static<typeof ErrorPayloadSchema>;

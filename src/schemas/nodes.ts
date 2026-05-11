import { Type, type Static, type TSchema } from "typebox";

/** Property that may be a value or null (Neo4j returns null for unset properties). */
const Nullable = <T extends TSchema>(schema: T) =>
  Type.Union([schema, Type.Null()]);

export const ToolSchema = Type.Object({
  id: Type.String({ minLength: 1 }),
  name: Type.String({ minLength: 1 }),
  version: Type.Optional(Nullable(Type.String())),
  type: Type.Optional(Nullable(Type.String())),
  description: Type.Optional(Nullable(Type.String())),
});
export type Tool = Static<typeof ToolSchema>;

export const ConceptSchema = Type.Object({
  id: Type.String({ minLength: 1 }),
  name: Type.String({ minLength: 1 }),
  description: Type.Optional(Nullable(Type.String())),
});
export type Concept = Static<typeof ConceptSchema>;

export const DomainSchema = Type.Object({
  id: Type.String({ minLength: 1 }),
  name: Type.String({ minLength: 1 }),
  category: Type.Optional(Nullable(Type.String())),
  description: Type.Optional(Nullable(Type.String())),
  repo: Type.Optional(Nullable(Type.String())),
  repo_path: Type.Optional(Nullable(Type.String())),
});
export type Domain = Static<typeof DomainSchema>;

export const SystemSchema = Type.Object({
  id: Type.String({ minLength: 1 }),
  name: Type.String({ minLength: 1 }),
  version: Type.Optional(Nullable(Type.String())),
  purpose: Type.Optional(Nullable(Type.String())),
  description: Type.Optional(Nullable(Type.String())),
  category: Type.Optional(Nullable(Type.String())),
  repo: Type.Optional(Nullable(Type.String())),
  repo_path: Type.Optional(Nullable(Type.String())),
  dev_port: Type.Optional(Nullable(Type.Integer())),
  binary: Type.Optional(Nullable(Type.String())),
});
export type System = Static<typeof SystemSchema>;

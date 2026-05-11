import {
  type Record as Neo4jRecord,
  isNode,
  isRelationship,
  isDateTime,
  isDate,
  isLocalDateTime,
  isLocalTime,
  isTime,
  isDuration,
} from "neo4j-driver";

/** Convert a Neo4j temporal/graph/structured value to a plain JS value. */
export function toPlain(val: unknown): unknown {
  if (val == null) return val;

  // Neo4j temporal types -> ISO strings
  if (
    isDateTime(val) ||
    isDate(val) ||
    isLocalDateTime(val) ||
    isTime(val) ||
    isLocalTime(val) ||
    isDuration(val)
  ) {
    return val.toString();
  }

  // Neo4j graph types -> extract properties
  if (isNode(val) || isRelationship(val)) return mapValues(val.properties);

  if (Array.isArray(val)) return val.map(toPlain);

  // Plain objects (maps returned by Cypher)
  if (typeof val === "object" && val.constructor === Object) {
    return mapValues(val as Record<string, unknown>);
  }

  return val;
}

function mapValues(obj: Record<string, unknown>): Record<string, unknown> {
  return Object.fromEntries(
    Object.entries(obj).map(([k, v]) => [k, toPlain(v)]),
  );
}

/** Convert a Neo4j Record to a plain JS object suitable for logging or JSON. */
export function recordToObject(record: Neo4jRecord): Record<string, unknown> {
  return Object.fromEntries(
    (record.keys as string[]).map((key) => [key, toPlain(record.get(key))]),
  );
}

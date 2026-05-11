import { type ManagedTransaction, type Session } from "neo4j-driver";
import { type TSchema } from "typebox";
import { getDriver, closeDriver } from "./driver.js";
import { createValidator } from "../validation/validator.js";
import { recordToObject } from "./record-mapper.js";

/** Shared implementation for executeRead and executeWrite. */
async function execute<T>(
  mode: "read" | "write",
  cypher: string,
  params: Record<string, unknown>,
  resultSchema?: TSchema,
): Promise<T[]> {
  const session = getDriver().session({
    database: process.env.NEO4J_DATABASE ?? "neo4j",
  });

  const run = async (tx: ManagedTransaction): Promise<T[]> => {
    const result = await tx.run(cypher, params);
    const rows = result.records.map(recordToObject);
    if (!resultSchema) return rows as T[];
    const validator = createValidator<T>(resultSchema);
    return rows.map((row, i) => validator.assertValid(row, `Row ${i}`));
  };

  try {
    if (mode === "read") return await session.executeRead(run);
    return await session.executeWrite(run);
  } finally {
    await session.close();
  }
}

export function executeRead<T = Record<string, unknown>>(
  cypher: string,
  params: Record<string, unknown> = {},
  resultSchema?: TSchema,
): Promise<T[]> {
  return execute<T>("read", cypher, params, resultSchema);
}

export function executeWrite<T = Record<string, unknown>>(
  cypher: string,
  params: Record<string, unknown> = {},
  resultSchema?: TSchema,
): Promise<T[]> {
  return execute<T>("write", cypher, params, resultSchema);
}

export { closeDriver };

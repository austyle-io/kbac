import { type Session } from "neo4j-driver";
import { recordToObject } from "../db/record-mapper.js";

/** First non-comment line of `statement`, used as a one-line preview for logs. */
export function statementPreview(statement: string): string {
  const firstCodeLine = statement
    .split("\n")
    .find((line) => !line.trim().startsWith("//"));
  return (firstCodeLine ?? statement.slice(0, 60)).trim();
}

export function pluralizeRows(count: number): string {
  return `${count} row${count === 1 ? "" : "s"}`;
}

/**
 * Execute one Cypher statement against `session`, logging the preview, every
 * returned record (as a plain JS object via `recordToObject`), and the row count.
 */
export async function runStatement(
  session: Session,
  statement: string,
): Promise<void> {
  console.log(`\n> ${statementPreview(statement)}...`);
  const result = await session.run(statement);
  for (const record of result.records) console.log(recordToObject(record));
  console.log(`  (${pluralizeRows(result.records.length)})`);
}

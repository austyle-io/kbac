import { readFileSync } from "fs";
import { resolve } from "path";
import { loadEnv } from "../src/config/index.js";
import { closeDriver, withSession } from "../src/db/index.js";
import { runStatement, splitCypherStatements } from "../src/cypher/index.js";
import { fatal } from "../src/utils/index.js";

async function runCypherFile(filePath: string): Promise<void> {
  const cypher = readFileSync(resolve(filePath), "utf-8");
  const statements = splitCypherStatements(cypher);
  try {
    await withSession(async (session) => {
      for (const statement of statements) await runStatement(session, statement);
    });
  } finally {
    await closeDriver();
  }
}

function main(): void {
  const file = process.argv[2];
  if (!file) {
    fatal("Usage: npx varlock run -- npx tsx bin/run-cypher.ts <path-to-cypher-file>");
  }
  try {
    loadEnv();
  } catch (err) {
    fatal((err as Error).message);
  }
  runCypherFile(file).catch((err: Error) => fatal(`Error: ${err.message}`));
}

main();

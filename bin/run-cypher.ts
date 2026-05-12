import { readFileSync } from "fs";
import { resolve, relative, sep } from "path";
import { loadEnv } from "../src/config/index.js";
import { closeDriver, withSession } from "../src/db/index.js";
import { runStatement, splitCypherStatements } from "../src/cypher/index.js";
import { fatal } from "../src/utils/index.js";

/**
 * Resolve a user-supplied cypher path and ensure it stays inside the repo's
 * `cypher/` directory. Prevents argv-driven path traversal (any file the
 * developer has read access to would otherwise be loadable and then sent
 * to Neo4j as a Cypher script).
 */
function resolveSafeCypherPath(filePath: string): string {
  const repoRoot = resolve(import.meta.dirname, "..");
  const cypherRoot = resolve(repoRoot, "cypher");
  // SAFE: the resolved path is rejected below unless it is contained
  // within cypherRoot. The `relative()` check happens before any I/O.
  const absolute = resolve(filePath); // nosemgrep
  const rel = relative(cypherRoot, absolute);
  if (rel.startsWith("..") || rel.startsWith(`${sep}`) || rel === "") {
    throw new Error(
      `path must be inside ${cypherRoot} — got: ${absolute}`,
    );
  }
  return absolute;
}

async function runCypherFile(filePath: string): Promise<void> {
  const safePath = resolveSafeCypherPath(filePath);
  const cypher = readFileSync(safePath, "utf-8");
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
    fatal("Usage: yarn cypher <path-to-cypher-file>  (or: node --env-file-if-exists=.env --import tsx bin/run-cypher.ts <path>)");
  }
  try {
    loadEnv();
  } catch (err) {
    fatal((err as Error).message);
  }
  runCypherFile(file).catch((err: Error) => fatal(`Error: ${err.message}`));
}

main();

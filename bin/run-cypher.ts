import { readFileSync, realpathSync } from "fs";
import { resolve, relative, isAbsolute } from "path";
import { pathToFileURL } from "url";
import { loadEnv } from "../src/config/index.js";
import { closeDriver, withSession } from "../src/db/index.js";
import { runStatement, splitCypherStatements } from "../src/cypher/index.js";
import { fatal } from "../src/utils/index.js";

/**
 * Resolve a user-supplied cypher path and ensure it stays inside the repo's
 * `cypher/` directory. Prevents argv-driven path traversal (any file the
 * developer has read access to would otherwise be loadable and then sent
 * to Neo4j as a Cypher script).
 *
 * Uses `realpathSync` on both ends so that a symlink inside `cypher/`
 * pointing outside the repo is rejected (lexical-only containment would
 * accept it because `relative()` sees only the literal path).
 *
 * Exported for direct unit testing in `bin/run-cypher.test.ts`.
 */
export function resolveSafeCypherPath(filePath: string): string {
  const repoRoot = resolve(import.meta.dirname, "..");
  const cypherRoot = resolve(repoRoot, "cypher");
  const absolute = resolve(filePath); // nosemgrep

  let realAbsolute: string;
  let realCypherRoot: string;
  try {
    realAbsolute = realpathSync(absolute);
    realCypherRoot = realpathSync(cypherRoot);
  } catch (err) {
    throw new Error(
      `path resolution failed for ${absolute}: ${(err as Error).message}`,
    );
  }

  // On Windows, path.relative() returns an absolute path when its two
  // arguments are on different drives. isAbsolute() catches that case in
  // addition to the standard `..` traversal check.
  const rel = relative(realCypherRoot, realAbsolute);
  if (rel === "" || rel.startsWith("..") || isAbsolute(rel)) {
    throw new Error(
      `path must be inside ${cypherRoot} — got: ${absolute}` +
        (absolute !== realAbsolute ? ` (resolves to ${realAbsolute})` : ""),
    );
  }
  return realAbsolute;
}

async function runCypherFile(filePath: string): Promise<void> {
  const safePath = resolveSafeCypherPath(filePath);
  const cypher = readFileSync(safePath, "utf-8");
  const statements = splitCypherStatements(cypher);
  try {
    await withSession(async (session) => {
      let i = 0;
      for (const statement of statements) {
        try {
          await runStatement(session, statement);
        } catch (err) {
          throw new Error(
            `statement ${i + 1}/${statements.length} in ${safePath} failed: ${(err as Error).message}`,
          );
        }
        i += 1;
      }
    });
  } finally {
    await closeDriver();
  }
}

function main(): void {
  const file = process.argv[2];
  if (!file) {
    fatal(
      "Usage: yarn cypher <path-to-cypher-file>  (or: node --env-file-if-exists=.env --import tsx bin/run-cypher.ts <path>)",
    );
  }
  try {
    loadEnv();
  } catch (err) {
    fatal((err as Error).message);
  }
  runCypherFile(file).catch((err: Error) => fatal(`Error: ${err.message}`));
}

// Run only when invoked as a script (not when imported by tests).
// pathToFileURL correctly URL-encodes spaces and handles Windows drive
// letters (e.g. `C:\path` → `file:///C:/path`), which a naive
// `file://${process.argv[1]}` template string would mangle.
if (import.meta.url === pathToFileURL(resolve(process.argv[1])).href) {
  main();
}

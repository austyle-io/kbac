import { type Session } from "neo4j-driver";
import { getDriver } from "./driver.js";

/**
 * Run `fn` inside a fresh Neo4j Session using the cached process-level driver.
 * The session is always closed in `finally`. The driver itself is NOT closed —
 * call `closeDriver()` once at process exit (typically from a CLI entry point).
 */
export async function withSession<T>(
  fn: (session: Session) => Promise<T>,
): Promise<T> {
  const session: Session = getDriver().session({
    database: process.env.NEO4J_DATABASE ?? "neo4j",
  });
  try {
    return await fn(session);
  } finally {
    await session.close();
  }
}

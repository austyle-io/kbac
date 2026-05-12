// Manually maintained types for the kbac runtime environment variables.
// Loaded from .env via Node's --env-file-if-exists flag, or inherited
// from the shell. See .env.example for the canonical key list.
//
// NEO4J_PASSWORD is required and is typed as `string` (not `string | undefined`).
// Callers should rely on src/config/env.ts:loadEnv() to fail fast at startup
// if it is missing rather than treating it as an optional value.

declare global {
  namespace NodeJS {
    interface ProcessEnv {
      /** Bolt URI for the Neo4j driver. Default: bolt://localhost:7688 */
      NEO4J_URI?: string;
      /** Neo4j user. Default: neo4j */
      NEO4J_USERNAME?: string;
      /** Database name. Default: neo4j */
      NEO4J_DATABASE?: string;
      /** Neo4j password — required at runtime, no default. Validated by loadEnv(). */
      NEO4J_PASSWORD: string;
    }
  }
}

export {};

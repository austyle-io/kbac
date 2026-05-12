// Manually maintained types for the kbac runtime environment variables.
// Loaded from .env via Node's --env-file-if-exists flag, or inherited
// from the shell. See .env.example for the canonical key list.

declare global {
  namespace NodeJS {
    interface ProcessEnv {
      /** Bolt URI for the Neo4j driver. Default: bolt://localhost:7688 */
      NEO4J_URI?: string;
      /** Neo4j user. Default: neo4j */
      NEO4J_USERNAME?: string;
      /** Database name. Default: neo4j */
      NEO4J_DATABASE?: string;
      /** Neo4j password — required, no default. */
      NEO4J_PASSWORD?: string;
    }
  }
}

export {};

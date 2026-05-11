import { Type, type Static } from "typebox";
import { createValidator } from "../validation/validator.js";

// ============================================================================
// Environment configuration
// ----------------------------------------------------------------------------
// Credentials are injected by `varlock run`. Defaults are applied BEFORE
// validation so optional vars satisfy `minLength: 1`. Required vars
// (NEO4J_PASSWORD) have no default; if missing they remain `undefined` and
// the AJV validator fails fast at startup with a precise error path.
// ============================================================================

export const EnvSchema = Type.Object({
  NEO4J_URI: Type.String({
    minLength: 1,
    // bolt:// | bolt+s:// | bolt+ssc:// | neo4j:// | neo4j+s:// | neo4j+ssc://
    pattern: "^(bolt|neo4j)(\\+s|\\+ssc)?://.+$",
  }),
  NEO4J_USERNAME: Type.String({ minLength: 1 }),
  NEO4J_DATABASE: Type.String({ minLength: 1 }),
  NEO4J_PASSWORD: Type.String({ minLength: 1 }),
});

export type Env = Static<typeof EnvSchema>;

const envValidator = createValidator<Env>(EnvSchema);

/**
 * Actionable remediation hints keyed by env-var name. Appended to AJV's
 * structural error message so the developer sees WHAT failed + HOW to fix it,
 * not just the AJV instance path. DX principle: fight uncertainty.
 */
const REMEDIATION_HINTS: Record<string, string> = {
  NEO4J_PASSWORD:
    "run the command via `varlock run -- <cmd>` so Varlock injects the password from 1Password (see docs/ARCHITECTURE.md#credential-flow)",
  NEO4J_URI:
    "set to a Bolt URL like `bolt://localhost:7688` (schemes: bolt, bolt+s, bolt+ssc, neo4j, neo4j+s, neo4j+ssc)",
  NEO4J_USERNAME: "defaults to 'neo4j' — set only if your database uses a different user",
  NEO4J_DATABASE: "defaults to 'neo4j' — set only if targeting a non-default database",
};

let _cached: Env | null = null;

/**
 * Validate the four `NEO4J_*` environment variables once at process startup
 * and cache the result. Throws an enriched `Error` (structural AJV path +
 * actionable remediation hint per variable) if validation fails.
 */
export function loadEnv(): Env {
  if (_cached) return _cached;
  const raw = {
    NEO4J_URI: process.env.NEO4J_URI ?? "bolt://localhost:7688",
    NEO4J_USERNAME: process.env.NEO4J_USERNAME ?? "neo4j",
    NEO4J_DATABASE: process.env.NEO4J_DATABASE ?? "neo4j",
    NEO4J_PASSWORD: process.env.NEO4J_PASSWORD,
  };
  try {
    _cached = envValidator.assertValid(raw, "Environment");
    return _cached;
  } catch (err) {
    const message = (err as Error).message;
    const hints = Object.entries(REMEDIATION_HINTS)
      .filter(([key]) => message.includes(key))
      .map(([key, hint]) => `  - ${key}: ${hint}`);
    if (hints.length === 0) throw err;
    throw new Error(`${message}\n\nFix:\n${hints.join("\n")}`);
  }
}

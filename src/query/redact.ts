/**
 * Field names redacted by exact case-insensitive match. All entries are
 * stored lowercase; lookup downcases the incoming key once.
 */
const REDACTED_FIELDS = new Set([
  "apikey",
  "api_key",
  "token",
  "password",
  "secret",
  "credential",
  "credentials",
  "key",
  "auth",
  "authorization",
  "bearer",
  "private",
  "privatekey",
  "private_key",
  "accesstoken",
  "access_token",
  "refreshtoken",
  "refresh_token",
  "clientsecret",
  "client_secret",
]);

/**
 * Field-name patterns redacted via case-insensitive regex. Catches
 * camelCase composites like `userCredentials` or `myAccessToken`.
 *
 * `/auth/i` is intentionally broad — it matches `myAuth`, `apiAuth`, and
 * also `author`, `authorId`, `authentication`. The kbac graph schema does
 * not currently include `author`-like fields, so this is an acceptable
 * scope-wide redaction. If author metadata is added to the graph in the
 * future, tighten this pattern (e.g. `/(^|_)auth($|_|orization$)/i`).
 */
const REDACTED_PATTERNS = [
  /api.?key/i,
  /secret/i,
  /password/i,
  /token/i,
  /credential/i,
  /auth/i,
  /private/i,
];

const MAX_DEPTH = 4;

function shouldRedact(key: string): boolean {
  if (REDACTED_FIELDS.has(key.toLowerCase())) return true;
  return REDACTED_PATTERNS.some((p) => p.test(key));
}

/**
 * Recursively redact sensitive fields from a property bag, returning a
 * new object with no mutation of input. Arrays are passed through
 * unchanged; recursion stops past `MAX_DEPTH` to prevent runaway on
 * pathological inputs.
 *
 * **Security note:** values nested deeper than `MAX_DEPTH` (4 levels)
 * are passed through unredacted by design. A sensitive field at
 * nesting depth 5+ silently leaks. For input that may exceed this
 * depth, callers should flatten first or raise `MAX_DEPTH`. Graph-node
 * properties from kbac never nest beyond two levels in practice.
 */
export function redactEntity(
  properties: Record<string, unknown>,
  depth = 0,
): Record<string, unknown> {
  const out: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(properties)) {
    if (shouldRedact(key)) {
      out[key] = "[REDACTED]";
      continue;
    }
    if (
      depth < MAX_DEPTH &&
      value !== null &&
      typeof value === "object" &&
      !Array.isArray(value)
    ) {
      out[key] = redactEntity(value as Record<string, unknown>, depth + 1);
      continue;
    }
    out[key] = value;
  }
  return out;
}

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
 * also `author`, `authorId`, `authentication`. This is a codebase-wide
 * acceptable false-positive: the kbac graph schema does not currently
 * include `author`-like fields. If author metadata is added in the
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
 * unchanged.
 *
 * **Depth behavior:** keys at depths 0, 1, 2, 3, and 4 are all checked
 * against `shouldRedact`. Recursion stops *into* objects at depth 4 —
 * meaning a sensitive key whose value is itself an object nested at
 * depth 5 or deeper will NOT be visited and its sub-keys will pass
 * through unredacted. The `MAX_DEPTH = 4` constant controls this.
 *
 * **Security note:** the depth limit is a fail-safe, not a guarantee.
 * Graph-node properties from kbac never nest beyond two levels in
 * practice, so the depth-5+ leak is unreachable for current data. If
 * deeper structures are introduced (e.g. stored config blobs), either
 * flatten before passing, raise `MAX_DEPTH`, or change this function
 * to throw on objects at the boundary.
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

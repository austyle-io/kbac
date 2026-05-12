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

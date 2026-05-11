# Credential Safety

- Never hardcode NEO4J_PASSWORD, NEO4J_URI, or any credential in source code, scripts, or Cypher files.
- Always use `varlock run --` to wrap commands that need environment secrets. Varlock resolves 1Password references at runtime via biometric auth.
- Never commit `.env` files. Only `.env.schema` (which contains `op()` references, not actual values) is committed.
- The `@sensitive` annotation in `.env.schema` causes Varlock to mask credential values in stdout.
- If a `varlock run` command fails in a sandboxed environment, do NOT fall back to plaintext credentials. Ask the user to run the command themselves via the `!` prefix.

#!/usr/bin/env tsx
import { readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import neo4j from "neo4j-driver";
import {
  search,
  renderJson,
  renderMarkdown,
  renderError,
  SearchOptionsSchema,
  type SearchOptions,
  type ErrorPayload,
} from "../src/query/index.js";
import { createValidator, ValidationError } from "../src/validation/index.js";
import { closeDriver } from "../src/db/index.js";
import { loadEnv } from "../src/config/index.js";

type ParseSuccess = {
  ok: true;
  subcommand: "search";
  options: SearchOptions;
  json: boolean;
};

type ParseInfo = {
  ok: "info";
  kind: "help" | "version";
  json: boolean;
};

type ParseFailure = {
  ok: false;
  error: ErrorPayload;
  /** Echoes the --json flag detected during parsing so callers can
   *  render error output in the right mode even when validation fails. */
  json: boolean;
};

export type ParseResult = ParseSuccess | ParseInfo | ParseFailure;

const HELP_TEXT = `Usage: kbac search <term> [--type <label>] [--limit <n>] [--json]

Subcommands:
  search <term>       Fulltext search over the kbac graph.

Flags:
  --type <label>      Filter by node label: Tool | Concept | Domain | System
  --limit <n>         Maximum results to return (1-100, default 10)
  --json              Emit machine-readable JSON instead of Markdown
  --help, -h          Show this help and exit
  --version, -v       Show version and exit
`;

function readVersion(): string {
  const here = dirname(fileURLToPath(import.meta.url));
  const pkg = JSON.parse(
    readFileSync(resolve(here, "..", "package.json"), "utf-8"),
  ) as { version: string };
  return pkg.version;
}

export function parseArgv(argv: string[]): ParseResult {
  const json = argv.includes("--json");

  if (argv.includes("--help") || argv.includes("-h")) {
    return { ok: "info", kind: "help", json };
  }
  if (argv.includes("--version") || argv.includes("-v")) {
    return { ok: "info", kind: "version", json };
  }

  if (argv.length === 0 || argv[0] !== "search") {
    return {
      ok: false,
      json,
      error: {
        error: "invalid_input",
        message: "unknown subcommand; only 'search' is supported",
      },
    };
  }

  if (argv.length < 2) {
    return {
      ok: false,
      json,
      error: { error: "invalid_input", message: "search requires a term" },
    };
  }
  const term = argv[1];

  let type: string | undefined;
  let limit = 10;
  for (let i = 2; i < argv.length; i++) {
    const flag = argv[i];
    if (flag === "--json") {
      // already captured above
    } else if (flag === "--type") {
      if (i + 1 >= argv.length) {
        return {
          ok: false,
          json,
          error: { error: "invalid_input", message: "--type requires a value" },
        };
      }
      type = argv[++i];
    } else if (flag === "--limit") {
      if (i + 1 >= argv.length) {
        return {
          ok: false,
          json,
          error: { error: "invalid_input", message: "--limit requires a value" },
        };
      }
      const raw = argv[++i];
      const parsed = Number.parseInt(raw, 10);
      if (Number.isNaN(parsed)) {
        return {
          ok: false,
          json,
          error: { error: "invalid_input", message: `--limit must be an integer, got: ${raw}` },
        };
      }
      limit = parsed;
    } else {
      return {
        ok: false,
        json,
        error: { error: "invalid_input", message: `unknown flag: ${flag}` },
      };
    }
  }

  const candidate = { term, type, limit };
  const validator = createValidator<SearchOptions>(SearchOptionsSchema);
  if (!validator.validate(candidate)) {
    return {
      ok: false,
      json,
      error: {
        error: "invalid_input",
        message:
          validator.errors()?.map((e) => `${e.instancePath} ${e.message}`).join("; ") ??
          "validation failed",
      },
    };
  }
  return { ok: true, subcommand: "search", options: candidate, json };
}

/**
 * Classify a thrown error into one of the ErrorPayload literal codes.
 *
 * Prefers `instanceof` checks where possible (ValidationError, neo4j
 * driver error classes) over substring matching, which is fragile and
 * misses messages whose wording diverges from the canonical phrasing.
 *
 * Exported so the unit tests in `bin/kbac.test.ts` can pin the
 * classification contract.
 */
export function classifyError(e: Error): ErrorPayload["error"] {
  if (e instanceof ValidationError) return "schema_mismatch";

  // neo4j-driver throws typed error classes — prefer instanceof.
  const driverErrors = (neo4j as unknown as { error?: Record<string, unknown> })
    .error;
  if (driverErrors) {
    const ServiceUnavailable = driverErrors.ServiceUnavailable as
      | (new () => Error)
      | undefined;
    const SessionExpired = driverErrors.SessionExpired as
      | (new () => Error)
      | undefined;
    if (ServiceUnavailable && e instanceof ServiceUnavailable)
      return "neo4j_unreachable";
    if (SessionExpired && e instanceof SessionExpired) return "neo4j_timeout";
  }

  const msg = e.message.toLowerCase();
  if (
    msg.includes("unauthorized") ||
    msg.includes("authentication failure") ||
    msg.includes("authentication failed") ||
    msg.includes("neo.clienterror.security")
  ) {
    return "neo4j_auth_failure";
  }
  if (
    msg.includes("connection refused") ||
    msg.includes("econnrefused") ||
    msg.includes("enotfound") ||
    msg.includes("econnreset")
  ) {
    return "neo4j_unreachable";
  }
  if (msg.includes("timeout") || msg.includes("timed out")) {
    return "neo4j_timeout";
  }
  return "unexpected";
}

function exitCodeFor(code: ErrorPayload["error"]): number {
  switch (code) {
    case "invalid_input":
      return 2;
    case "neo4j_unreachable":
    case "neo4j_timeout":
    case "neo4j_auth_failure":
      return 3;
    case "schema_mismatch":
      return 4;
    default:
      return 1;
  }
}

async function main(): Promise<number> {
  const argv = process.argv.slice(2);
  const parsed = parseArgv(argv);

  if (parsed.ok === "info") {
    if (parsed.kind === "help") process.stdout.write(HELP_TEXT);
    else process.stdout.write(`${readVersion()}\n`);
    return 0;
  }

  if (!parsed.ok) {
    process.stderr.write(renderError(parsed.error, parsed.json) + "\n");
    return 2;
  }

  // Validate env up-front with actionable error messages.
  try {
    loadEnv();
  } catch (e) {
    const payload: ErrorPayload = {
      error: "invalid_input",
      message: (e as Error).message,
    };
    process.stderr.write(renderError(payload, parsed.json) + "\n");
    return 2;
  }

  try {
    const result = await search(parsed.options);
    process.stdout.write(parsed.json ? renderJson(result) : renderMarkdown(result));
    process.stdout.write("\n");
    return 0;
  } catch (e) {
    const err = e as Error;
    const code = classifyError(err);
    const payload: ErrorPayload = { error: code, message: err.message };
    process.stderr.write(renderError(payload, parsed.json) + "\n");
    return exitCodeFor(code);
  } finally {
    await closeDriver().catch((shutdownErr: unknown) => {
      process.stderr.write(
        `[kbac] driver shutdown failed: ${String(shutdownErr)}\n`,
      );
    });
  }
}

// Run only when invoked as a script (not when imported by tests).
if (import.meta.url === `file://${process.argv[1]}`) {
  main().then((code) => process.exit(code));
}

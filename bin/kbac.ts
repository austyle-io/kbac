#!/usr/bin/env tsx
import { readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import {
  search,
  renderJson,
  renderMarkdown,
  renderError,
  SearchOptionsSchema,
  type SearchOptions,
  type ErrorPayload,
} from "../src/query/index.js";
import { createValidator } from "../src/validation/validator.js";
import { closeDriver } from "../src/db/driver.js";

type ParseSuccess = {
  ok: true;
  subcommand: "search";
  options: SearchOptions;
  json: boolean;
};

type ParseFailure = {
  ok: false;
  error: ErrorPayload;
  help?: boolean;
  version?: boolean;
  /** Echoes the --json flag detected during parsing so callers can
   *  render error output in the right mode even when validation fails. */
  json: boolean;
};

export type ParseResult = ParseSuccess | ParseFailure;

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
  // Detect --json up-front so failure paths can echo it back to the caller
  // and we render in the right mode regardless of where parsing fails.
  const json = argv.includes("--json");

  if (argv.includes("--help") || argv.includes("-h")) {
    return { ok: false, help: true, json, error: { error: "invalid_input", message: "help" } };
  }
  if (argv.includes("--version") || argv.includes("-v")) {
    return { ok: false, version: true, json, error: { error: "invalid_input", message: "version" } };
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
      // already captured above; just consume
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

function classifyError(e: Error): ErrorPayload["error"] {
  const msg = e.message.toLowerCase();
  if (msg.includes("connection refused") || msg.includes("econnrefused")) {
    return "neo4j_unreachable";
  }
  if (msg.includes("timeout") || msg.includes("timed out")) {
    return "neo4j_timeout";
  }
  if (msg.includes("validation failed") || msg.includes("search result")) {
    return "schema_mismatch";
  }
  return "unexpected";
}

async function main(): Promise<number> {
  const argv = process.argv.slice(2);
  const parsed = parseArgv(argv);

  if (!parsed.ok) {
    if (parsed.help) {
      process.stdout.write(HELP_TEXT);
      return 0;
    }
    if (parsed.version) {
      process.stdout.write(`${readVersion()}\n`);
      return 0;
    }
    process.stderr.write(renderError(parsed.error, parsed.json) + "\n");
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
    const payload: ErrorPayload = {
      error: code,
      message: err.message,
    };
    process.stdout.write(renderError(payload, parsed.json) + "\n");
    return code === "neo4j_unreachable" || code === "neo4j_timeout"
      ? 3
      : code === "schema_mismatch"
        ? 4
        : 1;
  } finally {
    await closeDriver().catch(() => {});
  }
}

// Run only when invoked as a script (not when imported by tests).
if (import.meta.url === `file://${process.argv[1]}`) {
  main().then((code) => process.exit(code));
}

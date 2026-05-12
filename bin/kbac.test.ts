import { describe, it, expect } from "vitest";
import { parseArgv, classifyError } from "./kbac.js";
import { ValidationError } from "../src/validation/index.js";

describe("parseArgv", () => {
  it("parses search subcommand with term only", () => {
    const r = parseArgv(["search", "hello"]);
    expect(r.ok).toBe(true);
    if (r.ok === true) {
      expect(r.subcommand).toBe("search");
      expect(r.options.term).toBe("hello");
      expect(r.options.limit).toBe(10);
      expect(r.options.type).toBeUndefined();
      expect(r.json).toBe(false);
    }
  });

  it("parses --type Tool --limit 5 --json", () => {
    const r = parseArgv([
      "search",
      "hello",
      "--type",
      "Tool",
      "--limit",
      "5",
      "--json",
    ]);
    expect(r.ok).toBe(true);
    if (r.ok === true) {
      expect(r.options.type).toBe("Tool");
      expect(r.options.limit).toBe(5);
      expect(r.json).toBe(true);
    }
  });

  it("rejects an empty term", () => {
    const r = parseArgv(["search", ""]);
    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.error.error).toBe("invalid_input");
  });

  it("rejects --limit 0", () => {
    const r = parseArgv(["search", "x", "--limit", "0"]);
    expect(r.ok).toBe(false);
  });

  it("rejects --limit 101", () => {
    const r = parseArgv(["search", "x", "--limit", "101"]);
    expect(r.ok).toBe(false);
  });

  it("rejects --type with a value not in the enum", () => {
    const r = parseArgv(["search", "x", "--type", "Foo"]);
    expect(r.ok).toBe(false);
  });

  it("treats --help as a non-error sentinel", () => {
    const r = parseArgv(["--help"]);
    expect(r.ok).toBe("info");
    if (r.ok === "info") expect(r.kind).toBe("help");
  });

  it("treats --version as a non-error sentinel", () => {
    const r = parseArgv(["--version"]);
    expect(r.ok).toBe("info");
    if (r.ok === "info") expect(r.kind).toBe("version");
  });

  it("rejects --type with no value following", () => {
    const r = parseArgv(["search", "x", "--type"]);
    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.error.message).toContain("--type requires a value");
  });

  it("rejects --limit with no value following", () => {
    const r = parseArgv(["search", "x", "--limit"]);
    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.error.message).toContain("--limit requires a value");
  });

  it("echoes the --json flag on parse failure so callers can render correctly", () => {
    const r = parseArgv(["search", "x", "--bad-flag", "--json"]);
    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.json).toBe(true);
  });

  it("returns ParseInfo (kind=help) for --help", () => {
    const r = parseArgv(["--help"]);
    expect(r.ok).toBe("info");
    if (r.ok === "info") {
      expect(r.kind).toBe("help");
    }
  });

  it("returns ParseInfo (kind=version) for --version", () => {
    const r = parseArgv(["--version"]);
    expect(r.ok).toBe("info");
    if (r.ok === "info") {
      expect(r.kind).toBe("version");
    }
  });
});

describe("classifyError", () => {
  it("classifies ECONNREFUSED as neo4j_unreachable", () => {
    expect(classifyError(new Error("connect ECONNREFUSED 127.0.0.1:7688"))).toBe(
      "neo4j_unreachable",
    );
  });

  it("classifies 'timeout' message as neo4j_timeout", () => {
    expect(classifyError(new Error("query timed out after 5s"))).toBe(
      "neo4j_timeout",
    );
  });

  it("classifies 'Neo.ClientError.Security.Unauthorized' as neo4j_auth_failure", () => {
    expect(
      classifyError(new Error("Neo.ClientError.Security.Unauthorized")),
    ).toBe("neo4j_auth_failure");
  });

  it("classifies 'authentication failure' as neo4j_auth_failure", () => {
    expect(classifyError(new Error("authentication failure"))).toBe(
      "neo4j_auth_failure",
    );
  });

  it("classifies ValidationError as schema_mismatch", () => {
    const ve = new ValidationError(
      [{ instancePath: "/x", message: "is wrong", schemaPath: "", keyword: "", params: {} } as never],
      "search result",
    );
    expect(classifyError(ve)).toBe("schema_mismatch");
  });

  it("falls back to 'unexpected' for unknown errors", () => {
    expect(classifyError(new Error("something weird happened"))).toBe(
      "unexpected",
    );
  });
});

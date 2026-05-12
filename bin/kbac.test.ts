import { describe, it, expect } from "vitest";
import { parseArgv } from "./kbac.js";

describe("parseArgv", () => {
  it("parses search subcommand with term only", () => {
    const r = parseArgv(["search", "hello"]);
    expect(r.ok).toBe(true);
    if (r.ok) {
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
    if (r.ok) {
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
    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.help).toBe(true);
  });

  it("treats --version as a non-error sentinel", () => {
    const r = parseArgv(["--version"]);
    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.version).toBe(true);
  });
});

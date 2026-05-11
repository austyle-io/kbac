import { describe, it, expect } from "vitest";
import { splitCypherStatements } from "./splitter.js";

describe("splitCypherStatements", () => {
  it("returns [] for an empty string", () => {
    expect(splitCypherStatements("")).toEqual([]);
  });

  it("returns one statement for a single MERGE without trailing ;", () => {
    expect(splitCypherStatements("MERGE (n:Node {id: 'x'})")).toEqual([
      "MERGE (n:Node {id: 'x'})",
    ]);
  });

  it("returns one statement for a single MERGE with trailing ;", () => {
    expect(splitCypherStatements("MERGE (n:Node {id: 'x'});")).toEqual([
      "MERGE (n:Node {id: 'x'})",
    ]);
  });

  it("splits two statements on `;`", () => {
    const result = splitCypherStatements(
      "MATCH (a) RETURN a;\nMATCH (b) RETURN b;",
    );
    expect(result).toHaveLength(2);
    expect(result[0]).toBe("MATCH (a) RETURN a");
    expect(result[1]).toBe("MATCH (b) RETURN b");
  });

  it("does NOT split on `;` inside `//` line comments", () => {
    const text = "// comment with ; semicolon\nMATCH (n) RETURN n;";
    const result = splitCypherStatements(text);
    expect(result).toHaveLength(1);
    expect(result[0]).toContain("// comment with ; semicolon");
    expect(result[0]).toContain("MATCH (n) RETURN n");
  });

  it("does NOT split on `;` inside `/* */` block comments", () => {
    const text = "/* block ; comment */ MATCH (n) RETURN n;";
    const result = splitCypherStatements(text);
    expect(result).toHaveLength(1);
    expect(result[0]).toContain("/* block ; comment */");
  });

  it("does NOT split on `;` inside single-quoted strings", () => {
    const text = "MERGE (n {name: 'has ; inside'});";
    expect(splitCypherStatements(text)).toEqual([
      "MERGE (n {name: 'has ; inside'})",
    ]);
  });

  it("does NOT split on `;` inside double-quoted strings", () => {
    const text = 'MERGE (n {name: "has ; inside"});';
    expect(splitCypherStatements(text)).toEqual([
      'MERGE (n {name: "has ; inside"})',
    ]);
  });

  it("honors `\\` escapes inside single-quoted strings", () => {
    const text = "MERGE (n {name: 'has \\' apostrophe; inside'});";
    const result = splitCypherStatements(text);
    expect(result).toHaveLength(1);
    expect(result[0]).toBe("MERGE (n {name: 'has \\' apostrophe; inside'})");
  });

  it("filters out comment-only statements", () => {
    const text = "// just a comment\n// and another;\nMATCH (n) RETURN n;";
    const result = splitCypherStatements(text);
    expect(result).toHaveLength(1);
    expect(result[0]).toContain("MATCH (n) RETURN n");
  });

  it("filters out empty/whitespace-only statements (trailing ;)", () => {
    const text = "MATCH (a) RETURN a;\n\n  \n;";
    const result = splitCypherStatements(text);
    expect(result).toHaveLength(1);
    expect(result[0]).toBe("MATCH (a) RETURN a");
  });

  it("preserves multi-line statements as one entry", () => {
    const text =
      "MERGE (n:Tool {id: 'x'})\nON CREATE SET\n  n.name = 'name',\n  n.created = datetime();";
    const result = splitCypherStatements(text);
    expect(result).toHaveLength(1);
    expect(result[0]).toContain("MERGE (n:Tool {id: 'x'})");
    expect(result[0]).toContain("ON CREATE SET");
    expect(result[0]).toContain("n.created = datetime()");
  });
});

import { describe, it, expect } from "vitest";
import { renderJson, renderMarkdown, renderError } from "./format.js";
import type { SearchResult, ErrorPayload } from "./schemas.js";

const sample: SearchResult = {
  term: "neo4j",
  type: null,
  limit: 10,
  totalCount: 1,
  results: [
    {
      id: "neo4j",
      name: "Neo4j",
      label: "Tool",
      score: 1.5,
      properties: { description: "Graph DB" },
    },
  ],
  durationMs: 42,
};

describe("renderJson", () => {
  it("emits valid JSON parseable back to the same object", () => {
    expect(JSON.parse(renderJson(sample))).toEqual(sample);
  });

  it("emits compact JSON without trailing newline or indentation", () => {
    const out = renderJson(sample);
    expect(out.endsWith("\n")).toBe(false);
    expect(out).not.toContain("\n  ");
  });
});

describe("renderMarkdown", () => {
  it("includes the query header with the term", () => {
    expect(renderMarkdown(sample)).toContain("**Query:** `neo4j`");
  });

  it("renders the result count in the header", () => {
    expect(renderMarkdown(sample)).toContain("1 result");
    const many: SearchResult = { ...sample, totalCount: 5 };
    expect(renderMarkdown(many)).toContain("5 results");
  });

  it("renders each result as a numbered list item with label, name, score", () => {
    const out = renderMarkdown(sample);
    expect(out).toMatch(/1\..*Tool.*Neo4j.*1\.50/);
  });

  it("indicates no results when totalCount is 0", () => {
    const empty: SearchResult = { ...sample, totalCount: 0, results: [] };
    expect(renderMarkdown(empty)).toContain("No results");
  });

  it("shows the type filter in the header when set", () => {
    const filtered: SearchResult = { ...sample, type: "Concept" };
    expect(renderMarkdown(filtered)).toContain("type=Concept");
  });
});

describe("renderError", () => {
  it("emits JSON for ErrorPayload when json=true", () => {
    const err: ErrorPayload = {
      error: "neo4j_unreachable",
      message: "Connection refused at bolt://localhost:7688",
    };
    expect(JSON.parse(renderError(err, true))).toEqual(err);
  });

  it("emits human-readable text when json=false", () => {
    const err: ErrorPayload = {
      error: "invalid_input",
      message: "term is required",
    };
    const out = renderError(err, false);
    expect(out).toContain("Error: invalid_input");
    expect(out).toContain("term is required");
  });
});

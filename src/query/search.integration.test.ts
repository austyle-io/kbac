import { describe, it, expect, afterAll } from "vitest";
import { search } from "./search.js";
import { closeDriver } from "../db/driver.js";

describe("search (integration, requires seeded Neo4j)", () => {
  afterAll(async () => {
    await closeDriver();
  });

  it("returns results for a known seed term", async () => {
    const result = await search({ term: "neo4j", limit: 10 });
    expect(result.term).toBe("neo4j");
    expect(result.totalCount).toBeGreaterThan(0);
    expect(result.results.length).toBeGreaterThan(0);
    expect(result.results[0]).toMatchObject({
      id: expect.any(String),
      name: expect.any(String),
      label: expect.stringMatching(/^(Tool|Concept|Domain|System)$/),
      score: expect.any(Number),
    });
  });

  it("respects the --type filter", async () => {
    const result = await search({ term: "neo4j", type: "Tool", limit: 10 });
    expect(result.type).toBe("Tool");
    expect(result.results.every((r) => r.label === "Tool")).toBe(true);
  });

  it("respects the --limit clamp", async () => {
    const result = await search({ term: "neo4j", limit: 1 });
    expect(result.results.length).toBeLessThanOrEqual(1);
  });

  it("returns empty results for a no-match term", async () => {
    const result = await search({
      term: "xyzqx_no_such_term_kbac_test",
      limit: 10,
    });
    expect(result.totalCount).toBe(0);
    expect(result.results).toEqual([]);
  });

  it("safely handles Lucene-special-char-only input", async () => {
    const result = await search({ term: "***", limit: 10 });
    expect(result.totalCount).toBe(0);
  });

  it("redacts sensitive properties in results (if any seed has them)", async () => {
    const result = await search({ term: "neo4j", limit: 10 });
    for (const entity of result.results) {
      for (const key of Object.keys(entity.properties)) {
        if (/password|secret|token|credential/i.test(key)) {
          expect(entity.properties[key]).toBe("[REDACTED]");
        }
      }
    }
  });
});

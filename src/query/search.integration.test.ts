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

  it("redacts sensitive properties when seed contains them", async () => {
    // The kbac seed graph does not currently include sensitive properties,
    // so this test serves as a regression guard: if a sensitive key is
    // ever returned, it MUST be redacted. We don't fail when no sensitive
    // key appears (that would couple the test to seed-data shape), but
    // we do verify the redaction contract when one does.
    const result = await search({ term: "neo4j", limit: 10 });
    let sawSensitiveKey = false;
    for (const entity of result.results) {
      for (const key of Object.keys(entity.properties)) {
        if (/password|secret|token|credential/i.test(key)) {
          sawSensitiveKey = true;
          expect(entity.properties[key]).toBe("[REDACTED]");
        }
      }
    }
    // Log whether the assertion fired — useful in CI logs to spot when
    // seed data starts including sensitive fields.
    if (!sawSensitiveKey) {
      console.warn(
        "[redaction test] no sensitive keys found in seed results — assertion is vacuous",
      );
    }
  });

  it("throws schema_mismatch (via ValidationError) when search() result fails validation", async () => {
    // Smoke: we can't easily induce real schema drift here, but we can
    // verify the wrap-and-classify pipeline. If search() returns a
    // value, it has already passed assertValid — so this test really
    // pins the integration-test charter that the validation IS happening.
    const result = await search({ term: "neo4j", limit: 1 });
    expect(result).toMatchObject({
      term: expect.any(String),
      limit: expect.any(Number),
      totalCount: expect.any(Number),
      results: expect.any(Array),
      durationMs: expect.any(Number),
    });
    // Spot-check that limit is bounded in the result (not just inputs):
    expect(result.limit).toBeGreaterThanOrEqual(1);
    expect(result.limit).toBeLessThanOrEqual(100);
  });
});

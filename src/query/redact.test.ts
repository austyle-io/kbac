import { describe, it, expect } from "vitest";
import { redactEntity } from "./redact.js";

describe("redactEntity", () => {
  it("passes through non-sensitive fields unchanged", () => {
    expect(redactEntity({ name: "foo", count: 42 })).toEqual({
      name: "foo",
      count: 42,
    });
  });

  it("redacts exact match: password", () => {
    expect(redactEntity({ password: "secret" })).toEqual({
      password: "[REDACTED]",
    });
  });

  it("redacts exact match: apiKey, apikey, api_key (all cases)", () => {
    expect(redactEntity({ apiKey: "x" }).apiKey).toBe("[REDACTED]");
    expect(redactEntity({ apikey: "x" }).apikey).toBe("[REDACTED]");
    expect(redactEntity({ api_key: "x" }).api_key).toBe("[REDACTED]");
  });

  it("redacts via pattern: anything matching /secret/i", () => {
    expect(redactEntity({ mySecretValue: "x" }).mySecretValue).toBe(
      "[REDACTED]",
    );
  });

  it("redacts via pattern: anything matching /token/i", () => {
    expect(redactEntity({ AccessToken: "x" }).AccessToken).toBe("[REDACTED]");
  });

  it("redacts via pattern: anything matching /credential/i", () => {
    expect(redactEntity({ userCredentials: "x" }).userCredentials).toBe(
      "[REDACTED]",
    );
  });

  it("recursively redacts nested objects", () => {
    const input = { meta: { password: "p", name: "n" } };
    expect(redactEntity(input)).toEqual({
      meta: { password: "[REDACTED]", name: "n" },
    });
  });

  it("does not recurse into arrays (treats them as values)", () => {
    const input = { tags: ["password", "token"] };
    expect(redactEntity(input)).toEqual({ tags: ["password", "token"] });
  });

  it("stops recursing past depth 4 to prevent runaway", () => {
    const deep: Record<string, unknown> = {};
    let cursor: Record<string, unknown> = deep;
    for (let i = 0; i < 6; i++) {
      cursor.nest = { password: "leaked" };
      cursor = cursor.nest as Record<string, unknown>;
    }
    const out = redactEntity(deep);
    // depth-4 redaction means the very deepest password is left raw because
    // we stop descending. Verify by walking 5 levels and finding raw "leaked".
    let probe: unknown = out;
    for (let i = 0; i < 5; i++) {
      probe = (probe as Record<string, unknown>).nest;
    }
    expect((probe as Record<string, unknown>).password).toBe("leaked");
  });

  it("handles null values without crashing", () => {
    expect(redactEntity({ password: null })).toEqual({
      password: "[REDACTED]",
    });
  });

  it("returns a new object (does not mutate input)", () => {
    const input = { password: "p" };
    const out = redactEntity(input);
    expect(input.password).toBe("p");
    expect(out.password).toBe("[REDACTED]");
  });

  it("redacts mixed pattern + exact + clean fields in one call", () => {
    expect(
      redactEntity({ name: "n", password: "p", refreshToken: "r" }),
    ).toEqual({
      name: "n",
      password: "[REDACTED]",
      refreshToken: "[REDACTED]",
    });
  });

  it("treats 'auth' as a redacted field name", () => {
    expect(redactEntity({ auth: "x" }).auth).toBe("[REDACTED]");
  });

  it("treats 'authorization' as a redacted field name", () => {
    expect(redactEntity({ authorization: "x" }).authorization).toBe(
      "[REDACTED]",
    );
  });

  it("treats 'private' and 'privateKey' as redacted", () => {
    expect(redactEntity({ private: "x" }).private).toBe("[REDACTED]");
    expect(redactEntity({ privateKey: "x" }).privateKey).toBe("[REDACTED]");
  });

  it("redacts exact match: bearer", () => {
    expect(redactEntity({ bearer: "tok" }).bearer).toBe("[REDACTED]");
  });

  it("redacts exact match: key (bare field)", () => {
    expect(redactEntity({ key: "ssh-rsa" }).key).toBe("[REDACTED]");
  });

  it("redacts exact match: access_token and accesstoken", () => {
    expect(redactEntity({ access_token: "x" }).access_token).toBe("[REDACTED]");
    expect(redactEntity({ accesstoken: "x" }).accesstoken).toBe("[REDACTED]");
  });

  it("redacts exact match: refresh_token and refreshtoken", () => {
    expect(redactEntity({ refresh_token: "x" }).refresh_token).toBe(
      "[REDACTED]",
    );
    expect(redactEntity({ refreshtoken: "x" }).refreshtoken).toBe("[REDACTED]");
  });

  it("redacts exact match: client_secret and clientsecret", () => {
    expect(redactEntity({ client_secret: "x" }).client_secret).toBe(
      "[REDACTED]",
    );
    expect(redactEntity({ clientsecret: "x" }).clientsecret).toBe("[REDACTED]");
  });

  it("redacts exact match: private_key and privatekey", () => {
    expect(redactEntity({ private_key: "x" }).private_key).toBe("[REDACTED]");
    expect(redactEntity({ privatekey: "x" }).privatekey).toBe("[REDACTED]");
  });
});

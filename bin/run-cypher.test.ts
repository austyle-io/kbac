import { describe, it, expect, beforeAll, afterAll } from "vitest";
import {
  mkdtempSync,
  rmSync,
  symlinkSync,
  writeFileSync,
  mkdirSync,
} from "node:fs";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";
import { resolveSafeCypherPath } from "./run-cypher.js";

const cypherRoot = resolve(__dirname, "..", "cypher");

describe("resolveSafeCypherPath", () => {
  it("accepts a real file inside cypher/", () => {
    expect(() => resolveSafeCypherPath("cypher/00-smoke-test.cypher")).not.toThrow();
  });

  it("rejects a parent-directory traversal", () => {
    expect(() => resolveSafeCypherPath("cypher/../package.json")).toThrow(
      /path must be inside/i,
    );
  });

  it("rejects an absolute path outside cypher/", () => {
    expect(() => resolveSafeCypherPath("/etc/passwd")).toThrow(
      /path must be inside/i,
    );
  });

  it("rejects the cypherRoot directory itself", () => {
    expect(() => resolveSafeCypherPath("cypher")).toThrow(/path must be inside/i);
  });
});

describe("resolveSafeCypherPath — symlink hardening", () => {
  let evilDir: string;
  let symlinkPath: string;

  beforeAll(() => {
    evilDir = mkdtempSync(join(tmpdir(), "kbac-symlink-test-"));
    writeFileSync(join(evilDir, "evil.cypher"), "RETURN 1;");
    symlinkPath = join(cypherRoot, "evil-symlink.cypher");
    symlinkSync(join(evilDir, "evil.cypher"), symlinkPath);
  });

  afterAll(() => {
    rmSync(symlinkPath, { force: true });
    rmSync(evilDir, { recursive: true, force: true });
  });

  it("rejects a symlink inside cypher/ that points outside the repo", () => {
    expect(() => resolveSafeCypherPath("cypher/evil-symlink.cypher")).toThrow(
      /path must be inside|symlink/i,
    );
  });
});

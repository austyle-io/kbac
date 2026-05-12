import { describe, it, expect } from "vitest";
import { escapeLucene } from "./escape.js";

describe("escapeLucene", () => {
  it("passes through plain text unchanged", () => {
    expect(escapeLucene("hello world")).toBe("hello world");
  });

  it("returns empty string for empty input", () => {
    expect(escapeLucene("")).toBe("");
  });

  it("escapes plus sign", () => {
    expect(escapeLucene("a+b")).toBe("a\\+b");
  });

  it("escapes minus sign", () => {
    expect(escapeLucene("a-b")).toBe("a\\-b");
  });

  it("escapes boolean operator chars && and ||", () => {
    expect(escapeLucene("a&&b")).toBe("a\\&\\&b");
    expect(escapeLucene("a||b")).toBe("a\\|\\|b");
  });

  it("escapes parentheses, brackets, braces", () => {
    expect(escapeLucene("(a){b}[c]")).toBe("\\(a\\)\\{b\\}\\[c\\]");
  });

  it("escapes quote, tilde, asterisk, question mark, colon", () => {
    expect(escapeLucene('"~*?:')).toBe('\\"\\~\\*\\?\\:');
  });

  it("escapes backslash and forward slash", () => {
    expect(escapeLucene("\\/")).toBe("\\\\\\/");
  });

  it("escapes exclamation and caret", () => {
    expect(escapeLucene("!x^y")).toBe("\\!x\\^y");
  });

  it("escapes a realistic injection attempt", () => {
    expect(escapeLucene("test+AND+password:*")).toBe(
      "test\\+AND\\+password\\:\\*",
    );
  });

  it("escapes all 17 Lucene special characters concatenated", () => {
    expect(escapeLucene('+-&|!(){}[]^"~*?:\\/')).toBe(
      '\\+\\-\\&\\|\\!\\(\\)\\{\\}\\[\\]\\^\\"\\~\\*\\?\\:\\\\\\/',
    );
  });

  it("escapes consecutive identical special characters", () => {
    expect(escapeLucene("+++")).toBe("\\+\\+\\+");
  });
});

// ============================================================================
// Cypher statement splitter
// ----------------------------------------------------------------------------
// Splits a Cypher file into top-level statements on `;` while preserving any
// `;` characters that appear inside skippable regions:
//
//   - `//` line comments
//   - `/* ... */` block comments
//   - 'single'-quoted string literals (with `\` escapes)
//   - "double"-quoted string literals (with `\` escapes)
//
// Comments are kept inside the emitted statements so Neo4j error line numbers
// and downstream logging output stay aligned with the source file.
// ============================================================================

type SkippableKind = "line-comment" | "block-comment" | "single-quote" | "double-quote";

/** Detect whether the two-character window at `text[i]` opens a skippable region. */
function detectSkippable(text: string, i: number): SkippableKind | null {
  const ch = text[i];
  const next = i + 1 < text.length ? text[i + 1] : "";
  if (ch === "/" && next === "/") return "line-comment";
  if (ch === "/" && next === "*") return "block-comment";
  if (ch === "'") return "single-quote";
  if (ch === '"') return "double-quote";
  return null;
}

/** Index just past the end of the `//` line comment starting at `start` (points at the `\n` or EOF). */
function endOfLineComment(text: string, start: number): number {
  let i = start;
  while (i < text.length && text[i] !== "\n") i++;
  return i;
}

/** Index just past the closing of the block comment starting at `start`. */
function endOfBlockComment(text: string, start: number): number {
  let i = start + 2;
  while (i + 1 < text.length) {
    if (text[i] === "*" && text[i + 1] === "/") return i + 2;
    i++;
  }
  return text.length;
}

/** Index just past a `'`- or `"`-quoted string literal starting at `start`, honoring `\` escapes. */
function endOfStringLiteral(text: string, start: number, quote: string): number {
  let i = start + 1;
  while (i < text.length) {
    const ch = text[i];
    if (ch === "\\" && i + 1 < text.length) {
      i += 2;
      continue;
    }
    i++;
    if (ch === quote) return i;
  }
  return text.length;
}

/** Index just past the skippable region of `kind` starting at `start`. */
function endOfSkippable(text: string, start: number, kind: SkippableKind): number {
  switch (kind) {
    case "line-comment":  return endOfLineComment(text, start);
    case "block-comment": return endOfBlockComment(text, start);
    case "single-quote":  return endOfStringLiteral(text, start, "'");
    case "double-quote":  return endOfStringLiteral(text, start, '"');
  }
}

function isAllCommentLines(text: string): boolean {
  return text.split("\n").every((line) => {
    const t = line.trim();
    return t.length === 0 || t.startsWith("//");
  });
}

function pushStatement(out: string[], buf: string): void {
  const trimmed = buf.trim();
  if (trimmed.length > 0 && !isAllCommentLines(trimmed)) out.push(trimmed);
}

/**
 * Split a Cypher script into top-level statements on `;`. Preserves `;` inside
 * line comments, block comments, and single/double-quoted string literals.
 */
export function splitCypherStatements(text: string): string[] {
  const out: string[] = [];
  let buf = "";
  let i = 0;
  while (i < text.length) {
    const skippable = detectSkippable(text, i);
    if (skippable !== null) {
      const end = endOfSkippable(text, i, skippable);
      buf += text.slice(i, end);
      i = end;
      continue;
    }
    if (text[i] === ";") {
      pushStatement(out, buf);
      buf = "";
      i++;
      continue;
    }
    buf += text[i];
    i++;
  }
  pushStatement(out, buf);
  return out;
}

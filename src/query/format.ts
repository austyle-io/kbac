import type { SearchResult, ErrorPayload } from "./schemas.js";

/**
 * Render a SearchResult as machine-readable JSON (compact, no trailing
 * newline). Used by the slash command via the Bash tool.
 */
export function renderJson(r: SearchResult): string {
  return JSON.stringify(r);
}

/**
 * Render a SearchResult as human-readable Markdown for interactive
 * terminal use (`kbac search ...` without `--json`).
 */
export function renderMarkdown(r: SearchResult): string {
  const header = [
    `**Query:** \`${r.term}\`${r.type ? ` _(type=${r.type})_` : ""}`,
    `**${r.totalCount} result${r.totalCount === 1 ? "" : "s"}** in ${r.durationMs}ms`,
    "",
  ].join("\n");

  if (r.results.length === 0) {
    return `${header}\n_No results._\n`;
  }

  const items = r.results
    .map((e, i) => {
      const score = e.score.toFixed(2);
      const desc =
        typeof e.properties.description === "string"
          ? `  \n  ${e.properties.description}`
          : "";
      return `${i + 1}. **${e.label}** \`${e.name}\` _(score: ${score})_${desc}`;
    })
    .join("\n");

  return `${header}\n${items}\n`;
}

/**
 * Render an ErrorPayload. JSON when `json=true`; otherwise a two-line
 * human-readable error.
 */
export function renderError(e: ErrorPayload, json: boolean): string {
  if (json) return JSON.stringify(e);
  return `Error: ${e.error}\n${e.message}`;
}

/**
 * Lucene special characters per
 * https://lucene.apache.org/core/9_8_0/queryparser/org/apache/lucene/queryparser/classic/package-summary.html
 *
 * Order in the character class matters only for readability; the regex
 * captures one char at a time and prefixes a backslash.
 */
const LUCENE_SPECIAL_CHARS = /([+\-&|!(){}[\]^"~*?:\\/])/g;

/**
 * Escape Lucene special characters in `input` so it can be safely passed
 * to `db.index.fulltext.queryNodes` without being parsed as a query
 * expression. Empty input is returned unchanged.
 */
export function escapeLucene(input: string): string {
  return input.replace(LUCENE_SPECIAL_CHARS, "\\$1");
}

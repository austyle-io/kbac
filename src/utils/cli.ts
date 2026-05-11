/**
 * Print `message` to stderr and exit the process with code 1.
 *
 * Returns `never` so TypeScript can narrow the surrounding scope after
 * a precondition check, e.g.:
 *
 * ```ts
 * const file = process.argv[2];
 * if (!file) fatal("Usage: my-script <file>");
 * // `file` is `string` here, not `string | undefined`.
 * ```
 */
export function fatal(message: string): never {
  console.error(message);
  process.exit(1);
}

import { Marked, type MarkedExtension, type Token } from "marked";

export interface LexedBlock {
  /** Stable key for React reconciliation. Encodes block type + offset in source. */
  key: string;
  token: Token;
  /**
   * 1-based source line number where this block starts in the original `content`.
   * Used by callers (e.g. Monaco preview) to align rendered DOM nodes with
   * editor lines for synchronized scrolling.
   */
  sourceLine: number;
}

/**
 * Lex `content` into block-level tokens using a fresh `Marked` instance (no global pollution).
 *
 * The returned `key` is stable across re-runs as long as the block's raw text
 * (and everything before it) doesn't change. That property is the basis of
 * `StreamingMarkdown`'s block-level memoization: while AI is appending to the
 * last block, all earlier blocks keep the same key and same `raw`, so their
 * memoized React subtree (and any browser selection inside it) stays alive.
 */
export function lex(
  content: string,
  extensions: MarkedExtension[] = [],
): LexedBlock[] {
  const m = new Marked();
  if (extensions.length > 0) m.use(...extensions);
  const tokens = m.lexer(content) as Token[];

  let offset = 0;
  let newlinesSeen = 0;
  return tokens.map((token) => {
    const raw = (token as { raw?: string }).raw ?? "";
    const sourceLine = newlinesSeen + 1;
    // Scrolling cursor: count `\n` chars in raw to avoid O(n²) slicing.
    for (let i = 0; i < raw.length; i++) {
      if (raw.charCodeAt(i) === 10) newlinesSeen++;
    }
    const key = `${token.type}-${offset}-${raw.length}`;
    offset += raw.length;
    return { key, token, sourceLine };
  });
}

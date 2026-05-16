import type { MarkedExtension, Token } from "marked";
import { memo, useMemo } from "react";

import { cn } from "../utils";
import { lex } from "./core/lex";
import { renderBlock } from "./core/render-block";
import type { MarkdownComponents } from "./core/types";
import type { MarkdownProps } from "./Markdown";

export interface StreamingMarkdownProps extends MarkdownProps {
  /**
   * Whether the upstream is still appending to `content`. When `true`, only the
   * last block is treated as "live"; all earlier blocks are memoized by their
   * stable raw text, so React skips reconciliation and the browser's selection
   * stays anchored inside them.
   */
  streaming?: boolean;
}

interface MemoBlockProps {
  token: Token;
  components?: MarkdownComponents;
  isLast: boolean;
  streaming: boolean;
  index: number;
  sourceLine: number;
}

const MemoBlock = memo(
  function MemoBlock({
    token,
    components,
    isLast,
    streaming,
    index,
    sourceLine,
  }: MemoBlockProps) {
    return (
      <span className="tk-md-block-wrap">
        {renderBlock(
          token,
          { components, streaming: isLast && streaming },
          index,
          sourceLine,
        )}
      </span>
    );
  },
  (prev, next) => {
    // marked.lexer always produces fresh token objects, so reference equality
    // is unreliable. Compare by raw text + type — the invariant that backs
    // streaming safety: completed blocks never have their raw text mutated.
    const a = prev.token as { raw?: string; type?: string };
    const b = next.token as { raw?: string; type?: string };
    return (
      a.raw === b.raw &&
      a.type === b.type &&
      prev.isLast === next.isLast &&
      prev.streaming === next.streaming &&
      prev.components === next.components &&
      prev.index === next.index &&
      prev.sourceLine === next.sourceLine
    );
  },
);

/**
 * Streaming-aware markdown renderer. While `streaming` is true, only the
 * currently-growing last block re-renders; everything before it is locked
 * via `React.memo` keyed on raw text. This protects browser selections
 * spanning prior blocks (a regression long suffered by the AI chat view).
 */
export function StreamingMarkdown({
  content,
  variant = "comfortable",
  extensions,
  components,
  className,
  streaming = false,
}: StreamingMarkdownProps) {
  const blocks = useMemo<ReturnType<typeof lex>>(
    () => lex(content, extensions ?? ([] as MarkedExtension[])),
    [content, extensions],
  );

  const lastIndex = blocks.length - 1;

  return (
    <div className={cn("tk-md", `tk-md-${variant}`, className)}>
      {blocks.map((b, i) => (
        <MemoBlock
          key={b.key}
          token={b.token}
          components={components}
          isLast={i === lastIndex}
          streaming={streaming}
          index={i}
          sourceLine={b.sourceLine}
        />
      ))}
    </div>
  );
}

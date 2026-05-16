import type { MarkedExtension } from "marked";
import { useMemo } from "react";

import { cn } from "../utils";
import { lex } from "./core/lex";
import { renderBlock } from "./core/render-block";
import type { MarkdownComponents } from "./core/types";

export type MarkdownVariant = "compact" | "comfortable";

export interface MarkdownProps {
  content: string;
  /** Visual density. Default `"comfortable"` (Docs-style reading). Use `"compact"` for chat / sidebars. */
  variant?: MarkdownVariant;
  /** Extra marked extensions for business-specific syntax (think / cite / mention etc.). */
  extensions?: MarkedExtension[];
  /** Override / add renderers for specific token types (including extension token types). */
  components?: MarkdownComponents;
  className?: string;
}

/** Static, all-at-once markdown renderer. Re-renders the whole tree on every content change. */
export function Markdown({
  content,
  variant = "comfortable",
  extensions,
  components,
  className,
}: MarkdownProps) {
  const blocks = useMemo(
    () => lex(content, extensions ?? []),
    [content, extensions],
  );

  return (
    <div className={cn("tk-md", `tk-md-${variant}`, className)}>
      {blocks.map((b, i) => (
        <span key={b.key} className="tk-md-block-wrap">
          {renderBlock(
            b.token,
            { components, streaming: false },
            i,
            b.sourceLine,
          )}
        </span>
      ))}
    </div>
  );
}

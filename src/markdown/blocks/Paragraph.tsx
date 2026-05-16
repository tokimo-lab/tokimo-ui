import type { Tokens } from "marked";

import { renderInline } from "../core/render-inline";

export function Paragraph({
  token,
  ctx,
  sourceLine,
}: {
  token: Tokens.Paragraph;
  ctx?: { components?: import("../core/types").MarkdownComponents };
  sourceLine?: number;
}) {
  return (
    <p className="tk-md-p" data-source-line={sourceLine}>
      {renderInline(token.tokens, ctx)}
    </p>
  );
}

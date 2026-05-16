import type { Tokens } from "marked";

import { renderInline } from "../core/render-inline";

export function Paragraph({
  token,
  ctx,
}: {
  token: Tokens.Paragraph;
  ctx?: { components?: import("../core/types").MarkdownComponents };
}) {
  return <p className="tk-md-p">{renderInline(token.tokens, ctx)}</p>;
}

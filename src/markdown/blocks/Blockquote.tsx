import type { Tokens } from "marked";

import { type RenderBlockContext, renderBlock } from "../core/render-block";

export function Blockquote({
  token,
  ctx,
  sourceLine,
}: {
  token: Tokens.Blockquote;
  ctx: RenderBlockContext;
  sourceLine?: number;
}) {
  return (
    <blockquote className="tk-md-blockquote" data-source-line={sourceLine}>
      {token.tokens.map((child, i) => renderBlock(child, ctx, i))}
    </blockquote>
  );
}

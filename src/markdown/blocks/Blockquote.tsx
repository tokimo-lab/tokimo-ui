import type { Tokens } from "marked";

import { type RenderBlockContext, renderBlock } from "../core/render-block";

export function Blockquote({
  token,
  ctx,
}: {
  token: Tokens.Blockquote;
  ctx: RenderBlockContext;
}) {
  return (
    <blockquote className="tk-md-blockquote">
      {token.tokens.map((child, i) => renderBlock(child, ctx, i))}
    </blockquote>
  );
}

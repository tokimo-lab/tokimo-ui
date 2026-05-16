import type { Tokens } from "marked";

import { renderInline } from "../core/render-inline";
import type { MarkdownComponents } from "../core/types";

export function Heading({
  token,
  ctx,
  sourceLine,
}: {
  token: Tokens.Heading;
  ctx?: { components?: MarkdownComponents };
  sourceLine?: number;
}) {
  const cls = `tk-md-h tk-md-h${token.depth}`;
  const dsl = sourceLine;
  switch (token.depth) {
    case 1:
      return (
        <h1 className={cls} data-source-line={dsl}>
          {renderInline(token.tokens, ctx)}
        </h1>
      );
    case 2:
      return (
        <h2 className={cls} data-source-line={dsl}>
          {renderInline(token.tokens, ctx)}
        </h2>
      );
    case 3:
      return (
        <h3 className={cls} data-source-line={dsl}>
          {renderInline(token.tokens, ctx)}
        </h3>
      );
    case 4:
      return (
        <h4 className={cls} data-source-line={dsl}>
          {renderInline(token.tokens, ctx)}
        </h4>
      );
    case 5:
      return (
        <h5 className={cls} data-source-line={dsl}>
          {renderInline(token.tokens, ctx)}
        </h5>
      );
    default:
      return (
        <h6 className={cls} data-source-line={dsl}>
          {renderInline(token.tokens, ctx)}
        </h6>
      );
  }
}

import type { Token, Tokens } from "marked";
import type { ReactNode } from "react";

import { type RenderBlockContext, renderBlock } from "../core/render-block";
import { renderInline } from "../core/render-inline";

export function List({
  token,
  ctx,
}: {
  token: Tokens.List;
  ctx: RenderBlockContext;
}) {
  const Tag = token.ordered ? "ol" : "ul";
  const startAttr =
    token.ordered && token.start !== 1 && token.start !== ""
      ? { start: Number(token.start) }
      : {};

  return (
    <Tag
      className={`tk-md-list ${token.ordered ? "tk-md-list-ordered" : "tk-md-list-unordered"}`}
      {...startAttr}
    >
      {token.items.map((item, i) => (
        // biome-ignore lint/suspicious/noArrayIndexKey: list item order is positional and never reorders within one parse
        <ListItem key={`li-${i}`} item={item} ctx={ctx} />
      ))}
    </Tag>
  );
}

function ListItem({
  item,
  ctx,
}: {
  item: Tokens.ListItem;
  ctx: RenderBlockContext;
}) {
  const isTask = item.task;
  return (
    <li className={`tk-md-li ${isTask ? "tk-md-li-task" : ""}`}>
      {isTask && (
        <input
          type="checkbox"
          checked={!!item.checked}
          readOnly
          className="tk-md-task-checkbox"
        />
      )}
      <span className="tk-md-li-body">
        {renderItemChildren(item.tokens, ctx)}
      </span>
    </li>
  );
}

/**
 * List items mix inline `text` tokens (which need to render inline, not in a <p>)
 * with nested block tokens (sub-lists, paragraphs, code blocks). We split:
 *  - leading inline `text` tokens → rendered inline
 *  - everything else → rendered as blocks via renderBlock
 */
function renderItemChildren(
  tokens: Token[],
  ctx: RenderBlockContext,
): ReactNode {
  const out: ReactNode[] = [];
  tokens.forEach((tok, i) => {
    if (tok.type === "text") {
      const t = tok as Tokens.Text;
      out.push(
        // biome-ignore lint/suspicious/noArrayIndexKey: positional children within a single list item
        <span key={`t-${i}`}>
          {renderInline(t.tokens ?? [tok as Token], ctx)}
        </span>,
      );
    } else {
      out.push(renderBlock(tok, ctx, i));
    }
  });
  return out;
}

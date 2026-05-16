import type { Token, Tokens } from "marked";
import type { ReactNode } from "react";

import type { MarkdownComponents } from "./types";

export interface RenderInlineContext {
  components?: MarkdownComponents;
}

/**
 * Render inline tokens (text, strong, em, code, link, image, etc.) into React nodes.
 * Used by paragraph / heading / table-cell / list-item renderers.
 *
 * `ctx.components` lets callers override default rendering or render extension
 * inline tokens (e.g. `cite`, `tokimo-mention`).
 */
export function renderInline(
  tokens: Token[] | undefined,
  ctx: RenderInlineContext = {},
): ReactNode {
  if (!tokens || tokens.length === 0) return null;
  return tokens.map((tok, i) => renderInlineToken(tok, i, ctx));
}

function renderInlineToken(
  token: Token,
  index: number,
  ctx: RenderInlineContext,
): ReactNode {
  const key = `${token.type}-${index}`;
  const Override = ctx.components?.[token.type];
  if (Override) {
    return <Override key={key} token={token} />;
  }
  switch (token.type) {
    case "text": {
      const t = token as Tokens.Text;
      // Some `text` tokens have nested inline `tokens` (e.g. inside list_item).
      if (t.tokens && t.tokens.length > 0) {
        return <span key={key}>{renderInline(t.tokens, ctx)}</span>;
      }
      return <span key={key}>{t.text}</span>;
    }
    case "escape": {
      const t = token as Tokens.Escape;
      return <span key={key}>{t.text}</span>;
    }
    case "strong": {
      const t = token as Tokens.Strong;
      return (
        <strong key={key} className="tk-md-strong">
          {renderInline(t.tokens, ctx)}
        </strong>
      );
    }
    case "em": {
      const t = token as Tokens.Em;
      return (
        <em key={key} className="tk-md-em">
          {renderInline(t.tokens, ctx)}
        </em>
      );
    }
    case "del": {
      const t = token as Tokens.Del;
      return (
        <del key={key} className="tk-md-del">
          {renderInline(t.tokens, ctx)}
        </del>
      );
    }
    case "codespan": {
      const t = token as Tokens.Codespan;
      return (
        <code key={key} className="tk-md-code-inline">
          {t.text}
        </code>
      );
    }
    case "link": {
      const t = token as Tokens.Link;
      const isExternal = /^https?:\/\//i.test(t.href);
      return (
        <a
          key={key}
          href={t.href}
          title={t.title ?? undefined}
          className="tk-md-link"
          target={isExternal ? "_blank" : undefined}
          rel={isExternal ? "noopener noreferrer" : undefined}
        >
          {renderInline(t.tokens, ctx)}
        </a>
      );
    }
    case "image": {
      const t = token as Tokens.Image;
      return (
        <img
          key={key}
          src={t.href}
          alt={t.text}
          title={t.title ?? undefined}
          loading="lazy"
          className="tk-md-image-inline"
        />
      );
    }
    case "br": {
      return <br key={key} />;
    }
    case "html": {
      // For safety, treat raw inline HTML as plain text — do NOT dangerouslySetInnerHTML.
      const t = token as Tokens.HTML;
      return <span key={key}>{t.raw}</span>;
    }
    default: {
      // Unknown / extension inline token — render its raw text as fallback.
      const raw =
        (token as { raw?: string; text?: string }).text ??
        (token as { raw?: string }).raw ??
        "";
      return <span key={key}>{raw}</span>;
    }
  }
}

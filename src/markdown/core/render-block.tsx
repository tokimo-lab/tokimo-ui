import type { Token, Tokens } from "marked";
import type { ReactNode } from "react";

import { Blockquote } from "../blocks/Blockquote";
import { CodeBlock } from "../blocks/CodeBlock";
import { Heading } from "../blocks/Heading";
import { Hr } from "../blocks/Hr";
import { Image } from "../blocks/Image";
import { List } from "../blocks/List";
import { Paragraph } from "../blocks/Paragraph";
import { Table } from "../blocks/Table";
import type { MarkdownComponents } from "./types";

export interface RenderBlockContext {
  components?: MarkdownComponents;
  /** When true, defers expensive work (e.g. syntax highlighting) — set by StreamingMarkdown on the last block. */
  streaming?: boolean;
}

export function renderBlock(
  token: Token,
  ctx: RenderBlockContext = {},
  index = 0,
  sourceLine?: number,
): ReactNode {
  const key = `${token.type}-${index}`;
  const Override = ctx.components?.[token.type];
  if (Override) {
    return <Override key={key} token={token} />;
  }

  switch (token.type) {
    case "space":
      return null;

    case "heading": {
      const t = token as Tokens.Heading;
      return <Heading key={key} token={t} ctx={ctx} sourceLine={sourceLine} />;
    }
    case "paragraph": {
      const t = token as Tokens.Paragraph;
      return (
        <Paragraph key={key} token={t} ctx={ctx} sourceLine={sourceLine} />
      );
    }
    case "blockquote": {
      const t = token as Tokens.Blockquote;
      return (
        <Blockquote key={key} token={t} ctx={ctx} sourceLine={sourceLine} />
      );
    }
    case "list": {
      const t = token as Tokens.List;
      return <List key={key} token={t} ctx={ctx} sourceLine={sourceLine} />;
    }
    case "hr":
      return <Hr key={key} sourceLine={sourceLine} />;
    case "code": {
      const t = token as Tokens.Code;
      return (
        <CodeBlock
          key={key}
          token={t}
          streaming={ctx.streaming}
          sourceLine={sourceLine}
        />
      );
    }
    case "table": {
      const t = token as Tokens.Table;
      return <Table key={key} token={t} ctx={ctx} sourceLine={sourceLine} />;
    }
    case "html": {
      // Raw block HTML — render as plain text for safety.
      const t = token as Tokens.HTML;
      return (
        <pre key={key} className="tk-md-raw-html" data-source-line={sourceLine}>
          {t.raw}
        </pre>
      );
    }
    case "image": {
      // Block-level image fallback (rare; usually inline).
      const t = token as Tokens.Image;
      return <Image key={key} token={t} sourceLine={sourceLine} />;
    }
    default: {
      // Unknown / extension block — render raw as paragraph fallback.
      const raw = (token as { raw?: string }).raw ?? "";
      return (
        <p key={key} className="tk-md-p" data-source-line={sourceLine}>
          {raw}
        </p>
      );
    }
  }
}

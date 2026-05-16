/**
 * Re-exports of marked extension types so consumers (packages/web) can author
 * business-specific syntax (e.g. `<think>`, `⟦cite:⟧`, `@mention`) without
 * importing marked themselves.
 */
export type {
  MarkedExtension,
  RendererExtension,
  Token,
  TokenizerAndRendererExtension,
  TokenizerExtension,
  Tokens,
} from "marked";

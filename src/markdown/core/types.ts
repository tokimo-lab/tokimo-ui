import type { Token } from "marked";
import type { ComponentType, ReactNode } from "react";

/** Custom block / inline renderer map, keyed by marked token `type`. */
export interface MarkdownComponents {
  [tokenType: string]: ComponentType<{ token: Token; children?: ReactNode }>;
}

import { createContext, useContext } from "react";

/** Only the standalone application's primary surface can own document scrolling. */
export const StandaloneDocumentScrollContext = createContext(false);

export function useStandaloneDocumentScroll(): boolean {
  return useContext(StandaloneDocumentScrollContext);
}

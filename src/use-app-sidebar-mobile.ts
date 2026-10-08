import { createContext, useContext } from "react";

/** Nested navigation uses its app's presentation rather than measuring a leftover column. */
export const AppSidebarMobileContext = createContext<boolean | null>(null);

export function useAppSidebarMobile(containerWidth: number): boolean {
  const inherited = useContext(AppSidebarMobileContext);
  return inherited ?? (containerWidth > 0 && containerWidth < 720);
}

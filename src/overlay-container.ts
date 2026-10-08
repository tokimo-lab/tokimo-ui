/** A document-scrolling app has no bounded window for an absolute overlay. */
export function resolveOverlayContainer(
  container: HTMLElement | null | undefined,
): HTMLElement | null {
  return container?.dataset.standaloneLayout === "document"
    ? null
    : (container ?? null);
}

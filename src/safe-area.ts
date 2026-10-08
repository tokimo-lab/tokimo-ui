import { type MiddlewareState, size } from "@floating-ui/react";

/** Viewport portal bounds, evaluated by Floating UI after mounting. */
export function safeAreaPadding(gap: number) {
  return ({ elements }: MiddlewareState) => {
    const doc = elements.floating.ownerDocument;
    const style = getComputedStyle(doc.documentElement);
    return {
      padding: {
        top:
          (Number.parseFloat(style.getPropertyValue("--safe-area-top")) || 0) +
          gap,
        right:
          (Number.parseFloat(style.getPropertyValue("--safe-area-right")) ||
            0) + gap,
        bottom:
          (Number.parseFloat(style.getPropertyValue("--safe-area-bottom")) ||
            0) + gap,
        left:
          (Number.parseFloat(style.getPropertyValue("--safe-area-left")) || 0) +
          gap,
      },
    };
  };
}

/** Cap the scrollable surface inside the positioned portal wrapper. */
export function safeAreaMenuSize(gap: number) {
  return size((state) => ({
    ...safeAreaPadding(gap)(state),
    apply({ availableHeight, elements }) {
      const surface = elements.floating.firstElementChild as HTMLElement;
      Object.assign(surface.style, {
        maxHeight: `${Math.max(0, availableHeight)}px`,
        overflowY: "auto",
      });
    },
  }));
}

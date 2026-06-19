export const PADDING = 16;
export const CONTENT_WIDTH = 300;
export const CONTENT_HEIGHT = 200;

export function getElementPosition(id: string, highlightPadding: number = 0) {
  const element = document.querySelector<HTMLElement>(`[data-tour-id="${id}"]`);
  if (!element) return null;
  const rect = element.getBoundingClientRect();
  return {
    top: rect.top + window.scrollY - highlightPadding,
    left: rect.left + window.scrollX - highlightPadding,
    width: rect.width + highlightPadding * 2,
    height: rect.height + highlightPadding * 2,
  };
}

export function calculateContentPosition(
  elementPos: { top: number; left: number; width: number; height: number },
  position: "top" | "bottom" | "left" | "right" = "bottom",
  popoverWidth: number = CONTENT_WIDTH,
  popoverHeight: number = CONTENT_HEIGHT,
) {
  const viewportWidth = window.innerWidth;
  const viewportHeight = window.innerHeight;

  let left = elementPos.left;
  let top = elementPos.top;

  switch (position) {
    case "top":
      top = elementPos.top - popoverHeight - PADDING;
      left = elementPos.left + elementPos.width / 2 - popoverWidth / 2;
      break;
    case "bottom":
      top = elementPos.top + elementPos.height + PADDING;
      left = elementPos.left + elementPos.width / 2 - popoverWidth / 2;
      break;
    case "left":
      left = elementPos.left - popoverWidth - PADDING;
      top = elementPos.top + elementPos.height / 2 - popoverHeight / 2;
      break;
    case "right":
      left = elementPos.left + elementPos.width + PADDING;
      top = elementPos.top + elementPos.height / 2 - popoverHeight / 2;
      break;
  }

  return {
    top: Math.max(
      PADDING,
      Math.min(top, viewportHeight - popoverHeight - PADDING),
    ),
    left: Math.max(
      PADDING,
      Math.min(left, viewportWidth - popoverWidth - PADDING),
    ),
    width: popoverWidth,
    height: popoverHeight,
  };
}

const VIEW_BOTTOM_PADDING = 24;

/** Space for carousel section title (`CarouselWrapper` header). */
const _CAROUSEL_TITLE_RESERVE_PX = 52;

function findScrollParent(el: HTMLElement): HTMLElement | null {
  let node: HTMLElement | null = el.parentElement;
  while (node) {
    const { overflowY } = getComputedStyle(node);
    if ((overflowY === "auto" || overflowY === "scroll") && node.scrollHeight > node.clientHeight) {
      return node;
    }
    node = node.parentElement;
  }
  return null;
}

/** Scroll TV browse lists so focused cards and their row titles stay visible. */
export function scrollTvFocusIfNeeded(el: HTMLElement): void {
  const tabsCarousel = el.closest("[data-slot='tv-tabs-carousel']");
  if (tabsCarousel instanceof HTMLElement) {
    const carouselRect = tabsCarousel.getBoundingClientRect();
    const focusRect = el.getBoundingClientRect();
    if (focusRect.left < carouselRect.left + 12 || focusRect.right > carouselRect.right - 12) {
      el.scrollIntoView({ block: "nearest", inline: "nearest", behavior: "smooth" });
    }
  }

  const scrollParent = (el.closest("[data-slot='tv-browse-scroll']") as HTMLElement | null) ?? findScrollParent(el);

  if (scrollParent) {
    const section = el.closest("[data-slot='tv-carousel-section']");
    const scrollTarget = section instanceof HTMLElement ? section : el;
    const parentRect = scrollParent.getBoundingClientRect();
    const targetRect = scrollTarget.getBoundingClientRect();
    const focusRect = el.getBoundingClientRect();

    const visibleBottom = parentRect.bottom - VIEW_BOTTOM_PADDING;

    if (targetRect.top >= parentRect.top + 8 && focusRect.bottom <= visibleBottom) {
      return;
    }

    const delta = targetRect.top - (parentRect.top + 8);
    scrollParent.scrollBy({ top: delta, behavior: "smooth" });
    return;
  }

  const topInset = 20;
  const rect = el.getBoundingClientRect();
  const safeBottom = window.innerHeight - VIEW_BOTTOM_PADDING;

  if (rect.top >= topInset && rect.bottom <= safeBottom) {
    return;
  }

  el.scrollIntoView({ block: "nearest", inline: "nearest", behavior: "smooth" });
}

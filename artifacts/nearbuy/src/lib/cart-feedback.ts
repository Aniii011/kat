// Visible "added to cart" feedback: a copy of the product image flies into the
// cart icon, then the nav listens for CART_ADDED_EVENT to bounce the icon and pop
// its count badge. No dependencies — uses the Web Animations API.

export const CART_ADDED_EVENT = "kat:cart-added";

function findCartTarget(): HTMLElement | null {
  const nodes = Array.from(document.querySelectorAll<HTMLElement>("[data-cart-target]"));
  return (
    nodes.find((el) => {
      const r = el.getBoundingClientRect();
      return r.width > 0 && r.height > 0;
    }) ?? null
  );
}

/**
 * @param source the element tapped (or the product image). If it sits inside a
 *               product card link, that card's image is used as the flight start.
 * @param imageUrl fallback image if no <img> can be found
 */
export function flyToCart(source?: Element | null, imageUrl?: string) {
  const notify = () => window.dispatchEvent(new CustomEvent(CART_ADDED_EVENT));

  try {
    const target = findCartTarget();
    const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (!source || !target || reduceMotion) {
      notify();
      return;
    }

    const cardImg =
      source instanceof HTMLImageElement
        ? source
        : source.closest("a, article")?.querySelector("img") ?? null;
    const startEl: Element = cardImg ?? source;
    const src = cardImg?.currentSrc || cardImg?.src || imageUrl;

    const from = startEl.getBoundingClientRect();
    const to = target.getBoundingClientRect();
    const size = 64;

    const startX = from.left + from.width / 2 - size / 2;
    const startY = from.top + from.height / 2 - size / 2;
    const dx = to.left + to.width / 2 - size / 2 - startX;
    const dy = to.top + to.height / 2 - size / 2 - startY;

    const chip = document.createElement("div");
    Object.assign(chip.style, {
      position: "fixed",
      left: `${startX}px`,
      top: `${startY}px`,
      width: `${size}px`,
      height: `${size}px`,
      borderRadius: "9999px",
      zIndex: "9999",
      pointerEvents: "none",
      overflow: "hidden",
      background: "hsl(var(--primary))",
      boxShadow: "0 8px 24px rgba(0,0,0,0.25)",
      border: "2px solid hsl(var(--background))",
    } as Partial<CSSStyleDeclaration>);
    if (src) {
      const img = document.createElement("img");
      img.src = src;
      img.alt = "";
      Object.assign(img.style, { width: "100%", height: "100%", objectFit: "cover" });
      chip.appendChild(img);
    }
    document.body.appendChild(chip);

    // Arc: rise a little, then drop into the cart while shrinking.
    const anim = chip.animate(
      [
        { transform: "translate(0,0) scale(1)", opacity: 1, offset: 0 },
        { transform: `translate(${dx * 0.45}px, ${Math.min(dy * 0.45, 0) - 70}px) scale(0.85)`, opacity: 1, offset: 0.45 },
        { transform: `translate(${dx}px, ${dy}px) scale(0.2)`, opacity: 0.4, offset: 1 },
      ],
      { duration: 750, easing: "cubic-bezier(0.4, 0, 0.2, 1)" },
    );
    const done = () => {
      chip.remove();
      notify();
    };
    anim.onfinish = done;
    anim.oncancel = done;
  } catch {
    notify();
  }
      }

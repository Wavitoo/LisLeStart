import "@testing-library/jest-dom/vitest";
import { afterEach } from "vitest";

// cleanup automatique de Testing Library (les globals Vitest sont désactivés)
afterEach(async () => {
  if (typeof document === "undefined") return;
  const { cleanup } = await import("@testing-library/react");
  cleanup();
});

// jsdom n'implémente ni scrollIntoView ni la capture de pointeur, utilisés par Radix
if (typeof window !== "undefined") {
  Element.prototype.scrollIntoView ??= () => {};
  Element.prototype.hasPointerCapture ??= () => false;
  Element.prototype.releasePointerCapture ??= () => {};
  window.ResizeObserver ??= class {
    observe() {}
    unobserve() {}
    disconnect() {}
  };
}

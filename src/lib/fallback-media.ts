import {
  DEMO_PRODUCT,
  type Category,
  type ProductInput,
} from "./types";

const CATEGORY_HERO_PLACEHOLDERS: Record<Category, string> = {
  skincare: "/placeholders/hero-skincare.svg",
  fashion: "/placeholders/hero-fashion.svg",
  food: "/placeholders/hero-food.svg",
};

const CATEGORY_LABELS: Record<Category, string> = {
  skincare: "skincare",
  fashion: "fashion",
  food: "food",
};

export function isDemoPersonaProduct(product: ProductInput): boolean {
  return (
    product.category === DEMO_PRODUCT.category &&
    product.name.trim().toLowerCase() === DEMO_PRODUCT.name.trim().toLowerCase()
  );
}

export function getCachedHeroImageUrl(product: ProductInput): string {
  if (isDemoPersonaProduct(product)) {
    return "/demo-hero.png";
  }

  return CATEGORY_HERO_PLACEHOLDERS[product.category];
}

export function getCachedHookVideoUrl(product: ProductInput): string | null {
  if (!isDemoPersonaProduct(product)) {
    return null;
  }

  return "/demo-hook.mp4";
}

export function getMediaFallbackNotice(
  product: ProductInput,
  source: "live" | "cached",
  media: "image" | "video",
): string | null {
  if (source !== "cached") {
    return null;
  }

  const categoryLabel = CATEGORY_LABELS[product.category];

  if (media === "video" && !getCachedHookVideoUrl(product)) {
    return `Live video generation was unavailable. No demo video for your product — your hook script and channel copy above are still tailored to "${product.name}".`;
  }

  if (isDemoPersonaProduct(product)) {
    return media === "image"
      ? "Showing Rina's saved demo hero image. Live generation was unavailable."
      : "Showing Rina's saved demo hook video. Live generation was unavailable.";
  }

  return `Showing a ${categoryLabel} demo placeholder — not generated for "${product.name}". Trends and copy above are still tailored to your product.`;
}

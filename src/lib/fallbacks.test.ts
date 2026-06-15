import { describe, expect, it } from "vitest";
import {
  getCachedHeroImageUrl,
  getCachedHookVideoUrl,
  getMediaFallbackNotice,
  isDemoPersonaProduct,
} from "./fallback-media";
import { DEMO_PRODUCT } from "./types";

describe("fallbacks", () => {
  it("uses Rina demo assets only for the demo persona product", () => {
    expect(isDemoPersonaProduct(DEMO_PRODUCT)).toBe(true);
    expect(getCachedHeroImageUrl(DEMO_PRODUCT)).toBe("/demo-hero.png");
    expect(getCachedHookVideoUrl(DEMO_PRODUCT)).toBe("/demo-hook.mp4");
  });

  it("uses category placeholders for non-demo products", () => {
    const fashionProduct = {
      name: "Linen Shirt",
      price: "Rp 250.000",
      category: "fashion" as const,
    };

    expect(getCachedHeroImageUrl(fashionProduct)).toBe(
      "/placeholders/hero-fashion.svg",
    );
    expect(getCachedHookVideoUrl(fashionProduct)).toBeNull();
  });

  it("returns a clear notice when cached image does not match the product", () => {
    const notice = getMediaFallbackNotice(
      {
        name: "Linen Shirt",
        price: "Rp 250.000",
        category: "fashion",
      },
      "cached",
      "image",
    );

    expect(notice).toContain("fashion demo placeholder");
    expect(notice).toContain("Linen Shirt");
  });

  it("returns a clear notice when cached video is unavailable", () => {
    const notice = getMediaFallbackNotice(
      {
        name: "Linen Shirt",
        price: "Rp 250.000",
        category: "fashion",
      },
      "cached",
      "video",
    );

    expect(notice).toContain("No demo video");
    expect(notice).toContain("Linen Shirt");
  });
});

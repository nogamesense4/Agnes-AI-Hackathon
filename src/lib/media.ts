import type { Category, ProductInput } from "./types";
import { getCachedHeroImageUrl, getCachedHookVideoUrl } from "./fallback-media";

const PROXY_HOST_SUFFIXES = [
  "agnes-ai.com",
  "agnes-ai.space",
  "aliyuncs.com",
  "amazonaws.com",
  "cloudfront.net",
];

export function isExternalMediaUrl(url: string): boolean {
  return url.startsWith("http://") || url.startsWith("https://");
}

function isAllowedProxyHost(hostname: string): boolean {
  return PROXY_HOST_SUFFIXES.some(
    (suffix) => hostname === suffix || hostname.endsWith(`.${suffix}`),
  );
}

export function toDisplayMediaUrl(url: string): string {
  if (!isExternalMediaUrl(url)) {
    return url;
  }

  try {
    const parsed = new URL(url);
    if (!isAllowedProxyHost(parsed.hostname)) {
      return url;
    }
  } catch {
    return url;
  }

  return `/api/proxy-media?url=${encodeURIComponent(url)}`;
}

export function getHeroFallbackForProduct(product: ProductInput): string {
  return getCachedHeroImageUrl(product);
}

export function getHeroFallbackForCategory(category: Category): string {
  return getCachedHeroImageUrl({
    name: "",
    price: "",
    category,
  });
}

export function getVideoFallbackForProduct(
  product: ProductInput,
): string | null {
  return getCachedHookVideoUrl(product);
}

/** @deprecated Use getHeroFallbackForProduct */
export function getDemoHeroFallback(): string {
  return "/demo-hero.png";
}

/** @deprecated Use getVideoFallbackForProduct */
export function getDemoVideoFallback(): string {
  return "/demo-hook.mp4";
}

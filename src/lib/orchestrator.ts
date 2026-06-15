import {
  fetchLiveTrendSignal,
  generateChannelCopy,
  generateHeroImage,
  generateHookVideo,
  generateSellingPlan,
  isAgnesConfigured,
} from "./agnes";
import {
  getCachedHeroImageUrl,
  getCachedHookVideoUrl,
  loadCachedTrendSignal,
  loadDemoBrief,
} from "./fallbacks";
import { toDisplayMediaUrl } from "./media";
import type {
  BriefStepEvent,
  Category,
  ImageSource,
  ProductInput,
  ShopBriefData,
  TrendSource,
  VideoSource,
} from "./types";

type Send = (event: BriefStepEvent) => void;

function parseProduct(body: unknown): ProductInput {
  if (!body || typeof body !== "object") {
    throw new Error("Invalid request body");
  }

  const { name, price, category, photo } = body as Record<string, unknown>;

  if (typeof name !== "string" || !name.trim()) {
    throw new Error("Product name is required");
  }
  if (typeof price !== "string" || !price.trim()) {
    throw new Error("Product price is required");
  }
  if (!["skincare", "fashion", "food"].includes(category as string)) {
    throw new Error("Valid category is required");
  }

  return {
    name: name.trim(),
    price: price.trim(),
    category: category as Category,
    photo: typeof photo === "string" ? photo : undefined,
  };
}

async function resolveTrendSignal(
  category: Category,
): Promise<{ trendSignal: ShopBriefData["trendSignal"]; trendSource: TrendSource }> {
  if (isAgnesConfigured()) {
    try {
      const trendSignal = await fetchLiveTrendSignal(category);
      return { trendSignal, trendSource: "live" };
    } catch {
      // fall through to cache
    }
  }

  const trendSignal = await loadCachedTrendSignal(category);
  return { trendSignal, trendSource: "cached" };
}

async function resolveHeroImage(
  product: ProductInput,
  sellingStyle: string,
): Promise<{ heroImageUrl: string; imageSource: ImageSource }> {
  if (isAgnesConfigured()) {
    try {
      const heroImageUrl = toDisplayMediaUrl(
        await generateHeroImage(product, sellingStyle),
      );
      return { heroImageUrl, imageSource: "live" };
    } catch {
      // fall through
    }
  }

  return {
    heroImageUrl: getCachedHeroImageUrl(product),
    imageSource: "cached",
  };
}

async function resolveHookVideo(
  product: ProductInput,
  hookLine: string,
): Promise<{
  hookVideoUrl: string;
  videoSource: VideoSource;
  videoPlaceholder: boolean;
}> {
  if (isAgnesConfigured()) {
    try {
      const hookVideoUrl = toDisplayMediaUrl(
        await generateHookVideo(product, hookLine),
      );
      return { hookVideoUrl, videoSource: "live", videoPlaceholder: false };
    } catch {
      // fall through
    }
  }

  const hookVideoUrl = getCachedHookVideoUrl(product);

  return {
    hookVideoUrl: hookVideoUrl ?? "",
    videoSource: "cached",
    videoPlaceholder: hookVideoUrl === null,
  };
}

export async function runShopBriefPipeline(
  product: ProductInput,
  send: Send,
): Promise<void> {
  try {
    const { trendSignal, trendSource } = await resolveTrendSignal(
      product.category,
    );

    send({
      step: 1,
      label: "Scanning trends",
      data: { trendSignal, trendSource },
    });

    const sellingPlan = isAgnesConfigured()
      ? await generateSellingPlan(product, trendSignal)
      : (await loadDemoBrief()).sellingPlan;

    send({
      step: 2,
      label: "Picking selling style",
      data: { sellingPlan },
    });

    let hookLine: string;
    let script: string;
    let channelCopy: ShopBriefData["channelCopy"];

    if (isAgnesConfigured()) {
      const copy = await generateChannelCopy(product, sellingPlan);
      hookLine = copy.hookLine;
      script = copy.script;
      channelCopy = copy.channelCopy;
    } else {
      const demoBrief = await loadDemoBrief();
      hookLine = demoBrief.hookLine;
      script = demoBrief.script;
      channelCopy = demoBrief.channelCopy;
    }

    send({
      step: 3,
      label: "Writing copy",
      data: { hookLine, script, channelCopy },
    });

    const imagePromise = resolveHeroImage(product, sellingPlan.sellingStyle);
    const videoPromise = resolveHookVideo(product, hookLine);

    const { heroImageUrl, imageSource } = await imagePromise;

    send({
      step: 4,
      label: "Creating image",
      data: { heroImageUrl, imageSource },
    });

    const { hookVideoUrl, videoSource, videoPlaceholder } = await videoPromise;

    send({
      step: 5,
      label: "Making hook video",
      data: { hookVideoUrl, videoSource, videoPlaceholder },
    });

    send({
      step: "done",
      label: "Shop Brief ready",
      data: { briefStatus: "complete" },
    });
  } catch {
    const demoBrief = await loadDemoBrief();

    send({
      step: 1,
      label: "Scanning trends",
      data: {
        trendSignal: demoBrief.trendSignal,
        trendSource: "cached",
      },
    });
    send({
      step: 2,
      label: "Picking selling style",
      data: { sellingPlan: demoBrief.sellingPlan },
    });
    send({
      step: 3,
      label: "Writing copy",
      data: {
        hookLine: demoBrief.hookLine,
        script: demoBrief.script,
        channelCopy: demoBrief.channelCopy,
      },
    });
    send({
      step: 4,
      label: "Creating image",
      data: { heroImageUrl: demoBrief.heroImageUrl, imageSource: "cached" },
    });
    send({
      step: 5,
      label: "Making hook video",
      data: {
        hookVideoUrl: demoBrief.hookVideoUrl,
        videoSource: "cached",
      },
    });
    send({
      step: "done",
      label: "Shop Brief ready",
      data: { briefStatus: "complete", usedDemoBrief: true },
    });
  }
}

export { parseProduct };

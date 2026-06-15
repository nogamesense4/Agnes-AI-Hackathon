import type { Category, ProductInput, TrendSignal } from "./types";

const TEXT_TIMEOUT_MS = 25_000;
const IMAGE_TIMEOUT_MS = 45_000;
const VIDEO_CREATE_TIMEOUT_MS = 15_000;
const VIDEO_POLL_TIMEOUT_MS = 90_000;
const VIDEO_POLL_INTERVAL_MS = 3_000;
const VIDEO_NUM_FRAMES = 25; // must be 8*n+1

export function getAgnesClient() {
  const apiKey = process.env.AGNES_API_KEY;
  const baseURL = process.env.AGNES_BASE_URL ?? "https://apihub.agnes-ai.com/v1";

  if (!apiKey) {
    return null;
  }

  return { apiKey, baseURL };
}

export function isAgnesConfigured() {
  return Boolean(process.env.AGNES_API_KEY);
}

function categoryVisualContext(category: Category): {
  heroStyle: string;
  videoScene: string;
} {
  switch (category) {
    case "fashion":
      return {
        heroStyle:
          "fashion e-commerce product shot, fabric texture and garment styling, natural light, premium apparel aesthetic",
        videoScene:
          "styled garment or fabric close-up, warm natural lighting, fashion retail aesthetic",
      };
    case "food":
      return {
        heroStyle:
          "food product photography, appetizing styling, soft natural light, premium F&B aesthetic",
        videoScene:
          "close-up of the food product with texture detail, warm appetizing lighting",
      };
    default:
      return {
        heroStyle:
          "beauty product photography, soft natural light, premium skincare aesthetic",
        videoScene:
          "close-up product bottle, warm golden lighting, premium skincare aesthetic",
      };
  }
}

function getApiConfig() {
  const apiKey = process.env.AGNES_API_KEY;
  const baseURL = process.env.AGNES_BASE_URL ?? "https://apihub.agnes-ai.com/v1";

  if (!apiKey) {
    throw new Error("Agnes API not configured");
  }

  return { apiKey, baseURL };
}

async function withTimeout<T>(
  promise: Promise<T>,
  timeoutMs: number,
  label: string,
): Promise<T> {
  let timer: ReturnType<typeof setTimeout> | undefined;

  const timeout = new Promise<never>((_, reject) => {
    timer = setTimeout(
      () => reject(new Error(`${label} timed out after ${timeoutMs}ms`)),
      timeoutMs,
    );
  });

  try {
    return await Promise.race([promise, timeout]);
  } finally {
    if (timer) clearTimeout(timer);
  }
}

async function chatJson<T>(
  system: string,
  user: string,
  model = "agnes-2.0-flash",
): Promise<T> {
  const { apiKey, baseURL } = getApiConfig();

  const response = await withTimeout(
    fetch(`${baseURL}/chat/completions`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model,
        messages: [
          { role: "system", content: system },
          { role: "user", content: user },
        ],
        response_format: { type: "json_object" },
        temperature: 0.7,
      }),
    }),
    TEXT_TIMEOUT_MS,
    `Agnes chat (${model})`,
  );

  if (!response.ok) {
    throw new Error(`Chat failed: ${response.status}`);
  }

  const payload = (await response.json()) as {
    choices?: Array<{ message?: { content?: string } }>;
  };
  const content = payload.choices?.[0]?.message?.content;
  if (!content) {
    throw new Error("Empty response from Agnes");
  }

  return JSON.parse(content) as T;
}

export async function fetchLiveTrendSignal(
  category: Category,
): Promise<TrendSignal> {
  return chatJson<TrendSignal>(
    "You are a TikTok commerce trend analyst for Southeast Asia. Return valid JSON only.",
    `What are the top 3 trending content formats and hashtags for ${category} sellers in Indonesia this week?
Return JSON: { "summary": string, "trends": [{ "format": string, "hashtag": string, "whyWinning": string }] }`,
  );
}

export async function generateSellingPlan(
  product: ProductInput,
  trendSignal: TrendSignal,
) {
  return chatJson<{
    sellingStyle: "top-pick" | "key-ingredient" | "life-change";
    targetBuyer:
      | "quality-focused"
      | "status-seeker"
      | "budget-prestige"
      | "luxury-buyer";
    whyThisWorks: string;
  }>(
    "You are a taste economy strategist for SEA e-commerce sellers. Return valid JSON only.",
    `Product: ${product.name}
Price: ${product.price}
Category: ${product.category}
Trending formats this week: ${JSON.stringify(trendSignal.trends)}

Pick the best Selling Style (top-pick, key-ingredient, or life-change) and Target Buyer (quality-focused, status-seeker, budget-prestige, luxury-buyer).
Return JSON: { "sellingStyle": string, "targetBuyer": string, "whyThisWorks": string }`,
  );
}

export async function generateChannelCopy(
  product: ProductInput,
  sellingPlan: {
    sellingStyle: string;
    targetBuyer: string;
    whyThisWorks: string;
  },
) {
  return chatJson<{
    hookLine: string;
    script: string;
    channelCopy: {
      tiktok: string;
      shopee: { title: string; description: string };
      whatsapp: string;
    };
  }>(
    "You are a bilingual Bahasa Indonesia content creator for TikTok Shop sellers. Return valid JSON only. Write punchy, taste-native copy.",
    `Product: ${product.name}
Price: ${product.price}
Selling Style: ${sellingPlan.sellingStyle}
Target Buyer: ${sellingPlan.targetBuyer}
Why this works: ${sellingPlan.whyThisWorks}

Generate JSON:
{
  "hookLine": "3-second opener in Bahasa",
  "script": "15-second filming guide with [shot directions]",
  "channelCopy": {
    "tiktok": "caption with hashtags",
    "shopee": { "title": "listing title", "description": "listing description" },
    "whatsapp": "short sharing caption"
  }
}`,
  );
}

export async function generateHeroImage(
  product: ProductInput,
  sellingStyle: string,
): Promise<string> {
  const { apiKey, baseURL } = getApiConfig();

  const { heroStyle } = categoryVisualContext(product.category);
  const prompt = `Cinematic product hero image for ${product.name}, ${sellingStyle} selling style, ${heroStyle}`;

  const response = await withTimeout(
    fetch(`${baseURL}/images/generations`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "agnes-image-2.1-flash",
        prompt,
        n: 1,
        size: "1024x1024",
      }),
    }),
    IMAGE_TIMEOUT_MS,
    "Agnes image generation",
  );

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Image failed: ${response.status} ${errorText}`);
  }

  const payload = (await response.json()) as {
    data?: Array<{ url?: string; b64_json?: string }>;
  };

  const item = payload.data?.[0];
  if (item?.url) return item.url;
  if (item?.b64_json) return `data:image/png;base64,${item.b64_json}`;

  throw new Error("No image returned from Agnes-Image");
}

function extractVideoUrl(payload: VideoTaskResponse): string | null {
  const candidates = [
    payload.video_url,
    payload.url,
    payload.remixed_from_video_id,
  ];

  for (const candidate of candidates) {
    if (
      typeof candidate === "string" &&
      (candidate.startsWith("http://") ||
        candidate.startsWith("https://") ||
        candidate.startsWith("/"))
    ) {
      return candidate;
    }
  }

  return null;
}

interface VideoTaskResponse {
  id?: string;
  task_id?: string;
  status?: string;
  progress?: number;
  error?: string | null;
  remixed_from_video_id?: string;
  video_url?: string;
  url?: string;
}

async function pollVideoTask(
  baseURL: string,
  apiKey: string,
  taskId: string,
): Promise<string> {
  const started = Date.now();

  while (Date.now() - started < VIDEO_POLL_TIMEOUT_MS) {
    const response = await fetch(`${baseURL}/videos/${taskId}`, {
      headers: { Authorization: `Bearer ${apiKey}` },
    });

    if (!response.ok) {
      throw new Error(`Video poll failed: ${response.status}`);
    }

    const payload = (await response.json()) as VideoTaskResponse;

    if (payload.status === "failed" || payload.error) {
      throw new Error(payload.error ?? "Video generation failed");
    }

    const url = extractVideoUrl(payload);

    if (payload.status === "completed" && url) {
      return url;
    }

    await new Promise((resolve) => setTimeout(resolve, VIDEO_POLL_INTERVAL_MS));
  }

  throw new Error("Video generation timed out while polling");
}

export async function generateHookVideo(
  product: ProductInput,
  hookLine: string,
): Promise<string> {
  const { apiKey, baseURL } = getApiConfig();

  const { videoScene } = categoryVisualContext(product.category);
  const prompt = `Cinematic product hook for ${product.name}. Opening line: ${hookLine}. ${videoScene}.`;

  const createResponse = await withTimeout(
    fetch(`${baseURL}/videos`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "agnes-video-v2.0",
        prompt,
        height: 720,
        width: 1280,
        num_frames: VIDEO_NUM_FRAMES,
        frame_rate: 24,
      }),
    }),
    VIDEO_CREATE_TIMEOUT_MS,
    "Agnes video create",
  );

  if (!createResponse.ok) {
    const errorText = await createResponse.text();
    throw new Error(`Video create failed: ${createResponse.status} ${errorText}`);
  }

  const created = (await createResponse.json()) as VideoTaskResponse;
  const taskId = created.id ?? created.task_id;

  if (!taskId) {
    throw new Error("No video task id returned from Agnes-Video");
  }

  return pollVideoTask(baseURL, apiKey, taskId);
}

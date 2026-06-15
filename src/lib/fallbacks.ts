import { readFile } from "fs/promises";
import path from "path";
import type { Category, ShopBriefData, TrendSignal } from "./types";

export {
  getCachedHeroImageUrl,
  getCachedHookVideoUrl,
  getMediaFallbackNotice,
  isDemoPersonaProduct,
} from "./fallback-media";

const PUBLIC_DIR = path.join(process.cwd(), "public");

export async function loadCachedTrendSignal(
  category: Category,
): Promise<TrendSignal> {
  const filePath = path.join(PUBLIC_DIR, "trends-fallback.json");
  const raw = await readFile(filePath, "utf-8");
  const data = JSON.parse(raw) as Record<Category, TrendSignal>;
  return data[category];
}

export async function loadDemoBrief(): Promise<ShopBriefData> {
  const filePath = path.join(PUBLIC_DIR, "demo-brief.json");
  const raw = await readFile(filePath, "utf-8");
  return JSON.parse(raw) as ShopBriefData;
}

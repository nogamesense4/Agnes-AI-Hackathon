"use client";

import { useEffect, useMemo, useState } from "react";
import {
  BRIEF_STEPS,
  DEMO_PRODUCT,
  SELLING_STYLE_LABELS,
  TARGET_BUYER_LABELS,
  type BriefStatus,
  type BriefStepEvent,
  type Category,
  type ChannelCopy,
  type ProductInput,
  type SellingPlan,
  type TrendSignal,
  type TrendSource,
  type ImageSource,
  type VideoSource,
} from "@/lib/types";
import { getMediaFallbackNotice } from "@/lib/fallback-media";
import { getHeroFallbackForProduct, getVideoFallbackForProduct } from "@/lib/media";
import { ThinkingIndicator } from "@/components/ThinkingIndicator";

type StepState = "pending" | "active" | "complete";
type ContentTab =
  | "hook"
  | "script"
  | "tiktok"
  | "shopee"
  | "whatsapp"
  | "image"
  | "video";

interface BriefState {
  trendSignal?: TrendSignal;
  trendSource?: TrendSource;
  sellingPlan?: SellingPlan;
  hookLine?: string;
  script?: string;
  channelCopy?: ChannelCopy;
  heroImageUrl?: string;
  imageSource?: ImageSource;
  hookVideoUrl?: string;
  videoSource?: VideoSource;
  videoPlaceholder?: boolean;
  briefStatus?: BriefStatus;
  usedDemoBrief?: boolean;
  activeProduct?: ProductInput;
}

const INITIAL_FORM: ProductInput = { ...DEMO_PRODUCT };

const CONTENT_TABS: Array<{ id: ContentTab; label: string }> = [
  { id: "hook", label: "Hook Line" },
  { id: "script", label: "Script" },
  { id: "tiktok", label: "TikTok" },
  { id: "shopee", label: "Shopee" },
  { id: "whatsapp", label: "WhatsApp" },
  { id: "image", label: "Image" },
  { id: "video", label: "Hook Video" },
];

const HOW_IT_WORKS = [
  { step: 1, title: "Enter product", detail: "Name, price, category" },
  { step: 2, title: "Generate Shop Brief", detail: "One tap — Agnes does the rest" },
  { step: 3, title: "Watch Brief Steps", detail: "Trend → plan → copy → image → video" },
  { step: 4, title: "Review Shop Brief", detail: "Scan trends, plan, and copy" },
  { step: 5, title: "Copy and post", detail: "TikTok, Shopee, WhatsApp — manual" },
];

const BRIEF_INSIDE = [
  {
    title: "Trend Signal",
    description: "What formats and hashtags are winning in your category this week.",
    accent: "border-teal/30 bg-teal/5",
    dot: "bg-teal",
  },
  {
    title: "Selling Plan",
    description: "Style, buyer, and why this approach fits your product today.",
    accent: "border-dragonfruit/30 bg-dragonfruit/5",
    dot: "bg-dragonfruit",
  },
  {
    title: "Content Bundle",
    description: "Hook, script, channel copy, hero image, and hook video — ready to post.",
    accent: "border-papaya/30 bg-papaya/5",
    dot: "bg-papaya",
  },
];

function getStepStates(activeIndex: number, isGenerating: boolean): StepState[] {
  return BRIEF_STEPS.map((_, index) => {
    if (!isGenerating && activeIndex < 0) return "pending";
    if (index < activeIndex) return "complete";
    if (index === activeIndex) return "active";
    return "pending";
  });
}

function StatusPill({
  label,
  value,
  tone = "neutral",
}: {
  label: string;
  value: string;
  tone?: "live" | "cached" | "neutral" | "warning";
}) {
  const toneClass =
    tone === "live"
      ? "border-teal/40 bg-teal/10 text-foreground"
      : tone === "cached"
        ? "border-border bg-background text-muted"
        : tone === "warning"
          ? "border-papaya/50 bg-papaya/10 text-foreground"
          : "border-border bg-background text-foreground";

  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs font-medium ${toneClass}`}
    >
      <span className="text-muted">{label}</span>
      <span className="font-semibold">{value}</span>
    </span>
  );
}

function DemoPlaceholderNotice({ message }: { message: string }) {
  return (
    <div
      role="status"
      className="mb-3 rounded-lg border border-papaya/40 bg-papaya/10 px-3 py-2.5 text-sm leading-relaxed text-foreground"
    >
      <p className="font-semibold">Demo placeholder</p>
      <p className="mt-1 text-muted">{message}</p>
    </div>
  );
}

function HeroImagePanel({
  src,
  product,
  imageSource,
}: {
  src: string;
  product: ProductInput;
  imageSource?: ImageSource;
}) {
  const [displaySrc, setDisplaySrc] = useState(src);
  const fallbackSrc = getHeroFallbackForProduct(product);
  const notice = getMediaFallbackNotice(product, imageSource ?? "live", "image");

  useEffect(() => {
    setDisplaySrc(src);
  }, [src]);

  return (
    <div>
      {notice ? <DemoPlaceholderNotice message={notice} /> : null}
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={displaySrc}
        alt="Hero product"
        className="max-h-80 w-full rounded-xl border border-border object-cover"
        onError={() => {
          if (displaySrc !== fallbackSrc) {
            setDisplaySrc(fallbackSrc);
          }
        }}
      />
    </div>
  );
}

function HookVideoPanel({
  src,
  product,
  videoSource,
  videoPlaceholder,
}: {
  src: string;
  product: ProductInput;
  videoSource?: VideoSource;
  videoPlaceholder?: boolean;
}) {
  const [displaySrc, setDisplaySrc] = useState(src);
  const fallbackSrc = getVideoFallbackForProduct(product);
  const notice = getMediaFallbackNotice(product, videoSource ?? "live", "video");

  useEffect(() => {
    setDisplaySrc(src);
  }, [src]);

  if (videoPlaceholder || !src) {
    return (
      <div className="rounded-xl border border-dashed border-border bg-background px-4 py-10 text-center">
        {notice ? <DemoPlaceholderNotice message={notice} /> : null}
        <p className="font-display text-base font-semibold text-foreground">
          Hook video not available
        </p>
        <p className="mx-auto mt-2 max-w-sm text-sm text-muted">
          Live generation did not complete. Use your hook script and channel copy
          above to record your own clip.
        </p>
      </div>
    );
  }

  return (
    <div>
      {notice ? <DemoPlaceholderNotice message={notice} /> : null}
      <video
        key={displaySrc}
        src={displaySrc}
        controls
        playsInline
        className="w-full rounded-xl border border-border"
        onError={() => {
          if (fallbackSrc && displaySrc !== fallbackSrc) {
            setDisplaySrc(fallbackSrc);
          }
        }}
      />
    </div>
  );
}

export function TasteSellApp() {
  const [form, setForm] = useState<ProductInput>(INITIAL_FORM);
  const [brief, setBrief] = useState<BriefState>({});
  const [agnesLive, setAgnesLive] = useState<boolean | null>(null);
  const [activeStep, setActiveStep] = useState(-1);
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<ContentTab>("hook");

  const stepStates = useMemo(
    () => getStepStates(activeStep, isGenerating),
    [activeStep, isGenerating],
  );

  const hasBriefContent = Boolean(brief.trendSignal);
  const showWelcome = !hasBriefContent && !isGenerating;

  const thinkingLabel = useMemo(() => {
    if (!isGenerating || activeStep < 0 || activeStep >= BRIEF_STEPS.length) {
      return null;
    }
    return `${BRIEF_STEPS[activeStep]}…`;
  }, [isGenerating, activeStep]);

  useEffect(() => {
    fetch("/api/health")
      .then((res) => res.json())
      .then((data: { agnesConfigured?: boolean }) =>
        setAgnesLive(Boolean(data.agnesConfigured)),
      )
      .catch(() => setAgnesLive(false));
  }, []);

  async function handleGenerate() {
    setIsGenerating(true);
    setError(null);
    setBrief({ activeProduct: { ...form } });
    setActiveStep(0);
    setActiveTab("hook");

    try {
      const response = await fetch("/api/shop-brief", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });

      if (!response.ok) {
        const payload = (await response.json()) as { error?: string };
        throw new Error(payload.error ?? "Failed to generate Shop Brief");
      }

      if (!response.body) {
        throw new Error("No response stream");
      }

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let buffer = "";

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const chunks = buffer.split("\n\n");
        buffer = chunks.pop() ?? "";

        for (const chunk of chunks) {
          const line = chunk.trim();
          if (!line.startsWith("data:")) continue;

          const event = JSON.parse(line.slice(5).trim()) as BriefStepEvent;
          applyEvent(event);
        }
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setIsGenerating(false);
    }
  }

  function applyEvent(event: BriefStepEvent) {
    if (event.step === "done") {
      setActiveStep(BRIEF_STEPS.length);
      setBrief((prev) => ({
        ...prev,
        briefStatus: (event.data?.briefStatus as BriefStatus) ?? "complete",
        usedDemoBrief: Boolean(event.data?.usedDemoBrief),
      }));
      return;
    }

    if (typeof event.step === "number") {
      setActiveStep(event.step);
      const data = event.data ?? {};

      setBrief((prev) => ({
        ...prev,
        ...(data.trendSignal ? { trendSignal: data.trendSignal as TrendSignal } : {}),
        ...(data.trendSource ? { trendSource: data.trendSource as TrendSource } : {}),
        ...(data.sellingPlan ? { sellingPlan: data.sellingPlan as SellingPlan } : {}),
        ...(data.hookLine ? { hookLine: data.hookLine as string } : {}),
        ...(data.script ? { script: data.script as string } : {}),
        ...(data.channelCopy ? { channelCopy: data.channelCopy as ChannelCopy } : {}),
        ...(data.heroImageUrl ? { heroImageUrl: data.heroImageUrl as string } : {}),
        ...(data.imageSource ? { imageSource: data.imageSource as ImageSource } : {}),
        ...(data.hookVideoUrl ? { hookVideoUrl: data.hookVideoUrl as string } : {}),
        ...(data.videoSource ? { videoSource: data.videoSource as VideoSource } : {}),
        ...(data.videoPlaceholder !== undefined
          ? { videoPlaceholder: Boolean(data.videoPlaceholder) }
          : {}),
      }));

      if (event.step === 4 && data.heroImageUrl) {
        setActiveTab("image");
      }

      if (event.step === 5 && (data.hookVideoUrl || data.videoPlaceholder)) {
        setActiveTab("video");
      }
    }
  }

  const displayProduct = brief.activeProduct ?? form;

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-border bg-card">
        <div className="mx-auto flex max-w-6xl flex-col gap-4 px-4 py-5 sm:px-6 md:flex-row md:items-center md:justify-between">
          <div>
            <div className="flex items-center gap-2">
              <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-accent text-lg text-white">
                ✦
              </span>
              <div>
                <p className="font-display text-xl font-semibold leading-tight text-foreground">
                  TasteSell
                </p>
                <p className="text-xs font-medium text-muted">by Agnes</p>
              </div>
            </div>
            <p className="mt-2 max-w-md text-sm text-muted">
              Every morning. Every seller. Every trend.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <span className="rounded-full border border-border bg-background px-3 py-1 text-xs font-medium text-muted">
              Demo: Rina, Jakarta
            </span>
            {agnesLive === true ? (
              <StatusPill label="Agnes" value="connected" tone="live" />
            ) : agnesLive === false ? (
              <StatusPill label="Mode" value="fallback" tone="warning" />
            ) : null}
          </div>
        </div>
      </header>

      {showWelcome ? (
        <section className="border-b border-border bg-accent-soft/40">
          <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6">
            <h1 className="font-display text-2xl font-semibold tracking-tight text-foreground sm:text-3xl">
              Your daily Shop Brief
            </h1>
            <p className="mt-2 max-w-2xl text-base leading-relaxed text-muted">
              Agnes turns one product into trend-matched copy for TikTok, Shopee, and
              WhatsApp — in Bahasa, in about a minute.
            </p>

            <div className="mt-6 grid gap-4 sm:grid-cols-3">
              {BRIEF_INSIDE.map((item) => (
                <article
                  key={item.title}
                  className={`rounded-2xl border p-4 ${item.accent}`}
                >
                  <div className="mb-2 flex items-center gap-2">
                    <span className={`h-2.5 w-2.5 rounded-full ${item.dot}`} />
                    <h2 className="font-display text-base font-semibold">{item.title}</h2>
                  </div>
                  <p className="text-sm leading-relaxed text-muted">{item.description}</p>
                </article>
              ))}
            </div>
          </div>
        </section>
      ) : null}

      <main
        id="generate"
        className="mx-auto grid max-w-6xl gap-6 px-4 py-6 sm:px-6 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.15fr)]"
      >
        <section className="space-y-6" aria-label="Product and progress">
          <div className="rounded-2xl border border-border bg-card p-5 shadow-sm sm:p-6">
            <h2 className="font-display text-lg font-semibold">Start here</h2>
            <p className="mt-1 text-sm text-muted">
              Enter your product. Tap generate. That&apos;s it.
            </p>

            <div className="mt-5 space-y-4">
              <label className="block space-y-1.5 text-sm">
                <span className="font-semibold text-foreground">Product name</span>
                <input
                  className="w-full rounded-xl border border-border bg-background px-3 py-2.5 text-foreground outline-none ring-accent/30 focus:ring-2"
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                />
              </label>
              <label className="block space-y-1.5 text-sm">
                <span className="font-semibold text-foreground">Price</span>
                <input
                  className="w-full rounded-xl border border-border bg-background px-3 py-2.5 text-foreground outline-none ring-accent/30 focus:ring-2"
                  value={form.price}
                  onChange={(e) => setForm({ ...form, price: e.target.value })}
                />
              </label>
              <label className="block space-y-1.5 text-sm">
                <span className="font-semibold text-foreground">Category</span>
                <select
                  className="w-full rounded-xl border border-border bg-background px-3 py-2.5 text-foreground outline-none ring-accent/30 focus:ring-2"
                  value={form.category}
                  onChange={(e) =>
                    setForm({ ...form, category: e.target.value as Category })
                  }
                >
                  <option value="skincare">Skincare</option>
                  <option value="fashion">Fashion</option>
                  <option value="food">Food</option>
                </select>
              </label>

              <button
                type="button"
                onClick={handleGenerate}
                disabled={isGenerating}
                className="w-full rounded-xl bg-accent px-4 py-3.5 text-base font-semibold text-white shadow-sm transition hover:bg-accent-hover disabled:cursor-not-allowed disabled:opacity-60"
              >
                {isGenerating ? (
                  <span className="flex items-center justify-center gap-3">
                    <ThinkingIndicator compact inverse label="" />
                    <span>Generating Shop Brief…</span>
                  </span>
                ) : (
                  "Generate Shop Brief"
                )}
              </button>

              {error ? (
                <p
                  role="alert"
                  className="rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-800"
                >
                  {error}
                </p>
              ) : null}
            </div>
          </div>

          <div className="rounded-2xl border border-border bg-card p-5 shadow-sm sm:p-6">
            <h2 className="font-display text-lg font-semibold">Brief Steps</h2>
            <p className="mt-1 text-sm text-muted">Live progress as Agnes builds your brief.</p>
            <ol className="mt-4 space-y-2">
              {BRIEF_STEPS.map((label, index) => {
                const state = stepStates[index];
                return (
                  <li
                    key={label}
                    className={`flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm transition ${
                      state === "active"
                        ? "border border-accent/30 bg-accent-soft font-medium text-foreground"
                        : state === "complete"
                          ? "text-foreground"
                          : "text-muted"
                    }`}
                  >
                    {state === "active" && isGenerating ? (
                      <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-accent-soft">
                        <ThinkingIndicator compact label="" />
                      </span>
                    ) : (
                      <span
                        className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-xs font-bold ${
                          state === "complete"
                            ? "bg-teal text-white"
                            : "border border-border bg-background text-muted"
                        }`}
                      >
                        {state === "complete" ? "✓" : index + 1}
                      </span>
                    )}
                    <span className="flex-1">{label}</span>
                  </li>
                );
              })}
            </ol>
          </div>
        </section>

        <section className="space-y-4" aria-label="Shop Brief output">
          <div className="rounded-2xl border border-border bg-card p-5 shadow-sm sm:p-6">
            <div className="mb-4 flex flex-wrap items-start justify-between gap-3">
              <div>
                <h2 className="font-display text-lg font-semibold">Shop Brief</h2>
                <p className="text-sm text-muted">Your morning deliverable — copy and post.</p>
              </div>

              {brief.briefStatus || brief.trendSource ? (
                <div className="flex flex-wrap gap-2">
                  {brief.briefStatus ? (
                    <StatusPill label="Status" value={brief.briefStatus} tone="live" />
                  ) : null}
                  {brief.trendSource ? (
                    <StatusPill
                      label="Trend"
                      value={brief.trendSource}
                      tone={brief.trendSource === "live" ? "live" : "cached"}
                    />
                  ) : null}
                  {brief.imageSource ? (
                    <StatusPill
                      label="Image"
                      value={brief.imageSource}
                      tone={brief.imageSource === "live" ? "live" : "cached"}
                    />
                  ) : null}
                  {brief.videoSource ? (
                    <StatusPill
                      label="Video"
                      value={brief.videoSource}
                      tone={brief.videoSource === "live" ? "live" : "cached"}
                    />
                  ) : null}
                  {brief.usedDemoBrief ? (
                    <StatusPill label="Mode" value="demo brief" tone="warning" />
                  ) : null}
                </div>
              ) : null}
            </div>

            {!hasBriefContent && !isGenerating ? (
              <div className="rounded-xl border border-dashed border-border bg-background px-4 py-10 text-center">
                <p className="font-display text-lg font-semibold text-foreground">
                  Your Shop Brief appears here
                </p>
                <p className="mx-auto mt-2 max-w-sm text-sm text-muted">
                  Trend signal, selling plan, and content bundle — step by step.
                </p>
              </div>
            ) : null}

            {thinkingLabel ? (
              <div className="mb-5 rounded-xl border border-accent/25 bg-accent-soft/60 px-4 py-4">
                <ThinkingIndicator label={thinkingLabel} />
              </div>
            ) : null}

            {brief.trendSignal ? (
              <article className="mb-5 rounded-xl border border-teal/20 bg-teal/5 p-4">
                <h3 className="font-display text-base font-semibold text-foreground">
                  Trend Signal
                </h3>
                <p className="mt-2 text-sm leading-relaxed text-muted">
                  {brief.trendSignal.summary}
                </p>
                <ul className="mt-3 space-y-2">
                  {brief.trendSignal.trends.map((trend) => (
                    <li
                      key={trend.hashtag}
                      className="rounded-lg border border-border bg-card p-3 text-sm"
                    >
                      <p className="font-semibold text-foreground">{trend.format}</p>
                      <p className="mt-0.5 font-medium text-accent">{trend.hashtag}</p>
                      <p className="mt-1 text-muted">{trend.whyWinning}</p>
                    </li>
                  ))}
                </ul>
              </article>
            ) : null}

            {brief.sellingPlan ? (
              <article className="mb-5 rounded-xl border border-dragonfruit/20 bg-dragonfruit/5 p-4">
                <h3 className="font-display text-base font-semibold text-foreground">
                  Selling Plan
                </h3>
                <div className="mt-2 flex flex-wrap gap-2">
                  <StatusPill
                    label="Style"
                    value={SELLING_STYLE_LABELS[brief.sellingPlan.sellingStyle]}
                  />
                  <StatusPill
                    label="Buyer"
                    value={TARGET_BUYER_LABELS[brief.sellingPlan.targetBuyer]}
                  />
                </div>
                <p className="mt-3 text-sm leading-relaxed text-muted">
                  <span className="font-semibold text-foreground">Why this works: </span>
                  {brief.sellingPlan.whyThisWorks}
                </p>
              </article>
            ) : null}

            {brief.hookLine || brief.channelCopy ? (
              <article className="overflow-hidden rounded-xl border border-border bg-background">
                <div className="border-b border-border px-4 py-3">
                  <h3 className="font-display text-base font-semibold text-foreground">
                    Content Bundle
                  </h3>
                </div>

                <div
                  className="flex gap-1 overflow-x-auto border-b border-border bg-card px-2 pt-2"
                  role="tablist"
                  aria-label="Content bundle tabs"
                >
                  {CONTENT_TABS.map(({ id, label }) => {
                    const isActive = activeTab === id;
                    return (
                      <button
                        key={id}
                        type="button"
                        role="tab"
                        aria-selected={isActive}
                        onClick={() => setActiveTab(id)}
                        className={`shrink-0 rounded-t-lg border px-3 py-2 text-xs font-semibold transition sm:text-sm ${
                          isActive
                            ? "-mb-px border-border border-b-background bg-background text-foreground"
                            : "border-transparent bg-transparent text-muted hover:text-foreground"
                        }`}
                      >
                        {label}
                      </button>
                    );
                  })}
                </div>

                <div className="min-h-44 p-4 text-sm leading-6 text-foreground" role="tabpanel">
                  {activeTab === "hook" && (
                    <p className="text-lg font-semibold leading-snug">{brief.hookLine}</p>
                  )}
                  {activeTab === "script" && (
                    <pre className="whitespace-pre-wrap font-sans">{brief.script}</pre>
                  )}
                  {activeTab === "tiktok" && (
                    <pre className="whitespace-pre-wrap font-sans">
                      {brief.channelCopy?.tiktok}
                    </pre>
                  )}
                  {activeTab === "shopee" && (
                    <div className="space-y-3">
                      <p className="font-semibold">{brief.channelCopy?.shopee.title}</p>
                      <pre className="whitespace-pre-wrap font-sans">
                        {brief.channelCopy?.shopee.description}
                      </pre>
                    </div>
                  )}
                  {activeTab === "whatsapp" && (
                    <pre className="whitespace-pre-wrap font-sans">
                      {brief.channelCopy?.whatsapp}
                    </pre>
                  )}
                  {activeTab === "image" && brief.heroImageUrl ? (
                    <HeroImagePanel
                      src={brief.heroImageUrl}
                      product={displayProduct}
                      imageSource={brief.imageSource}
                    />
                  ) : activeTab === "image" && isGenerating && activeStep === 3 ? (
                    <ThinkingIndicator label="Creating hero image…" />
                  ) : activeTab === "image" ? (
                    <p className="text-muted">Hero image not ready yet.</p>
                  ) : null}
                  {activeTab === "video" &&
                  (brief.hookVideoUrl || brief.videoPlaceholder) ? (
                    <HookVideoPanel
                      src={brief.hookVideoUrl ?? ""}
                      product={displayProduct}
                      videoSource={brief.videoSource}
                      videoPlaceholder={brief.videoPlaceholder}
                    />
                  ) : activeTab === "video" && isGenerating && activeStep === 4 ? (
                    <ThinkingIndicator label="Making hook video…" />
                  ) : activeTab === "video" ? (
                    <p className="text-muted">Hook video not ready yet.</p>
                  ) : null}
                </div>
              </article>
            ) : null}
          </div>
        </section>
      </main>

      <section className="border-t border-border bg-card" aria-label="How it works">
        <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6">
          <h2 className="font-display text-xl font-semibold">How it works</h2>
          <ol className="mt-5 grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
            {HOW_IT_WORKS.map((item) => (
              <li
                key={item.step}
                className="rounded-xl border border-border bg-background p-4"
              >
                <span className="inline-flex h-8 w-8 items-center justify-center rounded-full bg-accent text-sm font-bold text-white">
                  {item.step}
                </span>
                <p className="mt-3 font-semibold text-foreground">{item.title}</p>
                <p className="mt-1 text-sm text-muted">{item.detail}</p>
              </li>
            ))}
          </ol>
        </div>
      </section>

      <footer className="bg-footer px-4 py-6 text-center text-sm text-white sm:px-6">
        <p className="font-display text-base font-semibold">
          TasteSell turns Agnes into the first app a seller opens before they post.
        </p>
        <p className="mt-1 text-white/70">From blank page to first post.</p>
      </footer>
    </div>
  );
}

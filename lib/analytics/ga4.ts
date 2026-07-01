"use client";

const GA_ID = process.env.NEXT_PUBLIC_GA_ID?.trim() ?? "";
const DEFAULT_CURRENCY = "BOB";
const UNKNOWN_VALUE = "unknown";

type PrimitiveParam = string | number | boolean;
type EventParamValue =
  | PrimitiveParam
  | EventParamValue[]
  | { [key: string]: EventParamValue }
  | null
  | undefined;
type EventParams = Record<string, EventParamValue>;

type GtagFunction = (
  command: "event" | "config" | "js",
  target: string | Date,
  params?: Record<string, unknown>,
) => void;

type TrackProductViewPayload = {
  id: number | string;
  nombre: string;
  slug: string;
  categoria?: string | null;
  subcategoria?: string | null;
  precio?: number | string | null;
  precioReferencial?: number | string | null;
  marca?: string | null;
  sku?: string | null;
  skuDima?: string | null;
};

function getGtag(): GtagFunction | null {
  if (typeof window === "undefined") return null;

  const maybeGtag = (window as Window & { gtag?: GtagFunction }).gtag;
  return typeof maybeGtag === "function" ? maybeGtag : null;
}

function toNumber(value: number | string | null | undefined): number {
  if (typeof value === "number" && Number.isFinite(value)) return value;
  if (typeof value === "string") {
    const normalized = value.replace(",", ".").trim();
    const parsed = Number(normalized);
    if (Number.isFinite(parsed)) return parsed;
  }

  return 0;
}

function isDevelopmentMode(): boolean {
  return process.env.NODE_ENV !== "production";
}

function normalizeStringParam(value: unknown, fallback = UNKNOWN_VALUE): string {
  if (typeof value !== "string") return fallback;
  const normalized = value.trim();
  return normalized.length > 0 ? normalized : fallback;
}

function cleanParamValue(value: EventParamValue): unknown {
  if (value === null || value === undefined) {
    return undefined;
  }

  if (typeof value === "string") {
    const normalized = value.trim();
    return normalized.length > 0 ? normalized : undefined;
  }

  if (typeof value === "number") {
    return Number.isFinite(value) ? value : undefined;
  }

  if (typeof value === "boolean") {
    return value;
  }

  if (Array.isArray(value)) {
    const cleaned = value
      .map((item) => cleanParamValue(item))
      .filter((item): item is Exclude<typeof item, undefined> => item !== undefined);

    return cleaned.length > 0 ? cleaned : undefined;
  }

  if (typeof value === "object") {
    const cleanedObject = Object.entries(value).reduce<Record<string, unknown>>(
      (acc, [key, entryValue]) => {
        const cleaned = cleanParamValue(entryValue);
        if (cleaned !== undefined) {
          acc[key] = cleaned;
        }
        return acc;
      },
      {},
    );

    return Object.keys(cleanedObject).length > 0 ? cleanedObject : undefined;
  }

  return undefined;
}

function cleanParams(params?: EventParams): Record<string, unknown> {
  if (!params) return {};

  return Object.entries(params).reduce<Record<string, unknown>>((acc, [key, value]) => {
    const cleaned = cleanParamValue(value);
    if (cleaned === undefined) return acc;
    acc[key] = cleaned;
    return acc;
  }, {});
}

export function getGaId(): string {
  return GA_ID;
}

export function isGaEnabled(): boolean {
  return Boolean(getGaId()) && Boolean(getGtag());
}

export function getPageTypeFromPath(pathname: string): string {
  const cleanPath =
    pathname !== "/" ? pathname.replace(/\/+$/, "") || "/" : pathname;

  if (cleanPath === "/") return "home";
  if (cleanPath === "/catalogo") return "catalog";
  if (cleanPath.startsWith("/producto/")) return "product_detail";
  if (cleanPath === "/blog") return "blog_list";
  if (cleanPath.startsWith("/blog/")) return "blog_detail";
  if (cleanPath === "/dmc") return "corporate";

  return "other";
}

export function getPageTypeFromCurrentPath(pathname?: string): string {
  if (pathname && pathname.trim()) {
    return getPageTypeFromPath(pathname.trim());
  }

  if (typeof window !== "undefined" && window.location.pathname) {
    return getPageTypeFromPath(window.location.pathname);
  }

  return UNKNOWN_VALUE;
}

function resolvePageType(pageType?: string, pathname?: string): string {
  if (typeof pageType === "string" && pageType.trim().length > 0) {
    return pageType.trim();
  }

  const derived = getPageTypeFromCurrentPath(pathname);
  return derived.trim().length > 0 ? derived : UNKNOWN_VALUE;
}

function debugTrack(name: string, params: Record<string, unknown>, status: "sent" | "skipped"): void {
  if (!isDevelopmentMode()) return;
  // Temporary QA trace to verify required GA4 params are always present.
  console.info(`[GA4:${status}] ${name}`, params);
}

export function trackEvent(name: string, params?: EventParams): boolean {
  const finalParams = cleanParams(params);
  const gtag = getGtag();
  if (!gtag || !getGaId()) {
    debugTrack(name, finalParams, "skipped");
    return false;
  }

  gtag("event", name, finalParams);
  debugTrack(name, finalParams, "sent");
  return true;
}

export function trackPageView(url: string, pageType?: string): boolean {
  if (typeof window === "undefined") return false;

  const resolvedUrl = new URL(url, window.location.origin);
  return trackEvent("page_view", {
    page_location: resolvedUrl.toString(),
    page_path: `${resolvedUrl.pathname}${resolvedUrl.search}`,
    page_title: document.title,
    page_type: resolvePageType(pageType, resolvedUrl.pathname),
  });
}

export function trackProductView(product: TrackProductViewPayload): void {
  const category = product.categoria?.trim() || product.subcategoria?.trim() || "catalog";
  const price = toNumber(product.precio ?? product.precioReferencial);

  trackEvent("view_item", {
    currency: DEFAULT_CURRENCY,
    value: price,
    page_type: resolvePageType("product_detail"),
    item_slug: product.slug,
    sku: product.sku?.trim() || undefined,
    sku_dima: product.skuDima?.trim() || undefined,
    items: [
      {
        item_id: String(product.id),
        item_name: product.nombre,
        item_category: category,
        price,
        ...(product.marca?.trim() ? { item_brand: product.marca.trim() } : {}),
      },
    ],
  });
}

export function trackGenerateLead(params: {
  cta_name?: string;
  page_type?: string;
  source_section?: string;
  lead_type?: string;
  pathname?: string;
}): void {
  const { pathname, ...eventParams } = params;

  trackEvent("generate_lead", {
    ...eventParams,
    cta_name: normalizeStringParam(eventParams.cta_name),
    page_type: resolvePageType(eventParams.page_type, pathname),
    source_section: normalizeStringParam(eventParams.source_section),
  });
}

export function trackChatOpen(params: {
  chat_provider?: string;
  page_type?: string;
  source_section?: string;
  chat_mode?: string;
  realtime_active?: boolean;
  pathname?: string;
}): void {
  const { pathname, ...eventParams } = params;

  trackEvent("chat_open", {
    ...eventParams,
    chat_provider: normalizeStringParam(eventParams.chat_provider),
    page_type: resolvePageType(eventParams.page_type, pathname),
    source_section: eventParams.source_section
      ? normalizeStringParam(eventParams.source_section)
      : undefined,
  });
}

export function trackChatMessageSent(params: {
  chat_provider?: string;
  page_type?: string;
  message_length: number;
  chat_mode?: string;
  conversation_id_present?: boolean;
  pathname?: string;
}): void {
  const { pathname, ...eventParams } = params;

  trackEvent("chat_message_sent", {
    ...eventParams,
    chat_provider: normalizeStringParam(eventParams.chat_provider),
    page_type: resolvePageType(eventParams.page_type, pathname),
    message_length: Math.max(0, toNumber(eventParams.message_length)),
  });
}

export function trackChatLeadSubmit(params: {
  chat_provider?: string;
  page_type?: string;
  lead_type?: string;
  option_slug?: string;
  option_text?: string;
  pathname?: string;
}): void {
  const { pathname, ...eventParams } = params;

  trackEvent("chat_lead_submit", {
    ...eventParams,
    chat_provider: normalizeStringParam(eventParams.chat_provider),
    page_type: resolvePageType(eventParams.page_type, pathname),
    lead_type: normalizeStringParam(eventParams.lead_type),
  });
}

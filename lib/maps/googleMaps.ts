const FALLBACK_MAP_EMBED_URL =
  "https://www.google.com/maps?q=Santa+Cruz+de+la+Sierra,+Bolivia&output=embed";

function toGoogleEmbedQueryUrl(query: string): string {
  return `https://www.google.com/maps?q=${encodeURIComponent(query)}&output=embed`;
}

function parseIframeSrc(raw: string): string | null {
  const srcMatch = raw.match(/src\s*=\s*["']([^"']+)["']/i);
  return srcMatch?.[1]?.trim() || null;
}

function isGoogleMapsHost(hostname: string): boolean {
  return (
    hostname.includes("google.") ||
    hostname.includes("goo.gl") ||
    hostname.includes("maps.app.goo.gl")
  );
}

export function isPotentialGoogleMapsShortUrl(rawUrl: string | null | undefined): boolean {
  if (!rawUrl) return false;

  try {
    const parsed = new URL(rawUrl.trim());
    const hostname = parsed.hostname.toLowerCase();

    return (
      hostname === "share.google" ||
      hostname === "maps.app.goo.gl" ||
      hostname === "goo.gl"
    );
  } catch {
    return false;
  }
}

export function getFallbackMapEmbedUrl(): string {
  return FALLBACK_MAP_EMBED_URL;
}

export function resolveMapEmbedSrc(rawInput: string | null | undefined): string {
  const clean = rawInput?.trim();
  if (!clean) return FALLBACK_MAP_EMBED_URL;

  if (/<iframe/i.test(clean)) {
    const iframeSrc = parseIframeSrc(clean);
    if (iframeSrc) {
      return resolveMapEmbedSrc(iframeSrc);
    }
  }

  if (clean.includes("google.com/maps/embed") || clean.includes("output=embed")) {
    return clean;
  }

  let parsed: URL;
  try {
    parsed = new URL(clean);
  } catch {
    return toGoogleEmbedQueryUrl(clean);
  }

  const hostname = parsed.hostname.toLowerCase();
  if (!isGoogleMapsHost(hostname)) {
    return FALLBACK_MAP_EMBED_URL;
  }

  const q =
    parsed.searchParams.get("q") ||
    parsed.searchParams.get("query") ||
    parsed.searchParams.get("destination");

  if (q?.trim()) {
    return toGoogleEmbedQueryUrl(q.trim());
  }

  const ll = parsed.searchParams.get("ll") || parsed.searchParams.get("center");
  if (ll?.trim()) {
    return toGoogleEmbedQueryUrl(ll.trim());
  }

  const atMatch = parsed.pathname.match(/@(-?\d+(?:\.\d+)?),(-?\d+(?:\.\d+)?)/);
  if (atMatch) {
    return toGoogleEmbedQueryUrl(`${atMatch[1]},${atMatch[2]}`);
  }

  const placeMatch = parsed.pathname.match(/\/place\/([^/]+)/i);
  if (placeMatch?.[1]) {
    const place = decodeURIComponent(placeMatch[1]).replace(/\+/g, " ");
    return toGoogleEmbedQueryUrl(place);
  }

  return toGoogleEmbedQueryUrl(clean);
}

"use client";

import { MarcaItem, toPublicStorageUrl } from "@/lib/api";

function decodeLabel(label: string): string {
  return label
    .replace(/&laquo;/gi, "«")
    .replace(/&raquo;/gi, "»")
    .replace(/&amp;/gi, "&")
    .trim();
}

export function buildImageUrl(relativePath?: string | null): string | null {
  return toPublicStorageUrl(relativePath);
}

export function normalizePaginationLabel(label: string): string {
  const decoded = decodeLabel(label);

  if (/previous/i.test(decoded)) return "Anterior";
  if (/next/i.test(decoded)) return "Siguiente";

  return decoded.replace(/[«»]/g, "").trim();
}



export function resolvePageFromLink(
  url: string | null | undefined,
  pageFromApi: number | null | undefined,
): number | null {
  if (typeof pageFromApi === "number" && Number.isFinite(pageFromApi)) {
    return pageFromApi;
  }

  if (!url) return null;

  try {
    const parsed = new URL(url);
    const raw = parsed.searchParams.get("page");
    if (!raw) return null;

    const page = Number(raw);
    return Number.isFinite(page) && page > 0 ? page : null;
  } catch {
    return null;
  }
}

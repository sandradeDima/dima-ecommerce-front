"use client";

import {
  getProductoDetalle,
  getProductosList,
  ProductoDetailItem,
  ProductoImagenExtra,
  ProductoItem,
  ProductoRelacionadoItem,
  toPublicStorageUrl,
} from "@/lib/api";

type QueryMarcaValue = number | string;

export type ProductoGalleryImage = {
  key: string;
  path: string;
  url: string | null;
  alt: string;
  title: string;
};

export type RelatedProductCardItem = {
  id: number;
  nombre: string;
  descripcion_corta: string | null;
  imagen_principal: string | null;
  title_imagen: string | null;
  alt_imagen: string | null;
  slug: string;
  estado?: string;
  marca_id?: number | null;
};

function normalizePath(path: string | null | undefined): string {
  return (path ?? "").trim().replace(/^\/+/, "");
}

function isActiveProduct(estado?: string | null): boolean {
  if (!estado) return true;
  return estado.toLowerCase() === "activo";
}

function normalizeRelatedCandidate(item: ProductoRelacionadoItem): RelatedProductCardItem | null {
  const slug = item.slug?.trim();
  const nombre = item.nombre?.trim();
  if (!slug || !nombre) return null;

  return {
    id: Number(item.id),
    nombre,
    descripcion_corta: item.descripcion_corta ?? null,
    imagen_principal: item.imagen_principal ?? null,
    title_imagen: item.title_imagen ?? null,
    alt_imagen: item.alt_imagen ?? null,
    slug,
    estado: item.estado,
    marca_id: item.marca_id ?? null,
  };
}

function normalizeFromList(item: ProductoItem): RelatedProductCardItem | null {
  const slug = item.slug?.trim();
  const nombre = item.nombre?.trim();
  if (!slug || !nombre) return null;

  return {
    id: Number(item.id),
    nombre,
    descripcion_corta: item.descripcion_corta ?? null,
    imagen_principal: item.imagen_principal ?? null,
    title_imagen: item.title_imagen ?? null,
    alt_imagen: item.alt_imagen ?? null,
    slug,
    estado: (item as { estado?: string }).estado,
    marca_id: item.marca_id ?? null,
  };
}

function getMarcaQueryCandidates(producto: ProductoDetailItem): QueryMarcaValue[] {
  const candidates: QueryMarcaValue[] = [];
  const seen = new Set<string>();

  const add = (value: QueryMarcaValue | null | undefined) => {
    if (value === null || value === undefined) return;
    const key = String(value).trim();
    if (!key || seen.has(key)) return;
    seen.add(key);
    candidates.push(value);
  };

  add(producto.marca_id);
  add(producto.marca?.slug);
  add(producto.marca?.nombre);

  return candidates;
}

function dedupeRelatedItems(items: RelatedProductCardItem[]): RelatedProductCardItem[] {
  const seen = new Set<string>();
  const deduped: RelatedProductCardItem[] = [];

  for (const item of items) {
    const key = item.slug.trim().toLowerCase();
    if (!key || seen.has(key)) continue;
    seen.add(key);
    deduped.push(item);
  }

  return deduped;
}

function needsRelatedDetail(item: RelatedProductCardItem): boolean {
  const hasImage = Boolean(item.imagen_principal?.trim());
  const hasDescription = Boolean(item.descripcion_corta?.trim());
  return !hasImage || !hasDescription;
}

export function buildImageUrl(relativePath?: string | null): string | null {
  return toPublicStorageUrl(relativePath);
}

export function stripHtmlToText(value: string | null | undefined): string {
  if (!value) return "";

  return value
    .replace(/<br\s*\/?>/gi, "\n")
    .replace(/<\/p>/gi, "\n")
    .replace(/<[^>]+>/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

export function getProductoGalleryImages(producto: ProductoDetailItem): ProductoGalleryImage[] {
  const altBase = producto.alt_imagen?.trim() || producto.nombre;
  const titleBase = producto.title_imagen?.trim() || producto.nombre;

  const orderedExtras = [...(producto.imagenes ?? [])].sort((a, b) => {
    const orderA = typeof a.orden === "number" ? a.orden : Number.MAX_SAFE_INTEGER;
    const orderB = typeof b.orden === "number" ? b.orden : Number.MAX_SAFE_INTEGER;
    return orderA - orderB;
  });

  const candidates: Array<{ path: string; key: string }> = [];

  const mainPath = normalizePath(producto.imagen_principal);
  if (mainPath) {
    candidates.push({ path: mainPath, key: `main-${mainPath}` });
  }

  orderedExtras.forEach((image: ProductoImagenExtra, index) => {
    const path = normalizePath(image.ruta_imagen);
    if (!path) return;
    candidates.push({ path, key: `extra-${image.id ?? index}-${path}` });
  });

  const seenPaths = new Set<string>();
  const gallery: ProductoGalleryImage[] = [];

  candidates.forEach((candidate) => {
    const normalized = candidate.path.toLowerCase();
    if (seenPaths.has(normalized)) return;
    seenPaths.add(normalized);

    gallery.push({
      key: candidate.key,
      path: candidate.path,
      url: buildImageUrl(candidate.path),
      alt: altBase,
      title: titleBase,
    });
  });

  return gallery;
}

export function formatPriceOrFallback(producto: ProductoDetailItem): string | null {
  const candidates = [producto.precio, producto.precio_referencial];
  const formatter = new Intl.NumberFormat("es-BO", {
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  });

  for (const candidate of candidates) {
    if (typeof candidate === "number" && Number.isFinite(candidate)) {
      return `${formatter.format(candidate)} Bs.`;
    }

    if (typeof candidate === "string") {
      const clean = candidate.trim();
      if (!clean) continue;

      const numeric = Number(clean.replace(/[^0-9.,-]/g, "").replace(",", "."));
      if (Number.isFinite(numeric) && clean.match(/[0-9]/)) {
        return `${formatter.format(numeric)} Bs.`;
      }

      return clean;
    }
  }

  return null;
}

export function getRelatedProductsFromDetail(
  producto: ProductoDetailItem,
  limit = 4,
): RelatedProductCardItem[] {
  const currentSlug = producto.slug?.trim().toLowerCase();
  const normalized = (producto.relacionados ?? [])
    .map((item) => normalizeRelatedCandidate(item))
    .filter((item): item is RelatedProductCardItem => item !== null)
    .filter((item) => item.slug.trim().toLowerCase() !== currentSlug)
    .filter((item) => isActiveProduct(item.estado))
    .slice(0, limit);

  return dedupeRelatedItems(normalized);
}

export async function getRelatedProductsFallback(
  producto: ProductoDetailItem,
  limit = 4,
): Promise<RelatedProductCardItem[]> {
  const currentSlug = producto.slug?.trim().toLowerCase();
  const targetMarcaId = producto.marca_id;
  const marcaCandidates = getMarcaQueryCandidates(producto);
  const collected: RelatedProductCardItem[] = [];

  for (const marcaCandidate of marcaCandidates) {
    try {
      const response = await getProductosList({
        page: 1,
        per_page: 16,
        marca: marcaCandidate,
      });

      const normalized = response.data
        .map((item) => normalizeFromList(item))
        .filter((item): item is RelatedProductCardItem => item !== null)
        .filter((item) => item.slug.trim().toLowerCase() !== currentSlug)
        .filter((item) => {
          if (targetMarcaId === null || targetMarcaId === undefined) return true;
          if (item.marca_id === null || item.marca_id === undefined) return true;
          return item.marca_id === targetMarcaId;
        })
        .filter((item) => isActiveProduct(item.estado));

      collected.push(...normalized);

      const deduped = dedupeRelatedItems(collected);
      if (deduped.length >= limit) {
        return deduped.slice(0, limit);
      }
    } catch {
      continue;
    }
  }

  return dedupeRelatedItems(collected).slice(0, limit);
}

export async function enrichRelatedProductsIfNeeded(
  items: RelatedProductCardItem[],
): Promise<RelatedProductCardItem[]> {
  const enriched = await Promise.all(
    items.map(async (item) => {
      if (!needsRelatedDetail(item)) return item;

      try {
        const detail = await getProductoDetalle(item.slug);
        if (!detail || !detail.slug) return item;

        return {
          ...item,
          nombre: detail.nombre || item.nombre,
          descripcion_corta: detail.descripcion_corta ?? item.descripcion_corta ?? null,
          imagen_principal: detail.imagen_principal ?? item.imagen_principal ?? null,
          title_imagen: detail.title_imagen ?? item.title_imagen ?? null,
          alt_imagen: detail.alt_imagen ?? item.alt_imagen ?? null,
          estado: detail.estado ?? item.estado,
          marca_id: detail.marca_id ?? item.marca_id ?? null,
        };
      } catch {
        return item;
      }
    }),
  );

  return dedupeRelatedItems(enriched);
}

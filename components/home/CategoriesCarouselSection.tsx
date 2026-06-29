"use client";

/* eslint-disable @next/next/no-img-element */
import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { Categoria, getCategorias, toPublicStorageUrl } from "@/lib/api";

const ITEMS_PER_PAGE = 3;
const FALLBACK_DESCRIPTION =
  "Explora productos clave para equipar y modernizar tus espacios.";

function getItemsPerPage(screenWidth: number): number {
  if (screenWidth >= 1320) return 3;
  if (screenWidth >= 900) return 2;
  return 1;
}

export type CategoriaItem = {
  id: number;
  nombre: string;
  descripcion: string | null;
  imagen_principal: string;
  title_imagen: string | null;
  alt_imagen: string | null;
  slug: string;
};

export type CategoriasResponse = {
  conError: boolean;
  mensaje: string;
  data: CategoriaItem[];
};

function chunkCategorias(items: CategoriaItem[], size: number): CategoriaItem[][] {
  const chunks: CategoriaItem[][] = [];

  for (let index = 0; index < items.length; index += size) {
    chunks.push(items.slice(index, index + size));
  }

  return chunks;
}

function normalizeCategoria(item: Categoria): CategoriaItem | null {
  if (!item.slug || !item.nombre) return null;

  return {
    id: item.id,
    nombre: item.nombre,
    descripcion: item.descripcion ?? null,
    imagen_principal: item.imagen_principal ?? "",
    title_imagen: item.title_imagen ?? null,
    alt_imagen: item.alt_imagen ?? null,
    slug: item.slug,
  };
}

function ArrowLeftIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" className="h-8 w-8">
      <path
        d="M15 18l-6-6 6-6"
        fill="none"
        stroke="currentColor"
        strokeWidth="2.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function ArrowRightIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" className="h-8 w-8">
      <path
        d="M9 18l6-6-6-6"
        fill="none"
        stroke="currentColor"
        strokeWidth="2.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function CategoryCard({ item }: { item: CategoriaItem }) {
  const imageUrl = toPublicStorageUrl(item.imagen_principal);
  const description = item.descripcion?.trim() || FALLBACK_DESCRIPTION;
  const imageAlt = item.alt_imagen?.trim() || item.nombre;
  const imageTitle = item.title_imagen?.trim() || item.nombre;

  return (
    <article className="group flex min-h-[320px] overflow-hidden rounded-[34px] bg-white shadow-[0_12px_35px_rgba(15,23,42,0.14)] lg:min-h-[340px]">
      <div className="h-auto w-[50%] shrink-0 p-3 sm:p-4">
        {imageUrl ? (
          <img
            src={imageUrl}
            alt={imageAlt}
            title={imageTitle}
            className="h-full w-full rounded-[24px] object-cover transition-transform duration-300 ease-out group-hover:scale-105"
            loading="lazy"
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center rounded-[24px] bg-slate-200 text-sm text-slate-500">
            Sin imagen
          </div>
        )}
      </div>

      <div className="flex min-w-0 flex-1 flex-col items-center justify-center px-4 py-5 text-center sm:px-5 sm:py-6 lg:px-6 lg:py-8">
        <h3 className="break-words text-[clamp(1rem,1.2vw,1.65rem)] font-medium leading-tight text-slate-700">
          {item.nombre}
        </h3>
        <p className="mt-3 break-words text-[clamp(0.85rem,0.9vw,1.05rem)] leading-relaxed text-slate-500">
          {description}
        </p>

        <div className="mt-4 flex w-full items-center justify-center">
          <Link
            href={`/catalogo?categoria=${item.id}`}
            className="inline-flex h-11 w-full max-w-[210px] items-center justify-center rounded-full border border-[#F54029] px-5 text-sm font-medium text-[#F54029] transition-colors hover:bg-[#F54029] hover:text-white"
          >
            Ver más
          </Link>
        </div>
      </div>
    </article>
  );
}

function CategorySkeletonCard({ index }: { index: number }) {
  return (
    <div
      key={`category-skeleton-${index}`}
      className="flex min-h-[320px] animate-pulse overflow-hidden rounded-[34px] bg-white shadow-[0_12px_35px_rgba(15,23,42,0.08)] lg:min-h-[340px]"
    >
      <div className="w-[50%] p-3 sm:p-4">
        <div className="h-full w-full rounded-[24px] bg-slate-200" />
      </div>
      <div className="flex flex-1 flex-col items-center justify-center gap-4 px-5 py-6 text-center lg:px-6 lg:py-8">
        <div className="h-7 w-2/3 rounded-md bg-slate-200" />
        <div className="h-20 w-11/12 rounded-md bg-slate-200" />
        <div className="h-11 w-36 rounded-full bg-slate-200" />
      </div>
    </div>
  );
}

export default function CategoriesCarouselSection() {
  const [items, setItems] = useState<CategoriaItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [hasError, setHasError] = useState(false);
  const [currentPage, setCurrentPage] = useState(0);
  const [itemsPerPage, setItemsPerPage] = useState(ITEMS_PER_PAGE);

  useEffect(() => {
    let isCancelled = false;

    const loadCategorias = async () => {
      setIsLoading(true);
      setHasError(false);

      try {
        const response = await getCategorias();
        if (isCancelled) return;

        const normalized = response
          .map(normalizeCategoria)
          .filter((item): item is CategoriaItem => item !== null);

        setItems(normalized);
        setCurrentPage(0);
      } catch {
        if (!isCancelled) {
          setItems([]);
          setHasError(true);
        }
      } finally {
        if (!isCancelled) {
          setIsLoading(false);
        }
      }
    };

    void loadCategorias();

    return () => {
      isCancelled = true;
    };
  }, []);

  useEffect(() => {
    const updateItemsPerPage = () => {
      setItemsPerPage(getItemsPerPage(window.innerWidth));
    };

    updateItemsPerPage();
    window.addEventListener("resize", updateItemsPerPage);

    return () => window.removeEventListener("resize", updateItemsPerPage);
  }, []);

  const pages = useMemo(() => chunkCategorias(items, itemsPerPage), [items, itemsPerPage]);
  const lastPageIndex = Math.max(0, pages.length - 1);
  const safePageIndex = Math.min(currentPage, lastPageIndex);
  const visibleItems = pages[safePageIndex] ?? [];
  const canPaginate = pages.length > 1;
  const isPrevDisabled = !canPaginate || safePageIndex <= 0;
  const isNextDisabled = !canPaginate || safePageIndex >= lastPageIndex;
  const showEmptyState = !isLoading && !hasError && items.length === 0;
  const gridColsClass =
    itemsPerPage === 3 ? "xl:grid-cols-3 md:grid-cols-2 grid-cols-1" : itemsPerPage === 2 ? "md:grid-cols-2 grid-cols-1" : "grid-cols-1";

  return (
    <section className="bg-white pt-2 pb-24">
      <div className="bg-[#F4F5F7]">
        <div className="mx-auto w-full max-w-[1700px] px-6 py-8 text-center sm:px-10 lg:px-16 xl:px-20">
          <h2 className="text-[36px] font-medium leading-tight text-slate-700">
            Categorías
          </h2>
          <p className="mx-auto mt-8 max-w-5xl text-[18px] leading-tight text-slate-600">
            Desde computadoras y accesorios hasta soluciones de seguridad y
            audio profesional, encuentra productos para tu hogar u oficina en
            nuestras categorías principales.
          </p>
        </div>
      </div>

      <div className="mx-auto mt-[-12px] w-full max-w-[1700px] px-6 sm:mt-[-16px] sm:px-10 lg:px-16 xl:px-20">
        <div className="flex items-center gap-4 lg:gap-6">
          <button
            type="button"
            onClick={() => setCurrentPage(Math.max(0, safePageIndex - 1))}
            disabled={isPrevDisabled}
            aria-label="Categorías anteriores"
            className={`hidden h-12 w-12 shrink-0 items-center justify-center rounded-full border border-slate-300 bg-white text-slate-400 shadow-sm transition md:flex md:h-14 md:w-14 ${
              isPrevDisabled
                ? "pointer-events-none opacity-40"
                : "opacity-100 hover:bg-slate-50"
            }`}
          >
            <ArrowLeftIcon />
          </button>

          <div className="min-w-0 flex-1">
            {isLoading ? (
              <div className={`grid gap-6 ${gridColsClass}`}>
                {Array.from({ length: itemsPerPage }).map((_, index) => (
                  <CategorySkeletonCard key={`skeleton-${index}`} index={index} />
                ))}
              </div>
            ) : hasError ? (
              <div className="rounded-[30px] bg-white px-8 py-14 text-center shadow-[0_12px_35px_rgba(15,23,42,0.12)]">
                <p className="text-lg text-slate-600">
                  No se pudieron cargar las categorías por el momento.
                </p>
              </div>
            ) : showEmptyState ? (
              <div className="rounded-[30px] bg-white px-8 py-14 text-center shadow-[0_12px_35px_rgba(15,23,42,0.12)]">
                <p className="text-lg text-slate-600">
                  No hay categorías disponibles.
                </p>
              </div>
            ) : (
              <div className={`grid gap-6 ${gridColsClass}`}>
                {visibleItems.map((item) => (
                  <CategoryCard key={item.id} item={item} />
                ))}
              </div>
            )}
          </div>

          <button
            type="button"
            onClick={() => setCurrentPage(Math.min(lastPageIndex, safePageIndex + 1))}
            disabled={isNextDisabled}
            aria-label="Siguientes categorías"
            className={`hidden h-12 w-12 shrink-0 items-center justify-center rounded-full border border-slate-300 bg-white text-slate-400 shadow-sm transition md:flex md:h-14 md:w-14 ${
              isNextDisabled
                ? "pointer-events-none opacity-40"
                : "opacity-100 hover:bg-slate-50"
            }`}
          >
            <ArrowRightIcon />
          </button>
        </div>

        <div className="mt-4 flex items-center justify-center gap-3 md:hidden">
          <button
            type="button"
            onClick={() => setCurrentPage(Math.max(0, safePageIndex - 1))}
            disabled={isPrevDisabled}
            aria-label="Categorías anteriores"
            className={`flex h-10 w-10 items-center justify-center rounded-full border border-slate-300 bg-white text-slate-400 shadow-sm transition ${
              isPrevDisabled
                ? "pointer-events-none opacity-40"
                : "opacity-100 hover:bg-slate-50"
            }`}
          >
            <ArrowLeftIcon />
          </button>

          <button
            type="button"
            onClick={() => setCurrentPage(Math.min(lastPageIndex, safePageIndex + 1))}
            disabled={isNextDisabled}
            aria-label="Siguientes categorías"
            className={`flex h-10 w-10 items-center justify-center rounded-full border border-slate-300 bg-white text-slate-400 shadow-sm transition ${
              isNextDisabled
                ? "pointer-events-none opacity-40"
                : "opacity-100 hover:bg-slate-50"
            }`}
          >
            <ArrowRightIcon />
          </button>
        </div>
      </div>
    </section>
  );
}

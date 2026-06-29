"use client";

/* eslint-disable @next/next/no-img-element */
import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { toPublicStorageUrl } from "@/lib/api";

const BLOG_LIMIT = 6;
const BLOG_ENDPOINT = `/blog/inicio/${BLOG_LIMIT}`;
const DEFAULT_BASE_URL_PUBLIC = "http://127.0.0.1:8000/api/public";

export type BlogPost = {
  id: number;
  titulo: string;
  descripcion_corta: string;
  imagen_portada: string | null;
  title_imagen: string | null;
  alt_imagen: string | null;
  slug: string;
  fecha_publicacion: string;
  estado?: string;
  estado_blog?: string;
  autor: { id?: number; name?: string; email?: string } | string | null;
};

export type LatestNewsApiResponse = {
  conError: boolean;
  mensaje: string;
  data: BlogPost[];
};

function trimTrailingSlash(value: string): string {
  return value.replace(/\/+$/, "");
}

function joinUrl(base: string, path: string): string {
  return `${trimTrailingSlash(base)}/${path.replace(/^\/+/, "")}`;
}

function getBaseUrlPublic(): string {
  const envBase =
    process.env.NEXT_PUBLIC_DMC_API_BASE_URL ??
    process.env.NEXT_PUBLIC_API_BASE_URL ??
    DEFAULT_BASE_URL_PUBLIC;

  const cleanBase = trimTrailingSlash(envBase);

  return cleanBase.endsWith("/api/public") ? cleanBase : `${cleanBase}/api/public`;
}

function resolveItemsPerPage(screenWidth: number): number {
  if (screenWidth >= 1280) return 3;
  if (screenWidth >= 768) return 2;
  return 1;
}

function chunkItems<T>(items: T[], size: number): T[][] {
  const chunks: T[][] = [];

  for (let index = 0; index < items.length; index += size) {
    chunks.push(items.slice(index, index + size));
  }

  return chunks;
}

function formatDate(value: string): string {
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return value;

  const yyyy = parsed.getFullYear();
  const mm = String(parsed.getMonth() + 1).padStart(2, "0");
  const dd = String(parsed.getDate()).padStart(2, "0");

  return `${yyyy}/${mm}/${dd}`;
}

function resolveAuthorLabel(author: BlogPost["autor"]): string {
  if (!author) return "Autor";
  if (typeof author === "string") return author.trim() || "Autor";
  if (typeof author === "object" && "name" in author && author.name?.trim()) {
    return author.name.trim();
  }

  return "Autor";
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

function NewsSkeletonCard({ index }: { index: number }) {
  return (
    <div
      key={`news-skeleton-${index}`}
      className="overflow-hidden rounded-[22px] bg-[#f6f6f7] shadow-[0_10px_28px_rgba(15,23,42,0.12)]"
    >
      <div className="h-[180px] animate-pulse bg-slate-200" />
      <div className="space-y-3 px-5 py-4">
        <div className="h-12 animate-pulse rounded bg-slate-200" />
        <div className="border-t-[0.91px] border-[#EF4F39]/90" />
        <div className="h-4 w-1/2 animate-pulse rounded bg-slate-200" />
        <div className="h-14 animate-pulse rounded bg-slate-200" />
      </div>
    </div>
  );
}

function NewsCard({ post }: { post: BlogPost }) {
  const coverImageUrl = toPublicStorageUrl(post.imagen_portada);
  const titleImage = post.title_imagen?.trim() || post.titulo;
  const altImage = post.alt_imagen?.trim() || post.titulo;
  const authorLabel = resolveAuthorLabel(post.autor);
  const publishedDate = formatDate(post.fecha_publicacion);

  return (
    <Link
      href={`/blog/${post.slug}`}
      className="group block overflow-hidden rounded-[22px] bg-[#f6f6f7] shadow-[0_10px_28px_rgba(15,23,42,0.12)] transition-all duration-250 hover:-translate-y-1 hover:bg-[#5F6B76]"
    >
      <div className="relative h-[180px] w-full overflow-hidden">
        {coverImageUrl ? (
          <img
            src={coverImageUrl}
            alt={altImage}
            title={titleImage}
            className="h-full w-full object-cover transition-transform duration-300 ease-out group-hover:scale-110"
            loading="lazy"
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center bg-slate-200 text-sm text-slate-500 group-hover:bg-slate-500 group-hover:text-white">
            Sin imagen
          </div>
        )}
      </div>

      <div className="px-5 py-4">
        <h3
          className="h-[3.4rem] overflow-hidden text-[19px] font-semibold leading-tight text-slate-700 transition-colors duration-250 group-hover:text-white"
          style={{
            display: "-webkit-box",
            WebkitLineClamp: 2,
            WebkitBoxOrient: "vertical",
          }}
        >
          {post.titulo}
        </h3>

        <div className="mt-3 border-t-[0.91px] border-[#EF4F39] transition-colors duration-250 group-hover:border-white" />

        <p className="mt-2 text-[13.67px] text-slate-500 transition-colors duration-250 group-hover:text-white">
          {authorLabel} - {publishedDate}
        </p>

        <p
          className="mt-2 h-[4.8rem] overflow-hidden text-[19px] leading-tight text-slate-600 transition-colors duration-250 group-hover:text-white"
          style={{
            display: "-webkit-box",
            WebkitLineClamp: 3,
            WebkitBoxOrient: "vertical",
          }}
        >
          {post.descripcion_corta}
        </p>
      </div>
    </Link>
  );
}

function isPublishedBlogPost(item: BlogPost): boolean {
  return (
    item.estado?.toLowerCase() === "activo" &&
    item.estado_blog?.toLowerCase() === "publicado"
  );
}

export default function LatestNewsSection() {
  const [posts, setPosts] = useState<BlogPost[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [hasError, setHasError] = useState(false);
  const [errorMessage, setErrorMessage] = useState("No se pudieron cargar las noticias.");
  const [currentPage, setCurrentPage] = useState(0);
  const [itemsPerPage, setItemsPerPage] = useState(3);

  useEffect(() => {
    const updateItemsPerPage = () => {
      setItemsPerPage(resolveItemsPerPage(window.innerWidth));
    };

    updateItemsPerPage();
    window.addEventListener("resize", updateItemsPerPage);

    return () => window.removeEventListener("resize", updateItemsPerPage);
  }, []);

  useEffect(() => {
    let isCancelled = false;
    const controller = new AbortController();

    const loadLatestNews = async () => {
      setIsLoading(true);
      setHasError(false);
      setErrorMessage("No se pudieron cargar las noticias.");

      try {
        const response = await fetch(joinUrl(getBaseUrlPublic(), BLOG_ENDPOINT), {
          method: "GET",
          headers: { Accept: "application/json" },
          signal: controller.signal,
          cache: "no-store",
        });

        const payload =
          (await response.json()) as Partial<LatestNewsApiResponse> | null;

        if (isCancelled || controller.signal.aborted) return;

        if (
          !response.ok ||
          !payload ||
          payload.conError === true ||
          !Array.isArray(payload.data)
        ) {
          setPosts([]);
          setHasError(true);
          setErrorMessage(payload?.mensaje || "No se pudieron cargar las noticias.");
          return;
        }

        const normalized = payload.data
          .filter(
            (item): item is BlogPost =>
              Boolean(item?.id && item.slug && item.titulo && item.descripcion_corta),
          )
          .filter(isPublishedBlogPost);

        setPosts(normalized);
        setCurrentPage(0);
      } catch {
        if (!isCancelled && !controller.signal.aborted) {
          setPosts([]);
          setHasError(true);
          setErrorMessage("No se pudieron cargar las noticias.");
        }
      } finally {
        if (!isCancelled && !controller.signal.aborted) {
          setIsLoading(false);
        }
      }
    };

    void loadLatestNews();

    return () => {
      isCancelled = true;
      controller.abort();
    };
  }, []);

  const pages = useMemo(() => chunkItems(posts, itemsPerPage), [posts, itemsPerPage]);
  const lastPageIndex = Math.max(0, pages.length - 1);
  const safePageIndex = Math.min(currentPage, lastPageIndex);
  const visiblePosts = pages[safePageIndex] ?? [];
  const canPaginate = pages.length > 1;
  const showEmptyState = !isLoading && !hasError && posts.length === 0;

  const gridColsClass =
    itemsPerPage === 3
      ? "xl:grid-cols-3 md:grid-cols-2 grid-cols-1"
      : itemsPerPage === 2
        ? "md:grid-cols-2 grid-cols-1"
        : "grid-cols-1";

  return (
    <section className="bg-white pb-24">
      <div className="mx-auto w-full max-w-[1700px] px-6 sm:px-10 lg:px-16 xl:px-20">
        <h2 className="text-center text-[36px] font-medium leading-tight text-slate-700">
          Últimas Noticias
        </h2>

        <div className="mt-12 flex items-center gap-4 lg:gap-6">
          <button
            type="button"
            onClick={() => setCurrentPage(Math.max(0, safePageIndex - 1))}
            disabled={!canPaginate || safePageIndex <= 0}
            aria-label="Noticias anteriores"
            className={`hidden h-12 w-12 shrink-0 items-center justify-center rounded-full border border-slate-300 bg-white text-slate-400 shadow-sm transition md:flex md:h-14 md:w-14 ${
              !canPaginate || safePageIndex <= 0
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
                  <NewsSkeletonCard key={`news-loading-${index}`} index={index} />
                ))}
              </div>
            ) : hasError ? (
              <div className="rounded-[22px] bg-[#f6f6f7] px-8 py-14 text-center shadow-[0_10px_28px_rgba(15,23,42,0.12)]">
                <p className="text-lg text-slate-600">{errorMessage}</p>
              </div>
            ) : showEmptyState ? (
              <div className="rounded-[22px] bg-[#f6f6f7] px-8 py-14 text-center shadow-[0_10px_28px_rgba(15,23,42,0.12)]">
                <p className="text-lg text-slate-600">
                  No hay noticias disponibles.
                </p>
              </div>
            ) : (
              <div className={`grid gap-6 ${gridColsClass}`}>
                {visiblePosts.map((post) => (
                  <NewsCard key={post.id} post={post} />
                ))}
              </div>
            )}
          </div>

          <button
            type="button"
            onClick={() => setCurrentPage(Math.min(lastPageIndex, safePageIndex + 1))}
            disabled={!canPaginate || safePageIndex >= lastPageIndex}
            aria-label="Siguientes noticias"
            className={`hidden h-12 w-12 shrink-0 items-center justify-center rounded-full border border-slate-300 bg-white text-slate-400 shadow-sm transition md:flex md:h-14 md:w-14 ${
              !canPaginate || safePageIndex >= lastPageIndex
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
            disabled={!canPaginate || safePageIndex <= 0}
            aria-label="Noticias anteriores"
            className={`flex h-10 w-10 items-center justify-center rounded-full border border-slate-300 bg-white text-slate-400 shadow-sm transition ${
              !canPaginate || safePageIndex <= 0
                ? "pointer-events-none opacity-40"
                : "opacity-100 hover:bg-slate-50"
            }`}
          >
            <ArrowLeftIcon />
          </button>

          <button
            type="button"
            onClick={() => setCurrentPage(Math.min(lastPageIndex, safePageIndex + 1))}
            disabled={!canPaginate || safePageIndex >= lastPageIndex}
            aria-label="Siguientes noticias"
            className={`flex h-10 w-10 items-center justify-center rounded-full border border-slate-300 bg-white text-slate-400 shadow-sm transition ${
              !canPaginate || safePageIndex >= lastPageIndex
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

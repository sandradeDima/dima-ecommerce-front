"use client";

import { useEffect, useMemo, useState } from "react";
import ProductCard, { ProductoInicioItem } from "./ProductCard";

type HomeProductsSectionProps = {
  nuevos: ProductoInicioItem[];
  destacados: ProductoInicioItem[];
  isLoading: boolean;
  hasError: boolean;
};

type ProductsTab = "nuevos" | "destacados";

const CARD_WIDTH = 294;
const CARD_GAP = 47;
const CARD_STEP = CARD_WIDTH + CARD_GAP;

function getItemsPerPage(screenWidth: number): number {
  if (screenWidth >= 1500) return 4;
  if (screenWidth >= 1120) return 3;
  if (screenWidth >= 760) return 2;
  return 1;
}

function ArrowLeftIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" className="h-7 w-7">
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
    <svg viewBox="0 0 24 24" aria-hidden="true" className="h-7 w-7">
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

function ProductsLoadingSkeleton({ count }: { count: number }) {
  return (
    <div className="flex flex-wrap justify-center gap-[47px]">
      {Array.from({ length: count }).map((_, index) => (
        <div
          key={`product-skeleton-${index}`}
          className="h-[402px] w-[294px] animate-pulse rounded-[36px] bg-slate-100"
        />
      ))}
    </div>
  );
}

function ProductPlaceholderCard({ index }: { index: number }) {
  return (
    <div
      key={`placeholder-${index}`}
      className="flex h-[402px] w-[294px] shrink-0 flex-col items-center justify-center rounded-[36px] border border-dashed border-slate-300 bg-slate-50 text-slate-400"
    >
      Próximamente
    </div>
  );
}

export default function HomeProductsSection({
  nuevos,
  destacados,
  isLoading,
  hasError,
}: HomeProductsSectionProps) {
  const [activeTab, setActiveTab] = useState<ProductsTab>("nuevos");
  const [currentIndex, setCurrentIndex] = useState(0);
  const [itemsPerPage, setItemsPerPage] = useState(4);

  useEffect(() => {
    const updateItemsPerPage = () => {
      setItemsPerPage(getItemsPerPage(window.innerWidth));
    };

    updateItemsPerPage();
    window.addEventListener("resize", updateItemsPerPage);

    return () => window.removeEventListener("resize", updateItemsPerPage);
  }, []);

  const activeProducts = useMemo(
    () => (activeTab === "nuevos" ? nuevos : destacados),
    [activeTab, destacados, nuevos],
  );

  const maxIndex = Math.max(0, activeProducts.length - itemsPerPage);
  const canSlide = activeProducts.length > itemsPerPage;
  const safeIndex = Math.min(currentIndex, maxIndex);
  const placeholderCount = Math.max(0, itemsPerPage - activeProducts.length);
  const viewportMaxWidth = itemsPerPage * CARD_WIDTH + (itemsPerPage - 1) * CARD_GAP;

  const showEmptyState = !isLoading && !hasError && activeProducts.length === 0;

  return (
    <section className="mt-14 pb-12">
      <div className="mx-auto flex h-[64px] w-full max-w-[900px] items-center rounded-full bg-[#ECECEC] p-[6px]">
        <button
          type="button"
          onClick={() => {
            setActiveTab("nuevos");
            setCurrentIndex(0);
          }}
          className={`h-full flex-1 rounded-full text-[18px] font-normal md:text-[24px] ${
            activeTab === "nuevos"
              ? "bg-white text-[#F54029]"
              : "text-[#B9B9B9] hover:text-[#A7A7A7]"
          }`}
        >
          Productos nuevos
        </button>

        <button
          type="button"
          onClick={() => {
            setActiveTab("destacados");
            setCurrentIndex(0);
          }}
          className={`h-full flex-1 rounded-full text-[18px] font-normal md:text-[24px] ${
            activeTab === "destacados"
              ? "bg-white text-[#F54029]"
              : "text-[#B9B9B9] hover:text-[#A7A7A7]"
          }`}
        >
          Productos destacados
        </button>
      </div>

      <div className="mx-auto mt-12 w-full max-w-[1680px] px-2 sm:px-4 lg:px-8">
        <div className="flex items-center gap-4 lg:gap-6">
          <button
            type="button"
            onClick={() => setCurrentIndex(Math.max(0, safeIndex - itemsPerPage))}
            disabled={!canSlide || safeIndex <= 0}
            aria-label="Productos anteriores"
            className={`hidden h-12 w-12 shrink-0 items-center justify-center rounded-full border border-slate-200 bg-white text-slate-600 shadow-sm transition md:flex md:h-14 md:w-14 ${
              !canSlide || safeIndex <= 0
                ? "pointer-events-none opacity-40"
                : "opacity-100 hover:bg-slate-50"
            }`}
          >
            <ArrowLeftIcon />
          </button>

          <div className="min-w-0 flex-1">
            <div
              className="mx-auto w-full overflow-x-hidden overflow-y-visible py-3"
              style={{ maxWidth: `${viewportMaxWidth}px` }}
            >
              {isLoading ? (
                <ProductsLoadingSkeleton count={itemsPerPage} />
              ) : hasError ? (
                <p className="py-20 text-center text-sm text-slate-500">
                  No se pudieron cargar los productos por el momento.
                </p>
              ) : showEmptyState ? (
                <p className="py-20 text-center text-sm text-slate-500">
                  No hay productos disponibles
                </p>
              ) : (
                <div className={canSlide ? "" : "flex justify-center"}>
                  <div
                    className="flex gap-[47px] transition-transform duration-500 ease-out"
                    style={
                      canSlide
                        ? { transform: `translateX(-${safeIndex * CARD_STEP}px)` }
                        : undefined
                    }
                  >
                    {activeProducts.map((product) => (
                      <ProductCard key={`${activeTab}-${product.id}`} product={product} />
                    ))}
                    {!canSlide &&
                      activeProducts.length > 0 &&
                      Array.from({ length: placeholderCount }).map((_, index) => (
                        <ProductPlaceholderCard key={`placeholder-${index}`} index={index} />
                      ))}
                  </div>
                </div>
              )}
            </div>
          </div>

          <button
            type="button"
            onClick={() => setCurrentIndex(Math.min(maxIndex, safeIndex + itemsPerPage))}
            disabled={!canSlide || safeIndex >= maxIndex}
            aria-label="Siguientes productos"
            className={`hidden h-12 w-12 shrink-0 items-center justify-center rounded-full border border-slate-200 bg-white text-slate-600 shadow-sm transition md:flex md:h-14 md:w-14 ${
              !canSlide || safeIndex >= maxIndex
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
            onClick={() => setCurrentIndex(Math.max(0, safeIndex - itemsPerPage))}
            disabled={!canSlide || safeIndex <= 0}
            aria-label="Productos anteriores"
            className={`flex h-10 w-10 items-center justify-center rounded-full border border-slate-200 bg-white text-slate-600 shadow-sm transition ${
              !canSlide || safeIndex <= 0
                ? "pointer-events-none opacity-40"
                : "opacity-100 hover:bg-slate-50"
            }`}
          >
            <ArrowLeftIcon />
          </button>

          <button
            type="button"
            onClick={() => setCurrentIndex(Math.min(maxIndex, safeIndex + itemsPerPage))}
            disabled={!canSlide || safeIndex >= maxIndex}
            aria-label="Siguientes productos"
            className={`flex h-10 w-10 items-center justify-center rounded-full border border-slate-200 bg-white text-slate-600 shadow-sm transition ${
              !canSlide || safeIndex >= maxIndex
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

"use client";

import { useEffect, useMemo, useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import {
  Categoria,
  getCategorias,
  getMarcasList,
  MarcaItem,
  ProductosPaginationData,
  SearchSuggestionItem,
} from "@/lib/api";
import BrandProductCard from "@/components/marcas/BrandProductCard";
import MarcasPagination from "@/components/marcas/MarcasPagination";
import Breadcrumbs from "@/components/Breadcrumbs";
import SmartSearchBar from "@/components/search/SmartSearchBar";
import { searchProductos } from "@/lib/api/searchApi";
import {
  buildProductosQuery,
  CatalogoFilters,
  extractUniqueBrands,
  extractUniqueCategorias,
  FilterOption,
  filterActiveProducts,
  mergeUniqueOptions,
  parseNumberFilter,
  parsePageValue,
  parseToggleFilter,
} from "./catalogoUtils";

function ChevronIcon({ className = "" }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" className={className}>
      <path
        d="m7 10 5 5 5-5"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function ProductCardSkeleton({ index }: { index: number }) {
  return (
    <div
      key={`catalogo-skeleton-${index}`}
      className="h-full min-h-[402px] w-full max-w-[310px] animate-pulse overflow-hidden rounded-[24px] bg-white shadow-[0_10px_26px_rgba(15,23,42,0.12)]"
    >
      <div className="h-[230px] w-full bg-slate-200" />
      <div className="space-y-2 px-4 py-3">
        <div className="h-4 w-3/4 rounded bg-slate-200" />
        <div className="h-4 w-full rounded bg-slate-200" />
        <div className="h-4 w-5/6 rounded bg-slate-200" />
      </div>
      <div className="px-4 pb-4">
        <div className="mx-auto h-10 w-[190px] rounded-full bg-slate-200" />
      </div>
    </div>
  );
}

function normalizeMarcaOptions(items: MarcaItem[]): FilterOption[] {
  return items
    .filter((item) => item.estado?.toLowerCase() === "activo")
    .map((item) => ({ id: item.id, nombre: item.nombre }))
    .sort((a, b) => a.nombre.localeCompare(b.nombre, "es", { sensitivity: "base" }));
}

function normalizeCategoriaOptions(items: Categoria[]): FilterOption[] {
  return items
    .map((item) => ({ id: item.id, nombre: item.nombre }))
    .filter((item) => Number.isFinite(item.id) && item.id > 0 && item.nombre?.trim())
    .sort((a, b) => a.nombre.localeCompare(b.nombre, "es", { sensitivity: "base" }));
}

async function getAllMarcaOptions(): Promise<FilterOption[]> {
  const list: MarcaItem[] = [];
  let currentPage = 1;

  while (true) {
    const response = await getMarcasList({ page: currentPage, per_page: 100 });
    list.push(...response.data);

    if (!response.next_page_url || currentPage >= response.last_page) break;
    currentPage += 1;
  }

  return normalizeMarcaOptions(list);
}

function OptionCheckboxItem({
  name,
  checked,
  onChange,
}: {
  name: string;
  checked: boolean;
  onChange: () => void;
}) {
  return (
    <label className="flex cursor-pointer items-center gap-2.5 text-[13px] font-medium text-[var(--dima-ink-soft)]">
      <input
        type="checkbox"
        checked={checked}
        onChange={onChange}
        className="h-4 w-4 rounded border-[var(--dima-line)] accent-[var(--dima-primary)]"
      />
      <span className="line-clamp-1">{name}</span>
    </label>
  );
}

export default function CatalogoPageContent() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const requestedFilters = useMemo<CatalogoFilters>(
    () => ({
      nombre: searchParams.get("q")?.trim() ?? searchParams.get("nombre")?.trim() ?? "",
      marca: parseNumberFilter(searchParams.get("marca")),
      categoria: parseNumberFilter(searchParams.get("categoria")),
      nuevo: parseToggleFilter(searchParams.get("nuevo")),
      destacado: parseToggleFilter(searchParams.get("destacado")),
      page: parsePageValue(searchParams.get("page")),
    }),
    [searchParams],
  );

  const [searchInput, setSearchInput] = useState(requestedFilters.nombre);
  const [searchTerm, setSearchTerm] = useState(requestedFilters.nombre);
  const [selectedMarca, setSelectedMarca] = useState<number | "">(requestedFilters.marca);
  const [selectedCategoria, setSelectedCategoria] = useState<number | "">(
    requestedFilters.categoria,
  );
  const [nuevoOnly, setNuevoOnly] = useState<"" | 1>(requestedFilters.nuevo);
  const [destacadoOnly, setDestacadoOnly] = useState<"" | 1>(requestedFilters.destacado);
  const [currentPage, setCurrentPage] = useState(requestedFilters.page);

  const [paginationData, setPaginationData] = useState<ProductosPaginationData | null>(null);
  const [brandOptions, setBrandOptions] = useState<FilterOption[]>([]);
  const [categoryOptions, setCategoryOptions] = useState<FilterOption[]>([]);

  const [isLoadingFilters, setIsLoadingFilters] = useState(true);
  const [isLoadingProducts, setIsLoadingProducts] = useState(true);
  const [hasFilterError, setHasFilterError] = useState(false);
  const [hasProductsError, setHasProductsError] = useState(false);

  useEffect(() => {
    setSearchInput(requestedFilters.nombre);
    setSearchTerm(requestedFilters.nombre);
    setSelectedMarca(requestedFilters.marca);
    setSelectedCategoria(requestedFilters.categoria);
    setNuevoOnly(requestedFilters.nuevo);
    setDestacadoOnly(requestedFilters.destacado);
    setCurrentPage(requestedFilters.page);
  }, [requestedFilters]);

  useEffect(() => {
    let isCancelled = false;

    const loadFilterOptions = async () => {
      setIsLoadingFilters(true);
      setHasFilterError(false);

      try {
        const [marcas, categorias] = await Promise.all([
          getAllMarcaOptions(),
          getCategorias().catch(() => []),
        ]);

        if (isCancelled) return;

        setBrandOptions(marcas);
        setCategoryOptions(normalizeCategoriaOptions(categorias));
      } catch {
        if (!isCancelled) {
          setBrandOptions([]);
          setCategoryOptions([]);
          setHasFilterError(true);
        }
      } finally {
        if (!isCancelled) {
          setIsLoadingFilters(false);
        }
      }
    };

    void loadFilterOptions();

    return () => {
      isCancelled = true;
    };
  }, []);

  useEffect(() => {
    let isCancelled = false;
    const controller = new AbortController();

    const loadProductos = async () => {
      setIsLoadingProducts(true);
      setHasProductsError(false);

      try {
        const response = await searchProductos({
          page: currentPage,
          per_page: 12,
          q: searchTerm || undefined,
          marca: selectedMarca || undefined,
          categoria: selectedCategoria || undefined,
          nuevo: nuevoOnly ? "si" : undefined,
          destacado: destacadoOnly ? "si" : undefined,
        }, {
          signal: controller.signal,
        });

        if (isCancelled) return;

        setPaginationData({
          ...response,
          data: filterActiveProducts(response.data),
        });
      } catch {
        if (!isCancelled) {
          setPaginationData(null);
          setHasProductsError(true);
        }
      } finally {
        if (!isCancelled) {
          setIsLoadingProducts(false);
        }
      }
    };

    void loadProductos();

    return () => {
      isCancelled = true;
      controller.abort();
    };
  }, [currentPage, destacadoOnly, nuevoOnly, searchTerm, selectedCategoria, selectedMarca]);

  const productBrandOptions = useMemo(
    () => extractUniqueBrands(paginationData?.data ?? []),
    [paginationData?.data],
  );
  const productCategoryOptions = useMemo(
    () => extractUniqueCategorias(paginationData?.data ?? []),
    [paginationData?.data],
  );

  const mergedBrandOptions = useMemo(
    () => mergeUniqueOptions(brandOptions, productBrandOptions),
    [brandOptions, productBrandOptions],
  );
  const mergedCategoryOptions = useMemo(
    () => mergeUniqueOptions(categoryOptions, productCategoryOptions),
    [categoryOptions, productCategoryOptions],
  );

  const visibleProducts = useMemo(() => paginationData?.data ?? [], [paginationData?.data]);
  const isEmpty = !isLoadingProducts && !hasProductsError && visibleProducts.length === 0;

  const updateUrl = (filters: CatalogoFilters) => {
    const query = buildProductosQuery(filters);
    router.replace(query ? `${pathname}?${query}` : pathname, { scroll: false });
  };

  const currentFilters: CatalogoFilters = {
    nombre: searchTerm,
    marca: selectedMarca,
    categoria: selectedCategoria,
    nuevo: nuevoOnly,
    destacado: destacadoOnly,
    page: currentPage,
  };

  const setFiltersAndUrl = (next: Partial<CatalogoFilters>) => {
    const merged: CatalogoFilters = {
      ...currentFilters,
      ...next,
    };

    if (typeof next.nombre === "string") {
      setSearchTerm(next.nombre);
      setSearchInput(next.nombre);
    }

    if (next.marca !== undefined) {
      setSelectedMarca(next.marca);
    }

    if (next.categoria !== undefined) {
      setSelectedCategoria(next.categoria);
    }

    if (next.nuevo !== undefined) {
      setNuevoOnly(next.nuevo);
    }

    if (next.destacado !== undefined) {
      setDestacadoOnly(next.destacado);
    }

    if (next.page !== undefined) {
      setCurrentPage(next.page);
    }

    updateUrl(merged);
  };

  const handleSearchSubmit = (query: string) => {
    const normalized = query.trim();
    setSearchInput(normalized);
    setSearchTerm(normalized);
    setCurrentPage(1);

    updateUrl({
      ...currentFilters,
      nombre: normalized,
      page: 1,
    });
  };

  const handleSearchSuggestionSelect = (item: SearchSuggestionItem) => {
    if (!item.slug) return;
    router.push(`/producto/${item.slug}`);
  };

  const handleBrandToggle = (id: number) => {
    const next = selectedMarca === id ? "" : id;
    setFiltersAndUrl({ marca: next, page: 1 });
  };

  const handleCategoryToggle = (id: number) => {
    const next = selectedCategoria === id ? "" : id;
    setFiltersAndUrl({ categoria: next, page: 1 });
  };

  const handleTabClick = (categoria: number | "") => {
    setFiltersAndUrl({ categoria, page: 1 });
  };

  const handlePageChange = (page: number) => {
    if (page === currentPage) return;
    setFiltersAndUrl({ page });
  };

  const categoryTabs = useMemo(() => {
    if (!selectedCategoria) return mergedCategoryOptions;

    if (mergedCategoryOptions.some((item) => item.id === selectedCategoria)) {
      return mergedCategoryOptions;
    }

    return [
      { id: selectedCategoria, nombre: `Categoría ${selectedCategoria}` },
      ...mergedCategoryOptions,
    ];
  }, [mergedCategoryOptions, selectedCategoria]);

  return (
    <div className="relative min-h-screen overflow-hidden bg-[var(--dima-page)]">
      <div className="pointer-events-none absolute inset-x-0 top-[80px] h-[420px] bg-[radial-gradient(circle_at_16%_10%,rgba(125,167,255,0.3),transparent_28%),radial-gradient(circle_at_85%_24%,rgba(37,76,169,0.16),transparent_26%)]" />
      <div className="pointer-events-none absolute inset-x-0 bottom-[80px] h-[420px] bg-[radial-gradient(circle_at_76%_42%,rgba(125,167,255,0.22),transparent_24%),radial-gradient(circle_at_18%_74%,rgba(37,76,169,0.12),transparent_26%)]" />

      <section className="relative z-10 pt-7 pb-20 sm:pt-8">
        <div className="mx-auto w-full max-w-[1600px] px-5 sm:px-8 lg:px-10">
          <Breadcrumbs
            className="mb-5"
            items={[
              { label: "Inicio", href: "/" },
              { label: "Catálogo" },
            ]}
          />

          <div className="grid grid-cols-1 gap-6 lg:grid-cols-[280px_minmax(0,1fr)]">
            <aside className="overflow-hidden rounded-[34px] border border-[var(--dima-line)] bg-white shadow-[var(--dima-shadow)]">
              <div className="bg-[linear-gradient(135deg,var(--dima-primary)_0%,var(--dima-primary-strong)_100%)] px-5 py-4 text-center text-[13px] font-bold uppercase tracking-[0.16em] text-white">
                Filtros inteligentes
              </div>

              <div className="space-y-4 p-4 sm:p-5">
                <SmartSearchBar
                  value={searchInput}
                  onValueChange={setSearchInput}
                  onSubmit={handleSearchSubmit}
                  onSuggestionSelect={handleSearchSuggestionSelect}
                  placeholder="Buscar producto"
                  ariaLabel="Buscar producto"
                  disabled={isLoadingProducts}
                  suggestionFilters={{
                    marca: selectedMarca || undefined,
                    categoria: selectedCategoria || undefined,
                  }}
                  formClassName="relative flex items-center"
                  inputClassName="h-11 w-full rounded-full border border-[var(--dima-line)] bg-[var(--dima-surface-soft)] px-4 pr-10 text-[13px] text-[var(--dima-ink)] placeholder:text-[var(--dima-ink-soft)] outline-none transition focus:border-[var(--dima-primary)] focus:bg-white"
                  buttonClassName="absolute right-2 top-1/2 inline-flex h-7 w-7 -translate-y-1/2 items-center justify-center rounded-full text-[var(--dima-primary)] transition hover:bg-[rgba(37,76,169,0.08)] disabled:opacity-50"
                  dropdownClassName="top-full mt-2"
                />

                <div className="space-y-2 rounded-[24px] border border-[var(--dima-line)] bg-[var(--dima-surface-soft)] p-4">
                  <button
                    type="button"
                    className="flex w-full items-center justify-between text-left text-[13px] font-bold uppercase tracking-[0.08em] text-[var(--dima-ink)]"
                  >
                    <span>Marca</span>
                    <ChevronIcon className="h-4 w-4 text-[var(--dima-primary)]" />
                  </button>

                  <div className="max-h-[130px] space-y-1.5 overflow-y-auto pr-1">
                    {isLoadingFilters
                      ? Array.from({ length: 4 }).map((_, index) => (
                          <div
                            key={`brand-filter-loading-${index}`}
                            className="h-4 animate-pulse rounded bg-slate-200"
                          />
                        ))
                      : mergedBrandOptions.map((brand) => (
                          <OptionCheckboxItem
                            key={brand.id}
                            name={brand.nombre}
                            checked={selectedMarca === brand.id}
                            onChange={() => handleBrandToggle(brand.id)}
                          />
                        ))}
                  </div>
                </div>

                <div className="space-y-2 rounded-[24px] border border-[var(--dima-line)] bg-[var(--dima-surface-soft)] p-4">
                  <button
                    type="button"
                    className="flex w-full items-center justify-between text-left text-[13px] font-bold uppercase tracking-[0.08em] text-[var(--dima-ink)]"
                  >
                    <span>Categoría</span>
                    <ChevronIcon className="h-4 w-4 text-[var(--dima-primary)]" />
                  </button>

                  <div className="max-h-[130px] space-y-1.5 overflow-y-auto pr-1">
                    {isLoadingFilters
                      ? Array.from({ length: 4 }).map((_, index) => (
                          <div
                            key={`category-filter-loading-${index}`}
                            className="h-4 animate-pulse rounded bg-slate-200"
                          />
                        ))
                      : mergedCategoryOptions.map((category) => (
                          <OptionCheckboxItem
                            key={category.id}
                            name={category.nombre}
                            checked={selectedCategoria === category.id}
                            onChange={() => handleCategoryToggle(category.id)}
                          />
                        ))}
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => setFiltersAndUrl({ nuevo: nuevoOnly ? "" : 1, page: 1 })}
                  className={`flex h-11 w-full items-center justify-center rounded-full border text-[12px] font-bold uppercase tracking-[0.08em] transition ${
                    nuevoOnly
                      ? "border-[var(--dima-accent)] bg-[var(--dima-accent)] text-white"
                      : "border-[var(--dima-line)] bg-white text-[var(--dima-ink-soft)] hover:border-[var(--dima-primary)] hover:text-[var(--dima-primary)]"
                  }`}
                >
                  Productos nuevos
                </button>

                <button
                  type="button"
                  onClick={() =>
                    setFiltersAndUrl({ destacado: destacadoOnly ? "" : 1, page: 1 })
                  }
                  className={`flex h-11 w-full items-center justify-center rounded-full border text-[12px] font-bold uppercase tracking-[0.08em] transition ${
                    destacadoOnly
                      ? "border-[var(--dima-primary)] bg-[var(--dima-primary)] text-white"
                      : "border-[var(--dima-line)] bg-white text-[var(--dima-ink-soft)] hover:border-[var(--dima-primary)] hover:text-[var(--dima-primary)]"
                  }`}
                >
                  Productos destacados
                </button>

                {hasFilterError ? (
                  <p className="text-center text-[12px] text-[#C94734]">
                    No se pudieron cargar todos los filtros.
                  </p>
                ) : null}
              </div>
            </aside>

            <div className="min-w-0">
              <div className="rounded-[30px] border border-[var(--dima-line)] bg-white/90 p-2 shadow-[0_12px_30px_rgba(20,49,116,0.12)] backdrop-blur-[2px]">
                <div className="flex gap-2 overflow-x-auto">
                  <button
                    type="button"
                    onClick={() => handleTabClick("")}
                    className={`shrink-0 rounded-full px-4 py-2.5 text-[12px] font-bold uppercase tracking-[0.1em] transition ${
                      !selectedCategoria
                        ? "bg-[var(--dima-primary)] text-white shadow-[0_12px_24px_rgba(32,68,148,0.2)]"
                        : "text-[var(--dima-ink-soft)] hover:bg-[var(--dima-surface-soft)]"
                    }`}
                  >
                    Todos
                  </button>

                  {categoryTabs.map((category) => (
                    <button
                      key={category.id}
                      type="button"
                      onClick={() => handleTabClick(category.id)}
                      className={`shrink-0 rounded-full px-4 py-2.5 text-[12px] font-bold uppercase tracking-[0.1em] transition ${
                        selectedCategoria === category.id
                          ? "bg-[var(--dima-accent)] text-white shadow-[0_12px_24px_rgba(40,196,79,0.18)]"
                          : "text-[var(--dima-ink-soft)] hover:bg-[var(--dima-surface-soft)]"
                      }`}
                    >
                      {category.nombre}
                    </button>
                  ))}
                </div>
              </div>

              <div className="mt-5">
                {hasProductsError ? (
                  <div className="rounded-[32px] border border-[var(--dima-line)] bg-white px-8 py-14 text-center shadow-[var(--dima-shadow)]">
                    <p className="text-lg text-[var(--dima-ink-soft)]">
                      No se pudieron cargar los productos del catálogo.
                    </p>
                  </div>
                ) : isLoadingProducts ? (
                  <div className="grid grid-cols-1 justify-items-center gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                    {Array.from({ length: 12 }).map((_, index) => (
                      <ProductCardSkeleton key={index} index={index} />
                    ))}
                  </div>
                ) : isEmpty ? (
                  <div className="rounded-[32px] border border-[var(--dima-line)] bg-white px-8 py-14 text-center shadow-[var(--dima-shadow)]">
                    <p className="text-lg text-[var(--dima-ink-soft)]">No se encontraron productos.</p>
                  </div>
                ) : (
                  <>
                    <div
                      id="catalogo-grid"
                      className="grid grid-cols-1 justify-items-center gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4"
                    >
                      {visibleProducts.map((product) => (
                        <BrandProductCard key={product.id} product={product} />
                      ))}
                    </div>

                    <MarcasPagination
                      links={paginationData?.links ?? []}
                      isLoading={isLoadingProducts}
                      onPageChange={handlePageChange}
                    />
                  </>
                )}
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}

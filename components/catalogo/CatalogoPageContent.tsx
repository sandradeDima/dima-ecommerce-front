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
import CatalogoHero from "./CatalogoHero";
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
    <label className="flex cursor-pointer items-center gap-2 text-[13px] text-[#5C6776]">
      <input
        type="checkbox"
        checked={checked}
        onChange={onChange}
        className="h-4 w-4 rounded border-slate-300 accent-[#F54029]"
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
    <div className="min-h-screen bg-[#E8E8E8]">
      <CatalogoHero />

      <section className="relative z-10 -mt-10 pb-16 md:-mt-12">
        <div className="mx-auto w-full max-w-[1500px] px-6 sm:px-8 lg:px-10">
          <Breadcrumbs
            className="mb-4"
            items={[
              { label: "Inicio", href: "/" },
              { label: "Catálogo" },
            ]}
          />

          <div className="grid grid-cols-1 gap-6 xl:grid-cols-[260px_minmax(0,1fr)]">
            <aside className="overflow-hidden rounded-[22px] bg-[#E2E5EA] shadow-[0_10px_26px_rgba(15,23,42,0.12)]">
              <div className="bg-[#5F6B76] px-4 py-3 text-center text-[13px] font-semibold uppercase tracking-[0.06em] text-white">
                Filtro
              </div>

              <div className="space-y-4 p-4">
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
                  inputClassName="h-9 w-full rounded-full border border-[#D4D9E1] bg-white px-3 pr-10 text-[13px] text-[#4E5968] placeholder:text-[#9AA3AE] outline-none transition focus:border-[#F54029]/60"
                  buttonClassName="absolute right-2 top-1/2 inline-flex h-6 w-6 -translate-y-1/2 items-center justify-center rounded-full text-[#F54029] transition hover:bg-[#F54029]/10 disabled:opacity-50"
                  dropdownClassName="top-full mt-2"
                />

                <div className="space-y-2 rounded-[14px] bg-[#EEF1F5] p-3">
                  <button
                    type="button"
                    className="flex w-full items-center justify-between text-left text-[13px] font-semibold text-[#5E6979]"
                  >
                    <span>Marca</span>
                    <ChevronIcon className="h-4 w-4 text-[#F54029]" />
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

                <div className="space-y-2 rounded-[14px] bg-[#EEF1F5] p-3">
                  <button
                    type="button"
                    className="flex w-full items-center justify-between text-left text-[13px] font-semibold text-[#5E6979]"
                  >
                    <span>Categoría</span>
                    <ChevronIcon className="h-4 w-4 text-[#F54029]" />
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
                  className={`flex h-9 w-full items-center justify-center rounded-full border text-[12px] font-medium transition ${
                    nuevoOnly
                      ? "border-[#F54029] bg-[#F54029] text-white"
                      : "border-[#AEB6C2] bg-white text-[#5B6676] hover:border-[#F54029] hover:text-[#F54029]"
                  }`}
                >
                  Productos nuevos
                </button>

                <button
                  type="button"
                  onClick={() =>
                    setFiltersAndUrl({ destacado: destacadoOnly ? "" : 1, page: 1 })
                  }
                  className={`flex h-9 w-full items-center justify-center rounded-full border text-[12px] font-medium transition ${
                    destacadoOnly
                      ? "border-[#F54029] bg-[#F54029] text-white"
                      : "border-[#AEB6C2] bg-white text-[#5B6676] hover:border-[#F54029] hover:text-[#F54029]"
                  }`}
                >
                  Productos destacados
                </button>

                {hasFilterError ? (
                  <p className="text-center text-[12px] text-[#D33E2B]">
                    No se pudieron cargar todos los filtros.
                  </p>
                ) : null}
              </div>
            </aside>

            <div className="min-w-0">
              <div className="rounded-[22px] bg-[#DDE1E7] p-2 shadow-[0_8px_20px_rgba(15,23,42,0.10)]">
                <div className="flex gap-2 overflow-x-auto">
                  <button
                    type="button"
                    onClick={() => handleTabClick("")}
                    className={`shrink-0 rounded-full px-4 py-2 text-[13px] font-medium transition ${
                      !selectedCategoria
                        ? "bg-white text-[#F54029]"
                        : "text-[#54606F] hover:bg-white/70"
                    }`}
                  >
                    Todos
                  </button>

                  {categoryTabs.map((category) => (
                    <button
                      key={category.id}
                      type="button"
                      onClick={() => handleTabClick(category.id)}
                      className={`shrink-0 rounded-full px-4 py-2 text-[13px] font-medium transition ${
                        selectedCategoria === category.id
                          ? "bg-white text-[#F54029]"
                          : "text-[#54606F] hover:bg-white/70"
                      }`}
                    >
                      {category.nombre}
                    </button>
                  ))}
                </div>
              </div>

              <div className="mt-5">
                {hasProductsError ? (
                  <div className="rounded-[22px] bg-white px-8 py-14 text-center shadow-[0_12px_30px_rgba(15,23,42,0.12)]">
                    <p className="text-lg text-[#5D6673]">
                      No se pudieron cargar los productos del catálogo.
                    </p>
                  </div>
                ) : isLoadingProducts ? (
                  <div className="grid grid-cols-1 justify-items-center gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                    {Array.from({ length: 12 }).map((_, index) => (
                      <ProductCardSkeleton key={index} index={index} />
                    ))}
                  </div>
                ) : isEmpty ? (
                  <div className="rounded-[22px] bg-white px-8 py-14 text-center shadow-[0_12px_30px_rgba(15,23,42,0.12)]">
                    <p className="text-lg text-[#5D6673]">No se encontraron productos.</p>
                  </div>
                ) : (
                  <>
                    <div className="grid grid-cols-1 justify-items-center gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
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

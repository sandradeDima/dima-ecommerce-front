import { ProductosPaginationData, requestPublicApi } from "./publicApi";

export type SearchSuggestionsQuery = {
  q: string;
  limit?: number;
  marca?: number;
  marca_slug?: string;
  categoria?: number;
};

export type SearchProductosQuery = {
  q?: string;
  nombre?: string;
  page?: number;
  per_page?: number;
  marca?: number | string;
  marca_slug?: string;
  categoria?: number | string;
  nuevo?: "si" | "no";
  destacado?: "si" | "no";
  sort?: "relevance" | "name_asc" | "name_desc";
};

export type SearchSuggestionItem = {
  id: number;
  nombre: string;
  slug: string;
  sku?: string | null;
  sku_dmc?: string | null;
  marca_nombre?: string | null;
  categoria_nombre?: string | null;
  imagen_principal?: string | null;
  title_imagen?: string | null;
  alt_imagen?: string | null;
};

export type SearchSuggestionsResponse = {
  query: string;
  items: SearchSuggestionItem[];
};

type ApiRequestOptions = {
  signal?: AbortSignal;
};

export async function getSearchSuggestions(
  query: SearchSuggestionsQuery,
  options?: ApiRequestOptions,
) {
  return requestPublicApi<SearchSuggestionsResponse>("/search/suggestions", {
    query,
    signal: options?.signal,
  });
}

export async function searchProductos(
  query?: SearchProductosQuery,
  options?: ApiRequestOptions,
) {
  return requestPublicApi<ProductosPaginationData>("/search/productos", {
    query,
    signal: options?.signal,
  });
}


"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import {
  getSearchSuggestions,
  SearchSuggestionItem,
  SearchSuggestionsQuery,
} from "@/lib/api/searchApi";

type UseSearchSuggestionsParams = {
  query: string;
  enabled?: boolean;
  debounceMs?: number;
  minChars?: number;
  limit?: number;
  filters?: {
    marca?: number;
    marca_slug?: string;
    categoria?: number;
  };
};

type UseSearchSuggestionsResult = {
  items: SearchSuggestionItem[];
  isLoading: boolean;
  errorMessage: string | null;
  hasQuery: boolean;
};

export function useSearchSuggestions({
  query,
  enabled = true,
  debounceMs = 280,
  minChars = 2,
  limit,
  filters,
}: UseSearchSuggestionsParams): UseSearchSuggestionsResult {
  const [items, setItems] = useState<SearchSuggestionItem[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const requestIdRef = useRef(0);

  const normalizedQuery = useMemo(() => query.trim(), [query]);
  const hasQuery = normalizedQuery.length >= minChars;

  useEffect(() => {
    if (!enabled || !hasQuery) {
      setItems([]);
      setIsLoading(false);
      setErrorMessage(null);
      return;
    }

    const controller = new AbortController();
    const requestId = ++requestIdRef.current;

    const timer = setTimeout(async () => {
      setIsLoading(true);
      setErrorMessage(null);

      try {
        const payload: SearchSuggestionsQuery = {
          q: normalizedQuery,
          limit,
          marca: filters?.marca,
          marca_slug: filters?.marca_slug,
          categoria: filters?.categoria,
        };

        const response = await getSearchSuggestions(payload, {
          signal: controller.signal,
        });

        if (requestId !== requestIdRef.current) return;
        setItems(response.items ?? []);
      } catch {
        if (controller.signal.aborted || requestId !== requestIdRef.current) {
          return;
        }

        setItems([]);
        setErrorMessage("No se pudieron cargar las sugerencias.");
      } finally {
        if (!controller.signal.aborted && requestId === requestIdRef.current) {
          setIsLoading(false);
        }
      }
    }, debounceMs);

    return () => {
      controller.abort();
      clearTimeout(timer);
    };
  }, [
    debounceMs,
    enabled,
    filters?.categoria,
    filters?.marca,
    filters?.marca_slug,
    hasQuery,
    limit,
    normalizedQuery,
  ]);

  return {
    items,
    isLoading,
    errorMessage,
    hasQuery,
  };
}

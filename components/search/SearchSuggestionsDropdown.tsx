"use client";

/* eslint-disable @next/next/no-img-element */
import { SearchSuggestionItem, toPublicStorageUrl } from "@/lib/api";

type SearchSuggestionsDropdownProps = {
  isOpen: boolean;
  items: SearchSuggestionItem[];
  highlightedIndex: number;
  isLoading: boolean;
  errorMessage: string | null;
  hasQuery: boolean;
  className?: string;
  onHoverIndex: (index: number) => void;
  onSelectItem: (item: SearchSuggestionItem) => void;
};

function ItemImage({ item }: { item: SearchSuggestionItem }) {
  const imageUrl = toPublicStorageUrl(item.imagen_principal ?? null);

  if (!imageUrl) {
    return (
      <div className="flex h-10 w-10 items-center justify-center rounded-md bg-slate-200 text-[10px] text-slate-500">
        N/A
      </div>
    );
  }

  return (
    <img
      src={imageUrl}
      alt={item.alt_imagen?.trim() || item.nombre}
      title={item.title_imagen?.trim() || item.nombre}
      className="h-10 w-10 rounded-md object-cover"
      loading="lazy"
    />
  );
}

export default function SearchSuggestionsDropdown({
  isOpen,
  items,
  highlightedIndex,
  isLoading,
  errorMessage,
  hasQuery,
  className = "",
  onHoverIndex,
  onSelectItem,
}: SearchSuggestionsDropdownProps) {
  if (!isOpen) return null;

  return (
    <div
      className={`absolute left-0 right-0 z-40 max-h-[340px] overflow-y-auto rounded-2xl border border-slate-200 bg-white p-2 shadow-[0_16px_35px_rgba(15,23,42,0.18)] ${className}`}
      role="listbox"
      aria-label="Sugerencias de búsqueda"
    >
      {isLoading ? (
        <p className="px-3 py-2 text-sm text-slate-500">Buscando sugerencias...</p>
      ) : errorMessage ? (
        <p className="px-3 py-2 text-sm text-rose-600">{errorMessage}</p>
      ) : items.length === 0 && hasQuery ? (
        <p className="px-3 py-2 text-sm text-slate-500">No se encontraron sugerencias.</p>
      ) : (
        items.map((item, index) => {
          const isActive = index === highlightedIndex;
          const secondaryLine = [item.marca_nombre, item.sku || item.sku_dmc]
            .filter(Boolean)
            .join(" • ");

          return (
            <button
              key={`${item.id}-${item.slug}-${index}`}
              type="button"
              role="option"
              aria-selected={isActive}
              onMouseEnter={() => onHoverIndex(index)}
              onMouseDown={(event) => {
                event.preventDefault();
                onSelectItem(item);
              }}
              className={`flex w-full items-center gap-3 rounded-xl px-3 py-2 text-left transition ${
                isActive ? "bg-[#F54029]/10" : "hover:bg-slate-100"
              }`}
            >
              <ItemImage item={item} />
              <span className="min-w-0 flex-1">
                <span className="block truncate text-[13px] font-medium text-slate-800">
                  {item.nombre}
                </span>
                {secondaryLine ? (
                  <span className="block truncate text-[12px] text-slate-500">
                    {secondaryLine}
                  </span>
                ) : null}
              </span>
            </button>
          );
        })
      )}
    </div>
  );
}


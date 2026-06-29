"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { SearchSuggestionItem } from "@/lib/api";
import { useSearchSuggestions } from "@/hooks/useSearchSuggestions";
import SearchSuggestionsDropdown from "./SearchSuggestionsDropdown";

type SmartSearchBarProps = {
  value: string;
  onValueChange: (value: string) => void;
  onSubmit: (query: string) => void;
  onSuggestionSelect?: (item: SearchSuggestionItem) => void;
  placeholder?: string;
  ariaLabel?: string;
  disabled?: boolean;
  minSuggestionChars?: number;
  suggestionsLimit?: number;
  suggestionFilters?: {
    marca?: number;
    marca_slug?: string;
    categoria?: number;
  };
  className?: string;
  formClassName?: string;
  inputClassName?: string;
  buttonClassName?: string;
  dropdownClassName?: string;
};

function SearchIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" className="h-5 w-5">
      <circle cx="11" cy="11" r="6.5" fill="none" stroke="currentColor" strokeWidth="2" />
      <path
        d="m16 16 4.2 4.2"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
      />
    </svg>
  );
}

export default function SmartSearchBar({
  value,
  onValueChange,
  onSubmit,
  onSuggestionSelect,
  placeholder = "Buscar",
  ariaLabel = "Buscar",
  disabled = false,
  minSuggestionChars = 2,
  suggestionsLimit,
  suggestionFilters,
  className = "",
  formClassName = "",
  inputClassName = "",
  buttonClassName = "",
  dropdownClassName = "",
}: SmartSearchBarProps) {
  const rootRef = useRef<HTMLDivElement | null>(null);
  const [isOpen, setIsOpen] = useState(false);
  const [highlightedIndex, setHighlightedIndex] = useState(-1);

  const normalizedValue = useMemo(() => value.trim(), [value]);
  const {
    items,
    isLoading,
    errorMessage,
    hasQuery,
  } = useSearchSuggestions({
    query: value,
    enabled: !disabled,
    minChars: minSuggestionChars,
    limit: suggestionsLimit,
    filters: suggestionFilters,
  });

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (!rootRef.current) return;
      if (rootRef.current.contains(event.target as Node)) return;
      setIsOpen(false);
      setHighlightedIndex(-1);
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  useEffect(() => {
    if (!isOpen) {
      setHighlightedIndex(-1);
      return;
    }

    if (!items.length) {
      setHighlightedIndex(-1);
      return;
    }

    setHighlightedIndex((current) => {
      if (current >= items.length) return 0;
      return current;
    });
  }, [isOpen, items.length]);

  const submitValue = () => {
    const query = normalizedValue;
    onSubmit(query);
    setIsOpen(false);
    setHighlightedIndex(-1);
  };

  const selectSuggestion = (item: SearchSuggestionItem) => {
    onValueChange(item.nombre);
    setIsOpen(false);
    setHighlightedIndex(-1);

    if (onSuggestionSelect) {
      onSuggestionSelect(item);
      return;
    }

    onSubmit(item.nombre.trim());
  };

  const shouldRenderDropdown =
    isOpen && (isLoading || errorMessage !== null || hasQuery || items.length > 0);

  return (
    <div ref={rootRef} className={`relative ${className}`}>
      <form
        className={formClassName}
        onSubmit={(event) => {
          event.preventDefault();
          submitValue();
        }}
      >
        <input
          type="text"
          value={value}
          onChange={(event) => {
            onValueChange(event.target.value);
            setIsOpen(true);
          }}
          onFocus={() => {
            if (!disabled) {
              setIsOpen(true);
            }
          }}
          onKeyDown={(event) => {
            if (!shouldRenderDropdown || items.length === 0) {
              if (event.key === "Escape") {
                setIsOpen(false);
              }
              return;
            }

            if (event.key === "ArrowDown") {
              event.preventDefault();
              setIsOpen(true);
              setHighlightedIndex((current) =>
                current >= items.length - 1 ? 0 : current + 1,
              );
              return;
            }

            if (event.key === "ArrowUp") {
              event.preventDefault();
              setIsOpen(true);
              setHighlightedIndex((current) =>
                current <= 0 ? items.length - 1 : current - 1,
              );
              return;
            }

            if (event.key === "Enter" && highlightedIndex >= 0) {
              event.preventDefault();
              const activeItem = items[highlightedIndex];
              if (activeItem) {
                selectSuggestion(activeItem);
              }
              return;
            }

            if (event.key === "Escape") {
              event.preventDefault();
              setIsOpen(false);
              setHighlightedIndex(-1);
            }
          }}
          placeholder={placeholder}
          className={inputClassName}
          aria-label={ariaLabel}
          disabled={disabled}
        />

        <button
          type="submit"
          aria-label={ariaLabel}
          className={buttonClassName}
          disabled={disabled}
        >
          <SearchIcon />
        </button>
      </form>

      <SearchSuggestionsDropdown
        isOpen={shouldRenderDropdown}
        items={items}
        highlightedIndex={highlightedIndex}
        isLoading={isLoading}
        errorMessage={errorMessage}
        hasQuery={hasQuery}
        className={dropdownClassName}
        onHoverIndex={setHighlightedIndex}
        onSelectItem={selectSuggestion}
      />
    </div>
  );
}


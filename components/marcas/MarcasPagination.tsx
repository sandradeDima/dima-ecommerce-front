"use client";

import { PaginationLink } from "@/lib/api";
import {
  normalizePaginationLabel,
  resolvePageFromLink,
} from "./marcasUtils";

type MarcasPaginationProps = {
  links: PaginationLink[];
  isLoading?: boolean;
  onPageChange: (page: number) => void;
};

export default function MarcasPagination({
  links,
  isLoading = false,
  onPageChange,
}: MarcasPaginationProps) {
  if (!links || links.length === 0) return null;

  return (
    <nav aria-label="Paginación de marcas" className="mt-10 flex justify-center">
      <ul className="flex flex-wrap items-center justify-center gap-2 rounded-full border border-[var(--dima-line)] bg-white/90 px-3 py-2 shadow-[0_12px_26px_rgba(20,49,116,0.12)] backdrop-blur-[2px]">
        {links.map((link, index) => {
          const label = normalizePaginationLabel(link.label);
          const page = resolvePageFromLink(link.url, link.page);
          const isDisabled = isLoading || link.url === null || page === null;
          const isPageNumber = typeof page === "number" && /^\d+$/.test(label);

          return (
            <li key={`${label}-${link.page ?? index}`}>
              <button
                type="button"
                disabled={isDisabled}
                onClick={() => {
                  if (!page) return;
                  onPageChange(page);
                }}
                className={`inline-flex h-10 min-w-10 items-center justify-center rounded-full px-3 text-sm font-bold transition ${
                  link.active
                    ? "bg-[var(--dima-primary)] text-white shadow-[0_10px_20px_rgba(32,68,148,0.2)]"
                    : "text-[var(--dima-ink-soft)] hover:bg-[var(--dima-surface-soft)] hover:text-[var(--dima-primary)]"
                } ${isDisabled ? "cursor-not-allowed opacity-45" : ""}`}
              >
                {isPageNumber ? page : label}
              </button>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}

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
      <ul className="flex flex-wrap items-center justify-center gap-2">
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
                className={`inline-flex h-9 min-w-9 items-center justify-center rounded-full px-3 text-sm transition ${
                  link.active
                    ? "bg-[#F54029] text-white"
                    : "text-[#6F7681] hover:bg-white hover:text-[#4F5965]"
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

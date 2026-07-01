"use client";

import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import CartIconButton from "@/components/cart/CartIconButton";
import SmartSearchBar from "@/components/search/SmartSearchBar";
import type { SearchSuggestionItem } from "@/lib/api";

type TopMenuBarProps = {
  className?: string;
};

export default function TopMenuBar({ className = "" }: TopMenuBarProps) {
  const router = useRouter();
  const [searchValue, setSearchValue] = useState("");

  const handleSearchSubmit = (query: string) => {
    const normalized = query.trim();
    const params = new URLSearchParams();

    if (normalized) {
      params.set("q", normalized);
    }

    router.push(params.toString() ? `/catalogo?${params.toString()}` : "/catalogo");
  };

  const handleSearchSuggestionSelect = (item: SearchSuggestionItem) => {
    if (!item.slug) return;
    router.push(`/producto/${item.slug}`);
  };

  return (
    <header
      className={`sticky top-0 z-50 overflow-hidden border-b border-white/12 bg-[linear-gradient(135deg,#17377f_0%,#234aa8_55%,#1c4cae_100%)] text-white shadow-[0_18px_42px_rgba(16,39,88,0.26)] ${className}`}
    >
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(125,167,255,0.26),transparent_26%),radial-gradient(circle_at_top_right,rgba(255,255,255,0.1),transparent_22%),linear-gradient(180deg,rgba(255,255,255,0.08),transparent_55%)]" />

      <div className="relative mx-auto max-w-[1680px] px-4 sm:px-6 lg:px-8">
        <div className="grid gap-4 py-4 sm:py-5 lg:grid-cols-[minmax(0,1fr)_auto_minmax(0,1fr)] lg:items-center lg:gap-6">
          <div className="hidden min-w-0 lg:flex lg:justify-self-start">
            <Link
              href="/"
              className="inline-flex min-h-[44px] items-center rounded-full border border-white/35 bg-white/6 px-4 text-[12px] font-semibold tracking-[0.06em] text-white/95 transition hover:bg-white/12"
            >
              Centro de asistencia técnica
            </Link>
          </div>

          <div className="flex items-center justify-center gap-4">
            <Link
              href="/"
              className="relative block h-[62px] w-[210px] shrink-0 sm:h-[72px] sm:w-[240px] lg:h-[86px] lg:w-[260px] xl:h-[96px] xl:w-[300px]"
              aria-label="Dima inicio"
            >
              <Image
                src="/assets/logo_dima.png"
                alt="Dima"
                fill
                priority
                className="object-contain brightness-0 invert"
              />
            </Link>
          </div>

          <div className="hidden min-w-0 items-center justify-end gap-2 lg:flex xl:gap-3">
            <SmartSearchBar
              value={searchValue}
              onValueChange={setSearchValue}
              onSubmit={handleSearchSubmit}
              onSuggestionSelect={handleSearchSuggestionSelect}
              placeholder="Buscar productos"
              ariaLabel="Buscar productos"
              className="w-full max-w-[260px] xl:max-w-[320px]"
              formClassName="relative flex items-center"
              inputClassName="h-12 w-full rounded-full border border-white/35 bg-[rgba(255,255,255,0.08)] px-4 pr-11 text-sm text-white placeholder:text-white/72 outline-none transition focus:border-white/70 focus:bg-white/14"
              buttonClassName="absolute right-2 top-1/2 inline-flex h-8 w-8 -translate-y-1/2 items-center justify-center rounded-full text-white transition hover:bg-white/12"
              dropdownClassName="top-full mt-3"
            />

            <CartIconButton />
          </div>

          <div className="flex items-center gap-3 lg:hidden">
            <div className="min-w-0 flex-1">
              <SmartSearchBar
                value={searchValue}
                onValueChange={setSearchValue}
                onSubmit={handleSearchSubmit}
                onSuggestionSelect={handleSearchSuggestionSelect}
                placeholder="Buscar productos"
                ariaLabel="Buscar productos"
                formClassName="relative flex items-center"
                inputClassName="h-12 w-full rounded-full border border-white/28 bg-white/10 px-4 pr-12 text-sm text-white placeholder:text-white/72 outline-none transition focus:border-white/60"
                buttonClassName="absolute right-2 top-1/2 inline-flex h-8 w-8 -translate-y-1/2 items-center justify-center rounded-full text-white transition hover:bg-white/12"
                dropdownClassName="top-full mt-3"
              />
            </div>
            <CartIconButton className="shrink-0" />
          </div>
        </div>
      </div>
    </header>
  );
}

"use client";

import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { getPageTypeFromPath } from "@/lib/analytics/ga4";

const menuItems = [
  { label: "Inicio", href: "/" },
  { label: "Catálogo", href: "/catalogo" },
];

type TopMenuBarProps = {
  className?: string;
};

export default function TopMenuBar({ className = "" }: TopMenuBarProps) {
  const pathname = usePathname();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const pageType = getPageTypeFromPath(pathname ?? "/");

  useEffect(() => {
    if (!isMobileMenuOpen) {
      document.body.style.overflow = "";
      return;
    }

    document.body.style.overflow = "hidden";

    return () => {
      document.body.style.overflow = "";
    };
  }, [isMobileMenuOpen]);

  const isActiveRoute = (href: string) =>
    href === "/"
      ? pathname === "/"
      : pathname === href || pathname.startsWith(`${href}/`);



  return (
    <header
      className={`sticky top-0 z-50 h-[85px] w-full border-b border-white/20 bg-[rgba(92,104,115,0.68)] backdrop-blur-sm ${className}`}
    >
      <div className="mx-auto flex h-full w-full max-w-[1920px] items-center justify-between gap-6 px-6 lg:px-10">
        <Link
          href="/"
          className="relative block h-[55px] w-[134px] shrink-0"
          aria-label="DMC inicio"
        >
          <Image
            src="/assets/logo_dima.png"
            alt="DMC"
            fill
            priority
            className="object-contain object-left"
          />
        </Link>

        <button
          type="button"
          onClick={() => setIsMobileMenuOpen((current) => !current)}
          className="inline-flex h-10 w-10 items-center justify-center rounded-full text-white transition hover:bg-white/15 md:hidden"
          aria-label={isMobileMenuOpen ? "Cerrar menú" : "Abrir menú"}
          aria-expanded={isMobileMenuOpen}
          aria-controls="mobile-main-menu"
        >
          <span className="relative h-4 w-5">
            <span
              className={`absolute left-0 top-0 h-0.5 w-5 rounded-full bg-white transition-all duration-200 ${isMobileMenuOpen ? "translate-y-[7px] rotate-45" : ""
                }`}
            />
            <span
              className={`absolute left-0 top-[7px] h-0.5 w-5 rounded-full bg-white transition-opacity duration-200 ${isMobileMenuOpen ? "opacity-0" : "opacity-100"
                }`}
            />
            <span
              className={`absolute left-0 top-[14px] h-0.5 w-5 rounded-full bg-white transition-all duration-200 ${isMobileMenuOpen ? "-translate-y-[7px] -rotate-45" : ""
                }`}
            />
          </span>
        </button>

        <nav className="hidden md:block" aria-label="Navegación principal">
          <ul className="flex min-w-max items-center gap-3 text-[16px] font-semibold text-white/95 lg:gap-6">
            {menuItems.map((item) => (
              <li key={item.href}>
                <Link
                  href={item.href}
                  aria-current={isActiveRoute(item.href) ? "page" : undefined}
                  className={`whitespace-nowrap transition-colors duration-200 hover:text-white hover:underline hover:underline-offset-4 ${isActiveRoute(item.href)
                    ? "text-white underline underline-offset-4"
                    : ""
                    }`}
                >
                  {item.label}
                </Link>
              </li>
            ))}
          </ul>
        </nav>
      </div>

      {isMobileMenuOpen ? (
        <>
          <button
            type="button"
            aria-label="Cerrar menú"
            onClick={() => setIsMobileMenuOpen(false)}
            className="fixed inset-0 top-[85px] z-40 bg-black/35 backdrop-blur-[1px] md:hidden"
          />

          <nav
            id="mobile-main-menu"
            aria-label="Navegación principal móvil"
            className="absolute inset-x-0 top-full z-50 border-b border-white/20 bg-[rgba(92,104,115,0.96)] px-6 py-4 shadow-[0_10px_30px_rgba(15,23,42,0.35)] backdrop-blur-sm md:hidden"
          >
            <ul className="space-y-1">
              {menuItems.map((item) => (
                <li key={item.href}>
                  <Link
                    href={item.href}
                    onClick={() => setIsMobileMenuOpen(false)}
                    aria-current={isActiveRoute(item.href) ? "page" : undefined}
                    className={`block rounded-xl px-3 py-2 text-[16px] font-semibold text-white/95 transition ${isActiveRoute(item.href)
                      ? "bg-white/15 text-white underline underline-offset-4"
                      : "hover:bg-white/10 hover:text-white"
                      }`}
                  >
                    {item.label}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>
        </>
      ) : null}
    </header>
  );
}

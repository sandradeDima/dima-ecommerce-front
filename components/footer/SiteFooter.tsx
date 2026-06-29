"use client";

import Image from "next/image";
import { useEffect, useState } from "react";
import {
  getInformacion,
  InformacionItem,
  InformacionResponse,
  RedSocialItem,
} from "@/lib/api";
import FloatingActionButtons from "./FloatingActionButtons";
import FooterContactInfo from "./FooterContactInfo";
import FooterLinksColumn, { FooterLinkItem } from "./FooterLinksColumn";

function HomeIcon({ className = "" }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" className={className}>
      <path
        d="M4 11.5 12 5l8 6.5V20a1 1 0 0 1-1 1h-5v-5h-4v5H5a1 1 0 0 1-1-1v-8.5Z"
        fill="currentColor"
      />
    </svg>
  );
}

function BookIcon({ className = "" }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" className={className}>
      <path
        d="M5 4h7a3 3 0 0 1 3 3v13H8a3 3 0 0 0-3 3V4Zm14 0h-4a3 3 0 0 0-3 3v13h7V4Z"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.9"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function ReceiptIcon({ className = "" }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" className={className}>
      <path
        d="M7 3h10a2 2 0 0 1 2 2v16l-2.5-1.4L14 21l-2.5-1.4L9 21l-2.5-1.4L4 21V5a2 2 0 0 1 2-2Z"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.9"
        strokeLinejoin="round"
      />
      <path
        d="M8 8h8M8 12h8M8 16h5"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.9"
        strokeLinecap="round"
      />
    </svg>
  );
}

function TagIcon({ className = "" }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" className={className}>
      <path
        d="M3 11.2V5.6A2.6 2.6 0 0 1 5.6 3h5.6l9 9-7.6 7.5-9.6-9.3Z"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.9"
        strokeLinejoin="round"
      />
      <circle cx="8.2" cy="8.2" r="1.3" fill="currentColor" />
    </svg>
  );
}

function SupportIcon({ className = "" }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" className={className}>
      <path
        d="M4 13v3a2 2 0 0 0 2 2h2v-7H6a2 2 0 0 0-2 2Zm16 0v3a2 2 0 0 1-2 2h-2v-7h2a2 2 0 0 1 2 2Z"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M4 13a8 8 0 1 1 16 0"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
      />
    </svg>
  );
}

function GraduationCapIcon({ className = "" }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" className={className}>
      <path
        d="m2 9.5 10-5 10 5-10 5-10-5Z"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinejoin="round"
      />
      <path
        d="M6.5 11.6v4.1c0 1.4 2.5 2.8 5.5 2.8s5.5-1.4 5.5-2.8v-4.1"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function RssIcon({ className = "" }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" className={className}>
      <circle cx="6.2" cy="17.8" r="2.2" fill="currentColor" />
      <path
        d="M4 10.5a9.5 9.5 0 0 1 9.5 9.5M4 5a15 15 0 0 1 15 15"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.9"
        strokeLinecap="round"
      />
    </svg>
  );
}

const footerLinksLeft: FooterLinkItem[] = [
  { label: "Inicio", href: "/", icon: <HomeIcon className="h-[19px] w-[19px]" /> },
  {
    label: "Catálogo",
    href: "/catalogo",
    icon: <BookIcon className="h-[19px] w-[19px]" />,
  },
  {
    label: "Cotizar",
    href: "/cotizar",
    icon: <ReceiptIcon className="h-[19px] w-[19px]" />,
    analyticsSourceSection: "footer_nav",
  },
];

const footerLinksRight: FooterLinkItem[] = [
  { label: "Marcas", href: "/marcas", icon: <TagIcon className="h-[19px] w-[19px]" /> },
  {
    label: "Soporte",
    href: "/soporte",
    icon: <SupportIcon className="h-[19px] w-[19px]" />,
  },
  /* {
    label: "Academia DMC",
    href: "/academia",
    icon: <GraduationCapIcon className="h-[19px] w-[19px]" />,
  }, */
  { label: "Blog", href: "/blog", icon: <RssIcon className="h-[19px] w-[19px]" /> },
];

function FooterSkeleton() {
  return (
    <div className="grid gap-8 lg:grid-cols-[minmax(0,0.9fr)_minmax(0,1.1fr)_minmax(0,1fr)] lg:items-start">
      <div className="flex items-center justify-center lg:justify-start lg:pr-10">
        <div className="h-[68px] w-[180px] animate-pulse rounded-lg bg-white/20" />
      </div>

      <div className="grid gap-6 border-y border-white/20 py-6 sm:grid-cols-2 lg:border-y-0 lg:border-x lg:px-10 lg:py-0">
        <div>
          <div className="h-8 w-32 animate-pulse rounded-md bg-white/20" />
          <div className="mt-4 space-y-3">
            {Array.from({ length: 3 }).map((_, index) => (
              <div
                key={`left-link-skeleton-${index}`}
                className="h-5 w-32 animate-pulse rounded-md bg-white/20"
              />
            ))}
          </div>
        </div>

        <div className="space-y-3 sm:pt-[48px] lg:pt-0">
          {Array.from({ length: 4 }).map((_, index) => (
            <div
              key={`right-link-skeleton-${index}`}
              className="h-5 w-32 animate-pulse rounded-md bg-white/20"
            />
          ))}
        </div>
      </div>

      <div className="space-y-3 text-center lg:pl-10 lg:text-left">
        {Array.from({ length: 4 }).map((_, index) => (
          <div
            key={`contact-row-skeleton-${index}`}
            className="mx-auto h-5 w-full max-w-[260px] animate-pulse rounded-md bg-white/20 lg:mx-0"
          />
        ))}
        <div className="mt-5 flex justify-center gap-3 lg:justify-start">
          {Array.from({ length: 4 }).map((_, index) => (
            <div
              key={`social-skeleton-${index}`}
              className="h-10 w-10 animate-pulse rounded-full bg-white/20"
            />
          ))}
        </div>
      </div>
    </div>
  );
}

function normalizeInformacionPayload(payload: InformacionResponse | null | undefined): {
  informacion: InformacionItem | null;
  redesSociales: RedSocialItem[];
} {
  return {
    informacion: payload?.Informacion ?? null,
    redesSociales: Array.isArray(payload?.redes_sociales)
      ? payload.redes_sociales
      : [],
  };
}

export default function SiteFooter() {
  const [informacion, setInformacion] = useState<InformacionItem | null>(null);
  const [redesSociales, setRedesSociales] = useState<RedSocialItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [hasError, setHasError] = useState(false);

  useEffect(() => {
    let isCancelled = false;

    const loadFooterData = async () => {
      setIsLoading(true);
      setHasError(false);

      try {
        const response = await getInformacion();
        if (isCancelled) return;

        const normalized = normalizeInformacionPayload(response);
        setInformacion(normalized.informacion);
        setRedesSociales(normalized.redesSociales);
      } catch {
        if (!isCancelled) {
          setInformacion(null);
          setRedesSociales([]);
          setHasError(true);
        }
      } finally {
        if (!isCancelled) {
          setIsLoading(false);
        }
      }
    };

    void loadFooterData();

    return () => {
      isCancelled = true;
    };
  }, []);

  return (
    <>
      <footer className="relative overflow-hidden bg-[#22252A]">
        <div className="absolute inset-0 bg-[#22252A]" />
        <div
          className="absolute inset-0 bg-cover bg-center bg-no-repeat opacity-45"
          style={{ backgroundImage: "url('/assets/static/footer_bg.png')" }}
        />

        <div className="relative mx-auto w-full max-w-[1700px] px-5 py-10 sm:px-8 sm:py-12 lg:px-20 lg:py-14 xl:px-24">
          {isLoading ? (
            <FooterSkeleton />
          ) : (
            <div className="grid gap-8 lg:grid-cols-[minmax(0,0.9fr)_minmax(0,1.1fr)_minmax(0,1fr)] lg:items-start">
              <div className="flex items-center justify-center lg:pr-10">
                {/*  <Image
                  src="/assets/logo-dmc-dark-v1.png"
                  alt="DMC"
                  width={330}
                  height={130}
                  className="h-auto w-[180px] sm:w-[220px] lg:w-[285px]"
                  priority={false}
                />   */}
              </div>

              <div className="grid gap-6 border-y border-white/20 py-6 sm:grid-cols-2 lg:border-y-0 lg:border-x lg:px-10 lg:py-0">
                <FooterLinksColumn title="Páginas:" links={footerLinksLeft} />
                <FooterLinksColumn links={footerLinksRight} className="sm:pt-[48px] lg:pt-0" />
              </div>

              <FooterContactInfo
                informacion={informacion}
                redesSociales={redesSociales}
                hasError={hasError}
                className="text-center lg:pl-10 lg:text-left"
              />
            </div>
          )}
        </div>

        <div className="absolute inset-x-0 bottom-0 h-[4px] bg-[#F54029]" />
      </footer>

      <FloatingActionButtons />
    </>
  );
}

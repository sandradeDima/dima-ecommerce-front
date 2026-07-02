"use client";

/* eslint-disable @next/next/no-img-element */
import isoBadge from "@/app/assets/iso-min.webp";
import Image from "next/image";
import Link from "next/link";
import { useEffect, useState } from "react";
import {
  getInformacion,
  getTopMarcas,
  InformacionItem,
  InformacionResponse,
  RedSocialItem,
  TopMarcaItem,
  toPublicStorageUrl,
} from "@/lib/api";
import FloatingActionButtons from "./FloatingActionButtons";

const MANAGED_SERVICES_URL =
  "https://dima.com.bo/subcategoria/servicios-administrados-58";
const DISTRIBUTOR_HUB_URL = "https://dima.com.bo/login";
const JOIN_TEAM_URL = "https://dima.com.bo/equipo-trabajo";

function MailIcon({ className = "" }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" className={className}>
      <rect
        x="3"
        y="5"
        width="18"
        height="14"
        rx="2.5"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
      />
      <path
        d="m4 7 8 6 8-6"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function PhoneIcon({ className = "" }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" className={className}>
      <path
        d="M6.7 3.8h3.1l1.1 4-2 1.9a16 16 0 0 0 5.2 5.2l1.9-2 4 1.1v3.1c0 .8-.6 1.4-1.4 1.5-7.8.6-14-5.6-13.4-13.4.1-.8.7-1.4 1.5-1.4Z"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.9"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function LinkedInIcon({ className = "" }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" className={className}>
      <circle cx="6.1" cy="7" r="1.7" fill="currentColor" />
      <path
        d="M4.5 10h3.2v9H4.5zM10 10h3v1.4c.6-1 1.6-1.7 3.3-1.7 2.5 0 3.7 1.6 3.7 4.5v4.8h-3.2v-4.3c0-1.3-.5-2.2-1.7-2.2-1 0-1.6.6-1.9 1.3-.1.2-.1.6-.1.9v4.3H10V10Z"
        fill="currentColor"
      />
    </svg>
  );
}

function FacebookIcon({ className = "" }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" className={className}>
      <path
        d="M14 8h2V4h-2.4C10.8 4 9 5.8 9 8.6V11H7v4h2v5h4v-5h2.8l.7-4H13V8.9c0-.6.4-.9 1-.9Z"
        fill="currentColor"
      />
    </svg>
  );
}

function GlobeIcon({ className = "" }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" className={className}>
      <circle cx="12" cy="12" r="9" fill="none" stroke="currentColor" strokeWidth="2" />
      <path
        d="M3.5 12h17M12 3c2.4 2.5 3.8 5.7 3.8 9s-1.4 6.5-3.8 9m0-18C9.6 5.5 8.2 8.7 8.2 12s1.4 6.5 3.8 9"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.8"
      />
    </svg>
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

function normalizeExternalUrl(value: string | null | undefined): string | null {
  const clean = value?.trim();
  if (!clean) return null;
  if (/^https?:\/\//i.test(clean)) return clean;
  return `https://${clean}`;
}

function renderSocialFallbackIcon(name: string, className: string) {
  const lower = name.toLowerCase();
  if (lower.includes("facebook")) return <FacebookIcon className={className} />;
  if (lower.includes("linkedin")) return <LinkedInIcon className={className} />;
  return <GlobeIcon className={className} />;
}

function FooterTitle({ children }: { children: React.ReactNode }) {
  return (
    <h3 className="text-[15px] font-extrabold uppercase tracking-[0.14em] text-white sm:text-[16px]">
      {children}
    </h3>
  );
}

function FooterBrandLinks({ items }: { items: TopMarcaItem[] }) {
  return (
    <ul className="mt-4 space-y-2.5 text-sm leading-6 text-white/88">
      {items.map((item) => (
        <li key={item.id}>
          <Link
            href={`/catalogo?marca=${item.id}`}
            className="transition hover:text-white"
          >
            {item.nombre}
          </Link>
        </li>
      ))}
    </ul>
  );
}

function SocialLink({ item }: { item: RedSocialItem }) {
  const href = normalizeExternalUrl(item.url);
  const iconUrl = toPublicStorageUrl(item.imagen_icono);

  if (!href) return null;

  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      aria-label={item.nombre || "Red social"}
      title={item.nombre || "Red social"}
      className="inline-flex h-10 w-10 items-center justify-center border border-white/28 bg-white/10 text-white transition hover:bg-white/18"
    >
      {iconUrl ? (
        <img
          src={iconUrl}
          alt={item.nombre || "Red social"}
          className="h-4 w-4 object-contain brightness-0 invert"
          loading="lazy"
        />
      ) : (
        renderSocialFallbackIcon(item.nombre || "", "h-4 w-4")
      )}
    </a>
  );
}

export default function SiteFooter() {
  const [informacion, setInformacion] = useState<InformacionItem | null>(null);
  const [redesSociales, setRedesSociales] = useState<RedSocialItem[]>([]);
  const [topBrands, setTopBrands] = useState<TopMarcaItem[]>([]);

  useEffect(() => {
    let isCancelled = false;

    const loadFooterData = async () => {
      const [infoResult, brandsResult] = await Promise.allSettled([
        getInformacion(),
        getTopMarcas({ limit: 9 }),
      ]);

      if (isCancelled) return;

      if (infoResult.status === "fulfilled") {
        const normalized = normalizeInformacionPayload(infoResult.value);
        setInformacion(normalized.informacion);
        setRedesSociales(normalized.redesSociales);
      } else {
        setInformacion(null);
        setRedesSociales([]);
      }

      if (brandsResult.status === "fulfilled") {
        setTopBrands(
          brandsResult.value
            .filter((item) => Number(item.productos_count) > 0)
            .slice(0, 9),
        );
      } else {
        setTopBrands([]);
      }
    };

    void loadFooterData();

    return () => {
      isCancelled = true;
    };
  }, []);

  const email = informacion?.correo?.trim() || "sales@dimaintl.com";
  const phone = informacion?.telefono?.trim() || "+591 000 00000";
  const activeSocials = redesSociales.filter(
    (item) => item.estado?.toLowerCase() === "activo",
  );

  return (
    <>
      <footer className="relative overflow-hidden rounded-t-[40px] bg-[linear-gradient(135deg,#17377f_0%,#234aa8_48%,#294fa9_100%)] text-white shadow-[0_-12px_40px_rgba(0,0,0,0.2)]">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(125,167,255,0.26),transparent_28%),radial-gradient(circle_at_bottom_right,rgba(255,255,255,0.08),transparent_22%)]" />

        <div className="relative mx-auto max-w-[1680px] px-5 py-14 sm:px-8 lg:px-10">
          <div className="grid gap-10 lg:grid-cols-[1.15fr_1fr_0.9fr_0.8fr]">
            <div id="footer-contact" className="space-y-5">
              <Link
                href="/"
                className="relative block h-[58px] w-[180px] sm:h-[66px] sm:w-[220px]"
                aria-label="Dima"
              >
                <Image
                  src="/assets/logo_dima.png"
                  alt="Dima"
                  fill
                  className="object-contain object-left"
                />
              </Link>

              <div className="space-y-3 text-sm text-white/88">
                <a
                  href={`mailto:${email}`}
                  className="inline-flex items-center gap-3 transition hover:text-white"
                >
                  <MailIcon className="h-4 w-4" />
                  {email}
                </a>
                <p className="inline-flex items-center gap-3">
                  <PhoneIcon className="h-4 w-4" />
                  {phone}
                </p>
              </div>
            </div>

            <div>
              <FooterTitle>Marcas</FooterTitle>
              {topBrands.length > 0 ? (
                <FooterBrandLinks items={topBrands} />
              ) : (
                <p className="mt-4 text-sm leading-6 text-white/88">
                  Explora nuestras marcas en el catálogo.
                </p>
              )}
            </div>

            <div className="space-y-8">
              <div>
                <FooterTitle>Servicios administrados</FooterTitle>
                <a
                  href={MANAGED_SERVICES_URL}
                  className="mt-4 inline-flex text-sm leading-6 text-white/88 transition hover:text-white"
                >
                  Ver más
                </a>
              </div>

              <div>
                <FooterTitle>Hub distribuidores</FooterTitle>
                <a
                  href={DISTRIBUTOR_HUB_URL}
                  className="mt-4 inline-flex text-sm leading-6 text-white/88 transition hover:text-white"
                >
                  Ingresar
                </a>
              </div>
            </div>

            <div className="space-y-8">
              <div>
                <FooterTitle>Envíanos tu CV</FooterTitle>
                <a
                  href={JOIN_TEAM_URL}
                  className="mt-4 inline-flex text-sm leading-6 text-white/88 transition hover:text-white"
                >
                  Postúlate aquí
                </a>
              </div>

              <div className="inline-flex items-center justify-center px-5 py-4">
                <Image
                  src={isoBadge}
                  alt="Certificación ISO 9001"
                  className="h-auto w-[132px] object-contain"
                />
              </div>
            </div>
          </div>

          <div className="mt-12 border-t border-white/20 pt-6">
            {activeSocials.length > 0 ? (
              <div className="flex flex-wrap items-center justify-center gap-3">
                {activeSocials.map((item) => (
                  <SocialLink key={item.id} item={item} />
                ))}
              </div>
            ) : null}
          </div>
        </div>
      </footer>

      <FloatingActionButtons />
    </>
  );
}

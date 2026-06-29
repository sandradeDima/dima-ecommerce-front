"use client";

/* eslint-disable @next/next/no-img-element */
import { useState } from "react";
import type { ReactNode } from "react";
import {
  InformacionItem,
  RedSocialItem,
  toPublicStorageUrl,
} from "@/lib/api";

type FooterContactInfoProps = {
  informacion: InformacionItem | null;
  redesSociales: RedSocialItem[];
  hasError?: boolean;
  className?: string;
};

type ContactRowProps = {
  icon: ReactNode;
  text: string;
  href?: string;
};

function MapPinIcon({ className = "" }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" className={className}>
      <path
        d="M12 21s6.5-5.7 6.5-11a6.5 6.5 0 1 0-13 0c0 5.3 6.5 11 6.5 11Z"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
      />
      <circle cx="12" cy="10" r="2.2" fill="none" stroke="currentColor" strokeWidth="2" />
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

function ClockIcon({ className = "" }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" className={className}>
      <circle cx="12" cy="12" r="9" fill="none" stroke="currentColor" strokeWidth="2" />
      <path
        d="M12 7.5v5l3.6 2.2"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
      />
    </svg>
  );
}

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

function InstagramIcon({ className = "" }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" className={className}>
      <rect
        x="4"
        y="4"
        width="16"
        height="16"
        rx="4.5"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
      />
      <circle cx="12" cy="12" r="3.2" fill="none" stroke="currentColor" strokeWidth="2" />
      <circle cx="17.2" cy="6.8" r="1.2" fill="currentColor" />
    </svg>
  );
}

function TwitterIcon({ className = "" }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" className={className}>
      <path
        d="M6 5h3.8l3 4.4L16.7 5H19l-5 6.4L19.4 19h-3.8l-3.2-4.7L8.8 19H6.5l5-6.4L6 5Z"
        fill="currentColor"
      />
    </svg>
  );
}

function TikTokIcon({ className = "" }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" className={className}>
      <path
        d="M14.8 4c.3 1.8 1.5 3.2 3.2 3.7v2.8a6.5 6.5 0 0 1-3.2-.9v5.4a4.9 4.9 0 1 1-4.9-4.9c.4 0 .8.1 1.2.2v2.7a2.3 2.3 0 1 0 1.4 2.1V4h2.3Z"
        fill="currentColor"
      />
    </svg>
  );
}

function LinkedInIcon({ className = "" }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" className={className}>
      <circle cx="6.1" cy="7" r="1.7" fill="currentColor" />
      <path d="M4.5 10h3.2v9H4.5zM10 10h3v1.4c.6-1 1.6-1.7 3.3-1.7 2.5 0 3.7 1.6 3.7 4.5v4.8h-3.2v-4.3c0-1.3-.5-2.2-1.7-2.2-1 0-1.6.6-1.9 1.3-.1.2-.1.6-.1.9v4.3H10V10Z" fill="currentColor" />
    </svg>
  );
}

function YouTubeIcon({ className = "" }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" className={className}>
      <rect x="3" y="6.5" width="18" height="11" rx="3.2" fill="currentColor" />
      <path d="m10 9.4 5 3-5 3.1V9.4Z" fill="#111827" />
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

function sanitizeHtmlText(value: string | null | undefined): string {
  if (!value) return "";
  return value
    .replace(/<[^>]+>/g, " ")
    .replace(/&nbsp;/gi, " ")
    .replace(/&amp;/gi, "&")
    .replace(/&quot;/gi, '"')
    .replace(/&#39;/gi, "'")
    .replace(/\s+/g, " ")
    .trim();
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
  if (lower.includes("instagram")) return <InstagramIcon className={className} />;
  if (lower.includes("twitter") || lower.includes("x")) {
    return <TwitterIcon className={className} />;
  }
  if (lower.includes("tiktok")) return <TikTokIcon className={className} />;
  if (lower.includes("linkedin")) return <LinkedInIcon className={className} />;
  if (lower.includes("youtube")) return <YouTubeIcon className={className} />;
  return <GlobeIcon className={className} />;
}

function ContactRow({ icon, text, href }: ContactRowProps) {
  return (
    <div className="flex items-start justify-center gap-3 text-left text-white/90 lg:justify-start">
      <span className="mt-0.5 shrink-0 text-white/85">{icon}</span>
      {href ? (
        <a
          href={href}
          className="text-[14px] leading-relaxed transition-colors hover:text-[#F54029] sm:text-[15px]"
        >
          {text}
        </a>
      ) : (
        <p className="text-[14px] leading-relaxed sm:text-[15px]">{text}</p>
      )}
    </div>
  );
}

function SocialItem({ item }: { item: RedSocialItem }) {
  const [hasImageError, setHasImageError] = useState(false);
  const href = normalizeExternalUrl(item.url);
  const iconUrl = toPublicStorageUrl(item.imagen_icono);
  const showImage = Boolean(iconUrl) && !hasImageError;

  const content = (
    <span className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-white bg-white text-[#2F3B4A] transition-all duration-200 hover:scale-105 hover:bg-white/90">
      {showImage ? (
        <img
          src={iconUrl as string}
          alt={item.nombre || "Red social"}
          title={item.nombre || "Red social"}
          className="h-5 w-5 object-contain"
          loading="lazy"
          onError={() => setHasImageError(true)}
        />
      ) : (
        renderSocialFallbackIcon(item.nombre || "", "h-5 w-5")
      )}
    </span>
  );

  if (!href) return <span title={item.nombre}>{content}</span>;

  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      aria-label={item.nombre || "Red social"}
      title={item.nombre || "Red social"}
    >
      {content}
    </a>
  );
}

export default function FooterContactInfo({
  informacion,
  redesSociales,
  hasError = false,
  className = "",
}: FooterContactInfoProps) {
  const horario = sanitizeHtmlText(informacion?.horario_trabajo);
  const contactRows = [
    {
      key: "direccion",
      text: informacion?.direccion?.trim() || "",
      icon: <MapPinIcon className="h-5 w-5" />,
    },
    {
      key: "telefono",
      text: informacion?.telefono?.trim() || "",
      icon: <PhoneIcon className="h-5 w-5" />,
    },
    {
      key: "horario",
      text: horario,
      icon: <ClockIcon className="h-5 w-5" />,
    },
    {
      key: "correo",
      text: informacion?.correo?.trim() || "",
      icon: <MailIcon className="h-5 w-5" />,
      href: informacion?.correo?.trim() ? `mailto:${informacion.correo.trim()}` : undefined,
    },
  ].filter((row) => row.text.length > 0);

  const activeSocials = redesSociales.filter(
    (item) => item.estado?.toLowerCase() === "activo",
  );

  return (
    <div className={className}>
      {contactRows.length > 0 ? (
        <div className="space-y-3">
          {contactRows.map((row) => (
            <ContactRow key={row.key} icon={row.icon} text={row.text} />
          ))}
        </div>
      ) : (
        <p className="text-[14px] leading-relaxed text-white/80 sm:text-[15px]">
          {hasError
            ? "No se pudo cargar la información de contacto."
            : "Información de contacto no disponible por el momento."}
        </p>
      )}

      {activeSocials.length > 0 ? (
        <div className="mt-5 flex flex-wrap items-center justify-center gap-3 lg:justify-start">
          {activeSocials.map((item) => (
            <SocialItem key={item.id} item={item} />
          ))}
        </div>
      ) : null}
    </div>
  );
}

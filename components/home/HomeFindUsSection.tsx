"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { getInformacion, InformacionItem } from "@/lib/api";
import {
  getPageTypeFromPath,
  trackGenerateLead,
} from "@/lib/analytics/ga4";
import {
  getFallbackMapEmbedUrl,
  isPotentialGoogleMapsShortUrl,
  resolveMapEmbedSrc,
} from "@/lib/maps/googleMaps";

const overlayGradient =
  "linear-gradient(180deg, #56646F 0%, rgba(86,100,111,0.8) 50%, #56646F 100%)";

function decodeHtml(value: string): string {
  return value
    .replace(/&nbsp;/gi, " ")
    .replace(/&amp;/gi, "&")
    .replace(/&quot;/gi, '"')
    .replace(/&#39;/gi, "'");
}

function parseHtmlToLines(value: string | null | undefined): string[] {
  if (!value) return [];

  const normalized = decodeHtml(value)
    .replace(/<br\s*\/?>/gi, "\n")
    .replace(/<\/p>/gi, "\n")
    .replace(/<[^>]+>/g, " ")
    .replace(/\r/g, "");

  return normalized
    .split("\n")
    .map((line) => line.trim().replace(/\s+/g, " "))
    .filter((line) => line.length > 0);
}

type CtaCardProps = {
  titleLineOne: string;
  titleLineTwo: string;
  imageSrc: string;
  href: string;
  external?: boolean;
  onClick?: () => void;
};

function CtaCard({
  titleLineOne,
  titleLineTwo,
  imageSrc,
  href,
  external = false,
  onClick,
}: CtaCardProps) {
  const content = (
    <article className="group relative isolate h-[170px] overflow-hidden rounded-[34px] shadow-[0_12px_30px_rgba(15,23,42,0.14)] sm:h-[186px] lg:h-[198px]">
      <Image
        src={imageSrc}
        alt={`${titleLineOne} ${titleLineTwo}`}
        title={`${titleLineOne} ${titleLineTwo}`}
        fill
        sizes="(max-width: 1024px) 100vw, 432px"
        className="object-cover transition-transform duration-300 group-hover:scale-105"
      />
      <div
        className="absolute inset-0 bg-cover bg-center opacity-62"
        style={{ backgroundImage: overlayGradient }}
      />
      <div className="absolute inset-0 flex items-center justify-center px-5 text-center">
        <p className="text-[20px] leading-tight font-semibold text-white">
          {titleLineOne}
          <br />
          {titleLineTwo}
        </p>
      </div>
    </article>
  );

  if (external) {
    return (
      <a href={href} target="_blank" rel="noopener noreferrer" className="block" onClick={onClick}>
        {content}
      </a>
    );
  }

  return (
    <Link href={href} className="block" onClick={onClick}>
      {content}
    </Link>
  );
}

function FindUsSkeleton() {
  return (
    <div className="mt-10 grid gap-8 lg:grid-cols-[470px_minmax(0,1fr)]">
      <div className="space-y-10">
        <div className="h-[170px] animate-pulse rounded-[34px] bg-slate-300/70 sm:h-[186px] lg:h-[198px]" />
      </div>

      <div className="h-[380px] animate-pulse rounded-[36px] bg-white/80 shadow-[0_16px_40px_rgba(15,23,42,0.12)] sm:h-[410px] xl:h-[436px]" />
    </div>
  );
}

function InfoBlock({ title, lines }: { title: string; lines: string[] }) {
  if (lines.length === 0) return null;

  return (
    <div className="w-full max-w-[280px] text-left">
      <h3 className="text-[25px] font-semibold leading-tight text-[#767676]">{title}</h3>
      <div className="mt-3 space-y-1.5">
        {lines.map((line) => (
          <p key={`${title}-${line}`} className="text-[18px] leading-snug text-[#767676]">
            {line}
          </p>
        ))}
      </div>
    </div>
  );
}

export default function HomeFindUsSection() {
  const pathname = usePathname();
  const [informacion, setInformacion] = useState<InformacionItem | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [hasError, setHasError] = useState(false);
  const [mapEmbedSrc, setMapEmbedSrc] = useState<string>(getFallbackMapEmbedUrl());

  useEffect(() => {
    let isCancelled = false;

    const loadInformacion = async () => {
      setIsLoading(true);
      setHasError(false);

      try {
        const response = await getInformacion();
        if (isCancelled) return;
        setInformacion(response.Informacion ?? null);
      } catch {
        if (!isCancelled) {
          setInformacion(null);
          setHasError(true);
        }
      } finally {
        if (!isCancelled) {
          setIsLoading(false);
        }
      }
    };

    void loadInformacion();

    return () => {
      isCancelled = true;
    };
  }, []);

  const direccionLines = useMemo(() => {
    const lines = parseHtmlToLines(informacion?.direccion);
    if (lines.length > 0) return lines;
    if (hasError) return ["No se pudo cargar la dirección."];
    return ["Dirección no disponible."];
  }, [hasError, informacion?.direccion]);

  const contactoLines = useMemo(() => {
    const lines: string[] = [];
    if (informacion?.telefono?.trim()) lines.push(`Teléfono: ${informacion.telefono.trim()}`);
    if (informacion?.correo?.trim()) lines.push(`Correo: ${informacion.correo.trim()}`);

    if (lines.length > 0) return lines;
    if (hasError) return ["No se pudo cargar el contacto."];
    return ["Contacto no disponible."];
  }, [hasError, informacion?.correo, informacion?.telefono]);

  const horarioLines = useMemo(() => {
    const lines = parseHtmlToLines(informacion?.horario_trabajo);
    if (lines.length > 0) return lines;
    if (hasError) return ["No se pudo cargar el horario."];
    return ["Horario no disponible."];
  }, [hasError, informacion?.horario_trabajo]);

  useEffect(() => {
    const rawUrl = informacion?.ubicacion_mapa?.trim();
    const baseEmbed = resolveMapEmbedSrc(rawUrl);
    setMapEmbedSrc(baseEmbed);

    if (!rawUrl || !isPotentialGoogleMapsShortUrl(rawUrl)) {
      return;
    }

    let cancelled = false;
    const controller = new AbortController();

    const resolveShortUrl = async () => {
      try {
        const params = new URLSearchParams({ url: rawUrl });
        const response = await fetch(`/api/maps/embed?${params.toString()}`, {
          method: "GET",
          cache: "no-store",
          signal: controller.signal,
        });

        if (!response.ok || cancelled) {
          return;
        }

        const data = (await response.json()) as { embedSrc?: string };
        if (data.embedSrc && !cancelled) {
          setMapEmbedSrc(data.embedSrc);
        }
      } catch {
        // If short-link resolution fails, keep the best-effort embed already set.
      }
    };

    void resolveShortUrl();

    return () => {
      cancelled = true;
      controller.abort();
    };
  }, [informacion?.ubicacion_mapa]);

  const pageType = getPageTypeFromPath(pathname ?? "/");

  return (
    <section className="relative overflow-hidden bg-[#ECEEF1] py-16 sm:py-20">
      <div
        className="pointer-events-none absolute inset-0 bg-cover bg-center bg-no-repeat opacity-35"
        style={{ backgroundImage: "url('/assets/static/encuentranos_bg.png')" }}
      />

      <div className="relative z-10 mx-auto w-full max-w-[1700px] px-6 sm:px-10 lg:px-16 xl:px-20">
        <h2 className="text-center text-[36px] font-medium leading-tight text-slate-700">
          Encuéntranos
        </h2>

        {isLoading ? (
          <FindUsSkeleton />
        ) : (
          <div className="mt-10 grid gap-8 lg:grid-cols-[450px_minmax(0,1fr)]">
            <div className="space-y-10">
              <CtaCard
                titleLineOne="Solicita una"
                titleLineTwo="asesoría gratuita"
                imageSrc="/assets/static/asesoria.png"
                href="/cotizar"
                onClick={() =>
                  trackGenerateLead({
                    cta_name: "cotizar",
                    page_type: pageType,
                    source_section: "home_find_us",
                  })
                }
              />
            </div>

            <article className="rounded-[36px] bg-white p-4 shadow-[0_16px_40px_rgba(15,23,42,0.12)] sm:p-5 xl:h-[436px]">
              <div className="grid h-full gap-4 xl:grid-cols-[minmax(240px,320px)_minmax(0,1fr)]">
                <div className="flex flex-col items-center justify-start space-y-6 p-5 sm:p-6 xl:justify-center xl:p-7">
                  <InfoBlock title="Dirección" lines={direccionLines} />
                  <InfoBlock title="Contacto" lines={contactoLines} />
                  <InfoBlock title="Horario" lines={horarioLines} />
                </div>

                <div className="h-[280px] rounded-[24px] bg-slate-100 p-3 sm:h-[320px] sm:p-4 xl:h-full">
                  <iframe
                    src={mapEmbedSrc}
                    title="Mapa de ubicación DMC"
                    className="h-full w-full rounded-[18px] border-0"
                    loading="lazy"
                    referrerPolicy="no-referrer-when-downgrade"
                    allowFullScreen
                  />
                </div>
              </div>
            </article>
          </div>
        )}
      </div>
    </section>
  );
}

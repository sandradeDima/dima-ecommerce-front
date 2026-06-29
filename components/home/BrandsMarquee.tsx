"use client";

/* eslint-disable @next/next/no-img-element */
import Link from "next/link";
import { toPublicStorageUrl } from "@/lib/api";

export type MarcaInicioItem = {
  id: number;
  nombre: string;
  descripcion: string | null;
  url_sitio_web: string | null;
  slug: string;
  estado: string;
  imagen_principal: string;
  title_imagen: string | null;
  alt_imagen: string | null;
};

type BrandsMarqueeProps = {
  brands: MarcaInicioItem[];
  isLoading: boolean;
  hasError: boolean;
};

const MIN_BRANDS_TO_FILL = 12;
const MIN_DURATION_SECONDS = 16;
const MAX_DURATION_SECONDS = 42;

function isValidExternalUrl(value: string | null): value is string {
  if (!value) return false;

  try {
    const url = new URL(value);
    return url.protocol === "http:" || url.protocol === "https:";
  } catch {
    return false;
  }
}

function renderBrandLogo(brand: MarcaInicioItem) {
  const logoUrl = toPublicStorageUrl(brand.imagen_principal);
  const altText = brand.alt_imagen?.trim() || brand.nombre;
  const titleText = brand.title_imagen?.trim() || brand.nombre;

  if (!logoUrl) return null;

  const logo = (
    <div className="flex h-[75px] w-[154px] items-center justify-center overflow-hidden rounded-[20px] bg-white px-[3px]">
      <img
        src={logoUrl}
        alt={altText}
        title={titleText}
        className="h-[50px] w-[150px] object-contain transition-transform duration-300 ease-out group-hover:scale-105"
        loading="lazy"
      />
    </div>
  );

  if (isValidExternalUrl(brand.url_sitio_web)) {
    return (
      <a
        key={brand.id}
        href={brand.url_sitio_web}
        target="_blank"
        rel="noreferrer noopener"
        className="group transition-opacity hover:opacity-90"
        aria-label={`Ir al sitio web de ${brand.nombre}`}
      >
        {logo}
      </a>
    );
  }

  return (
    <Link
      key={brand.id}
      href={`/marcas/${brand.slug}`}
      className="group transition-opacity hover:opacity-90"
      aria-label={`Ver marca ${brand.nombre}`}
    >
      {logo}
    </Link>
  );
}

function BrandsLoadingSkeleton() {
  return (
    <div className="mx-auto h-[138px] w-full max-w-[1919px] overflow-hidden bg-white pt-[32px]">
      <div className="flex items-center justify-center gap-[10px]">
        {Array.from({ length: 12 }).map((_, index) => (
          <div
            key={`brand-skeleton-${index}`}
            className="h-[75px] w-[154px] animate-pulse rounded-[20px] bg-slate-100"
          />
        ))}
      </div>
    </div>
  );
}

export default function BrandsMarquee({
  brands,
  isLoading,
  hasError,
}: BrandsMarqueeProps) {
  if (isLoading) {
    return <BrandsLoadingSkeleton />;
  }

  if (hasError || brands.length === 0) {
    return null;
  }

  const baseBrands: MarcaInicioItem[] = [];
  while (baseBrands.length < MIN_BRANDS_TO_FILL) {
    baseBrands.push(...brands);
    if (brands.length >= MIN_BRANDS_TO_FILL) break;
  }
  const visibleBrands = baseBrands.slice(0, Math.max(MIN_BRANDS_TO_FILL, brands.length));
  const loopBrands = [...visibleBrands, ...visibleBrands];
  const durationSeconds = Math.min(
    MAX_DURATION_SECONDS,
    Math.max(MIN_DURATION_SECONDS, visibleBrands.length * 1.35),
  );

  return (
    <div className="brands-marquee mx-auto h-[138px] w-full max-w-[1919px] overflow-hidden bg-white pt-[32px]">
      <div
        className="brands-marquee-track flex w-max items-center gap-[10px]"
        style={{
          animationDuration: `${durationSeconds}s`,
          animationDirection: "reverse",
          animationPlayState: "running",
        }}
      >
        {loopBrands.map((brand, index) => {
          const logoElement = renderBrandLogo(brand);

          if (!logoElement) return null;

          return <div key={`${brand.id}-${index}`}>{logoElement}</div>;
        })}
      </div>
    </div>
  );
}

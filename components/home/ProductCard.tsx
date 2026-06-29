"use client";

/* eslint-disable @next/next/no-img-element */
import Link from "next/link";
import { useEffect, useState, type CSSProperties } from "react";
import { toPublicStorageUrl } from "@/lib/api";

export type ProductoInicioItem = {
  id: number;
  nombre: string;
  descripcion_corta: string | null;
  imagen_principal: string;
  destacado: number;
  title_imagen: string | null;
  alt_imagen: string | null;
  slug: string;
};

type ProductCardProps = {
  product: ProductoInicioItem;
};

function clampedTextStyle(lines: number): CSSProperties {
  return {
    display: "-webkit-box",
    WebkitLineClamp: lines,
    WebkitBoxOrient: "vertical",
    overflow: "hidden",
  };
}

export default function ProductCard({ product }: ProductCardProps) {
  const productHref = `/producto/${product.slug}`;
  const imageUrl = toPublicStorageUrl(product.imagen_principal);
  const [hasImageError, setHasImageError] = useState(false);
  const altText = product.alt_imagen?.trim() || product.nombre;
  const titleText = product.title_imagen?.trim() || product.nombre;
  const description =
    product.descripcion_corta?.trim() || "Producto disponible en catálogo";
  const showImage = Boolean(imageUrl) && !hasImageError;

  useEffect(() => {
    setHasImageError(false);
  }, [imageUrl]);

  return (
    <article className="flex h-[402px] w-[294px] shrink-0 flex-col overflow-hidden rounded-[36px] bg-white shadow-[0_8px_22px_rgba(15,23,42,0.12)] ring-1 ring-slate-200/70">
      <Link
        href={productHref}
        className="group block h-[267px] w-[294px] overflow-hidden bg-[#F5F7FA] p-3"
      >
        {showImage ? (
          <img
            src={imageUrl as string}
            alt={altText}
            title={titleText}
            className="h-full w-full object-contain transition-transform duration-300 ease-out group-hover:scale-105"
            loading="lazy"
            onError={() => setHasImageError(true)}
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center bg-slate-200 text-sm text-slate-500">
            Sin imagen
          </div>
        )}
      </Link>

      <div className="flex flex-1 flex-col px-4 pt-3 pb-4">
        <Link href={productHref} className="block">
          <h3
            className="text-[14px] font-medium text-slate-800"
            style={clampedTextStyle(2)}
            title={product.nombre}
          >
            {product.nombre}
          </h3>

          <p
            className="mt-1 text-[14px] font-normal text-slate-500"
            style={clampedTextStyle(2)}
            title={description}
          >
            {description}
          </p>
        </Link>

        <Link
          href={productHref}
          className="mx-auto mt-auto flex h-[41px] w-[195px] items-center justify-center rounded-[20.37px] border border-[#F54029] text-[14px] font-normal text-[#F54029] transition-colors hover:bg-[#F54029] hover:text-white"
        >
          Ver más
        </Link>
      </div>
    </article>
  );
}

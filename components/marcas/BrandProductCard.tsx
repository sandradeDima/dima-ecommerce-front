"use client";

/* eslint-disable @next/next/no-img-element */
import Link from "next/link";
import { useEffect, useState } from "react";
import { ProductoItem } from "@/lib/api";
import { buildImageUrl } from "./marcasUtils";

type BrandProductCardProps = {
  product: ProductoItem;
};

export default function BrandProductCard({ product }: BrandProductCardProps) {
  const productHref = `/producto/${product.slug}`;
  const imageUrl = buildImageUrl(product.imagen_principal);
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
    <article className="flex h-full min-h-[402px] w-full max-w-[310px] flex-col overflow-hidden rounded-[24px] bg-white shadow-[0_10px_26px_rgba(15,23,42,0.12)] ring-1 ring-slate-200/70">
      <Link
        href={productHref}
        className="group block h-[230px] w-full overflow-hidden bg-[#F5F7FA] p-3"
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

      <div className="flex flex-1 flex-col px-4 pb-4 pt-3">
        <Link href={productHref}>
          <h2 className="line-clamp-2 text-[14px] font-medium leading-snug text-slate-800">
            {product.nombre}
          </h2>

          <p className="mt-1 line-clamp-3 text-[13px] leading-snug text-slate-500">
            {description}
          </p>
        </Link>

        <Link
          href={productHref}
          className="mx-auto mt-auto inline-flex h-[40px] w-[190px] items-center justify-center rounded-full border border-[#F54029] text-[14px] font-normal text-[#F54029] transition-colors hover:bg-[#F54029] hover:text-white"
        >
          Ver más
        </Link>
      </div>
    </article>
  );
}

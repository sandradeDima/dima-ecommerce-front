"use client";

/* eslint-disable @next/next/no-img-element */
import Link from "next/link";
import { RelatedProductCardItem, buildImageUrl } from "./productoUtils";

type RelatedProductCardProps = {
  product: RelatedProductCardItem;
};

export default function RelatedProductCard({ product }: RelatedProductCardProps) {
  const href = `/producto/${product.slug}`;
  const imageUrl = buildImageUrl(product.imagen_principal);
  const fallbackImageUrl = "/assets/heros/producto_inside.png";
  const resolvedImageUrl = imageUrl || fallbackImageUrl;
  const altText = product.alt_imagen?.trim() || product.nombre;
  const titleText = product.title_imagen?.trim() || product.nombre;
  const description =
    product.descripcion_corta?.trim() || "Producto disponible en catálogo";

  return (
    <article className="flex h-full min-h-[398px] w-full max-w-[310px] flex-col overflow-hidden rounded-[24px] bg-white shadow-[0_10px_26px_rgba(15,23,42,0.12)] ring-1 ring-slate-200/70">
      <Link
        href={href}
        className="group block h-[260px] w-full overflow-hidden bg-[#F5F7FA] p-3"
      >
        <img
          src={resolvedImageUrl}
          alt={altText}
          title={titleText}
          className="h-full w-full object-contain transition-transform duration-300 ease-out group-hover:scale-110"
          loading="lazy"
        />
      </Link>

      <div className="flex flex-1 flex-col px-4 pb-4 pt-3">
        <Link href={href}>
          <h3 className="line-clamp-2 text-[14px] font-medium leading-snug text-slate-800">
            {product.nombre}
          </h3>
          <p className="mt-1 line-clamp-2 text-[13px] leading-snug text-slate-500">
            {description}
          </p>
        </Link>

        <Link
          href={href}
          className="mx-auto mt-auto inline-flex h-[40px] w-[190px] items-center justify-center rounded-full border border-[#F54029] text-[14px] font-normal text-[#F54029] transition-colors hover:bg-[#F54029] hover:text-white"
        >
          Ver más
        </Link>
      </div>
    </article>
  );
}

"use client";

/* eslint-disable @next/next/no-img-element */
import Link from "next/link";
import { useState } from "react";
import AddToCartButton from "@/components/cart/AddToCartButton";
import { ProductoItem } from "@/lib/api";
import { buildImageUrl } from "./marcasUtils";

type BrandProductCardProps = {
  product: ProductoItem;
};

export default function BrandProductCard({ product }: BrandProductCardProps) {
  const productHref = `/producto/${product.slug}`;
  const imageUrl = buildImageUrl(product.imagen_principal);
  const [brokenImageUrl, setBrokenImageUrl] = useState<string | null>(null);
  const altText = product.alt_imagen?.trim() || product.nombre;
  const titleText = product.title_imagen?.trim() || product.nombre;
  const description =
    product.descripcion_corta?.trim() || "Producto disponible en catálogo";
  const showImage = Boolean(imageUrl) && brokenImageUrl !== imageUrl;

  return (
    <article className="group relative flex h-full min-h-[430px] w-full max-w-[320px] flex-col overflow-hidden rounded-[34px] border border-[rgba(34,76,168,0.14)] bg-[linear-gradient(180deg,rgba(255,255,255,0.98)_0%,#f8fbff_100%)] shadow-[0_24px_56px_rgba(18,44,108,0.14)] transition duration-300 hover:-translate-y-1.5 hover:shadow-[0_30px_62px_rgba(18,44,108,0.18)]">
      <div className="pointer-events-none absolute inset-x-0 bottom-0 h-[152px] bg-[linear-gradient(180deg,rgba(237,244,255,0)_0%,rgba(221,233,255,0.86)_40%,rgba(198,217,255,0.98)_100%)]" />
      <Link
        href={productHref}
        className="relative z-10 block p-4 pb-0"
      >
        <div className="relative overflow-hidden rounded-[28px] border border-white/75 bg-[linear-gradient(180deg,#eef5ff_0%,#d7e6ff_55%,#edf4ff_100%)] px-4 py-5 shadow-[inset_0_1px_0_rgba(255,255,255,0.72),0_20px_34px_rgba(37,76,169,0.12)]">
          {showImage ? (
            <>
              <div className="pointer-events-none absolute inset-0">
                <div
                  className="absolute inset-3 rounded-[24px] opacity-30 blur-2xl"
                  style={{
                    backgroundImage: `url(${imageUrl})`,
                    backgroundPosition: "center",
                    backgroundSize: "cover",
                  }}
                />
                <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(255,255,255,0.72),transparent_56%)]" />
                <div className="absolute inset-x-8 bottom-3 h-8 rounded-full bg-[rgba(23,55,127,0.14)] blur-2xl" />
              </div>

              <div className="relative flex h-[198px] items-center justify-center">
                <img
                  src={imageUrl as string}
                  alt={altText}
                  title={titleText}
                  className="h-full w-full object-contain drop-shadow-[0_18px_28px_rgba(18,44,108,0.18)] transition-transform duration-300 ease-out group-hover:scale-[1.04]"
                  loading="lazy"
                  onError={() => setBrokenImageUrl(imageUrl)}
                />
              </div>
            </>
          ) : (
            <div className="flex h-[198px] w-full items-center justify-center rounded-[24px] bg-white/72 text-sm text-[var(--dima-ink-soft)]">
              Sin imagen
            </div>
          )}
        </div>
      </Link>

      <div className="relative z-10 flex flex-1 flex-col px-5 pb-5 pt-4">
        <span className="mb-3 inline-flex w-fit rounded-full border border-white/80 bg-white/90 px-3 py-1 text-[10px] font-bold uppercase tracking-[0.14em] text-[var(--dima-primary)] shadow-[0_8px_20px_rgba(37,76,169,0.08)]">
          Selección Dima
        </span>
        <Link href={productHref}>
          <h2 className="line-clamp-2 text-[18px] font-bold leading-tight text-[var(--dima-ink)]">
            {product.nombre}
          </h2>

          <p className="mt-2.5 line-clamp-3 max-w-[24ch] text-[13px] leading-6 text-[var(--dima-ink-soft)]">
            {description}
          </p>
        </Link>

        <div className="mx-auto mt-auto flex w-full max-w-[250px] flex-col gap-2">
          <AddToCartButton
            product={product}
            productPath={productHref}
            className="h-[42px] w-full justify-center bg-[var(--dima-accent)] text-[12px]"
          />
          <Link
            href={productHref}
            className="inline-flex h-[42px] w-full items-center justify-center rounded-full bg-[#111111] text-[13px] font-bold uppercase tracking-[0.12em] text-white transition-colors hover:bg-[var(--dima-primary)]"
          >
            Ver más
          </Link>
        </div>
      </div>
    </article>
  );
}

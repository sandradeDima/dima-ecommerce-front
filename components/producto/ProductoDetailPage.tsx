"use client";

/* eslint-disable @next/next/no-img-element */
import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";
import { getMarcasList, getProductoDetalle, ProductoDetailItem } from "@/lib/api";
import Breadcrumbs, { type BreadcrumbItem } from "@/components/Breadcrumbs";
import { trackProductView } from "@/lib/analytics/ga4";
import AddToCartButton from "@/components/cart/AddToCartButton";
import ProductImageGallery from "./ProductImageGallery";
import RelatedProductCard from "./RelatedProductCard";
import {
  buildImageUrl,
  enrichRelatedProductsIfNeeded,
  formatPriceOrFallback,
  getProductoGalleryImages,
  getRelatedProductsFallback,
  getRelatedProductsFromDetail,
  RelatedProductCardItem,
} from "./productoUtils";

type ProductoDetailPageProps = {
  slug: string;
};

type BrandLogoData = {
  url: string | null;
  alt: string;
  title: string;
  name: string;
} | null;

function ArrowLeftIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" className="h-5 w-5">
      <path
        d="M15 18l-6-6 6-6"
        fill="none"
        stroke="currentColor"
        strokeWidth="2.2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function DetailSkeleton() {
  return (
    <div className="space-y-6">
      <div className="h-10 w-64 animate-pulse rounded-full bg-[rgba(37,76,169,0.12)]" />
      <div className="rounded-[36px] border border-[var(--dima-line)] bg-white/90 p-5 shadow-[var(--dima-shadow)]">
        <div className="grid gap-6 xl:grid-cols-[minmax(0,1.15fr)_minmax(340px,0.85fr)]">
          <div className="h-[620px] animate-pulse rounded-[30px] bg-[rgba(37,76,169,0.1)]" />
          <div className="space-y-4">
            <div className="h-[290px] animate-pulse rounded-[30px] bg-[rgba(37,76,169,0.14)]" />
            <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-1">
              <div className="h-[170px] animate-pulse rounded-[26px] bg-[rgba(37,76,169,0.1)]" />
              <div className="h-[170px] animate-pulse rounded-[26px] bg-[rgba(37,76,169,0.1)]" />
            </div>
          </div>
        </div>
      </div>
      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_320px]">
        <div className="h-[220px] animate-pulse rounded-[30px] bg-[rgba(37,76,169,0.1)]" />
        <div className="h-[220px] animate-pulse rounded-[30px] bg-[rgba(37,76,169,0.1)]" />
      </div>
    </div>
  );
}

function RelatedSkeletonCard({ index }: { index: number }) {
  return (
    <div
      key={`related-loading-${index}`}
      className="h-full min-h-[420px] w-full max-w-[320px] animate-pulse rounded-[34px] bg-white shadow-[0_16px_36px_rgba(15,23,42,0.1)]"
    >
      <div className="m-4 h-[238px] rounded-[28px] bg-slate-200" />
      <div className="space-y-3 px-5 py-4">
        <div className="h-4 w-28 rounded-full bg-slate-200" />
        <div className="h-6 w-3/4 rounded bg-slate-200" />
        <div className="h-14 w-full rounded bg-slate-200" />
      </div>
    </div>
  );
}

function formatSpecValue(value: string | null | undefined): string | null {
  const clean = value?.trim();
  return clean && clean.length > 0 ? clean : null;
}

function formatSlugTitle(slug: string): string {
  return slug
    .split(/[-_]+/)
    .filter((part) => part.length > 0)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

async function resolveBrandLogo(producto: ProductoDetailItem): Promise<BrandLogoData> {
  const targetId = producto.marca_id;
  const targetSlug = producto.marca?.slug?.trim().toLowerCase();
  const targetName = producto.marca?.nombre?.trim().toLowerCase();

  if (!targetId && !targetSlug && !targetName) return null;

  let currentPage = 1;

  while (true) {
    const response = await getMarcasList({ page: currentPage, per_page: 100 });
    const found = response.data.find((marca) => {
      const marcaSlug = marca.slug?.trim().toLowerCase();
      const marcaName = marca.nombre?.trim().toLowerCase();

      if (targetId && marca.id === targetId) return true;
      if (targetSlug && marcaSlug === targetSlug) return true;
      if (targetName && marcaName === targetName) return true;

      return false;
    });

    if (found) {
      return {
        url: buildImageUrl(found.imagen_principal),
        alt: found.alt_imagen?.trim() || found.nombre,
        title: found.title_imagen?.trim() || found.nombre,
        name: found.nombre,
      };
    }

    if (!response.next_page_url || currentPage >= response.last_page) {
      return null;
    }

    currentPage += 1;
  }
}

export default function ProductoDetailPage({ slug }: ProductoDetailPageProps) {
  const [product, setProduct] = useState<ProductoDetailItem | null>(null);
  const [relatedProducts, setRelatedProducts] = useState<RelatedProductCardItem[]>([]);
  const [brandLogo, setBrandLogo] = useState<BrandLogoData>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [hasError, setHasError] = useState(false);
  const lastTrackedProductKeyRef = useRef<string>("");

  useEffect(() => {
    let isCancelled = false;

    const loadData = async () => {
      setIsLoading(true);
      setHasError(false);
      setBrandLogo(null);

      try {
        const response = await getProductoDetalle(slug);
        if (isCancelled) return;

        if (!response || response.estado?.toLowerCase() !== "activo") {
          setProduct(null);
          setRelatedProducts([]);
          setHasError(true);
          return;
        }

        setProduct(response);

        const fromDetail = getRelatedProductsFromDetail(response, 4);
        const [resolvedBrandLogo, fallbackRelated] = await Promise.all([
          resolveBrandLogo(response).catch(() => null),
          fromDetail.length > 0
            ? Promise.resolve<RelatedProductCardItem[]>([])
            : getRelatedProductsFallback(response, 4).catch(() => []),
        ]);

        if (!isCancelled) {
          const baseRelated = fromDetail.length > 0 ? fromDetail : fallbackRelated;
          const enrichedRelated = await enrichRelatedProductsIfNeeded(baseRelated);
          if (isCancelled) return;

          setBrandLogo(resolvedBrandLogo);
          setRelatedProducts(enrichedRelated.slice(0, 4));
        }
      } catch {
        if (!isCancelled) {
          setProduct(null);
          setRelatedProducts([]);
          setBrandLogo(null);
          setHasError(true);
        }
      } finally {
        if (!isCancelled) {
          setIsLoading(false);
        }
      }
    };

    void loadData();

    return () => {
      isCancelled = true;
    };
  }, [slug]);

  const galleryImages = useMemo(
    () => (product ? getProductoGalleryImages(product) : []),
    [product],
  );

  useEffect(() => {
    if (!product) return;

    const trackingKey = `${product.id}-${product.slug}`;
    if (lastTrackedProductKeyRef.current === trackingKey) return;

    lastTrackedProductKeyRef.current = trackingKey;
    trackProductView({
      id: product.id,
      nombre: product.nombre,
      slug: product.slug,
      categoria: product.categoria?.nombre ?? null,
      subcategoria: product.subcategoria?.nombre ?? null,
      precio: product.precio ?? null,
      precioReferencial: product.precio_referencial ?? null,
      marca: product.marca?.nombre ?? null,
      sku: product.sku ?? null,
      skuDima: product.sku_dima ?? null,
    });
  }, [product]);

  const backHref = "/catalogo";
  const fallbackImageUrl = "/assets/heros/producto_inside.png";
  const priceLabel = product ? formatPriceOrFallback(product) : null;
  const shortDescription = formatSpecValue(product?.descripcion_corta) ?? "Producto disponible en catálogo.";
  const technicalDescription = formatSpecValue(product?.descripcion_tecnica);
  const productLabel = product?.nombre?.trim() || formatSlugTitle(slug) || "Producto";
  const brandLabel = product?.marca?.nombre?.trim() || "Marca";
  const categoryLabel = formatSpecValue(product?.categoria?.nombre);

  const specs = [
    { label: "SKU", value: formatSpecValue(product?.sku) },
    { label: "SKU Dima", value: formatSpecValue(product?.sku_dima) },
    { label: "Categoría", value: categoryLabel },
    { label: "Subcategoría", value: formatSpecValue(product?.subcategoria?.nombre) },
    { label: "Garantía", value: formatSpecValue(product?.garantia) },
  ].filter((item) => item.value);

  const breadcrumbItems = useMemo<BreadcrumbItem[]>(
    () => [
      { label: "Inicio", href: "/" },
      { label: "Catálogo", href: "/catalogo" },
      ...(product?.marca?.slug ? [{ label: brandLabel, href: backHref }] : []),
      { label: productLabel },
    ],
    [backHref, brandLabel, product?.marca?.slug, productLabel],
  );

  return (
    <div className="relative min-h-screen overflow-hidden bg-[var(--dima-page)]">
      <div className="pointer-events-none absolute inset-x-0 top-0 h-[420px] bg-[radial-gradient(circle_at_12%_12%,rgba(125,167,255,0.28),transparent_28%),radial-gradient(circle_at_84%_14%,rgba(37,76,169,0.16),transparent_24%)]" />
      <div className="pointer-events-none absolute inset-x-0 bottom-0 h-[420px] bg-[radial-gradient(circle_at_80%_35%,rgba(125,167,255,0.22),transparent_26%),radial-gradient(circle_at_18%_78%,rgba(37,76,169,0.12),transparent_24%)]" />

      <section className="relative z-10 py-8 sm:py-10">
        <div className="mx-auto w-full max-w-[1600px] px-5 sm:px-8 lg:px-10">
          <Breadcrumbs className="mb-6" items={breadcrumbItems} />

          {isLoading ? (
            <DetailSkeleton />
          ) : hasError || !product ? (
            <div className="rounded-[30px] border border-[var(--dima-line)] bg-white px-8 py-14 text-center shadow-[var(--dima-shadow)]">
              <p className="text-lg text-[var(--dima-ink-soft)]">No se pudo cargar el producto.</p>
              <Link
                href="/catalogo"
                className="mt-6 inline-flex items-center gap-2 rounded-full bg-[var(--dima-primary)] px-5 py-3 text-sm font-semibold text-white transition hover:bg-[var(--dima-primary-strong)]"
              >
                <ArrowLeftIcon />
                Volver al catálogo
              </Link>
            </div>
          ) : (
            <>
              <div className="rounded-[36px] border border-[var(--dima-line)] bg-white/92 p-4 shadow-[var(--dima-shadow)] sm:p-5 lg:p-6">
                <div className="grid gap-6 xl:grid-cols-[minmax(0,1.15fr)_minmax(340px,0.85fr)]">
                  <div className="rounded-[30px] bg-[linear-gradient(180deg,rgba(239,245,255,0.86)_0%,rgba(223,235,255,0.96)_100%)] p-4 sm:p-5">
                    <ProductImageGallery
                      key={product.slug}
                      images={galleryImages}
                      fallbackImageUrl={fallbackImageUrl}
                      productName={product.nombre}
                    />
                  </div>

                  <aside className="flex h-full flex-col gap-4">
                    <Link
                      href={backHref}
                      className="inline-flex w-fit items-center gap-2 rounded-full border border-[var(--dima-line)] bg-white px-4 py-2 text-sm font-semibold text-[var(--dima-primary)] transition hover:border-[var(--dima-primary)]"
                    >
                      <ArrowLeftIcon />
                      Volver al buscador
                    </Link>

                    <div className="overflow-hidden rounded-[30px] bg-[linear-gradient(145deg,var(--dima-primary-strong)_0%,var(--dima-primary)_58%,#3162cf_100%)] p-6 text-white shadow-[0_26px_52px_rgba(18,44,108,0.22)]">
                      <div className="flex flex-wrap gap-2">
                        {product?.marca?.slug ? (
                          <Link
                            href={`/catalogo?marca=${encodeURIComponent(product.marca.slug)}`}
                            className="inline-flex rounded-full border border-white/20 bg-white/10 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.14em] text-white/95 transition hover:brightness-105"
                          >
                            {brandLabel}
                          </Link>
                        ) : (
                          <span className="inline-flex rounded-full border border-white/20 bg-white/10 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.14em]">
                            {brandLabel}
                          </span>
                        )}
                        {categoryLabel ? (
                          <span className="inline-flex rounded-full border border-white/20 bg-white/10 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.14em]">
                            {categoryLabel}
                          </span>
                        ) : null}
                      </div>

                      <h1 className="mt-4 text-[clamp(2rem,3vw,3.1rem)] font-bold leading-[1.02] text-white">
                        {product.nombre}
                      </h1>

                      <p className="mt-4 max-w-[38ch] text-[15px] leading-7 text-white/82">
                        {shortDescription}
                      </p>

                      <div className="mt-6">
                        <p className="text-[12px] font-semibold uppercase tracking-[0.16em] text-white/68">
                          Precio referencial
                        </p>
                        <p className="mt-2 text-[34px] font-bold leading-none text-white">
                          {priceLabel || "Consultar precio"}
                        </p>
                      </div>

                      <AddToCartButton
                        product={product}
                        productPath={`/producto/${product.slug}`}
                        className="mt-6 w-full justify-center"
                      />

                      <p className="mt-4 max-w-[34ch] text-[13px] leading-6 text-white/72">
                        Agrega este producto al carrito para enviar una solicitud completa y dejar
                        registrado tu pedido en Dima.
                      </p>
                    </div>

                    <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-1">
                      <article className="rounded-[26px] border border-[var(--dima-line)] bg-white p-5 shadow-[0_18px_32px_rgba(18,44,108,0.08)]">
                        <p className="text-[12px] font-bold uppercase tracking-[0.12em] text-[var(--dima-primary)]">
                          Especificaciones clave
                        </p>
                        <ul className="mt-4 space-y-3 text-[14px] leading-relaxed text-[var(--dima-ink-soft)]">
                          {specs.map((item) => (
                            <li key={item.label} className="flex items-start justify-between gap-4">
                              <span className="font-semibold text-[var(--dima-ink)]">{item.label}</span>
                              <span className="text-right">{item.value}</span>
                            </li>
                          ))}
                        </ul>
                      </article>

                      <article className="rounded-[26px] border border-[var(--dima-line)] bg-[linear-gradient(180deg,#f9fbff_0%,#edf4ff_100%)] p-5 shadow-[0_18px_32px_rgba(18,44,108,0.08)]">
                        <p className="text-[12px] font-bold uppercase tracking-[0.12em] text-[var(--dima-primary)]">
                          Marca
                        </p>
                        {product.marca?.slug ? (
                          <Link
                            href={`/marcas/${product.marca.slug}`}
                            className="mt-4 flex items-center gap-4 rounded-[20px] border border-white/80 bg-white/90 px-4 py-4 transition hover:border-[var(--dima-primary-soft)]"
                          >
                            {brandLogo?.url ? (
                              <img
                                src={brandLogo.url}
                                alt={brandLogo.alt}
                                title={brandLogo.title}
                                className="h-10 w-auto max-w-[120px] object-contain"
                                loading="lazy"
                              />
                            ) : null}
                            <span className="text-[15px] font-semibold text-[var(--dima-ink)]">
                              {brandLogo?.name || product.marca.nombre}
                            </span>
                          </Link>
                        ) : (
                          <p className="mt-4 text-[15px] font-semibold text-[var(--dima-ink)]">
                            {product.marca?.nombre || "Sin marca"}
                          </p>
                        )}
                      </article>
                    </div>
                  </aside>
                </div>
              </div>

              <div className="mt-6 grid gap-6 lg:grid-cols-[minmax(0,1fr)_320px]">
                <article className="rounded-[30px] border border-[var(--dima-line)] bg-white p-6 shadow-[0_18px_32px_rgba(18,44,108,0.08)]">
                  <p className="text-[12px] font-bold uppercase tracking-[0.12em] text-[var(--dima-primary)]">
                    Detalle técnico
                  </p>
                  <div className="mt-4 max-w-[72ch] text-[15px] leading-8 text-[var(--dima-ink-soft)]">
                    {technicalDescription ? (
                      <p>{technicalDescription}</p>
                    ) : (
                      <p>
                        Este producto no tiene un detalle técnico extendido publicado todavía.
                        Puedes agregarlo al carrito para solicitar información completa al equipo
                        comercial.
                      </p>
                    )}
                  </div>
                </article>

                <article className="rounded-[30px] border border-[var(--dima-line)] bg-[linear-gradient(180deg,#f9fbff_0%,#edf4ff_100%)] p-6 shadow-[0_18px_32px_rgba(18,44,108,0.08)]">
                  <p className="text-[12px] font-bold uppercase tracking-[0.12em] text-[var(--dima-primary)]">
                    Resumen comercial
                  </p>
                  <ul className="mt-4 space-y-3 text-[14px] leading-relaxed text-[var(--dima-ink-soft)]">
                    <li>Pedido registrado directamente desde la ficha del producto.</li>
                    <li>Precio sujeto a validación comercial según disponibilidad y volumen.</li>
                    <li>Seguimiento centralizado desde el carrito y WhatsApp de Dima.</li>
                  </ul>
                </article>
              </div>
            </>
          )}
        </div>
      </section>

      <section className="relative z-10 pb-16">
        <div className="mx-auto w-full max-w-[1600px] px-5 sm:px-8 lg:px-10">
          <div className="mb-6">
            <p className="text-[12px] font-bold uppercase tracking-[0.12em] text-[var(--dima-primary)]">
              Más productos
            </p>
            <h2 className="mt-2 text-[30px] font-bold leading-tight text-[var(--dima-ink)]">
              Relacionados con esta selección
            </h2>
          </div>

          {isLoading ? (
            <div className="grid grid-cols-1 justify-items-center gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              {Array.from({ length: 4 }).map((_, index) => (
                <RelatedSkeletonCard key={index} index={index} />
              ))}
            </div>
          ) : relatedProducts.length > 0 ? (
            <div className="grid grid-cols-1 justify-items-center gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              {relatedProducts.map((related) => (
                <RelatedProductCard key={related.slug} product={related} />
              ))}
            </div>
          ) : (
            <div className="rounded-[24px] border border-[var(--dima-line)] bg-white px-8 py-12 text-center text-[var(--dima-ink-soft)] shadow-[0_10px_26px_rgba(15,23,42,0.08)]">
              No hay productos relacionados por el momento.
            </div>
          )}
        </div>
      </section>
    </div>
  );
}

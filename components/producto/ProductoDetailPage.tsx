"use client";

/* eslint-disable @next/next/no-img-element */
import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";
import { getMarcasList, getProductoDetalle, ProductoDetailItem } from "@/lib/api";
import Breadcrumbs from "@/components/Breadcrumbs";
import { trackProductView } from "@/lib/analytics/ga4";
import ProductoHero from "./ProductoHero";
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
    <div className="rounded-[26px] bg-[#EFEFEF] p-5 shadow-[0_16px_36px_rgba(15,23,42,0.12)]">
      <div className="grid gap-4 xl:grid-cols-[46px_88px_minmax(0,1fr)_360px]">
        <div className="h-10 w-10 animate-pulse rounded-full bg-slate-300" />
        <div className="flex gap-2 xl:flex-col">
          {Array.from({ length: 4 }).map((_, index) => (
            <div
              key={`thumb-skeleton-${index}`}
              className="h-16 w-16 animate-pulse rounded-[10px] bg-slate-300"
            />
          ))}
        </div>
        <div className="h-[300px] animate-pulse rounded-[20px] bg-slate-300 sm:h-[380px] lg:h-[430px]" />
        <div className="space-y-4 rounded-[20px] bg-[#E7E7E7] p-4">
          <div className="h-28 animate-pulse rounded-[14px] bg-slate-300" />
          <div className="h-36 animate-pulse rounded-[14px] bg-slate-300" />
          <div className="h-16 animate-pulse rounded-[14px] bg-slate-300" />
        </div>
      </div>
    </div>
  );
}

function RelatedSkeletonCard({ index }: { index: number }) {
  return (
    <div
      key={`related-loading-${index}`}
      className="h-full min-h-[398px] w-full max-w-[310px] animate-pulse rounded-[24px] bg-white shadow-[0_10px_26px_rgba(15,23,42,0.10)]"
    >
      <div className="h-[260px] rounded-t-[24px] bg-slate-200" />
      <div className="space-y-2 px-4 py-3">
        <div className="h-4 w-3/4 rounded bg-slate-200" />
        <div className="h-4 w-full rounded bg-slate-200" />
      </div>
      <div className="px-4 pb-4">
        <div className="mx-auto h-10 w-[190px] rounded-full bg-slate-200" />
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
  const [selectedImagePath, setSelectedImagePath] = useState<string | null>(null);
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

        const gallery = getProductoGalleryImages(response);
        setSelectedImagePath(gallery[0]?.path ?? null);

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
    if (galleryImages.length === 0) {
      setSelectedImagePath(null);
      return;
    }

    const exists = galleryImages.some((image) => image.path === selectedImagePath);
    if (!exists) {
      setSelectedImagePath(galleryImages[0].path);
    }
  }, [galleryImages, selectedImagePath]);

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
      skuDmc: product.sku_dmc ?? null,
    });
  }, [product]);

  const selectedImage =
    galleryImages.find((image) => image.path === selectedImagePath) ?? galleryImages[0] ?? null;

  const backHref = product?.marca?.slug ? `/marcas/${product.marca.slug}` : "/marcas";
  const fallbackImageUrl = "/assets/heros/producto_inside.png";
  const selectedImageUrl = selectedImage?.url || fallbackImageUrl;
  const selectedImageAlt =
    selectedImage?.alt || product?.alt_imagen?.trim() || product?.nombre || "Producto";
  const selectedImageTitle =
    selectedImage?.title || product?.title_imagen?.trim() || product?.nombre || "Producto";
  const priceLabel = product ? formatPriceOrFallback(product) : null;
  const shortDescription = formatSpecValue(product?.descripcion_corta) ?? "Sin descripción";
  const technicalDescription = formatSpecValue(product?.descripcion_tecnica);
  const productLabel = product?.nombre?.trim() || formatSlugTitle(slug) || "Producto";
  const brandLabel = product?.marca?.nombre?.trim() || "Marcas";

  const specs = [
    { label: "SKU", value: formatSpecValue(product?.sku) },
    { label: "SKU DMC", value: formatSpecValue(product?.sku_dmc) },
    { label: "Categoría", value: formatSpecValue(product?.categoria?.nombre) },
    { label: "Subcategoría", value: formatSpecValue(product?.subcategoria?.nombre) },
    { label: "Garantía", value: formatSpecValue(product?.garantia) },
  ].filter((item) => item.value);

  return (
    <div className="min-h-screen bg-[#E8E8E8]">
      <ProductoHero />

      <section className="bg-white py-8 md:py-10">
        <div className="mx-auto w-full max-w-[1500px] px-6 sm:px-8 lg:px-10">
          <Breadcrumbs
            className="mb-5"
            items={[
              { label: "Inicio", href: "/" },
              { label: "Marcas", href: "/marcas" },
              { label: brandLabel, href: backHref },
              { label: productLabel },
            ]}
          />

          {isLoading ? (
            <DetailSkeleton />
          ) : hasError || !product ? (
            <div className="rounded-[22px] bg-white px-8 py-14 text-center shadow-[0_16px_36px_rgba(15,23,42,0.12)]">
              <p className="text-lg text-[#5D6673]">No se pudo cargar el producto.</p>
              <Link
                href="/marcas"
                className="mt-6 inline-flex items-center gap-2 rounded-full border border-[#F54029] px-5 py-2 text-sm font-medium text-[#F54029] transition hover:bg-[#F54029] hover:text-white"
              >
                <ArrowLeftIcon />
                Volver a marcas
              </Link>
            </div>
          ) : (
            <div className="rounded-[26px] bg-[#EFEFEF] p-4 shadow-[0_16px_36px_rgba(15,23,42,0.12)] sm:p-5 lg:p-6">
              <div className="grid gap-4 xl:grid-cols-[46px_88px_minmax(0,1fr)_360px]">
                <div className="pt-1">
                  <Link
                    href={backHref}
                    className="inline-flex h-10 w-10 items-center justify-center rounded-full text-[#F54029] transition hover:bg-white/80"
                    aria-label="Volver"
                  >
                    <ArrowLeftIcon />
                  </Link>
                </div>

                <div className="flex gap-2 overflow-x-auto pb-1 xl:flex-col xl:overflow-x-visible">
                  {galleryImages.length > 0 ? (
                    galleryImages.map((image) => {
                      const isActive = image.path === selectedImage?.path;
                      const thumbSrc = image.url || fallbackImageUrl;
                      return (
                        <button
                          key={image.key}
                          type="button"
                          onClick={() => setSelectedImagePath(image.path)}
                          className={`h-16 w-16 shrink-0 overflow-hidden rounded-[10px] border bg-white p-1 transition ${
                            isActive
                              ? "border-[#F54029] shadow-[0_0_0_2px_rgba(245,64,41,0.25)]"
                              : "border-slate-200 hover:border-slate-300"
                          }`}
                          aria-label={`Ver imagen ${image.title}`}
                        >
                          <img
                            src={thumbSrc}
                            alt={image.alt}
                            title={image.title}
                            className="h-full w-full object-contain"
                            loading="lazy"
                          />
                        </button>
                      );
                    })
                  ) : (
                    <div className="h-16 w-16 overflow-hidden rounded-[10px] border border-slate-200">
                      <img
                        src={fallbackImageUrl}
                        alt={selectedImageAlt}
                        title={selectedImageTitle}
                        className="h-full w-full object-contain"
                        loading="lazy"
                      />
                    </div>
                  )}
                </div>

                <div className="group overflow-hidden rounded-[20px] bg-white/80 p-3">
                  <img
                    src={selectedImageUrl}
                    alt={selectedImageAlt}
                    title={selectedImageTitle}
                    className="h-[300px] w-full object-contain transition-transform duration-300 ease-out group-hover:scale-105 sm:h-[380px] lg:h-[430px]"
                    loading="lazy"
                  />
                </div>

                <aside className="flex h-full flex-col gap-4 rounded-[20px] bg-[#E7E7E7] p-4">
                  <div className="rounded-[14px] bg-[#EFEFEF] p-4">
                    <h2 className="text-[26px] font-semibold leading-tight text-[#2E3B52]">
                      {product.nombre}
                    </h2>
                    <p className="mt-2 text-[14px] leading-relaxed text-[#6B7280]">
                      {shortDescription}
                    </p>
                    {priceLabel ? (
                      <p className="mt-4 text-[28px] font-semibold leading-none text-[#56646F]">
                        {priceLabel}
                      </p>
                    ) : null}
                  </div>

                  <div className="rounded-[14px] bg-[#EFEFEF] p-4">
                    <h3 className="text-[18px] font-semibold text-[#3B4756]">
                      Especificaciones
                    </h3>
                    <ul className="mt-2 space-y-1.5 text-[13px] leading-snug text-[#667180]">
                      {technicalDescription ? (
                        <li>
                          <span className="font-semibold text-[#4D5968]">Detalle técnico:</span>{" "}
                          {technicalDescription}
                        </li>
                      ) : null}
                      {specs.map((item) => (
                        <li key={item.label}>
                          <span className="font-semibold text-[#4D5968]">{item.label}:</span>{" "}
                          {item.value}
                        </li>
                      ))}
                    </ul>
                  </div>

                  <div className="mt-auto rounded-[14px] bg-white p-4">
                    <p className="text-[12px] font-semibold uppercase tracking-[0.06em] text-[#7B8390]">
                      Marca
                    </p>
                    {product.marca?.slug ? (
                      <Link
                        href={`/marcas/${product.marca.slug}`}
                        className="mt-2 flex items-center gap-3 rounded-[12px] bg-[#E9EEF4] px-3 py-2 transition hover:bg-[#DEE6F0]"
                      >
                        {brandLogo?.url ? (
                          <img
                            src={brandLogo.url}
                            alt={brandLogo.alt}
                            title={brandLogo.title}
                            className="h-9 w-auto max-w-[110px] object-contain"
                            loading="lazy"
                          />
                        ) : null}
                        <span className="text-[14px] font-medium text-[#3A4655]">
                          {brandLogo?.name || product.marca.nombre}
                        </span>
                      </Link>
                    ) : (
                      <p className="mt-2 text-[16px] font-semibold text-[#3A4655]">
                        {product.marca?.nombre || "Sin marca"}
                      </p>
                    )}
                  </div>
                </aside>
              </div>
            </div>
          )}
        </div>
      </section>

      <section className="bg-[#E8E8E8] py-12 pb-16">
        <div className="mx-auto w-full max-w-[1500px] px-6 sm:px-8 lg:px-10">
          <h2 className="text-center text-[22px] font-medium text-[#F54029]">
            Productos relacionados
          </h2>

          {isLoading ? (
            <div className="mt-6 grid grid-cols-1 justify-items-center gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              {Array.from({ length: 4 }).map((_, index) => (
                <RelatedSkeletonCard key={index} index={index} />
              ))}
            </div>
          ) : relatedProducts.length > 0 ? (
            <div className="mt-6 grid grid-cols-1 justify-items-center gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              {relatedProducts.map((related) => (
                <RelatedProductCard key={related.slug} product={related} />
              ))}
            </div>
          ) : (
            <div className="mt-6 rounded-[18px] bg-white px-8 py-12 text-center text-[#6B7280] shadow-[0_10px_26px_rgba(15,23,42,0.08)]">
              No hay productos relacionados.
            </div>
          )}
        </div>
      </section>
    </div>
  );
}

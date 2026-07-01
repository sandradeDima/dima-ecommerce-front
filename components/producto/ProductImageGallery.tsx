"use client";

/* eslint-disable @next/next/no-img-element */
import { useState, type MouseEvent } from "react";
import type { ProductoGalleryImage } from "./productoUtils";

type ProductImageGalleryProps = {
  images: ProductoGalleryImage[];
  fallbackImageUrl: string;
  productName: string;
};

type ZoomPosition = {
  x: number;
  y: number;
};

function clamp(value: number, min: number, max: number): number {
  return Math.min(Math.max(value, min), max);
}

export default function ProductImageGallery({
  images,
  fallbackImageUrl,
  productName,
}: ProductImageGalleryProps) {
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [zoomActive, setZoomActive] = useState(false);
  const [zoomPosition, setZoomPosition] = useState<ZoomPosition>({ x: 50, y: 50 });

  const safeSelectedIndex = images.length === 0 ? 0 : clamp(selectedIndex, 0, images.length - 1);
  const selectedImage = images[safeSelectedIndex] ?? null;
  const selectedImageUrl = selectedImage?.url || fallbackImageUrl;
  const selectedImageAlt = selectedImage?.alt || productName;
  const selectedImageTitle = selectedImage?.title || productName;

  const handlePointerMove = (event: MouseEvent<HTMLDivElement>) => {
    const rect = event.currentTarget.getBoundingClientRect();
    const x = ((event.clientX - rect.left) / rect.width) * 100;
    const y = ((event.clientY - rect.top) / rect.height) * 100;

    setZoomPosition({
      x: clamp(x, 0, 100),
      y: clamp(y, 0, 100),
    });
    setZoomActive(true);
  };

  const handlePointerLeave = () => {
    setZoomActive(false);
  };

  return (
    <div className="grid gap-5 lg:grid-cols-[96px_minmax(0,1fr)] lg:items-start">
      <div className="order-2 flex gap-3 overflow-x-auto pb-1 lg:order-1 lg:max-h-[560px] lg:flex-col lg:overflow-x-hidden lg:overflow-y-auto">
        {images.length > 0 ? (
          images.map((image, index) => {
            const isActive = index === safeSelectedIndex;
            const thumbSrc = image.url || fallbackImageUrl;

            return (
              <button
                key={image.key}
                type="button"
                onClick={() => {
                  setSelectedIndex(index);
                  setZoomActive(false);
                }}
                className={`relative h-[4.75rem] w-[4.75rem] shrink-0 overflow-hidden rounded-[20px] border bg-white/90 p-2 shadow-[0_12px_24px_rgba(18,44,108,0.08)] transition sm:h-[5.25rem] sm:w-[5.25rem] ${
                  isActive
                    ? "border-[var(--dima-primary)] shadow-[0_0_0_3px_rgba(37,76,169,0.16)]"
                    : "border-[var(--dima-line)] hover:border-[var(--dima-primary-soft)]"
                }`}
                aria-label={`Ver imagen ${index + 1} de ${images.length}`}
                aria-pressed={isActive}
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
          <div className="h-[4.75rem] w-[4.75rem] overflow-hidden rounded-[20px] border border-[var(--dima-line)] bg-white/90 p-2 shadow-[0_12px_24px_rgba(18,44,108,0.08)] sm:h-[5.25rem] sm:w-[5.25rem]">
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

      <div className="order-1 space-y-3 lg:order-2">
        <div className="overflow-hidden rounded-[32px] border border-white/70 bg-[linear-gradient(180deg,#f9fbff_0%,#edf4ff_100%)] p-4 shadow-[0_22px_46px_rgba(18,44,108,0.14)]">
          <div
            className="relative flex h-[320px] items-center justify-center overflow-hidden rounded-[24px] border border-white/75 bg-[radial-gradient(circle_at_top,rgba(255,255,255,0.92),rgba(230,239,255,0.88)_48%,rgba(215,228,255,0.94)_100%)] sm:h-[390px] lg:h-[500px] lg:cursor-zoom-in"
            onMouseMove={handlePointerMove}
            onMouseLeave={handlePointerLeave}
          >
            <div className="pointer-events-none absolute inset-x-10 bottom-5 h-10 rounded-full bg-[rgba(23,55,127,0.14)] blur-2xl" />
            <img
              src={selectedImageUrl}
              alt={selectedImageAlt}
              title={selectedImageTitle}
              className="relative h-full w-full object-contain p-4 drop-shadow-[0_20px_30px_rgba(18,44,108,0.16)]"
              loading="lazy"
            />

            <div
              className="pointer-events-none absolute inset-0 hidden rounded-[24px] bg-white transition-opacity duration-150 lg:block"
              style={{
                opacity: zoomActive ? 1 : 0,
                backgroundImage: `url(${selectedImageUrl})`,
                backgroundPosition: `${zoomPosition.x}% ${zoomPosition.y}%`,
                backgroundRepeat: "no-repeat",
                backgroundSize: "220%",
              }}
            />

            <div className="pointer-events-none absolute left-4 top-4 hidden rounded-full bg-white/94 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.12em] text-[var(--dima-primary)] shadow-sm lg:block">
              Pasa el cursor
            </div>

            {images.length > 1 ? (
              <div className="pointer-events-none absolute bottom-4 right-4 rounded-full bg-[var(--dima-primary)] px-3 py-1 text-[11px] font-medium text-white shadow-sm">
                {safeSelectedIndex + 1} / {images.length}
              </div>
            ) : null}
          </div>
        </div>

        <p className="text-xs text-[var(--dima-ink-soft)]">
          {images.length > 1
            ? "Usa las miniaturas para recorrer toda la galería del producto."
            : "Pasa el cursor sobre la imagen para verla con más detalle."}
        </p>
      </div>
    </div>
  );
}

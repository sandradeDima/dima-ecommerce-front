"use client";

/* eslint-disable @next/next/no-img-element */
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useCallback, useEffect, useMemo, useState } from "react";
import SmartSearchBar from "@/components/search/SmartSearchBar";
import { SearchSuggestionItem } from "@/lib/api";
import { getBanners, getInformacion, toPublicStorageUrl } from "@/lib/api";
import { getPageTypeFromPath, trackGenerateLead } from "@/lib/analytics/ga4";

type RawBannerRecord = Record<string, unknown>;

type HeroSlide = {
  id: string;
  imageUrl: string;
  title: string | null;
  alt: string;
};

const AUTOPLAY_INTERVAL_MS = 6000;
const SWIPE_THRESHOLD_PX = 48;
const LOREM_IPSUM_PATTERN = /\b(?:lorem|horem)\s+ipsum\b/i;

function asNonEmptyString(value: unknown): string | null {
  if (typeof value !== "string") return null;
  const trimmed = value.trim();

  return trimmed.length > 0 ? trimmed : null;
}

function sanitizeDbText(value: unknown): string {
  const text = asNonEmptyString(value);
  if (!text) return "";
  return LOREM_IPSUM_PATTERN.test(text) ? "" : text;
}

function mapToSlides(items: RawBannerRecord[]): HeroSlide[] {
  return items
    .map((item, index) => {
      const imagePath =
        asNonEmptyString(item.imagen_principal) ??
        asNonEmptyString(item.imagen_desktop) ??
        asNonEmptyString(item.imagen_mobile) ??
        asNonEmptyString(item.imagen) ??
        asNonEmptyString(item.image);

      if (!imagePath) return null;

      const imageUrl = toPublicStorageUrl(imagePath);
      if (!imageUrl) return null;

      const idValue = item.id;
      const id = idValue !== undefined ? String(idValue) : `hero-slide-${index}`;
      const title = asNonEmptyString(item.title_imagen);
      const alt =
        asNonEmptyString(item.alt_imagen) ??
        title ??
        `Banner principal ${index + 1}`;

      return {
        id,
        imageUrl,
        title,
        alt,
      };
    })
    .filter((slide): slide is HeroSlide => slide !== null);
}

async function fetchHeroSlides(signal: AbortSignal): Promise<HeroSlide[]> {
  if (signal.aborted) {
    throw new Error("Banner request aborted");
  }

  const items = await getBanners();

  if (signal.aborted) {
    throw new Error("Banner request aborted");
  }

  return mapToSlides(items as unknown as RawBannerRecord[]);
}

export default function HeroBanner() {
  const router = useRouter();
  const pathname = usePathname();
  const [slides, setSlides] = useState<HeroSlide[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [activeIndex, setActiveIndex] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const [failedSlideIds, setFailedSlideIds] = useState<string[]>([]);
  const [touchStartX, setTouchStartX] = useState<number | null>(null);
  const [touchEndX, setTouchEndX] = useState<number | null>(null);
  const [mainHeaderText, setMainHeaderText] = useState("");
  const [searchValue, setSearchValue] = useState("");

  useEffect(() => {
    const controller = new AbortController();

    const loadSlides = async () => {
      setIsLoading(true);
      setErrorMessage(null);

      try {
        const fetchedSlides = await fetchHeroSlides(controller.signal);
        setSlides(fetchedSlides);
      } catch {
        if (controller.signal.aborted) return;
        setSlides([]);
        setErrorMessage("No se pudieron cargar los banners en este momento.");
      } finally {
        if (!controller.signal.aborted) {
          setIsLoading(false);
        }
      }
    };

    void loadSlides();

    const loadMainHeaderText = async () => {
      try {
        const response = await getInformacion();
        if (controller.signal.aborted) return;

        setMainHeaderText(sanitizeDbText(response?.Informacion?.texto_home));
      } catch {
        if (controller.signal.aborted) return;
      }
    };

    void loadMainHeaderText();

    return () => controller.abort();
  }, []);

  const visibleSlides = useMemo(
    () => slides.filter((slide) => !failedSlideIds.includes(slide.id)),
    [slides, failedSlideIds],
  );

  useEffect(() => {
    if (activeIndex >= visibleSlides.length) {
      setActiveIndex(0);
    }
  }, [activeIndex, visibleSlides.length]);

  const hasCarousel = visibleSlides.length > 1;

  const goNext = useCallback(() => {
    setActiveIndex((current) =>
      visibleSlides.length === 0 ? 0 : (current + 1) % visibleSlides.length,
    );
  }, [visibleSlides.length]);

  const goPrev = useCallback(() => {
    setActiveIndex((current) =>
      visibleSlides.length === 0
        ? 0
        : (current - 1 + visibleSlides.length) % visibleSlides.length,
    );
  }, [visibleSlides.length]);

  useEffect(() => {
    if (!hasCarousel || isPaused) return;

    const timer = setInterval(goNext, AUTOPLAY_INTERVAL_MS);

    return () => clearInterval(timer);
  }, [goNext, hasCarousel, isPaused]);

  const handleImageError = useCallback((slideId: string) => {
    setFailedSlideIds((current) =>
      current.includes(slideId) ? current : [...current, slideId],
    );
  }, []);

  const onTouchStart = (event: React.TouchEvent<HTMLElement>) => {
    setTouchStartX(event.changedTouches[0]?.clientX ?? null);
    setTouchEndX(null);
    setIsPaused(true);
  };

  const onTouchMove = (event: React.TouchEvent<HTMLElement>) => {
    setTouchEndX(event.changedTouches[0]?.clientX ?? null);
  };

  const onTouchEnd = () => {
    if (touchStartX === null || touchEndX === null || !hasCarousel) {
      setIsPaused(false);
      return;
    }

    const delta = touchStartX - touchEndX;
    if (Math.abs(delta) > SWIPE_THRESHOLD_PX) {
      if (delta > 0) goNext();
      else goPrev();
    }

    setIsPaused(false);
  };

  const handleSearchSubmit = useCallback(
    (query: string) => {
      const normalized = query.trim();
      const params = new URLSearchParams();

      if (normalized) {
        params.set("q", normalized);
      }

      router.push(params.toString() ? `/catalogo?${params.toString()}` : "/catalogo");
    },
    [router],
  );

  const handleSearchSuggestionSelect = useCallback(
    (item: SearchSuggestionItem) => {
      if (!item.slug) return;
      router.push(`/producto/${item.slug}`);
    },
    [router],
  );

  /*
  const handleCotizarClick = useCallback(() => {
    trackGenerateLead({
      cta_name: "cotizar",
      page_type: getPageTypeFromPath(pathname ?? "/"),
      source_section: "home_hero",
    });
  }, [pathname]);
  */
  const showFallbackBackground = visibleSlides.length === 0;

  return (
    <section className="relative w-full min-h-[80px] mt-[80px]">
      {/* <div
        className="relative h-[360px] min-h-[320px] overflow-hidden bg-slate-900 sm:h-[440px] md:h-[560px] lg:h-[700px]"
        onMouseEnter={() => setIsPaused(true)}
        onMouseLeave={() => setIsPaused(false)}
        onTouchStart={onTouchStart}
        onTouchMove={onTouchMove} 
        onTouchEnd={onTouchEnd}
      >
        {showFallbackBackground ? (
          <div className="absolute inset-0 bg-[linear-gradient(120deg,#1f2a37,#3b4c5f)]" />
        ) : (
          visibleSlides.map((slide, index) => (
            <img
              key={slide.id}
              src={slide.imageUrl}
              alt={slide.alt}
              className={`absolute inset-0 h-full w-full object-cover object-center transition-opacity duration-700 ${index === activeIndex ? "opacity-100" : "opacity-0"
                }`}
              onError={() => handleImageError(slide.id)}
              loading={index === 0 ? "eager" : "lazy"}
            />
          ))
        )}

        <div className="absolute inset-0 bg-black/10" />
        <div className="absolute inset-y-0 left-0 w-full bg-[linear-gradient(90deg,rgba(68,68,68,0.92)_0%,rgba(68,68,68,0.66)_20%,rgba(68,68,68,0.28)_40%,rgba(68,68,68,0)_58%)] lg:w-[596px]" />

        <div className="absolute inset-0 z-10 flex items-start px-6 pt-[118px] sm:px-8 sm:pt-[136px] md:pt-[170px] lg:px-0 lg:pt-[297px]">
          <div className="max-w-[425px] lg:ml-[47px]">
             <h1 className="text-[24px] leading-[1.2] font-normal text-white sm:text-[27px] lg:text-[30.185px]">
              {mainHeaderText}
            </h1>  

       <Link
              href="/cotizar"
              onClick={handleCotizarClick}
              className="mt-6 inline-flex h-[49.954px] w-[191px] items-center justify-center rounded-[19.1px] bg-[#ef4f39] text-[18px] font-normal text-white transition-colors hover:bg-[#de3f2a] lg:text-[22.175px]"
            >
              Cotiza ahora
            </Link>  

      {isLoading && (
        <p className="mt-3 text-xs text-white/75">Cargando banners...</p>
      )}

      {!isLoading && errorMessage && (
        <p className="mt-3 text-xs text-rose-200">{errorMessage}</p>
      )}
    </div>
        </div >

    { hasCarousel && (
      <div className="absolute bottom-4 left-5 z-20 flex h-[37px] items-center gap-1 sm:left-7 lg:bottom-[23px] lg:left-[47px]">
        <button
          type="button"
          onClick={goPrev}
          aria-label="Slide anterior"
          className="flex h-[37px] w-[24px] items-center justify-center text-[36px] leading-none text-white/90 transition-opacity hover:opacity-75"
        >
          &#8249;
        </button>

        <div className="flex items-center gap-1.5">
          {visibleSlides.map((slide, index) => (
            <button
              key={slide.id}
              type="button"
              aria-label={`Ir al slide ${index + 1}`}
              onClick={() => setActiveIndex(index)}
              className={`h-[8px] w-[8px] rounded-full transition-all ${index === activeIndex
                ? "bg-[#ef4f39]"
                : "bg-white/80 hover:bg-white"
                }`}
            />
          ))}
        </div>

        <button
          type="button"
          onClick={goNext}
          aria-label="Siguiente slide"
          className="flex h-[37px] w-[24px] items-center justify-center text-[36px] leading-none text-white/90 transition-opacity hover:opacity-75"
        >
          &#8250;
        </button>
      </div>
    )
}
      </div > */}

      <div className="pointer-events-none absolute inset-x-0 bottom-0 z-30 flex translate-y-1/2 justify-center px-4">
        <SmartSearchBar
          value={searchValue}
          onValueChange={setSearchValue}
          onSubmit={handleSearchSubmit}
          onSuggestionSelect={handleSearchSuggestionSelect}
          placeholder="Buscar productos"
          ariaLabel="Buscar productos"
          className="pointer-events-auto w-full max-w-[773px]"
          formClassName="flex h-[58px] w-full items-center rounded-[42px] bg-[#eeeeee] pl-6 pr-3 shadow-[0px_3.387px_10.329px_0px_rgba(0,0,0,0.17)] md:h-[70px] md:pl-8 md:pr-4 lg:h-[82.973px]"
          inputClassName="w-full bg-transparent text-[16px] font-light tracking-[0.2px] text-[#5f6773] placeholder:text-[16px] placeholder:font-light placeholder:text-[#9da5b0] focus:outline-none md:text-[19px] md:placeholder:text-[19px] lg:text-[21.963px] lg:tracking-[0.439px] lg:placeholder:text-[21.963px]"
          buttonClassName="flex h-[38px] w-[38px] items-center justify-center rounded-full text-[#ef4f39] transition-colors hover:bg-[#e2e2e2]"
          dropdownClassName="top-full mt-2"
        />
      </div>
    </section >
  );
}

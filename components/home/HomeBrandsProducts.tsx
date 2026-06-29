"use client";

import { useEffect, useMemo, useState } from "react";
import { getMarcasInicio, getProductosInicio, Marca, ProductoBase } from "@/lib/api";
import BrandsMarquee, { MarcaInicioItem } from "./BrandsMarquee";
import HomeProductsSection from "./HomeProductsSection";
import { ProductoInicioItem } from "./ProductCard";

function normalizeMarca(item: Marca): MarcaInicioItem | null {
  if (!item.slug || !item.nombre) return null;

  return {
    id: item.id,
    nombre: item.nombre,
    descripcion: item.descripcion ?? null,
    url_sitio_web: item.url_sitio_web ?? null,
    slug: item.slug,
    estado: item.estado ?? "inactivo",
    imagen_principal: item.imagen_principal ?? "",
    title_imagen: item.title_imagen ?? null,
    alt_imagen: item.alt_imagen ?? null,
  };
}

function normalizeProducto(item: ProductoBase): ProductoInicioItem | null {
  if (!item.slug || !item.nombre) return null;

  return {
    id: item.id,
    nombre: item.nombre,
    descripcion_corta: item.descripcion_corta ?? null,
    imagen_principal: item.imagen_principal ?? "",
    destacado: item.destacado ? 1 : 0,
    title_imagen: item.title_imagen ?? null,
    alt_imagen: item.alt_imagen ?? null,
    slug: item.slug,
  };
}

export default function HomeBrandsProducts() {
  const [brands, setBrands] = useState<MarcaInicioItem[]>([]);
  const [isBrandsLoading, setIsBrandsLoading] = useState(true);
  const [hasBrandsError, setHasBrandsError] = useState(false);

  const [nuevos, setNuevos] = useState<ProductoInicioItem[]>([]);
  const [destacados, setDestacados] = useState<ProductoInicioItem[]>([]);
  const [isProductsLoading, setIsProductsLoading] = useState(true);
  const [hasProductsError, setHasProductsError] = useState(false);

  useEffect(() => {
    let isCancelled = false;

    const loadBrands = async () => {
      setIsBrandsLoading(true);
      setHasBrandsError(false);

      try {
        const response = await getMarcasInicio({ per_page: 40 });
        if (isCancelled) return;

        const normalized = response.data
          .map(normalizeMarca)
          .filter((item): item is MarcaInicioItem => item !== null)
          .filter((item) => item.estado === "activo")
          .filter((item) => item.imagen_principal.trim() !== "");

        setBrands(normalized);
      } catch {
        if (!isCancelled) {
          setHasBrandsError(true);
          setBrands([]);
        }
      } finally {
        if (!isCancelled) {
          setIsBrandsLoading(false);
        }
      }
    };

    void loadBrands();

    return () => {
      isCancelled = true;
    };
  }, []);

  useEffect(() => {
    let isCancelled = false;

    const loadProducts = async () => {
      setIsProductsLoading(true);
      setHasProductsError(false);

      try {
        const response = await getProductosInicio();
        if (isCancelled) return;

        const normalizedNuevos = response.productosNuevos
          .map(normalizeProducto)
          .filter((item): item is ProductoInicioItem => item !== null);

        const normalizedDestacados = response.productosDestacados
          .map(normalizeProducto)
          .filter((item): item is ProductoInicioItem => item !== null);

        setNuevos(normalizedNuevos);
        setDestacados(normalizedDestacados);
      } catch {
        if (!isCancelled) {
          setHasProductsError(true);
          setNuevos([]);
          setDestacados([]);
        }
      } finally {
        if (!isCancelled) {
          setIsProductsLoading(false);
        }
      }
    };

    void loadProducts();

    return () => {
      isCancelled = true;
    };
  }, []);

  const shouldRenderBrands = useMemo(
    () => isBrandsLoading || (!hasBrandsError && brands.length > 0),
    [brands.length, hasBrandsError, isBrandsLoading],
  );

  return (
    <section className="bg-white pt-20 pb-12">
      {shouldRenderBrands && (
        <BrandsMarquee
          brands={brands}
          isLoading={isBrandsLoading}
          hasError={hasBrandsError}
        />
      )}

      <div className="mx-auto w-full max-w-[1700px] px-6 sm:px-10 lg:px-16 xl:px-20">
        <HomeProductsSection
          nuevos={nuevos}
          destacados={destacados}
          isLoading={isProductsLoading}
          hasError={hasProductsError}
        />
      </div>
    </section>
  );
}

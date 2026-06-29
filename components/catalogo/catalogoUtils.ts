import { ProductoItem } from "@/lib/api";

export type FilterOption = {
  id: number;
  nombre: string;
};

export type CatalogoFilters = {
  nombre: string;
  marca: number | "";
  categoria: number | "";
  nuevo: "" | 1;
  destacado: "" | 1;
  page: number;
};

export function parsePageValue(raw: string | null): number {
  const parsed = Number(raw);
  if (!Number.isFinite(parsed) || parsed < 1) return 1;

  return Math.floor(parsed);
}

export function parseNumberFilter(raw: string | null): number | "" {
  if (!raw) return "";

  const parsed = Number(raw);
  if (!Number.isFinite(parsed) || parsed <= 0) return "";

  return Math.floor(parsed);
}

export function parseToggleFilter(raw: string | null): "" | 1 {
  if (!raw) return "";

  const value = raw.trim().toLowerCase();
  return value === "1" || value === "si" || value === "true" ? 1 : "";
}

export function buildProductosQuery(filters: CatalogoFilters): string {
  const params = new URLSearchParams();

  if (filters.nombre.trim()) {
    params.set("q", filters.nombre.trim());
  }

  if (filters.marca) {
    params.set("marca", String(filters.marca));
  }

  if (filters.categoria) {
    params.set("categoria", String(filters.categoria));
  }

  if (filters.nuevo) {
    params.set("nuevo", String(filters.nuevo));
  }

  if (filters.destacado) {
    params.set("destacado", String(filters.destacado));
  }

  if (filters.page > 1) {
    params.set("page", String(filters.page));
  }

  return params.toString();
}

export function filterActiveProducts(items: ProductoItem[]): ProductoItem[] {
  return items.filter((item) => {
    if (!Object.prototype.hasOwnProperty.call(item, "estado")) return true;
    const estado = (item as ProductoItem & { estado?: string }).estado;
    if (!estado) return true;

    return estado.toLowerCase() === "activo";
  });
}

export function extractUniqueBrands(items: ProductoItem[]): FilterOption[] {
  const map = new Map<number, FilterOption>();

  for (const item of items) {
    const id = item.marca_id ?? item.marca?.id;
    const nombre = item.marca?.nombre?.trim();

    if (!id || !nombre) continue;
    if (!map.has(id)) {
      map.set(id, { id, nombre });
    }
  }

  return Array.from(map.values()).sort((a, b) =>
    a.nombre.localeCompare(b.nombre, "es", { sensitivity: "base" }),
  );
}

export function extractUniqueCategorias(items: ProductoItem[]): FilterOption[] {
  const map = new Map<number, FilterOption>();

  for (const item of items) {
    const id = item.categoria_id ?? item.categoria?.id;
    const nombre = item.categoria?.nombre?.trim();

    if (!id || !nombre) continue;
    if (!map.has(id)) {
      map.set(id, { id, nombre });
    }
  }

  return Array.from(map.values()).sort((a, b) =>
    a.nombre.localeCompare(b.nombre, "es", { sensitivity: "base" }),
  );
}

export function mergeUniqueOptions(
  primary: FilterOption[],
  secondary: FilterOption[],
): FilterOption[] {
  const map = new Map<number, FilterOption>();

  for (const option of primary) {
    map.set(option.id, option);
  }

  for (const option of secondary) {
    if (!map.has(option.id)) {
      map.set(option.id, option);
    }
  }

  return Array.from(map.values()).sort((a, b) =>
    a.nombre.localeCompare(b.nombre, "es", { sensitivity: "base" }),
  );
}

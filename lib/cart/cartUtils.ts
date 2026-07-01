import type { InformacionItem } from "@/lib/api";
import { toPublicStorageUrl } from "@/lib/api";
import type {
  CartEntityLike,
  CartItem,
  CartProductSource,
  CartTotals,
  CheckoutFieldErrors,
  CheckoutFormValues,
} from "./cartTypes";

export const CART_STORAGE_KEY = "dima_local_cart_v1";

const currencyFormatter = new Intl.NumberFormat("es-BO", {
  minimumFractionDigits: 0,
  maximumFractionDigits: 2,
});

function asRecord(value: unknown): Record<string, unknown> | null {
  return typeof value === "object" && value !== null ? (value as Record<string, unknown>) : null;
}

function cleanText(value: unknown): string | null {
  if (typeof value !== "string") {
    return null;
  }

  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : null;
}

function cleanId(value: unknown): string | number | null {
  if (typeof value === "number" && Number.isFinite(value)) {
    return value;
  }

  if (typeof value === "string") {
    const trimmed = value.trim();
    return trimmed.length > 0 ? trimmed : null;
  }

  return null;
}

function cleanNumber(value: unknown): number | null {
  if (typeof value === "number" && Number.isFinite(value)) {
    return value;
  }

  if (typeof value === "string") {
    const normalized = value.replace(/[^0-9,.-]/g, "").replace(",", ".").trim();
    if (!normalized) {
      return null;
    }

    const parsed = Number(normalized);
    return Number.isFinite(parsed) ? parsed : null;
  }

  return null;
}

function cleanBoolean(value: unknown): boolean {
  if (typeof value === "boolean") {
    return value;
  }

  if (typeof value === "number") {
    return value === 1;
  }

  if (typeof value === "string") {
    const normalized = value.trim().toLowerCase();
    return normalized === "1" || normalized === "true" || normalized === "si";
  }

  return false;
}

function normalizeQuantity(quantity: number): number {
  if (!Number.isFinite(quantity)) {
    return 1;
  }

  return Math.max(1, Math.min(999, Math.round(quantity)));
}

function resolveEntity(entity: CartEntityLike): {
  name: string | null;
  slug: string | null;
} {
  if (!entity) {
    return { name: null, slug: null };
  }

  if (typeof entity === "string") {
    return {
      name: cleanText(entity),
      slug: null,
    };
  }

  return {
    name: cleanText(entity.nombre ?? entity.name),
    slug: cleanText(entity.slug),
  };
}

function resolvePriceData(source: CartProductSource): {
  unitPrice: number | null;
  unitPriceLabel: string | null;
  unitPriceType: "precio" | "precio_referencial" | "custom" | null;
} {
  const directPrice = cleanNumber(source.precio);
  if (directPrice !== null) {
    return {
      unitPrice: directPrice,
      unitPriceLabel: formatCurrency(directPrice),
      unitPriceType: "precio",
    };
  }

  const directText = cleanText(source.precio);
  if (directText) {
    return {
      unitPrice: null,
      unitPriceLabel: directText,
      unitPriceType: "custom",
    };
  }

  const referentialPrice = cleanNumber(source.precio_referencial);
  if (referentialPrice !== null) {
    return {
      unitPrice: referentialPrice,
      unitPriceLabel: formatCurrency(referentialPrice),
      unitPriceType: "precio_referencial",
    };
  }

  const referentialText = cleanText(source.precio_referencial);
  if (referentialText) {
    return {
      unitPrice: null,
      unitPriceLabel: referentialText,
      unitPriceType: "custom",
    };
  }

  return {
    unitPrice: null,
    unitPriceLabel: null,
    unitPriceType: null,
  };
}

function resolveProductPath(slug: string, explicitPath?: string | null): string {
  const cleanPath = cleanText(explicitPath);

  if (cleanPath) {
    if (cleanPath.startsWith("http://") || cleanPath.startsWith("https://")) {
      try {
        const parsed = new URL(cleanPath);
        return parsed.pathname || `/producto/${slug}`;
      } catch {
        return `/producto/${slug}`;
      }
    }

    return cleanPath.startsWith("/") ? cleanPath : `/${cleanPath}`;
  }

  return `/producto/${slug}`;
}

function buildAbsoluteUrl(path: string, explicitUrl?: string | null): string {
  const cleanUrl = cleanText(explicitUrl);
  if (cleanUrl) {
    return cleanUrl;
  }

  if (typeof window !== "undefined" && window.location.origin) {
    try {
      return new URL(path, window.location.origin).toString();
    } catch {
      return path;
    }
  }

  return path;
}

function coerceStoredCartItem(value: unknown): CartItem | null {
  const record = asRecord(value);
  if (!record) {
    return null;
  }

  const cartKey = cleanText(record.cartKey);
  const nombre = cleanText(record.nombre);
  const slug = cleanText(record.slug);
  const id = cleanId(record.id);
  const quantity = cleanNumber(record.quantity);

  if (!cartKey || !nombre || !slug || id === null || quantity === null) {
    return null;
  }

  return {
    cartKey,
    id,
    nombre,
    slug,
    sku: cleanText(record.sku),
    skuDima: cleanText(record.skuDima),
    marca: cleanText(record.marca),
    marcaSlug: cleanText(record.marcaSlug),
    categoria: cleanText(record.categoria),
    categoriaSlug: cleanText(record.categoriaSlug),
    subcategoria: cleanText(record.subcategoria),
    subcategoriaSlug: cleanText(record.subcategoriaSlug),
    unitPrice: cleanNumber(record.unitPrice),
    unitPriceLabel: cleanText(record.unitPriceLabel),
    unitPriceType:
      record.unitPriceType === "precio" ||
      record.unitPriceType === "precio_referencial" ||
      record.unitPriceType === "custom"
        ? record.unitPriceType
        : null,
    imagenUrl: cleanText(record.imagenUrl),
    imagenPath: cleanText(record.imagenPath),
    altImagen: cleanText(record.altImagen),
    titleImagen: cleanText(record.titleImagen),
    descripcionCorta: cleanText(record.descripcionCorta),
    garantia: cleanText(record.garantia),
    destacado: cleanBoolean(record.destacado),
    estado: cleanText(record.estado),
    productPath: resolveProductPath(slug, cleanText(record.productPath)),
    productUrl: buildAbsoluteUrl(
      resolveProductPath(slug, cleanText(record.productPath)),
      cleanText(record.productUrl),
    ),
    quantity: normalizeQuantity(quantity),
  };
}

export function parseStoredCartItems(rawValue: string | null): CartItem[] {
  if (!rawValue) {
    return [];
  }

  try {
    const parsed = JSON.parse(rawValue);
    if (!Array.isArray(parsed)) {
      return [];
    }

    return parsed
      .map((item) => coerceStoredCartItem(item))
      .filter((item): item is CartItem => item !== null);
  } catch {
    return [];
  }
}

export function formatCurrency(value: number): string {
  return `${currencyFormatter.format(value)} Bs.`;
}

export function formatCartLinePrice(item: CartItem): string {
  if (item.unitPriceLabel) {
    return item.unitPriceLabel;
  }

  return "Consultar precio";
}

export function formatCartLineSubtotal(item: CartItem): string {
  if (item.unitPrice === null) {
    return "Consultar precio";
  }

  return formatCurrency(item.unitPrice * item.quantity);
}

export function calculateCartTotals(items: CartItem[]): CartTotals {
  return items.reduce<CartTotals>(
    (totals, item) => {
      totals.totalQuantity += item.quantity;
      totals.uniqueItemsCount += 1;

      if (item.unitPrice === null) {
        totals.unpricedItemsCount += 1;
        totals.hasUnpricedItems = true;
      } else {
        totals.pricedItemsCount += 1;
        totals.subtotal += item.unitPrice * item.quantity;
        totals.hasPricedItems = true;
      }

      return totals;
    },
    {
      totalQuantity: 0,
      uniqueItemsCount: 0,
      pricedItemsCount: 0,
      unpricedItemsCount: 0,
      subtotal: 0,
      hasPricedItems: false,
      hasUnpricedItems: false,
    },
  );
}

export function buildCartItemFromProduct(
  source: CartProductSource,
  options?: {
    quantity?: number;
    imageUrl?: string | null;
    imagePath?: string | null;
    productPath?: string | null;
    productUrl?: string | null;
  },
): CartItem | null {
  const id = cleanId(source.id);
  const nombre = cleanText(source.nombre ?? source.name);
  const slug = cleanText(source.slug);

  if (id === null || !nombre || !slug) {
    return null;
  }

  const marca = resolveEntity(source.marca);
  const categoria = resolveEntity(source.categoria);
  const subcategoria = resolveEntity(source.subcategoria);
  const priceData = resolvePriceData(source);
  const imagePath = cleanText(options?.imagePath) ?? cleanText(source.imagen_principal);
  const productPath = resolveProductPath(slug, options?.productPath ?? source.productPath);

  return {
    cartKey: String(id),
    id,
    nombre,
    slug,
    sku: cleanText(source.sku),
    skuDima: cleanText(source.sku_dima),
    marca: marca.name,
    marcaSlug: marca.slug,
    categoria: categoria.name,
    categoriaSlug: categoria.slug,
    subcategoria: subcategoria.name,
    subcategoriaSlug: subcategoria.slug,
    unitPrice: priceData.unitPrice,
    unitPriceLabel: priceData.unitPriceLabel,
    unitPriceType: priceData.unitPriceType,
    imagenUrl: cleanText(options?.imageUrl) ?? toPublicStorageUrl(imagePath),
    imagenPath: imagePath,
    altImagen: cleanText(source.alt_imagen),
    titleImagen: cleanText(source.title_imagen),
    descripcionCorta: cleanText(source.descripcion_corta),
    garantia: cleanText(source.garantia),
    destacado: cleanBoolean(source.destacado),
    estado: cleanText(source.estado),
    productPath,
    productUrl: buildAbsoluteUrl(productPath, options?.productUrl ?? source.productUrl),
    quantity: normalizeQuantity(options?.quantity ?? 1),
  };
}

export function mergeCartItems(currentItem: CartItem, nextItem: CartItem): CartItem {
  return {
    ...currentItem,
    ...nextItem,
    quantity: normalizeQuantity(currentItem.quantity + nextItem.quantity),
    nombre: nextItem.nombre || currentItem.nombre,
    slug: nextItem.slug || currentItem.slug,
    sku: nextItem.sku ?? currentItem.sku,
    skuDima: nextItem.skuDima ?? currentItem.skuDima,
    marca: nextItem.marca ?? currentItem.marca,
    marcaSlug: nextItem.marcaSlug ?? currentItem.marcaSlug,
    categoria: nextItem.categoria ?? currentItem.categoria,
    categoriaSlug: nextItem.categoriaSlug ?? currentItem.categoriaSlug,
    subcategoria: nextItem.subcategoria ?? currentItem.subcategoria,
    subcategoriaSlug: nextItem.subcategoriaSlug ?? currentItem.subcategoriaSlug,
    unitPrice: nextItem.unitPrice ?? currentItem.unitPrice,
    unitPriceLabel: nextItem.unitPriceLabel ?? currentItem.unitPriceLabel,
    unitPriceType: nextItem.unitPriceType ?? currentItem.unitPriceType,
    imagenUrl: nextItem.imagenUrl ?? currentItem.imagenUrl,
    imagenPath: nextItem.imagenPath ?? currentItem.imagenPath,
    altImagen: nextItem.altImagen ?? currentItem.altImagen,
    titleImagen: nextItem.titleImagen ?? currentItem.titleImagen,
    descripcionCorta: nextItem.descripcionCorta ?? currentItem.descripcionCorta,
    garantia: nextItem.garantia ?? currentItem.garantia,
    destacado: nextItem.destacado || currentItem.destacado,
    estado: nextItem.estado ?? currentItem.estado,
    productPath: nextItem.productPath || currentItem.productPath,
    productUrl: nextItem.productUrl || currentItem.productUrl,
  };
}

export function normalizeWhatsAppNumber(rawValue: string | null | undefined): string | null {
  const cleanValue = cleanText(rawValue);
  if (!cleanValue) {
    return null;
  }

  const digitsOnly = cleanValue.replace(/\D+/g, "");
  if (digitsOnly.length < 8) {
    return null;
  }

  return digitsOnly;
}

export function normalizePhonePrefix(rawValue: string | null | undefined): string {
  const cleanValue = cleanText(rawValue);
  if (!cleanValue) {
    return "+591";
  }

  const digitsOnly = cleanValue.replace(/\D+/g, "");
  return digitsOnly ? `+${digitsOnly}` : "+591";
}

export function buildFullPhoneNumber(values: Pick<CheckoutFormValues, "phonePrefix" | "phone">): string {
  const prefix = normalizePhonePrefix(values.phonePrefix);
  const phone = values.phone.trim().replace(/\s+/g, "");

  return `${prefix} ${phone}`.trim();
}

export function resolveCompanyWhatsappNumber(
  info: (InformacionItem & {
    whatsapp?: string | null;
    numero_whatsapp?: string | null;
  }) | null,
): string | null {
  const candidates = [
    info?.whatsapp,
    info?.numero_whatsapp,
    info?.telefono,
  ];

  for (const candidate of candidates) {
    const normalized = normalizeWhatsAppNumber(candidate);
    if (normalized) {
      return normalized;
    }
  }

  return null;
}

export function getCompanyWhatsappLabel(
  info: (InformacionItem & {
    whatsapp?: string | null;
    numero_whatsapp?: string | null;
  }) | null,
): string | null {
  return cleanText(info?.whatsapp) ?? cleanText(info?.numero_whatsapp) ?? cleanText(info?.telefono);
}

export function resolveAbsoluteProductUrl(item: CartItem, origin: string): string {
  const productPath = resolveProductPath(item.slug, item.productPath);

  try {
    return new URL(productPath, origin).toString();
  } catch {
    return item.productUrl || productPath;
  }
}

export function validateCheckoutForm(values: CheckoutFormValues): CheckoutFieldErrors {
  const errors: CheckoutFieldErrors = {};

  if (!values.name.trim()) {
    errors.name = "Ingresa tu nombre.";
  }

  if (!values.phonePrefix.trim()) {
    errors.phonePrefix = "Ingresa el prefijo.";
  }

  if (!values.phone.trim()) {
    errors.phone = "Ingresa tu telefono.";
  }

  if (!values.city.trim()) {
    errors.city = "Ingresa tu ciudad.";
  }

  if (!values.address.trim()) {
    errors.address = "Ingresa tu direccion.";
  }

  return errors;
}

export function buildWhatsAppCheckoutMessage(params: {
  items: CartItem[];
  values: CheckoutFormValues;
  origin: string;
}): string {
  const { items, values, origin } = params;
  const totals = calculateCartTotals(items);
  const lines: string[] = [
    "Nuevo pedido desde la web DIMA",
    "",
    "Datos del cliente:",
    `Nombre: ${values.name.trim()}`,
    `Telefono: ${buildFullPhoneNumber(values)}`,
    `Ciudad: ${values.city.trim()}`,
    `Ubicacion: ${values.location.trim() || "-"}`,
    `Direccion: ${values.address.trim()}`,
    `NIT: ${values.nit.trim() || "-"}`,
    `Razon social: ${values.razonSocial.trim() || "-"}`,
    `Notas: ${values.notes.trim() || "-"}`,
    "",
    "Productos:",
  ];

  items.forEach((item, index) => {
    lines.push(`${index + 1}. Producto: ${item.nombre}`);

    if (item.skuDima) {
      lines.push(`SKU Dima: ${item.skuDima}`);
    }

    if (item.sku && item.sku !== item.skuDima) {
      lines.push(`SKU: ${item.sku}`);
    }

    if (item.marca) {
      lines.push(`Marca: ${item.marca}`);
    }

    if (item.categoria) {
      lines.push(`Categoria: ${item.categoria}`);
    }

    if (item.subcategoria) {
      lines.push(`Subcategoria: ${item.subcategoria}`);
    }

    lines.push(`Precio: ${formatCartLinePrice(item)}`);
    lines.push(`Cantidad: ${item.quantity}`);
    lines.push(`Subtotal: ${formatCartLineSubtotal(item)}`);
    lines.push(`URL: ${resolveAbsoluteProductUrl(item, origin)}`);
    lines.push("");
  });

  lines.push("Resumen:");
  lines.push(`Total productos: ${totals.totalQuantity}`);
  lines.push(
    `Total estimado: ${
      totals.hasPricedItems ? formatCurrency(totals.subtotal) : "Consultar precio"
    }`,
  );
  lines.push(
    totals.hasUnpricedItems
      ? `Productos sin precio: ${totals.unpricedItemsCount} producto(s), consultar precio`
      : "Productos sin precio: Ninguno",
  );

  return lines.join("\n");
}

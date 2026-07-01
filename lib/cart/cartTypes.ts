export type CartEntityLike =
  | string
  | {
      id?: number | string | null;
      nombre?: string | null;
      name?: string | null;
      slug?: string | null;
    }
  | null
  | undefined;

export type CartProductSource = {
  id: number | string;
  nombre?: string | null;
  name?: string | null;
  slug?: string | null;
  sku?: string | null;
  sku_dima?: string | null;
  marca?: CartEntityLike;
  categoria?: CartEntityLike;
  subcategoria?: CartEntityLike;
  precio?: number | string | null;
  precio_referencial?: number | string | null;
  imagen_principal?: string | null;
  alt_imagen?: string | null;
  title_imagen?: string | null;
  descripcion_corta?: string | null;
  garantia?: string | null;
  destacado?: boolean | number | null;
  estado?: string | null;
  productPath?: string | null;
  productUrl?: string | null;
};

export type CartItem = {
  cartKey: string;
  id: number | string;
  nombre: string;
  slug: string;
  sku: string | null;
  skuDima: string | null;
  marca: string | null;
  marcaSlug: string | null;
  categoria: string | null;
  categoriaSlug: string | null;
  subcategoria: string | null;
  subcategoriaSlug: string | null;
  unitPrice: number | null;
  unitPriceLabel: string | null;
  unitPriceType: "precio" | "precio_referencial" | "custom" | null;
  imagenUrl: string | null;
  imagenPath: string | null;
  altImagen: string | null;
  titleImagen: string | null;
  descripcionCorta: string | null;
  garantia: string | null;
  destacado: boolean;
  estado: string | null;
  productPath: string;
  productUrl: string;
  quantity: number;
};

export type CartTotals = {
  totalQuantity: number;
  uniqueItemsCount: number;
  pricedItemsCount: number;
  unpricedItemsCount: number;
  subtotal: number;
  hasPricedItems: boolean;
  hasUnpricedItems: boolean;
};

export type CheckoutFormValues = {
  name: string;
  phonePrefix: string;
  phone: string;
  city: string;
  location: string;
  address: string;
  notes: string;
  nit: string;
  razonSocial: string;
};

export type CheckoutFieldErrors = Partial<Record<keyof CheckoutFormValues, string>>;

export type CartContextValue = {
  items: CartItem[];
  isHydrated: boolean;
  isDrawerOpen: boolean;
  cartCount: number;
  totals: CartTotals;
  addItem: (item: CartItem) => void;
  removeItem: (cartKey: string) => void;
  incrementItem: (cartKey: string) => void;
  decrementItem: (cartKey: string) => void;
  updateQuantity: (cartKey: string, quantity: number) => void;
  clearCart: () => void;
  openDrawer: () => void;
  closeDrawer: () => void;
  toggleDrawer: () => void;
};

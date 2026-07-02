export type ApiEnvelope<T> = {
  conError: boolean;
  mensaje: string | null;
  mensajeTecnico?: string;
  data: T;
};

export type PageLink = {
  url: string | null;
  label: string;
  page?: number | null;
  active: boolean;
};

export type Paginated<T> = {
  current_page: number;
  data: T[];
  first_page_url: string | null;
  from: number | null;
  last_page: number;
  last_page_url: string | null;
  links: PageLink[];
  next_page_url: string | null;
  path: string;
  per_page: number;
  prev_page_url: string | null;
  to: number | null;
  total: number;
};

export class PublicApiError extends Error {
  status: number;
  detalle?: string;

  constructor(message: string, status: number, detalle?: string) {
    super(message);
    this.name = "PublicApiError";
    this.status = status;
    this.detalle = detalle;
  }
}

type QueryValue = string | number | boolean | null | undefined;
type QueryParams = Record<string, QueryValue>;
type NextFetchOptions = {
  revalidate?: number | false;
  tags?: string[];
};

const DEFAULT_API_ORIGIN = "http://127.0.0.1:8000";
const PUBLIC_PREFIX = "/api/public";

function trimTrailingSlash(value: string): string {
  return value.replace(/\/+$/, "");
}

function getPublicApiBaseUrl(): string {
  const envBase =
    process.env.NEXT_PUBLIC_DMC_API_BASE_URL ??
    process.env.DMC_API_BASE_URL ??
    process.env.NEXT_PUBLIC_API_BASE_URL ??
    DEFAULT_API_ORIGIN;

  const clean = trimTrailingSlash(envBase);

  return clean.endsWith(PUBLIC_PREFIX) ? clean : `${clean}${PUBLIC_PREFIX}`;
}

function getApiOrigin(): string {
  const base = getPublicApiBaseUrl();

  return base.endsWith(PUBLIC_PREFIX)
    ? base.slice(0, -PUBLIC_PREFIX.length)
    : base;
}

function buildUrl(path: string, query?: QueryParams): string {
  const cleanPath = path.startsWith("/") ? path : `/${path}`;
  const url = new URL(`${getPublicApiBaseUrl()}${cleanPath}`);

  if (!query) return url.toString();

  Object.entries(query).forEach(([key, value]) => {
    if (value === null || value === undefined || value === "") return;
    url.searchParams.set(key, String(value));
  });

  return url.toString();
}

export async function requestPublicApi<T>(
  path: string,
  options?: {
    method?: "GET" | "POST";
    query?: QueryParams;
    body?: unknown;
    signal?: AbortSignal;
    cache?: RequestCache;
    next?: NextFetchOptions;
  },
): Promise<T> {
  const method = options?.method ?? "GET";
  const headers: HeadersInit = {
    Accept: "application/json",
  };

  let body: string | undefined;
  if (options?.body !== undefined) {
    headers["Content-Type"] = "application/json";
    body = JSON.stringify(options.body);
  }

  const response = await fetch(buildUrl(path, options?.query), {
    method,
    headers,
    body,
    signal: options?.signal,
    cache: options?.cache,
    next: options?.next,
  });

  let payload: ApiEnvelope<T> | null = null;
  try {
    payload = (await response.json()) as ApiEnvelope<T>;
  } catch {
    payload = null;
  }

  if (!payload) {
    throw new PublicApiError(
      `Invalid JSON response from ${path}`,
      response.status,
    );
  }

  if (!response.ok || payload.conError) {
    throw new PublicApiError(
      payload.mensaje ?? "Public API request failed",
      response.status,
      payload.mensajeTecnico,
    );
  }

  return payload.data;
}

export function toPublicStorageUrl(path?: string | null): string | null {
  if (!path) return null;
  if (path.startsWith("http://") || path.startsWith("https://")) return path;
  const origin = getApiOrigin();
  const normalized = path.replace(/^\/+/, "");

  if (normalized.startsWith("storage/")) {
    return `${origin}/${normalized}`;
  }

  return `${origin}/storage/${normalized}`;
}

export type BannerItem = {
  id: number;
  imagen_principal: string;
  title_imagen: string | null;
  alt_imagen: string | null;
  orden: number;
};

export type Marca = {
  id: number;
  nombre: string;
  descripcion: string | null;
  url_sitio_web: string | null;
  imagen_principal: string | null;
  title_imagen: string | null;
  alt_imagen: string | null;
  slug: string;
  estado: string;
  whatsapp?: string | null;
  telefono?: string | null;
  numero_whatsapp?: string | null;
  created_at?: string;
  updated_at?: string;
};

export type MarcaItem = {
  id: number;
  nombre: string;
  descripcion: string | null;
  url_sitio_web: string | null;
  slug: string;
  estado: string;
  imagen_principal: string | null;
  title_imagen: string | null;
  alt_imagen: string | null;
  whatsapp?: string | null;
  telefono?: string | null;
  numero_whatsapp?: string | null;
};

export type TopMarcaItem = MarcaItem & {
  productos_count: number;
};

export type PaginationLink = {
  url: string | null;
  label: string;
  page: number | null;
  active: boolean;
};

export type MarcasPaginationData = {
  current_page: number;
  data: MarcaItem[];
  first_page_url?: string | null;
  from?: number | null;
  last_page: number;
  last_page_url?: string | null;
  links: PaginationLink[];
  next_page_url: string | null;
  path?: string;
  per_page: number;
  prev_page_url: string | null;
  to?: number | null;
  total: number;
};

export type MarcasListResponse = {
  conError: boolean;
  mensaje: string;
  data: MarcasPaginationData;
};

export type Categoria = {
  id: number;
  nombre: string;
  descripcion: string | null;
  imagen_principal: string | null;
  title_imagen: string | null;
  alt_imagen: string | null;
  slug: string;
};

export type RedSocialItem = {
  id: number;
  nombre: string;
  slug: string;
  url: string | null;
  imagen_icono: string | null;
  estado: string;
  created_at?: string;
  updated_at?: string;
};

export type InformacionItem = {
  id: number;
  correo: string | null;
  telefono: string | null;
  whatsapp?: string | null;
  numero_whatsapp?: string | null;
  direccion: string | null;
  horario_trabajo: string | null;
  mensaje_despedida_chat: string | null;
  mensaje_bienvenida_chat: string | null;
  texto_home: string | null;
  ubicacion_mapa?: string | null;
  chat_menu_habilitado?: boolean | null;
};

export type InformacionResponse = {
  Informacion: InformacionItem | null;
  redes_sociales: RedSocialItem[];
};

export type ProductoBase = {
  id: number;
  nombre: string;
  descripcion_corta: string | null;
  imagen_principal: string | null;
  destacado: boolean;
  title_imagen: string | null;
  alt_imagen: string | null;
  slug: string;
};

export type ProductoCatalogo = ProductoBase & {
  marca_id: number;
  categoria_id: number;
  categoria?: { id: number; nombre: string };
  marca?: { id: number; nombre: string };
};

export type CheckoutPedidoItemPayload = {
  id: number | string;
  nombre: string;
  slug: string;
  sku?: string | null;
  sku_dima?: string | null;
  marca?: string | null;
  categoria?: string | null;
  subcategoria?: string | null;
  cantidad: number;
  precio_unitario?: number | null;
  precio_unitario_texto?: string | null;
  subtotal_texto?: string | null;
  url_producto?: string | null;
};

export type CheckoutPedidoPayload = {
  nombre: string;
  telefono_prefijo: string;
  telefono: string;
  ciudad: string;
  ubicacion?: string | null;
  direccion: string;
  notas?: string | null;
  nit?: string | null;
  razon_social?: string | null;
  items: CheckoutPedidoItemPayload[];
  resumen: {
    total_cantidad: number;
    total_items_unicos: number;
    items_con_precio: number;
    items_sin_precio: number;
    subtotal: number;
    tiene_items_con_precio: boolean;
    tiene_items_sin_precio: boolean;
  };
  meta?: {
    origen?: string | null;
    whatsapp_destino?: string | null;
    whatsapp_url?: string | null;
  };
};

export type CheckoutPedidoResponse = {
  id: number;
  slug: string;
  estado_pedido: string;
};

export type ProductoSubcategoria = {
  id: number;
  nombre: string;
  slug: string;
};

export type ProductoImagenExtra = {
  id: number;
  producto_id: number;
  ruta_imagen: string;
  orden: number | null;
};

export type ProductoRelacionadoItem = {
  id: number;
  nombre: string;
  descripcion_corta?: string | null;
  imagen_principal?: string | null;
  title_imagen?: string | null;
  alt_imagen?: string | null;
  slug: string;
  estado?: string;
  marca_id?: number | null;
};

export type ProductoDetailItem = {
  id: number;
  sku: string | null;
  sku_dima: string | null;
  moneda?: string | null;
  nombre: string;
  marca_id: number | null;
  categoria_id: number | null;
  subcategoria_id: number | null;
  imagen_principal: string | null;
  title_imagen: string | null;
  alt_imagen: string | null;
  descripcion_corta: string | null;
  descripcion_tecnica: string | null;
  garantia: string | null;
  destacado: number | boolean;
  precio?: number | string | null;
  precio_referencial?: number | string | null;
  slug: string;
  estado: string;
  created_at?: string;
  updated_at?: string;
  marca?: ProductoMarca | null;
  categoria?: ProductoCategoria | null;
  subcategoria?: ProductoSubcategoria | null;
  relacionados?: ProductoRelacionadoItem[];
  imagenes?: ProductoImagenExtra[];
};

export type ProductoDetalle = ProductoDetailItem;

export type ProductoDetailResponse = {
  conError: boolean;
  mensaje: string;
  data: ProductoDetailItem;
};

export type Subcategoria = {
  id: number;
  nombre: string;
  descripcion: string | null;
  slug: string;
  estado: string;
  categoria_id: number;
  created_at: string;
  updated_at: string;
};



export type Blog = {
  id: number;
  titulo: string;
  descripcion_corta: string;
  contenido: string;
  imagen_portada: string | null;
  title_imagen: string | null;
  alt_imagen: string | null;
  fecha_publicacion: string;
  autor_id: number;
  estado_blog: string;
  slug: string;
  estado: string;
  autor?: { id: number; name: string; email: string };
};

export type BlogAutor = {
  id: number;
  name: string;
  email: string;
};

export type BlogPostItem = {
  id: number;
  titulo: string;
  descripcion_corta: string | null;
  contenido: string | null;
  imagen_portada: string | null;
  title_imagen: string | null;
  alt_imagen: string | null;
  fecha_publicacion: string | null;
  estado_blog: string;
  estado: string;
  slug: string;
  autor_id: number | null;
  autor?: BlogAutor | null;
};

export type BlogPaginationLink = {
  url: string | null;
  label: string;
  page: number | null;
  active: boolean;
};

export type BlogPaginationData = {
  current_page: number;
  data: BlogPostItem[];
  first_page_url: string | null;
  from: number | null;
  last_page: number;
  last_page_url: string | null;
  links: BlogPaginationLink[];
  next_page_url: string | null;
  path: string;
  per_page: number;
  prev_page_url: string | null;
  to: number | null;
  total: number;
};

export type BlogInicio = {
  id: number;
  titulo: string;
  descripcion_corta: string;
  imagen_portada: string | null;
  title_imagen: string | null;
  alt_imagen: string | null;
  slug: string;
  fecha_publicacion: string;
  autor_id: number;
  autor?: { id: number; name: string; email: string };
};






export type BaseListQuery = {
  page?: number;
  per_page?: number;
};

export type MarcasQuery = BaseListQuery & {
  nombre?: string;
};

export type ProductosQuery = BaseListQuery & {
  nombre?: string;
  marca?: number | string;
  categoria?: number | string;
  nuevo?: "si" | "no";
  destacado?: "si" | "no";
};

export type ProductoCategoria = {
  id: number;
  nombre: string;
  slug?: string;
};

export type ProductoMarca = {
  id: number;
  nombre: string;
  slug?: string;
};

export type ProductoItem = {
  id: number;
  nombre: string;
  descripcion_corta: string | null;
  imagen_principal: string | null;
  destacado: number;
  title_imagen: string | null;
  alt_imagen: string | null;
  slug: string;
  sku?: string | null;
  sku_dima?: string | null;
  moneda?: string | null;
  precio?: number | string | null;
  precio_referencial?: number | string | null;
  precio_visible?: boolean | number | string | null;
  marca_id: number | null;
  categoria_id: number | null;
  subcategoria_id?: number | null;
  categoria?: ProductoCategoria | null;
  marca?: ProductoMarca | null;
  subcategoria?: ProductoSubcategoria | null;
  estado?: string;
};

export type ProductosPaginationData = {
  current_page: number;
  data: ProductoItem[];
  first_page_url?: string | null;
  from?: number | null;
  last_page: number;
  last_page_url?: string | null;
  links: PaginationLink[];
  next_page_url: string | null;
  path?: string;
  per_page: number;
  prev_page_url: string | null;
  to?: number | null;
  total: number;
};

export type ProductosListResponse = {
  conError: boolean;
  mensaje: string;
  data: ProductosPaginationData;
};

export async function getBanners() {
  return requestPublicApi<BannerItem[]>("/banners");
}



export async function getMarcasList(query?: MarcasQuery) {
  return requestPublicApi<MarcasPaginationData>("/marcas", { query });
}



export async function getMarcasInicio(query?: BaseListQuery) {
  return requestPublicApi<Paginated<Marca>>("/marcas/inicio", { query });
}

export async function getTopMarcas(query?: { limit?: number }) {
  return requestPublicApi<TopMarcaItem[]>("/marcas/top", { query });
}

export async function getCategorias(query?: { limit?: number }) {
  return requestPublicApi<Categoria[]>("/categorias", { query });
}

export async function getInformacion() {
  return requestPublicApi<InformacionResponse>("/informacion");
}

export async function getProductos(query?: ProductosQuery) {
  return requestPublicApi<Paginated<ProductoCatalogo>>("/productos", {
    query,
  });
}

export async function getProductosList(query?: ProductosQuery) {
  return requestPublicApi<ProductosPaginationData>("/productos", {
    query,
  });
}

export async function getProductosInicio() {
  return requestPublicApi<{
    productosDestacados: ProductoBase[];
    productosNuevos: ProductoBase[];
  }>("/productos/inicio");
}

export async function getProductoDetalle(slug: string) {
  return requestPublicApi<ProductoDetalle | null>(`/productos/${slug}`);
}

export async function createCheckoutPedido(payload: CheckoutPedidoPayload) {
  return requestPublicApi<CheckoutPedidoResponse>("/pedidos", {
    method: "POST",
    body: payload,
  });
}




export async function getSubcategorias() {
  return requestPublicApi<Subcategoria[]>("/subcategorias");
}



export async function getBlog(query?: BaseListQuery) {
  return requestPublicApi<Paginated<Blog>>("/blog", { query });
}

export async function getBlogList(query?: BaseListQuery) {
  return requestPublicApi<BlogPaginationData>("/blog", { query });
}

export async function getBlogInicio(nro: number) {
  return requestPublicApi<BlogInicio[]>(`/blog/inicio/${nro}`);
}

export async function getBlogDetalle(slug: string) {
  return requestPublicApi<BlogPostItem | null>(`/blog/${slug}`);
}

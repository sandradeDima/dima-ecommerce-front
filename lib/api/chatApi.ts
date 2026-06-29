import { PublicApiError } from "./publicApi";

const DEFAULT_API_ORIGIN = "http://127.0.0.1:8000";
const PUBLIC_PREFIX = "/api/public";
const CHAT_PREFIX = "/chat";
const CHAT_TOKEN_HEADER = "X-Chat-Token";

export const DMC_CHAT_TOKEN_STORAGE_KEY = "dmc_chat_token";

type ChatApiEnvelope<T> = {
  conError: boolean;
  mensaje: string | null;
  mensajeTecnico?: string;
  data: T;
};

export type ChatMenu = {
  id: number;
  titulo: string;
  orden: number;
  slug: string;
  estado: string;
};

export type ChatBotOpcion = {
  id: number;
  bot_menu_id: number;
  texto_opcion: string;
  siguiente_menu_id: number | null;
  orden: number;
  slug: string;
  transferir_a_operador: number;
  estado: string;
};

export type ChatBotRespuesta = {
  id: number;
  bot_opcion_id: number;
  mensaje_respuesta: string;
  tipo: string;
  orden: number;
  slug: string;
  estado: string;
};

export type ChatHistorialMensaje = {
  id: number;
  conversacion_id: number;
  emisor: "cliente" | "sistema" | "operador" | string;
  mensaje: string;
  leido: boolean;
  estado?: string;
  created_at: string;
  updated_at?: string;
};

export type ChatInicializarData = {
  token: string | null;
  modo: "bot" | "operador";
  es_horario_laboral: boolean;
  menus_iniciales: ChatMenu[] | null;
  historial: ChatHistorialMensaje[];
};

export type ChatMenusOpcionesData = ChatMenu & {
  opciones: ChatBotOpcion[];
};

export type ChatOpcionSeleccionarData = ChatBotOpcion & {
  respuestas: ChatBotRespuesta[];
};

export type ChatEnviarMensajeData = {
  nuevo_mensaje: ChatHistorialMensaje;
  modo: "operador" | "bot" | string;
  esperando_operador?: boolean;
  token?: string;
  mensaje_bienvenida?: string;
};

export type ChatFinalizarData = {
  mensaje: string;
};

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

function buildChatUrl(path: string): string {
  const cleanPath = path.startsWith("/") ? path : `/${path}`;
  return `${getPublicApiBaseUrl()}${CHAT_PREFIX}${cleanPath}`;
}

async function requestChatApi<T>(
  path: string,
  options?: {
    token?: string | null;
    formData?: FormData;
  },
): Promise<T> {
  const headers: HeadersInit = {
    Accept: "application/json",
  };

  if (options?.token) {
    headers[CHAT_TOKEN_HEADER] = options.token;
  }

  const response = await fetch(buildChatUrl(path), {
    method: "POST",
    headers,
    body: options?.formData,
    cache: "no-store",
  });

  let payload: ChatApiEnvelope<T> | null = null;
  try {
    payload = (await response.json()) as ChatApiEnvelope<T>;
  } catch {
    payload = null;
  }

  if (!payload) {
    throw new PublicApiError(
      `Invalid JSON response from /chat${path}`,
      response.status,
    );
  }

  if (!response.ok || payload.conError) {
    throw new PublicApiError(
      payload.mensaje ?? "Chat API request failed",
      response.status,
      payload.mensajeTecnico,
    );
  }

  return payload.data;
}

function toFormData(field: string, value: string | number): FormData {
  const form = new FormData();
  form.append(field, String(value));
  return form;
}

export async function chatInicializar(token?: string | null) {
  return requestChatApi<ChatInicializarData>("/inicializar", { token });
}

export async function chatMenusOpciones(
  botMenuId: number,
  token?: string | null,
) {
  return requestChatApi<ChatMenusOpcionesData>("/menus-opciones", {
    token,
    formData: toFormData("bot_menu_id", botMenuId),
  });
}

export async function chatOpcionSeleccionar(
  botOpcionId: number,
  token?: string | null,
) {
  return requestChatApi<ChatOpcionSeleccionarData>("/opcion-seleccionar", {
    token,
    formData: toFormData("bot_opcion_id", botOpcionId),
  });
}

export async function chatEnviarMensaje(mensaje: string, token: string) {
  return requestChatApi<ChatEnviarMensajeData>("/enviar-mensaje", {
    token,
    formData: toFormData("mensaje", mensaje),
  });
}

export async function chatFinalizar(token: string) {
  return requestChatApi<ChatFinalizarData>("/finalizar", { token });
}

export function isChatTokenError(error: unknown): boolean {
  if (error instanceof PublicApiError) {
    if (error.status === 401 || error.status === 403) {
      return true;
    }

    const text = `${error.message} ${error.detalle ?? ""}`.toLowerCase();
    return (
      text.includes("token") ||
      text.includes("sesión") ||
      text.includes("sesion") ||
      text.includes("código de cliente inválido") ||
      text.includes("codigo de cliente invalido")
    );
  }

  return false;
}

export function getChatErrorMessage(error: unknown): string {
  if (error instanceof PublicApiError) {
    return error.message || "No se pudo completar la solicitud de chat.";
  }

  if (error instanceof Error) {
    return error.message;
  }

  return "No se pudo completar la solicitud de chat.";
}

import type {
  ChatBotOpcion,
  ChatBotRespuesta,
  ChatHistorialMensaje,
} from "@/lib/api/chatApi";
import type { ChatMessageKind, ChatUiMessage } from "./chatTypes";

function toIsoOrNow(value?: string | null): string {
  if (!value) {
    return new Date().toISOString();
  }

  const normalized = value.includes(" ") ? value.replace(" ", "T") : value;
  const parsed = new Date(normalized);

  if (Number.isNaN(parsed.getTime())) {
    return new Date().toISOString();
  }

  return parsed.toISOString();
}

function createUiId(prefix: string, id?: number): string {
  if (typeof id === "number") {
    return `${prefix}-${id}`;
  }

  return `${prefix}-${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

export function normalizeHistorialMessage(
  message: ChatHistorialMensaje,
): ChatUiMessage {
  return {
    id: createUiId("historial", message.id),
    backendId: message.id,
    conversacionId: message.conversacion_id,
    emisor: message.emisor,
    mensaje: message.mensaje,
    leido: message.leido,
    createdAt: toIsoOrNow(message.created_at),
    kind: message.emisor === "sistema" ? "system" : "chat",
  };
}

export function normalizeHistorial(
  historial: ChatHistorialMensaje[] | null | undefined,
): ChatUiMessage[] {
  if (!Array.isArray(historial)) {
    return [];
  }

  return historial.map((item) => normalizeHistorialMessage(item));
}

export function normalizeRealtimeMessage(payload: {
  id?: number;
  mensaje: string;
  emisor: string;
  leido?: boolean;
  conversacion_id?: number;
  created_at?: string;
}): ChatUiMessage {
  return {
    id: createUiId("realtime", payload.id),
    backendId: payload.id,
    conversacionId: payload.conversacion_id,
    emisor: payload.emisor,
    mensaje: payload.mensaje,
    leido: payload.leido,
    createdAt: toIsoOrNow(payload.created_at),
    kind: payload.emisor === "sistema" ? "system" : "chat",
  };
}

export function normalizeBotRespuesta(
  respuesta: ChatBotRespuesta,
  option?: ChatBotOpcion,
): ChatUiMessage {
  return {
    id: createUiId("bot-respuesta", respuesta.id),
    emisor: "sistema",
    mensaje: respuesta.mensaje_respuesta,
    createdAt: new Date().toISOString(),
    kind: "bot_response",
    meta: {
      tipo: respuesta.tipo,
      opcion_id: option?.id,
      bot_opcion_id: respuesta.bot_opcion_id,
    },
  };
}

export function createLocalClientMessage(
  mensaje: string,
  kind: ChatMessageKind = "chat",
): ChatUiMessage {
  return {
    id: createUiId("cliente"),
    emisor: "cliente",
    mensaje,
    createdAt: new Date().toISOString(),
    kind,
    leido: false,
  };
}

export function createSystemMessage(
  mensaje: string,
  kind: ChatMessageKind = "system",
): ChatUiMessage {
  return {
    id: createUiId("sistema"),
    emisor: "sistema",
    mensaje,
    createdAt: new Date().toISOString(),
    kind,
    leido: true,
  };
}

function messageSignature(message: ChatUiMessage): string {
  if (typeof message.backendId === "number") {
    return `backend-${message.backendId}`;
  }

  return [
    message.emisor,
    message.mensaje.trim(),
    message.createdAt,
    message.conversacionId ?? "",
  ].join("|");
}

export function mergeUniqueMessages(
  base: ChatUiMessage[],
  incoming: ChatUiMessage[],
): ChatUiMessage[] {
  const items = [...base];
  const indexBySignature = new Map<string, number>();

  items.forEach((item, index) => {
    indexBySignature.set(messageSignature(item), index);
  });

  incoming.forEach((item) => {
    const signature = messageSignature(item);
    const existingIndex = indexBySignature.get(signature);

    if (typeof existingIndex === "number") {
      const current = items[existingIndex];
      const mergedRead =
        current.leido === true || item.leido === true
          ? true
          : (item.leido ?? current.leido);

      items[existingIndex] = {
        ...current,
        ...item,
        id: current.id,
        leido: mergedRead,
      };
      return;
    }

    items.push(item);
    indexBySignature.set(signature, items.length - 1);
  });

  items.sort(
    (a, b) =>
      new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime(),
  );

  return items;
}

export function getConversationIdFromMessages(
  messages: ChatUiMessage[],
): number | null {
  for (let i = messages.length - 1; i >= 0; i -= 1) {
    const candidate = messages[i]?.conversacionId;
    if (typeof candidate === "number") {
      return candidate;
    }
  }

  return null;
}

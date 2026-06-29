export type ChatRealtimeMessagePayload = {
  id?: number;
  mensaje: string;
  emisor: string;
  leido?: boolean;
  conversacion_id?: number;
  created_at?: string;
};

export type ChatRealtimeReadPayload = {
  conversacion_id: number;
  timestamp: string;
};

type EchoChannelLike = {
  listen: (
    event: string,
    callback: (payload: unknown) => void,
  ) => EchoChannelLike;
  error?: (callback: (error: unknown) => void) => EchoChannelLike;
};

type EchoLike = {
  private: (channelName: string) => EchoChannelLike;
  leave: (channelName: string) => void;
};

export type ChatRealtimeHandlers = {
  onNuevoMensaje: (payload: ChatRealtimeMessagePayload) => void;
  onMensajesLeidos?: (payload: ChatRealtimeReadPayload) => void;
  onError?: (error: unknown) => void;
};

export type ChatRealtimeSubscription = {
  active: boolean;
  reason?: string;
  unsubscribe: () => void;
};

function isObjectRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

function toOptionalNumber(value: unknown): number | undefined {
  if (typeof value === "number" && Number.isFinite(value)) {
    return value;
  }

  if (typeof value === "string") {
    const trimmed = value.trim();
    if (!trimmed) {
      return undefined;
    }

    const parsed = Number(trimmed);
    if (Number.isFinite(parsed)) {
      return parsed;
    }
  }

  return undefined;
}

function toOptionalBoolean(value: unknown): boolean | undefined {
  return typeof value === "boolean" ? value : undefined;
}

function toOptionalString(value: unknown): string | undefined {
  return typeof value === "string" ? value : undefined;
}

function asChatRealtimeMessagePayload(
  payload: unknown,
): ChatRealtimeMessagePayload | null {
  if (!isObjectRecord(payload)) return null;

  const mensaje = toOptionalString(payload.mensaje);
  const emisor = toOptionalString(payload.emisor);

  if (!mensaje || !emisor) {
    return null;
  }

  return {
    mensaje,
    emisor,
    id: toOptionalNumber(payload.id),
    leido: toOptionalBoolean(payload.leido),
    conversacion_id: toOptionalNumber(payload.conversacion_id),
    created_at: toOptionalString(payload.created_at),
  };
}

function asChatRealtimeReadPayload(payload: unknown): ChatRealtimeReadPayload | null {
  if (!isObjectRecord(payload)) return null;

  const conversacionId = toOptionalNumber(payload.conversacion_id);
  const timestamp = toOptionalString(payload.timestamp);

  if (!conversacionId || !timestamp) {
    return null;
  }

  return {
    conversacion_id: conversacionId,
    timestamp,
  };
}

function getEcho(): EchoLike | null {
  if (typeof window === "undefined") {
    return null;
  }

  const maybeEcho = (window as Window & { Echo?: EchoLike }).Echo;

  if (!maybeEcho || typeof maybeEcho.private !== "function") {
    return null;
  }

  return maybeEcho;
}

export function subscribeToChatRealtime(
  conversacionId: number,
  handlers: ChatRealtimeHandlers,
): ChatRealtimeSubscription {
  const echo = getEcho();

  if (!echo) {
    return {
      active: false,
      reason: "Echo no está disponible en el cliente.",
      unsubscribe: () => undefined,
    };
  }

  const channelName = `chat.${conversacionId}`;

  try {
    const channel = echo
      .private(channelName)
      .listen(".nuevo.mensaje", (payload) => {
        const parsed = asChatRealtimeMessagePayload(payload);
        if (!parsed) {
          handlers.onError?.(
            new Error("Payload inválido recibido para evento .nuevo.mensaje"),
          );
          return;
        }

        handlers.onNuevoMensaje(parsed);
      })
      .listen(".mensajes.leidos", (payload) => {
        const parsed = asChatRealtimeReadPayload(payload);
        if (!parsed) {
          handlers.onError?.(
            new Error("Payload inválido recibido para evento .mensajes.leidos"),
          );
          return;
        }

        handlers.onMensajesLeidos?.(parsed);
      });

    if (typeof channel.error === "function") {
      channel.error((error) => {
        handlers.onError?.(error);
      });
    }

    return {
      active: true,
      unsubscribe: () => {
        echo.leave(channelName);
      },
    };
  } catch (error) {
    handlers.onError?.(error);

    return {
      active: false,
      reason: "No se pudo crear la suscripción realtime.",
      unsubscribe: () => undefined,
    };
  }
}

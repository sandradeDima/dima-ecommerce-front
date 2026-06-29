import Echo from "laravel-echo";
import Pusher from "pusher-js";

const DEFAULT_API_ORIGIN = "http://127.0.0.1:8000";

export type RealtimeInitResult = {
  ready: boolean;
  reason?: string;
};

type EchoInstance = InstanceType<typeof Echo>;
type EchoWindow = Window & {
  Echo?: EchoInstance;
  Pusher?: typeof Pusher;
  __dmcEchoSignature?: string;
};

function trimTrailingSlash(value: string): string {
  return value.replace(/\/+$/, "");
}

function parseBoolean(rawValue: string | undefined, fallback: boolean): boolean {
  if (!rawValue) {
    return fallback;
  }

  const normalized = rawValue.trim().toLowerCase();
  if (["1", "true", "yes", "on"].includes(normalized)) return true;
  if (["0", "false", "no", "off"].includes(normalized)) return false;
  return fallback;
}

function parsePort(rawValue: string | undefined): number | undefined {
  if (!rawValue) return undefined;
  const parsed = Number(rawValue);
  if (!Number.isInteger(parsed) || parsed <= 0) return undefined;
  return parsed;
}

function resolveApiOrigin(): string {
  const envBase =
    process.env.NEXT_PUBLIC_DMC_API_BASE_URL ??
    process.env.NEXT_PUBLIC_API_BASE_URL ??
    DEFAULT_API_ORIGIN;

  return trimTrailingSlash(envBase).replace(/\/api\/public$/, "");
}

function resolveAuthEndpoint(): string {
  const explicit = process.env.NEXT_PUBLIC_BROADCAST_AUTH_ENDPOINT;
  if (explicit && explicit.trim().length > 0) {
    return trimTrailingSlash(explicit);
  }

  return `${resolveApiOrigin()}/broadcasting/auth`;
}

export function ensureChatEcho(chatToken?: string | null): RealtimeInitResult {
  if (typeof window === "undefined") {
    return {
      ready: false,
      reason: "Realtime solo está disponible en el navegador.",
    };
  }

  const appKey = process.env.NEXT_PUBLIC_PUSHER_APP_KEY?.trim();
  if (!appKey) {
    return {
      ready: false,
      reason:
        "Falta NEXT_PUBLIC_PUSHER_APP_KEY. Realtime continuará en modo API.",
    };
  }

  const token = chatToken?.trim() || null;
  if (!token) {
    return {
      ready: false,
      reason:
        "No existe token de chat para autorizar el canal privado. Realtime continuará en modo API.",
    };
  }

  const cluster = process.env.NEXT_PUBLIC_PUSHER_APP_CLUSTER?.trim() || "mt1";
  const wsHost = process.env.NEXT_PUBLIC_PUSHER_HOST?.trim() || undefined;
  const wsPort = parsePort(process.env.NEXT_PUBLIC_PUSHER_PORT);
  const wssPort = parsePort(process.env.NEXT_PUBLIC_PUSHER_WSS_PORT);
  const forceTLS = parseBoolean(process.env.NEXT_PUBLIC_PUSHER_FORCE_TLS, true);
  const authEndpoint = resolveAuthEndpoint();

  const signature = JSON.stringify({
    appKey,
    cluster,
    wsHost: wsHost ?? null,
    wsPort: wsPort ?? null,
    wssPort: wssPort ?? null,
    forceTLS,
    authEndpoint,
    token,
  });

  const browserWindow = window as EchoWindow;
  if (browserWindow.Echo && browserWindow.__dmcEchoSignature === signature) {
    return { ready: true };
  }

  if (browserWindow.Echo && typeof browserWindow.Echo.disconnect === "function") {
    browserWindow.Echo.disconnect();
  }

  browserWindow.Pusher = Pusher;

  const authHeaders: Record<string, string> = {
    Accept: "application/json",
    "X-Requested-With": "XMLHttpRequest",
  };

  if (token) {
    authHeaders["X-Chat-Token"] = token;
  }

  browserWindow.Echo = new Echo({
    broadcaster: "pusher",
    key: appKey,
    cluster,
    forceTLS,
    enabledTransports: ["ws", "wss"],
    authEndpoint,
    auth: {
      headers: authHeaders,
    },
    ...(wsHost ? { wsHost } : {}),
    ...(wsPort ? { wsPort } : {}),
    ...(wssPort ? { wssPort } : {}),
  });

  browserWindow.__dmcEchoSignature = signature;

  return { ready: true };
}

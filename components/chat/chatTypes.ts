import type { ChatBotOpcion, ChatMenu } from "@/lib/api/chatApi";

export type ChatMode = "bot" | "operador" | null;

export type ChatMessageKind = "chat" | "bot_menu" | "bot_response" | "system";

export type ChatUiMessage = {
  id: string;
  backendId?: number;
  conversacionId?: number;
  emisor: string;
  mensaje: string;
  leido?: boolean;
  createdAt: string;
  kind: ChatMessageKind;
  meta?: Record<string, unknown>;
};

export type BotSelectionState = {
  currentMenu: ChatMenu | null;
  currentOptions: ChatBotOpcion[];
  loadingMenuId: number | null;
  loadingOptionId: number | null;
};

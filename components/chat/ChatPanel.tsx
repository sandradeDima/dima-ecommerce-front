"use client";

import type { ChatBotOpcion, ChatMenu } from "@/lib/api/chatApi";
import ChatHeader from "./ChatHeader";
import ChatMessagesList from "./ChatMessagesList";
import ChatTextInput from "./ChatTextInput";
import type { ChatMode, ChatUiMessage } from "./chatTypes";

type ChatPanelProps = {
  mode: ChatMode;
  loading: boolean;
  error: string | null;
  messages: ChatUiMessage[];
  esHorarioLaboral: boolean;
  esperandoOperador: boolean;
  token: string | null;
  canFinalize: boolean;
  finalizing: boolean;
  isFinalized: boolean;
  draft: string;
  sending: boolean;
  menusIniciales: ChatMenu[];
  currentMenu: ChatMenu | null;
  currentOptions: ChatBotOpcion[];
  loadingMenuId: number | null;
  loadingOptionId: number | null;
  canGoBackInBot: boolean;
  realtimeActive: boolean;
  onClose: () => void;
  onFinalize: () => void;
  onRestart: () => void;
  onBackBotMenu: () => void;
  onSelectMenu: (menu: ChatMenu) => void;
  onSelectOption: (option: ChatBotOpcion) => void;
  onDraftChange: (value: string) => void;
  onSendMessage: () => void;
};

export default function ChatPanel({
  mode,
  loading,
  error,
  messages,
  esHorarioLaboral,
  esperandoOperador,
  token,
  canFinalize,
  finalizing,
  isFinalized,
  draft,
  sending,
  menusIniciales,
  currentMenu,
  currentOptions,
  loadingMenuId,
  loadingOptionId,
  canGoBackInBot,
  realtimeActive,
  onClose,
  onFinalize,
  onRestart,
  onBackBotMenu,
  onSelectMenu,
  onSelectOption,
  onDraftChange,
  onSendMessage,
}: ChatPanelProps) {
  const showBotControls = mode === "bot" && !loading;
  const showOperatorInput =
    mode === "operador" && !loading && !isFinalized && Boolean(token);
  const hasCurrentOptions = currentOptions.length > 0;

  return (
    <div className="w-[min(380px,calc(100vw-2rem))] overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-[0_24px_60px_rgba(15,23,42,0.28)]">
      <ChatHeader
        mode={mode}
        esHorarioLaboral={esHorarioLaboral}
        esperandoOperador={esperandoOperador}
        canFinalize={canFinalize}
        finalizing={finalizing}
        onFinalize={onFinalize}
        onClose={onClose}
      />

      <div className="flex h-[min(65vh,560px)] min-h-[420px] flex-col">
        <ChatMessagesList messages={messages} loading={loading} />

        {error && (
          <div className="mx-3 mt-2 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-xs text-red-700">
            {error}
          </div>
        )}

        {showBotControls && (
          <div className="space-y-2 border-t border-slate-200 bg-slate-50 p-3">
            <div className="flex items-center justify-between gap-2">
              <p className="text-xs font-semibold text-slate-500">
                {hasCurrentOptions
                  ? `Opciones${currentMenu?.titulo ? `: ${currentMenu.titulo}` : ""}`
                  : "Elige cómo te puedo ayudar"}
              </p>
              {canGoBackInBot && (
                <button
                  type="button"
                  onClick={onBackBotMenu}
                  className="rounded-full border border-slate-300 bg-white px-3 py-1 text-[11px] font-semibold text-slate-600 transition hover:border-[#F54029]/50 hover:bg-[#F54029]/5"
                >
                  Volver
                </button>
              )}
            </div>

            <div className="flex flex-wrap gap-2">
              {hasCurrentOptions
                ? currentOptions.map((option) => {
                    const isLoading = loadingOptionId === option.id;
                    return (
                      <button
                        key={option.id}
                        type="button"
                        onClick={() => onSelectOption(option)}
                        disabled={isLoading}
                        className="rounded-full border border-slate-300 bg-white px-3 py-1.5 text-xs font-medium text-slate-700 transition hover:border-[#F54029]/50 hover:bg-[#F54029]/5 disabled:cursor-not-allowed disabled:opacity-60"
                      >
                        {isLoading ? "Procesando..." : option.texto_opcion}
                      </button>
                    );
                  })
                : menusIniciales.map((menu) => {
                    const isLoading = loadingMenuId === menu.id;
                    return (
                      <button
                        key={menu.id}
                        type="button"
                        onClick={() => onSelectMenu(menu)}
                        disabled={isLoading}
                        className="rounded-full border border-slate-300 bg-white px-3 py-1.5 text-xs font-medium text-slate-700 transition hover:border-[#F54029]/50 hover:bg-[#F54029]/5 disabled:cursor-not-allowed disabled:opacity-60"
                      >
                        {isLoading ? "Cargando..." : menu.titulo}
                      </button>
                    );
                  })}
            </div>
          </div>
        )}

        {showOperatorInput && (
          <ChatTextInput
            value={draft}
            onChange={onDraftChange}
            onSend={onSendMessage}
            sending={sending}
            disabled={isFinalized}
          />
        )}

        {mode === "operador" && !token && !loading && (
          <div className="border-t border-slate-200 bg-slate-100 px-3 py-2 text-xs text-slate-600">
            La sesión finalizó. Puedes iniciar un chat nuevo.
          </div>
        )}

        {isFinalized && (
          <div className="border-t border-slate-200 bg-slate-100 px-3 py-2">
            <button
              type="button"
              onClick={onRestart}
              className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm font-semibold text-slate-700 transition hover:border-[#F54029]/40 hover:bg-[#F54029]/5"
            >
              Iniciar nuevo chat
            </button>
          </div>
        )}

        <div className="border-t border-slate-200 bg-white px-3 py-2 text-[11px] text-slate-500">
          Realtime: {realtimeActive ? "activo" : "modo API"}
        </div>
      </div>
    </div>
  );
}

"use client";

import type { ChatBotOpcion, ChatMenu } from "@/lib/api/chatApi";

type ChatBotOptionsProps = {
  currentMenu: ChatMenu | null;
  options: ChatBotOpcion[];
  loadingOptionId: number | null;
  onSelectOption: (option: ChatBotOpcion) => void;
};

export default function ChatBotOptions({
  currentMenu,
  options,
  loadingOptionId,
  onSelectOption,
}: ChatBotOptionsProps) {
  if (!currentMenu) {
    return null;
  }

  return (
    <div className="space-y-2">
      <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
        Opciones {currentMenu.titulo ? `· ${currentMenu.titulo}` : ""}
      </p>

      <div className="grid grid-cols-1 gap-2">
        {options.length ? (
          options.map((option) => {
            const isLoading = loadingOptionId === option.id;
            return (
              <button
                key={option.id}
                type="button"
                onClick={() => onSelectOption(option)}
                disabled={isLoading}
                className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-left text-sm text-slate-700 transition hover:border-[#F54029]/40 hover:bg-[#F54029]/5 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {isLoading ? "Procesando..." : option.texto_opcion}
              </button>
            );
          })
        ) : (
          <div className="rounded-xl border border-dashed border-slate-300 bg-slate-100 px-3 py-2 text-xs text-slate-500">
            Este menú no tiene opciones disponibles.
          </div>
        )}
      </div>
    </div>
  );
}

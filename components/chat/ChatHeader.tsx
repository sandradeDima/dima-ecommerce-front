"use client";

import ChatStatusBadge from "./ChatStatusBadge";
import type { ChatMode } from "./chatTypes";

type ChatHeaderProps = {
  mode: ChatMode;
  esHorarioLaboral: boolean;
  esperandoOperador: boolean;
  canFinalize: boolean;
  onFinalize: () => void;
  onClose: () => void;
  finalizing: boolean;
};

export default function ChatHeader({
  mode,
  esHorarioLaboral,
  esperandoOperador,
  canFinalize,
  onFinalize,
  onClose,
  finalizing,
}: ChatHeaderProps) {
  return (
    <div className="flex items-start justify-between gap-3 rounded-t-2xl bg-[#1f2329] px-4 py-3 text-white">
      <div className="min-w-0">
        <p className="text-sm font-semibold">Chat DMC</p>
        <div className="mt-1">
          <ChatStatusBadge
            mode={mode}
            esHorarioLaboral={esHorarioLaboral}
            esperandoOperador={esperandoOperador}
          />
        </div>
      </div>

      <div className="flex items-center gap-2">
        {canFinalize && (
          <button
            type="button"
            onClick={onFinalize}
            disabled={finalizing}
            className="rounded-md border border-white/25 bg-white/10 px-2 py-1 text-[11px] font-semibold transition hover:bg-white/20 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {finalizing ? "Finalizando..." : "Finalizar"}
          </button>
        )}

        <button
          type="button"
          onClick={onClose}
          aria-label="Cerrar chat"
          className="rounded-md border border-white/20 bg-transparent px-2 py-1 text-xs font-semibold transition hover:bg-white/10"
        >
          Cerrar
        </button>
      </div>
    </div>
  );
}

"use client";

import type { ChatMode } from "./chatTypes";

type ChatStatusBadgeProps = {
  mode: ChatMode;
  esHorarioLaboral: boolean;
  esperandoOperador: boolean;
};

export default function ChatStatusBadge({
  mode,
  esHorarioLaboral,
  esperandoOperador,
}: ChatStatusBadgeProps) {
  const isOperador = mode === "operador";

  const label = isOperador
    ? esperandoOperador
      ? "Esperando operador"
      : "Operador"
    : "Bot";

  const toneClass = isOperador
    ? "border-emerald-200 bg-emerald-50 text-emerald-700"
    : "border-orange-200 bg-orange-50 text-orange-700";

  return (
    <div className="flex items-center gap-2">
      <span
        className={`rounded-full border px-2 py-0.5 text-[11px] font-semibold ${toneClass}`}
      >
        {label}
      </span>
      {!esHorarioLaboral && (
        <span className="rounded-full border border-slate-200 bg-slate-100 px-2 py-0.5 text-[11px] font-medium text-slate-600">
          Fuera de horario
        </span>
      )}
    </div>
  );
}

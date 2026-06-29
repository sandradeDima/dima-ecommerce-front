"use client";

import type { KeyboardEvent } from "react";

type ChatTextInputProps = {
  value: string;
  onChange: (value: string) => void;
  onSend: () => void;
  disabled?: boolean;
  sending?: boolean;
};

export default function ChatTextInput({
  value,
  onChange,
  onSend,
  disabled = false,
  sending = false,
}: ChatTextInputProps) {
  const blocked = disabled || sending;

  const onKeyDown = (event: KeyboardEvent<HTMLTextAreaElement>) => {
    if (event.key === "Enter" && !event.shiftKey) {
      event.preventDefault();
      onSend();
    }
  };

  return (
    <div className="border-t border-slate-200 bg-white p-3">
      <div className="flex items-end gap-2">
        <textarea
          value={value}
          onChange={(event) => onChange(event.target.value)}
          onKeyDown={onKeyDown}
          disabled={blocked}
          maxLength={1000}
          placeholder="Escribe tu mensaje..."
          className="min-h-[44px] max-h-[120px] flex-1 resize-y rounded-xl border border-slate-300 px-3 py-2 text-sm text-slate-800 outline-none transition focus:border-[#F54029]/70 focus:ring-2 focus:ring-[#F54029]/20 disabled:cursor-not-allowed disabled:bg-slate-100"
        />

        <button
          type="button"
          onClick={onSend}
          disabled={blocked || value.trim().length === 0}
          className="h-11 rounded-xl bg-[#F54029] px-4 text-sm font-semibold text-white transition hover:brightness-105 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {sending ? "..." : "Enviar"}
        </button>
      </div>
      <p className="mt-1 text-[11px] text-slate-500">Enter para enviar, Shift+Enter para salto.</p>
    </div>
  );
}

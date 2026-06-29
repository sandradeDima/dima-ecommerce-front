"use client";

import type { ChatUiMessage } from "./chatTypes";

type ChatMessageBubbleProps = {
  message: ChatUiMessage;
};

function formatMessageHour(value: string): string {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return "";
  }

  return date.toLocaleTimeString("es-BO", {
    hour: "2-digit",
    minute: "2-digit",
  });
}

export default function ChatMessageBubble({ message }: ChatMessageBubbleProps) {
  const isClient = message.emisor === "cliente";
  const canShowReadReceipt =
    isClient && message.kind === "chat" && typeof message.backendId === "number";
  const readReceiptLabel = message.leido ? "Leido" : "Enviado";
  const bubbleClass = isClient
    ? "ml-auto rounded-br-md bg-[#F54029] text-white"
    : "mr-auto rounded-bl-md border border-slate-200 bg-white text-slate-800";

  return (
    <div className={`max-w-[88%] rounded-2xl px-3 py-2 text-sm shadow-sm ${bubbleClass}`}>
      <p className="whitespace-pre-wrap leading-relaxed">{message.mensaje}</p>
      <div
        className={`mt-1 flex items-center justify-end gap-2 text-[10px] ${
          isClient ? "text-white/85" : "text-slate-500"
        }`}
      >
        <span>{formatMessageHour(message.createdAt)}</span>
        {canShowReadReceipt && <span>{readReceiptLabel}</span>}
      </div>
    </div>
  );
}

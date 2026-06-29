"use client";

import { useEffect, useMemo, useRef } from "react";
import ChatMessageBubble from "./ChatMessageBubble";
import type { ChatUiMessage } from "./chatTypes";

type ChatMessagesListProps = {
  messages: ChatUiMessage[];
  loading: boolean;
};

export default function ChatMessagesList({
  messages,
  loading,
}: ChatMessagesListProps) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const stickToBottomRef = useRef(true);

  const hasMessages = messages.length > 0;

  const content = useMemo(() => {
    if (loading) {
      return (
        <div className="space-y-3 p-4">
          {Array.from({ length: 3 }).map((_, index) => (
            <div
              key={`chat-loading-${index}`}
              className="h-14 animate-pulse rounded-xl bg-slate-200/70"
            />
          ))}
        </div>
      );
    }

    if (!hasMessages) {
      return (
        <div className="flex h-full items-center justify-center p-4 text-center text-sm text-slate-500">
          Inicia la conversación para recibir ayuda.
        </div>
      );
    }

    return (
      <div className="space-y-2 p-3">
        {messages.map((message) => (
          <ChatMessageBubble key={message.id} message={message} />
        ))}
      </div>
    );
  }, [hasMessages, loading, messages]);

  useEffect(() => {
    const element = containerRef.current;
    if (!element || !stickToBottomRef.current) {
      return;
    }

    element.scrollTo({ top: element.scrollHeight, behavior: "smooth" });
  }, [messages.length, loading]);

  const onScroll = () => {
    const element = containerRef.current;
    if (!element) {
      return;
    }

    const remaining = element.scrollHeight - element.scrollTop - element.clientHeight;
    stickToBottomRef.current = remaining < 80;
  };

  return (
    <div
      ref={containerRef}
      onScroll={onScroll}
      className="min-h-0 flex-1 overflow-y-auto bg-slate-50"
    >
      {content}
    </div>
  );
}

"use client";

import { useEffect, useState } from "react";
import ChatWidget from "@/components/chat/ChatWidget";
import { getInformacion } from "@/lib/api/publicApi";

function ChevronUpIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" className="h-8 w-8">
      <path
        d="M6 15l6-6 6 6"
        fill="none"
        stroke="currentColor"
        strokeWidth="2.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export default function FloatingActionButtons() {
  const [chatEnabled, setChatEnabled] = useState(true);

  useEffect(() => {
    let mounted = true;

    async function loadChatSetting() {
      try {
        const response = await getInformacion();
        if (!mounted) {
          return;
        }

        const enabled = response?.Informacion?.chat_menu_habilitado ?? true;
        setChatEnabled(Boolean(enabled));
      } catch {
        setChatEnabled(true);
      }
    }

    loadChatSetting();

    return () => {
      mounted = false;
    };
  }, []);

  return (
    <div className="fixed right-4 bottom-6 z-[60] flex flex-col items-end gap-3 sm:right-6 sm:bottom-8 sm:gap-4">
      <button
        type="button"
        onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
        aria-label="Volver arriba"
        className="flex h-14 min-w-[56px] items-center justify-center rounded-full border border-white/70 bg-[var(--dima-accent)] px-4 text-white shadow-[0_14px_28px_rgba(28,126,53,0.28)] transition-transform duration-200 hover:scale-105 hover:brightness-105"
      >
        <ChevronUpIcon />
      </button>

      {chatEnabled ? <ChatWidget /> : null}
    </div>
  );
}

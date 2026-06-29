"use client";

import ChatWidget from "@/components/chat/ChatWidget";

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
  return (
    <div className="fixed right-4 bottom-6 z-[60] flex flex-col items-end gap-3 sm:right-6 sm:bottom-8 sm:gap-4">
      <button
        type="button"
        onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
        aria-label="Volver arriba"
        className="flex h-14 w-14 items-center justify-center rounded-full bg-[#BDBFC2] text-white shadow-[0_10px_24px_rgba(15,23,42,0.28)] transition-transform duration-200 hover:scale-105 hover:brightness-105"
      >
        <ChevronUpIcon />
      </button>

      <ChatWidget />
    </div>
  );
}

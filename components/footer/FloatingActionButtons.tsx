"use client";

import { useEffect, useState } from "react";
import ChatWidget from "@/components/chat/ChatWidget";
import { MailIcon, WhatsAppIcon } from "@/components/contact/ContactIcons";
import { getInformacion } from "@/lib/api/publicApi";
import { resolveCompanyWhatsappNumber } from "@/lib/cart/cartUtils";

const CONTACT_FORM_URL = "https://dima.com.bo/contacto_directo";

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
  const [whatsAppUrl, setWhatsAppUrl] = useState<string | null>(null);

  useEffect(() => {
    let mounted = true;

    async function loadChatSetting() {
      try {
        const response = await getInformacion();
        if (!mounted) {
          return;
        }

        const information = response?.Informacion ?? null;
        const enabled = information?.chat_menu_habilitado ?? true;
        const whatsAppNumber = resolveCompanyWhatsappNumber(information);
        setChatEnabled(Boolean(enabled));
        setWhatsAppUrl(whatsAppNumber ? `https://wa.me/${whatsAppNumber}` : null);
      } catch {
        setChatEnabled(true);
        setWhatsAppUrl(null);
      }
    }

    loadChatSetting();

    return () => {
      mounted = false;
    };
  }, []);

  return (
    <div className="fixed right-4 bottom-6 z-[60] flex flex-col items-end gap-3 sm:right-6 sm:bottom-8 sm:gap-4">
      {whatsAppUrl ? (
        <a
          href={whatsAppUrl}
          target="_blank"
          rel="noopener noreferrer"
          aria-label="Escríbenos por WhatsApp"
          className="group relative flex h-14 w-14 items-center justify-center rounded-full bg-[#19b943] text-white shadow-[0_14px_28px_rgba(25,185,67,0.3)] transition-[transform,box-shadow] duration-200 ease-[cubic-bezier(0.25,1,0.5,1)] hover:scale-105 hover:shadow-[0_18px_34px_rgba(25,185,67,0.38)] focus-visible:scale-105 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#19b943]"
        >
          <WhatsAppIcon className="h-7 w-7" />
          <span className="pointer-events-none absolute right-[calc(100%+0.75rem)] whitespace-nowrap rounded-md bg-[#263640] px-2.5 py-1.5 text-[11px] font-bold text-white opacity-0 shadow-lg transition-[opacity,transform] duration-200 ease-[cubic-bezier(0.25,1,0.5,1)] translate-x-1 group-hover:translate-x-0 group-hover:opacity-100 group-focus-visible:translate-x-0 group-focus-visible:opacity-100">
            Escríbenos por WhatsApp
          </span>
        </a>
      ) : null}

      <a
        href={CONTACT_FORM_URL}
        target="_blank"
        rel="noopener noreferrer"
        aria-label="Abrir formulario de contacto"
        className="group relative flex h-14 w-14 items-center justify-center rounded-full bg-[#19b943] text-white shadow-[0_14px_28px_rgba(25,185,67,0.3)] transition-[transform,box-shadow] duration-200 ease-[cubic-bezier(0.25,1,0.5,1)] hover:scale-105 hover:shadow-[0_18px_34px_rgba(25,185,67,0.38)] focus-visible:scale-105 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#19b943]"
      >
        <MailIcon className="h-7 w-7" filled detailColor="#19b943" />
        <span className="pointer-events-none absolute right-[calc(100%+0.75rem)] whitespace-nowrap rounded-md bg-[#263640] px-2.5 py-1.5 text-[11px] font-bold text-white opacity-0 shadow-lg transition-[opacity,transform] duration-200 ease-[cubic-bezier(0.25,1,0.5,1)] translate-x-1 group-hover:translate-x-0 group-hover:opacity-100 group-focus-visible:translate-x-0 group-focus-visible:opacity-100">
          Formulario de contacto
        </span>
      </a>

      <button
        type="button"
        onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
        aria-label="Volver arriba"
        className="flex h-14 w-14 items-center justify-center rounded-full border border-white/70 bg-[var(--dima-accent)] text-white shadow-[0_14px_28px_rgba(0,72,153,0.28)] transition-transform duration-200 hover:scale-105 hover:brightness-105"
      >
        <ChevronUpIcon />
      </button>

      {chatEnabled ? <ChatWidget /> : null}
    </div>
  );
}

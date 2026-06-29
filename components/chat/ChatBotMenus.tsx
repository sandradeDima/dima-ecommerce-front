"use client";

import type { ChatMenu } from "@/lib/api/chatApi";

type ChatBotMenusProps = {
  menus: ChatMenu[];
  loadingMenuId: number | null;
  onSelectMenu: (menu: ChatMenu) => void;
};

export default function ChatBotMenus({
  menus,
  loadingMenuId,
  onSelectMenu,
}: ChatBotMenusProps) {
  if (!menus.length) {
    return null;
  }

  return (
    <div className="space-y-2">
      <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
        Menús
      </p>
      <div className="grid grid-cols-1 gap-2">
        {menus.map((menu) => {
          const isLoading = loadingMenuId === menu.id;
          return (
            <button
              key={menu.id}
              type="button"
              onClick={() => onSelectMenu(menu)}
              disabled={isLoading}
              className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-left text-sm font-medium text-slate-800 transition hover:border-[#F54029]/40 hover:bg-[#F54029]/5 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {isLoading ? "Cargando..." : menu.titulo}
            </button>
          );
        })}
      </div>
    </div>
  );
}

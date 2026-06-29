"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { usePathname } from "next/navigation";
import {
  chatEnviarMensaje,
  chatFinalizar,
  chatInicializar,
  chatMenusOpciones,
  chatOpcionSeleccionar,
  DMC_CHAT_TOKEN_STORAGE_KEY,
  getChatErrorMessage,
  isChatTokenError,
  type ChatBotOpcion,
  type ChatMenu,
} from "@/lib/api/chatApi";
import {
  getPageTypeFromPath,
  trackChatLeadSubmit,
  trackChatMessageSent,
  trackChatOpen,
} from "@/lib/analytics/ga4";
import {
  subscribeToChatRealtime,
  type ChatRealtimeMessagePayload,
} from "@/lib/chat/chatRealtime";
import { ensureChatEcho } from "@/lib/chat/echoClient";
import ChatFabButton from "./ChatFabButton";
import ChatPanel from "./ChatPanel";
import {
  createLocalClientMessage,
  createSystemMessage,
  getConversationIdFromMessages,
  mergeUniqueMessages,
  normalizeBotRespuesta,
  normalizeHistorial,
  normalizeHistorialMessage,
  normalizeRealtimeMessage,
} from "./chatMessageUtils";
import type { ChatMode, ChatUiMessage } from "./chatTypes";

const BOT_WELCOME_MESSAGE =
  "Hola, soy el asistente de DMC. Selecciona una opción para ayudarte mejor.";

function readStoredToken(): string | null {
  if (typeof window === "undefined") {
    return null;
  }

  return localStorage.getItem(DMC_CHAT_TOKEN_STORAGE_KEY);
}

function createDevelopmentRealtimeLogger(message: string, error?: unknown) {
  if (process.env.NODE_ENV !== "production") {
    if (error) {
      console.warn(message, error);
      return;
    }

    console.warn(message);
  }
}

export default function ChatWidget() {
  const pathname = usePathname();
  const [isOpen, setIsOpen] = useState(false);
  const [initializing, setInitializing] = useState(false);
  const [mode, setMode] = useState<ChatMode>(null);
  const [token, setToken] = useState<string | null>(null);
  const [esHorarioLaboral, setEsHorarioLaboral] = useState(true);
  const [menusIniciales, setMenusIniciales] = useState<ChatMenu[]>([]);
  const [currentMenu, setCurrentMenu] = useState<ChatMenu | null>(null);
  const [currentOptions, setCurrentOptions] = useState<ChatBotOpcion[]>([]);
  const [menuHistory, setMenuHistory] = useState<
    Array<{ menu: ChatMenu; options: ChatBotOpcion[] }>
  >([]);
  const [messages, setMessages] = useState<ChatUiMessage[]>([]);
  const [sending, setSending] = useState(false);
  const [esperandoOperador, setEsperandoOperador] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isFinalized, setIsFinalized] = useState(false);
  const [finalizing, setFinalizing] = useState(false);
  const [draft, setDraft] = useState("");
  const [conversacionId, setConversacionId] = useState<number | null>(null);
  const [loadingMenuId, setLoadingMenuId] = useState<number | null>(null);
  const [loadingOptionId, setLoadingOptionId] = useState<number | null>(null);
  const [realtimeActive, setRealtimeActive] = useState(false);
  const [hasUnreadWhileClosed, setHasUnreadWhileClosed] = useState(false);

  const messagesRef = useRef<ChatUiMessage[]>([]);
  const pageType = getPageTypeFromPath(pathname ?? "/");

  const resolveChatMode = useCallback((): string => {
    if (mode === "bot") return "bot";
    if (mode === "operador" && realtimeActive) return "realtime";
    return "hybrid";
  }, [mode, realtimeActive]);

  const persistToken = useCallback((value: string | null) => {
    setToken(value);

    if (typeof window === "undefined") {
      return;
    }

    if (value) {
      localStorage.setItem(DMC_CHAT_TOKEN_STORAGE_KEY, value);
      return;
    }

    localStorage.removeItem(DMC_CHAT_TOKEN_STORAGE_KEY);
  }, []);

  const appendMessages = useCallback(
    (incoming: ChatUiMessage[]) => {
      if (!incoming.length) {
        return;
      }

      setMessages((prev) => {
        const signature = (message: ChatUiMessage): string => {
          if (typeof message.backendId === "number") {
            return `backend-${message.backendId}`;
          }

          return [
            message.emisor,
            message.mensaje.trim(),
            message.createdAt,
            message.conversacionId ?? "",
          ].join("|");
        };

        const existing = new Set(prev.map(signature));
        const hasNewIncomingWhileClosed =
          !isOpen &&
          incoming.some((message) => {
            const isNew = !existing.has(signature(message));
            const isIncoming =
              message.emisor === "operador" || message.emisor === "sistema";
            return isNew && isIncoming;
          });

        if (hasNewIncomingWhileClosed) {
          setHasUnreadWhileClosed(true);
        }

        return mergeUniqueMessages(prev, incoming);
      });
    },
    [isOpen],
  );

  const applyInitializedState = useCallback(
    (data: {
      modo: "bot" | "operador";
      token: string | null;
      es_horario_laboral: boolean;
      menus_iniciales: ChatMenu[] | null;
      historial: {
        id: number;
        conversacion_id: number;
        emisor: string;
        mensaje: string;
        leido: boolean;
        created_at: string;
      }[];
    }) => {
      setMode(data.modo);
      setEsHorarioLaboral(data.es_horario_laboral);
      setMenusIniciales(data.menus_iniciales ?? []);
      setCurrentMenu(null);
      setCurrentOptions([]);
      setMenuHistory([]);
      setEsperandoOperador(data.modo === "operador");
      setIsFinalized(false);

      const normalizedHistory = normalizeHistorial(data.historial);
      const shouldInjectBotWelcome =
        data.modo === "bot" &&
        !normalizedHistory.some(
          (message) =>
            message.emisor === "sistema" &&
            message.mensaje.trim().length > 0,
        );

      const hydratedMessages = shouldInjectBotWelcome
        ? mergeUniqueMessages(
            normalizedHistory,
            [createSystemMessage(BOT_WELCOME_MESSAGE)],
          )
        : normalizedHistory;

      setMessages(hydratedMessages);
      setConversacionId(getConversationIdFromMessages(hydratedMessages));

      if (data.modo === "operador" && data.token) {
        persistToken(data.token);
      }

      if (data.modo === "bot") {
        persistToken(null);
      }
    },
    [persistToken],
  );

  const initializeChat = useCallback(
    async (forceFresh = false) => {
      setInitializing(true);
      setError(null);

      const existingToken = forceFresh ? null : readStoredToken();
      if (!forceFresh) {
        setToken(existingToken);
      }

      try {
        const data = await chatInicializar(existingToken);
        applyInitializedState(data);
      } catch (firstError) {
        if (existingToken && isChatTokenError(firstError)) {
          persistToken(null);

          try {
            const fallbackData = await chatInicializar();
            applyInitializedState(fallbackData);
            setError("Tu sesión anterior expiró. Iniciamos una nueva conversación.");
          } catch (fallbackError) {
            setError(getChatErrorMessage(fallbackError));
          }
        } else {
          setError(getChatErrorMessage(firstError));
        }
      } finally {
        setInitializing(false);
      }
    },
    [applyInitializedState, persistToken],
  );

  useEffect(() => {
    setToken(readStoredToken());
  }, []);

  useEffect(() => {
    messagesRef.current = messages;
  }, [messages]);

  useEffect(() => {
    const latestConversationId = getConversationIdFromMessages(messages);
    if (latestConversationId && latestConversationId !== conversacionId) {
      setConversacionId(latestConversationId);
    }
  }, [conversacionId, messages]);

  useEffect(() => {
    if (!isOpen) {
      return;
    }

    void initializeChat(false);
  }, [initializeChat, isOpen]);

  useEffect(() => {
    if (isOpen) {
      setHasUnreadWhileClosed(false);
    }
  }, [isOpen]);

  useEffect(() => {
    if (mode !== "operador" || !token || !conversacionId) {
      setRealtimeActive(false);
      return;
    }

    const realtimeInit = ensureChatEcho(token);
    if (!realtimeInit.ready) {
      setRealtimeActive(false);

      if (realtimeInit.reason) {
        createDevelopmentRealtimeLogger(`[ChatWidget] ${realtimeInit.reason}`);
      }

      return;
    }

    const subscription = subscribeToChatRealtime(conversacionId, {
      onNuevoMensaje: (payload: ChatRealtimeMessagePayload) => {
        const normalized = normalizeRealtimeMessage(payload);
        appendMessages([normalized]);

        if (typeof payload.conversacion_id === "number") {
          setConversacionId(payload.conversacion_id);
        }

        if (payload.emisor === "operador" || payload.emisor === "sistema") {
          setEsperandoOperador(false);
        }
      },
      onMensajesLeidos: (payload) => {
        setMessages((prev) =>
          prev.map((item) => {
            if (
              item.emisor === "cliente" &&
              item.conversacionId === payload.conversacion_id
            ) {
              return {
                ...item,
                leido: true,
              };
            }

            return item;
          }),
        );
      },
      onError: (realtimeError) => {
        createDevelopmentRealtimeLogger(
          "[ChatWidget] Error de canal realtime. Se mantiene modo API.",
          realtimeError,
        );
        setRealtimeActive(false);
      },
    });

    setRealtimeActive(subscription.active);
    if (!subscription.active && subscription.reason) {
      createDevelopmentRealtimeLogger(`[ChatWidget] ${subscription.reason}`);
    }

    return () => {
      subscription.unsubscribe();
      setRealtimeActive(false);
    };
  }, [appendMessages, conversacionId, mode, token]);

  useEffect(() => {
    if (!token) {
      return;
    }

    const syncSnapshot = async () => {
      try {
        const snapshot = await chatInicializar(token);
        const normalized = normalizeHistorial(snapshot.historial);
        appendMessages(normalized);
        setEsHorarioLaboral(snapshot.es_horario_laboral);

        if (snapshot.modo !== mode) {
          applyInitializedState(snapshot);
        }
      } catch (pollError) {
        if (isChatTokenError(pollError)) {
          persistToken(null);
          await initializeChat(true);
          setError("Tu sesión expiró. Iniciamos una conversación nueva.");
          return;
        }

        createDevelopmentRealtimeLogger(
          "[ChatWidget] Polling falló, se mantiene el estado actual.",
          pollError,
        );
      }
    };

    void syncSnapshot();

    const interval = window.setInterval(() => {
      void syncSnapshot();
    }, 18000);

    return () => {
      window.clearInterval(interval);
    };
  }, [
    appendMessages,
    applyInitializedState,
    initializeChat,
    mode,
    persistToken,
    token,
  ]);

  const handleToggle = () => {
    setIsOpen((prev) => {
      const next = !prev;

      if (!prev && next) {
        trackChatOpen({
          chat_provider: "dmc_custom_chat",
          page_type: pageType,
          chat_mode: resolveChatMode(),
          realtime_active: realtimeActive,
        });
      }

      return next;
    });
  };

  const handleClose = () => {
    setIsOpen(false);
  };

  const handleSelectMenu = async (menu: ChatMenu) => {
    setLoadingMenuId(menu.id);
    setError(null);

    appendMessages([createLocalClientMessage(menu.titulo, "bot_menu")]);

    try {
      const data = await chatMenusOpciones(menu.id, token);
      setMenuHistory([]);
      setCurrentMenu(data);
      setCurrentOptions(data.opciones ?? []);

      appendMessages([
        createSystemMessage(
          `Perfecto. Ahora elige una opción de "${data.titulo}".`,
          "bot_response",
        ),
      ]);
    } catch (menuError) {
      setError(getChatErrorMessage(menuError));
    } finally {
      setLoadingMenuId(null);
    }
  };

  const handleSelectOption = async (option: ChatBotOpcion) => {
    setLoadingOptionId(option.id);
    setError(null);

    appendMessages([createLocalClientMessage(option.texto_opcion, "bot_menu")]);

    try {
      const data = await chatOpcionSeleccionar(option.id, token);

      const responseMessages = (data.respuestas ?? []).map((item) =>
        normalizeBotRespuesta(item, option),
      );
      appendMessages(responseMessages);

      if (data.transferir_a_operador === 1) {
        trackChatLeadSubmit({
          chat_provider: "dmc_custom_chat",
          page_type: pageType,
          lead_type: "support",
          option_slug: option.slug,
        });
        await initializeChat(false);
        return;
      }

      if (data.siguiente_menu_id) {
        const nextMenu = await chatMenusOpciones(data.siguiente_menu_id, token);
        setMenuHistory((prev) => {
          if (!currentMenu) {
            return prev;
          }

          return [
            ...prev,
            {
              menu: currentMenu,
              options: currentOptions,
            },
          ];
        });
        setCurrentMenu(nextMenu);
        setCurrentOptions(nextMenu.opciones ?? []);
        appendMessages([
          createSystemMessage("Puedes continuar con las siguientes opciones."),
        ]);
      }
    } catch (optionError) {
      setError(getChatErrorMessage(optionError));
    } finally {
      setLoadingOptionId(null);
    }
  };

  const handleBackBotMenu = () => {
    if (loadingMenuId || loadingOptionId) {
      return;
    }

    setError(null);

    if (menuHistory.length > 0) {
      const previous = menuHistory[menuHistory.length - 1];
      setMenuHistory((prev) => prev.slice(0, -1));
      setCurrentMenu(previous.menu);
      setCurrentOptions(previous.options);
      appendMessages([createSystemMessage("Volviste al menú anterior.", "bot_response")]);
      return;
    }

    if (currentMenu) {
      setCurrentMenu(null);
      setCurrentOptions([]);
      appendMessages([createSystemMessage("Volviste al menú principal.", "bot_response")]);
    }
  };

  const handleSendMessage = async () => {
    if (sending) {
      return;
    }

    const content = draft.trim();
    if (!content) {
      return;
    }

    if (!token) {
      setError("La sesión del chat expiró. Inicia una nueva conversación.");
      setIsFinalized(true);
      return;
    }

    setSending(true);
    setError(null);
    trackChatMessageSent({
      chat_provider: "dmc_custom_chat",
      page_type: pageType,
      message_length: content.length,
      chat_mode: resolveChatMode(),
      conversation_id_present: Boolean(conversacionId),
    });

    try {
      const data = await chatEnviarMensaje(content, token);
      setDraft("");

      const newMessage = normalizeHistorialMessage(data.nuevo_mensaje);
      appendMessages([newMessage]);

      if (typeof data.nuevo_mensaje.conversacion_id === "number") {
        setConversacionId(data.nuevo_mensaje.conversacion_id);
      }

      if (data.mensaje_bienvenida && !realtimeActive) {
        const exists = messagesRef.current.some(
          (item) =>
            item.emisor === "sistema" && item.mensaje === data.mensaje_bienvenida,
        );

        if (!exists) {
          appendMessages([createSystemMessage(data.mensaje_bienvenida)]);
        }
      }

      if (typeof data.token === "string" && data.token.length > 0) {
        persistToken(data.token);
      }

      setEsperandoOperador(Boolean(data.esperando_operador));

      if (data.modo === "operador" || data.modo === "bot") {
        setMode(data.modo);
      }
    } catch (sendError) {
      if (isChatTokenError(sendError)) {
        persistToken(null);
        await initializeChat(true);
        setError("Tu sesión expiró. Iniciamos una conversación nueva.");
        setSending(false);
        return;
      }

      setError(getChatErrorMessage(sendError));
    } finally {
      setSending(false);
    }
  };

  const handleFinalize = async () => {
    if (!token || finalizing) {
      return;
    }

    setFinalizing(true);
    setError(null);

    try {
      const data = await chatFinalizar(token);

      if (data.mensaje) {
        appendMessages([createSystemMessage(data.mensaje)]);
      }

      persistToken(null);
      setIsFinalized(true);
      setEsperandoOperador(false);
      setCurrentMenu(null);
      setCurrentOptions([]);
      setMenuHistory([]);
    } catch (finalizeError) {
      if (isChatTokenError(finalizeError)) {
        persistToken(null);
        await initializeChat(true);
        setError("Tu sesión expiró. Iniciamos una conversación nueva.");
        setFinalizing(false);
        return;
      }

      setError(getChatErrorMessage(finalizeError));
    } finally {
      setFinalizing(false);
    }
  };

  const handleRestart = async () => {
    persistToken(null);
    setMessages([]);
    setCurrentMenu(null);
    setCurrentOptions([]);
    setMenuHistory([]);
    setIsFinalized(false);
    setDraft("");
    setError(null);
    await initializeChat(true);
  };

  const canFinalize = Boolean(token) && mode === "operador" && !isFinalized;
  const canGoBackInBot = mode === "bot" && (Boolean(currentMenu) || menuHistory.length > 0);

  return (
    <div className="relative">
      {isOpen && (
        <div className="absolute right-0 bottom-16 z-[80] sm:bottom-[4.25rem]">
          <ChatPanel
            mode={mode}
            loading={initializing}
            error={error}
            messages={messages}
            esHorarioLaboral={esHorarioLaboral}
            esperandoOperador={esperandoOperador}
            token={token}
            canFinalize={canFinalize}
            finalizing={finalizing}
            isFinalized={isFinalized}
            draft={draft}
            sending={sending}
            menusIniciales={menusIniciales}
            currentMenu={currentMenu}
            currentOptions={currentOptions}
            loadingMenuId={loadingMenuId}
            loadingOptionId={loadingOptionId}
            canGoBackInBot={canGoBackInBot}
            realtimeActive={realtimeActive}
            onClose={handleClose}
            onFinalize={handleFinalize}
            onRestart={() => {
              void handleRestart();
            }}
            onBackBotMenu={handleBackBotMenu}
            onSelectMenu={(menu) => {
              void handleSelectMenu(menu);
            }}
            onSelectOption={(option) => {
              void handleSelectOption(option);
            }}
            onDraftChange={setDraft}
            onSendMessage={() => {
              void handleSendMessage();
            }}
          />
        </div>
      )}

      <ChatFabButton
        isOpen={isOpen}
        hasUnread={hasUnreadWhileClosed}
        onClick={handleToggle}
      />
    </div>
  );
}

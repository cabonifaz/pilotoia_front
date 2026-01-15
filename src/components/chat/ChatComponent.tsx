import { useState, useEffect, useRef, useCallback } from "react";
import { useQuery } from "@tanstack/react-query";
import type { Message } from "@/types/message";
import { useChatStream } from "../../hooks/useChatStream";
import { usePaginatedChatMessages } from "../../hooks/usePaginatedChatMessages";
import { useExternalLogin } from "../../hooks/useExternalLogin";
import { useTranscribe } from "../../hooks/useTranscribe";
import { useFileTranscribe } from "../../hooks/useFileTranscribe";
import { MessageBubble } from "./MessageBubble";
import { QueryInputSection } from "./QueryInputSection";
import { CommandProvider } from "../../contexts/CommandContext";
import { TranscriptionProvider } from "../../contexts/TranscriptionContext";
import { type ChatContext } from "@/types/aiConfig";
import { Loader } from "@/components/loader/Loader";
import { useQueryAuthContext } from "../../contexts/QueryAuthContext";
import {
  Card,
  CardHeaderCompact,
  CardContentCompact,
} from "@/components/shadcn/card";
import { Avatar, AvatarFallback } from "@/components/shadcn/avatar";
import { Bot, Loader2 } from "lucide-react";

interface ChatComponentProps {
  chatContext: ChatContext;
  onChatIdChange?: (chatId: number) => void;
  onStreamingStateChange?: (isStreaming: boolean) => void;
  onOpenConfigSidebar?: () => void;
}

const ChatComponent = ({
  chatContext,
  onChatIdChange,
  onStreamingStateChange,
  onOpenConfigSidebar,
}: ChatComponentProps) => {
  const [userQuery, setUserQuery] = useState("");
  const currentMainActionRef = useRef<() => void>(() => {});
  const scrollTimeoutRef = useRef<ReturnType<typeof setTimeout> | undefined>(
    undefined
  );

  const { data: currentUser } = useQuery({
    queryKey: ["user", "current"],
    queryFn: async () => {
      return null;
    },
    enabled: false,
  });

  const transcribeProvider = import.meta.env.VITE_TRANSCRIBE_PROVIDER;

  const pageSize = 15;
  const maxPages = 3;
  const MAX_WINDOW = pageSize * maxPages;

  const {
    messages,
    loadOlder,
    loadLatest,
    hasMoreOlder,
    loadingInitial: isLoadingMessages,
    loadingOlder,
    error: errorMessages,
    containerRef,
    setMessages,
  } = usePaginatedChatMessages(
    chatContext.chat_id,
    chatContext.company_id,
    chatContext.area_id,
    pageSize,
    maxPages
  );

  const [loadingRecent] = useState(false);
  const pendingReloadRef = useRef(false);
  const isRestoringRef = useRef(false);
  const messagesContainerRef = useRef<HTMLDivElement | null>(null);
  const wasAtBottomRef = useRef(true);
  const isLoadingOlderRef = useRef(false);

  useEffect(() => {
    if (messagesContainerRef.current) {
      // @ts-ignore
      (containerRef as any).current = messagesContainerRef.current;
    }
  }, [containerRef]);

  const captureTopAnchor = useCallback(() => {
    const c = messagesContainerRef.current;
    if (!c) return null;
    const containerRect = c.getBoundingClientRect();
    const children = Array.from(
      c.querySelectorAll("[data-message-id]")
    ) as HTMLElement[];
    for (const el of children) {
      const rect = el.getBoundingClientRect();
      if (rect.bottom > containerRect.top + 1) {
        const anchor = {
          id: el.dataset.messageId || null,
          relTop: rect.top - containerRect.top,
        };

        return anchor;
      }
    }
    if (children.length) {
      const el = children[0];
      const rect = el.getBoundingClientRect();
      const anchor = {
        id: el.dataset.messageId || null,
        relTop: rect.top - containerRect.top,
      };

      return anchor;
    }
    return null;
  }, []);

  const restoreTopAnchor = useCallback(
    (
      anchor: { id: string | null; relTop: number } | null,
      prevScrollTop?: number | null,
      prevScrollHeight?: number | null
    ) => {
      const c = messagesContainerRef.current;
      if (!c || !anchor || !anchor.id) return;
      const el = c.querySelector(
        `[data-message-id="${anchor.id}"]`
      ) as HTMLElement | null;
      if (!el) return;

      requestAnimationFrame(() => {
        requestAnimationFrame(() => {
          try {
            const containerRect = c.getBoundingClientRect();
            const rect = el.getBoundingClientRect();
            const currentRelTop = rect.top - containerRect.top;
            const delta = currentRelTop - anchor.relTop;
            const newScrollHeight = c.scrollHeight;

            if (delta != null && Math.abs(delta) <= 200) {
              c.scrollTop += delta;
            } else {
              c.scrollTop =
                (prevScrollTop ?? c.scrollTop) +
                (newScrollHeight - (prevScrollHeight ?? newScrollHeight));
            }
          } catch (e) {}
        });
      });
    },
    []
  );

  const {
    isLoading,
    streamingMessageId,
    progressMessage,
    searchVectorial,
    searchVectorialSQL,
    cancelMessage,
    currentChatId,
  } = useChatStream();
  const { isAuthenticated, token } = useExternalLogin();
  const { user } = useQueryAuthContext();
  const actualCompanyArea = (user as any)?.actual_company_area;
  const logoUrl = actualCompanyArea?.LOGO
    ? `${import.meta.env.VITE_LOGO_URL_BASE}${
        actualCompanyArea.LOGO
      }?v=${Date.now()}`
    : "/fractal-logo.svg";

  const {
    isRecording,
    isConnecting,
    transcript,
    partialTranscript,
    startRecording,
    stopRecording,
    clearTranscript,
  } = useTranscribe();
  const {
    isRecording: isFileRecording,
    isTranscribing: isFileTranscribing,
    transcriptionResult: fileTranscriptionResult,
    prepareRecording: prepareFileRecording,
    cancelPrepareRecording: cancelPrepareFileRecording,
    startRecording: startFileRecording,
    stopRecording: stopFileRecording,
  } = useFileTranscribe();

  useEffect(() => {
    if (currentChatId && onChatIdChange) {
      onChatIdChange(currentChatId);
    }
  }, [currentChatId, onChatIdChange]);

  useEffect(() => {
    if (streamingMessageId) {
      pendingReloadRef.current = true;
      requestAnimationFrame(() => {
        try {
          if (messagesContainerRef.current)
            messagesContainerRef.current.scrollTop =
              messagesContainerRef.current.scrollHeight;
        } catch (e) {}
      });
    }
  }, [streamingMessageId]);

  useEffect(() => {
    if (!isLoading && pendingReloadRef.current) {
      setMessages((prev) => {
        const lastOptimisticIndex = [...prev]
          .reverse()
          .findIndex((m) => (m as any).__optimistic);

        if (lastOptimisticIndex === -1) return prev;

        const index = prev.length - 1 - lastOptimisticIndex;

        const cleaned = [...prev];
        cleaned.splice(index, 1);

        return cleaned;
      });

      pendingReloadRef.current = false;
    }
  }, [isLoading]);

  useEffect(() => {
    if (onStreamingStateChange) {
      onStreamingStateChange(isLoading);
    }
  }, [isLoading, onStreamingStateChange]);

  const handleScroll = useCallback(
    (e: React.UIEvent<HTMLDivElement>) => {
      if (scrollTimeoutRef.current) {
        clearTimeout(scrollTimeoutRef.current);
      }
      const { scrollTop, scrollHeight, clientHeight } = e.currentTarget;
      scrollTimeoutRef.current = setTimeout(() => {
        const isAtBottom = scrollHeight - scrollTop <= clientHeight + 80;
        wasAtBottomRef.current = isAtBottom;
        if (scrollTop <= 120 && !loadingOlder) {
          (async () => {
            try {
              if (scrollTop <= 120 && hasMoreOlder && !loadingOlder) {
                const anchor = captureTopAnchor();
                const prevScrollTop =
                  messagesContainerRef.current?.scrollTop || 0;
                const prevScrollHeight =
                  messagesContainerRef.current?.scrollHeight || 0;

                isRestoringRef.current = true;

                const list = await loadOlder();

                if (list?.length) {
                  isLoadingOlderRef.current = true;
                  applyWindow(list, "older");

                  requestAnimationFrame(() => {
                    restoreTopAnchor(anchor, prevScrollTop, prevScrollHeight);
                    isRestoringRef.current = false;
                  });
                } else {
                  isRestoringRef.current = false;
                }
              } else if (hasMoreOlder) {
                const anchor = captureTopAnchor();
                const prevScrollTop =
                  messagesContainerRef.current?.scrollTop || 0;
                const prevScrollHeight =
                  messagesContainerRef.current?.scrollHeight || 0;
                isRestoringRef.current = true;

                const list = await loadOlder();
                if (list?.length) {
                  isLoadingOlderRef.current = true;
                  applyWindow(list, "older");

                  requestAnimationFrame(() => {
                    try {
                      restoreTopAnchor(anchor, prevScrollTop, prevScrollHeight);
                    } finally {
                      isRestoringRef.current = false;
                    }
                  });
                } else {
                  isRestoringRef.current = false;
                }
              }
            } catch (e) {}
          })();
        }
        wasAtBottomRef.current = isAtBottom;
      }, 150);
    },
    [hasMoreOlder, loadingOlder, loadOlder, messages]
  );

  useEffect(() => {
    if (
      !messagesContainerRef.current ||
      isRestoringRef.current ||
      !wasAtBottomRef.current
    ) {
      return;
    }

    messagesContainerRef.current.scrollTop =
      messagesContainerRef.current.scrollHeight;
  }, [messages, streamingMessageId]);

  useEffect(() => {
    return () => {
      if (scrollTimeoutRef.current) {
        clearTimeout(scrollTimeoutRef.current);
      }
    };
  }, []);

  useEffect(() => {
    const currentTranscript = transcript || partialTranscript;
    if (currentTranscript) {
      setUserQuery(currentTranscript);
    }
  }, [transcript, partialTranscript]);

  useEffect(() => {
    if (fileTranscriptionResult?.transcript) {
      setUserQuery(fileTranscriptionResult.transcript);
    }
  }, [fileTranscriptionResult]);

  const handleMicrophoneClick = async () => {
    if (isRecording) {
      stopRecording();
    } else {
      clearTranscript();
      await startRecording({ language_code: "es-ES" });
    }
  };

  const chatQuery = async () => {
    wasAtBottomRef.current = true;
    if (!userQuery.trim()) return;
    const currentQuery = userQuery;
    setUserQuery("");

    requestAnimationFrame(() => {
      try {
        if (messagesContainerRef.current)
          messagesContainerRef.current.scrollTop =
            messagesContainerRef.current.scrollHeight;
      } catch (e) {}
    });

    await searchVectorial(currentQuery, chatContext);
    const latest = await loadLatest();

    if (latest?.length) {
      const existingIds = new Set(messages.map((m) => m.id));

      const deduped = latest.filter((m) => !existingIds.has(m.id));

      if (deduped.length > 0) {
        setMessages((prev) => prev.filter((m) => !(m as any).__optimistic));
      }
    }
  };

  const cancelar = () => {
    cancelMessage();
  };

  const agentQuery = async () => {
    wasAtBottomRef.current = true;
    if (!userQuery.trim() || !token) return;
    const currentQuery = userQuery;
    setUserQuery("");
    const tmpId = `tmp-user-${Date.now()}`;
    const optimisticMsg = {
      id: tmpId,
      created_at: new Date().toISOString(),
      sender: 0,
      message: currentQuery,
      __optimistic: true, // 👈 SOLO FRONTEND
    } as any;
    applyWindow([optimisticMsg], "newer");

    requestAnimationFrame(() => {
      try {
        if (messagesContainerRef.current)
          messagesContainerRef.current.scrollTop =
            messagesContainerRef.current.scrollHeight;
      } catch (e) {}
    });
    console.info(
      "[chat] optimistic user message appended and scrolled (agent)",
      { tmpId, contentPreview: currentQuery.slice(0, 80) }
    );
    await searchVectorialSQL(currentQuery, chatContext, token);
  };
  function applyWindow(incoming: Message[], direction: "older" | "newer") {
    setMessages((prev) => {
      const combined =
        direction === "older" ? [...incoming, ...prev] : [...prev, ...incoming];

      const map = new Map<string, Message>();

      for (const m of combined) {
        // Si el id empieza con "temp-" → es temporal, usamos id como clave
        const key = m.id.startsWith("temp-")
          ? m.id
          : `${m.sender}-${m.message}-${m.created_at}`;

        map.set(key, m);
      }

      const deduped = Array.from(map.values()).sort((a, b) =>
        a.created_at > b.created_at ? 1 : -1
      );

      if (direction === "older") return deduped;

      return deduped.slice(-MAX_WINDOW);
    });
  }

  return (
    <CommandProvider
      userQuery={userQuery}
      onQueryChange={setUserQuery}
      isLoading={isLoading}
      onCancel={cancelar}
      isAuthenticated={isAuthenticated}
      token={token || undefined}
      onSearchVectorial={chatQuery}
      onSearchVectorialSQL={agentQuery}
      onMainActionChange={(action) => {
        currentMainActionRef.current = action;
      }}
    >
      <TranscriptionProvider
        transcribeProvider={transcribeProvider}
        isRecording={isRecording}
        isConnecting={isConnecting}
        onMicrophoneClick={handleMicrophoneClick}
        startMicrophoneRecording={async () => {
          clearTranscript();
          await startRecording({ language_code: "es-ES" });
        }}
        stopMicrophoneRecording={stopRecording}
        isFileRecording={isFileRecording}
        isFileTranscribing={isFileTranscribing}
        onPrepareRecording={prepareFileRecording}
        onCancelPrepareRecording={cancelPrepareFileRecording}
        onStartRecording={startFileRecording}
        onStopRecording={stopFileRecording}
      >
        <div className="h-full flex flex-col">
          {isLoadingMessages ? (
            <Loader text="Cargando mensajes..." />
          ) : errorMessages ? (
            <div className="flex items-center justify-center h-full">
              <p className="text-red-500">Error al cargar los mensajes.</p>
            </div>
          ) : !messages || messages.length === 0 ? (
            <div className="flex-1 flex items-center justify-center">
              <div className="w-full flex flex-col gap-3">
                <div className="flex items-center justify-center mb-2">
                  <div className="w-[148px] flex items-center justify-center">
                    <img
                      src={logoUrl}
                      alt={actualCompanyArea?.RAZON_SOCIAL || "Logo Fractal"}
                      className="w-auto h-auto min-h-6 max-h-12 max-w-full object-contain"
                    />
                  </div>
                </div>
                <h3 className="text-3xl font-semibold text-center">
                  Bueno verte, {(currentUser as any)?.nombres || "Usuario"}
                </h3>
                <QueryInputSection
                  company={chatContext.company}
                  area={chatContext.area}
                  onOpenConfigSidebar={onOpenConfigSidebar}
                />
              </div>
            </div>
          ) : (
            <>
              <div className="flex-1 min-h-0 overflow-hidden flex">
                <div
                  ref={messagesContainerRef}
                  className="w-full h-full overflow-y-auto messages-container"
                  onScroll={handleScroll}
                >
                  <div className="flex justify-center py-2">
                    {hasMoreOlder ? (
                      <button
                        onClick={async () => {
                          try {
                            const prevScrollTop =
                              messagesContainerRef.current?.scrollTop || 0;
                            if (
                              prevScrollTop <= 120 &&
                              hasMoreOlder &&
                              !loadingOlder
                            ) {
                              const anchor = captureTopAnchor();
                              const prevScrollTop =
                                messagesContainerRef.current?.scrollTop || 0;
                              const prevScrollHeight =
                                messagesContainerRef.current?.scrollHeight || 0;

                              isRestoringRef.current = true;

                              const list = await loadOlder();

                              if (list?.length) {
                                isLoadingOlderRef.current = true;
                                applyWindow(list, "older");

                                requestAnimationFrame(() => {
                                  restoreTopAnchor(
                                    anchor,
                                    prevScrollTop,
                                    prevScrollHeight
                                  );
                                  isRestoringRef.current = false;
                                });
                              } else {
                                isRestoringRef.current = false;
                              }
                            } else {
                              if (!hasMoreOlder) return;
                              const list = await loadOlder();
                              if (list?.length) {
                                applyWindow(list, "older");
                              }
                            }
                          } catch (e) {}
                        }}
                        className="text-sm text-primary underline"
                        disabled={loadingOlder}
                      >
                        {loadingOlder ? (
                          <span className="flex items-center gap-2">
                            <Loader2 className="h-3 w-3 animate-spin" />{" "}
                            Cargando mensajes antiguos...
                          </span>
                        ) : (
                          "Ver mensajes anteriores"
                        )}
                      </button>
                    ) : (
                      <span className="text-xs text-muted-foreground">
                        No hay más mensajes
                      </span>
                    )}
                  </div>

                  {messages?.map((message) => (
                    <div key={message.id} data-message-id={message.id}>
                      <MessageBubble
                        message={message}
                        streamingMessageId={streamingMessageId}
                        progressMessage={progressMessage}
                        user={chatContext.user}
                      />
                    </div>
                  ))}

                  {loadingRecent && (
                    <div className="w-full flex justify-center py-2">
                      <div className="text-sm text-primary flex items-center gap-2">
                        <Loader2 className="h-3 w-3 animate-spin" />
                        <span>Cargando mensajes recientes...</span>
                      </div>
                    </div>
                  )}

                  {isLoading && progressMessage && !streamingMessageId && (
                    <div className="mb-6 flex justify-start">
                      <Card className="max-w-[80%] border-0 shadow-none bg-background">
                        <CardHeaderCompact className="pb-2">
                          <div className="flex items-center gap-2 text-xs">
                            <Avatar className="h-6 w-6">
                              <AvatarFallback className="text-xs">
                                <Bot className="h-4 w-4" />
                              </AvatarFallback>
                            </Avatar>
                            <span className="font-medium">AI</span>
                          </div>
                        </CardHeaderCompact>
                        <CardContentCompact>
                          <div className="flex items-center gap-2 text-xs text-muted-foreground">
                            <span>{progressMessage}</span>
                            <Loader2 className="h-3 w-3 animate-spin" />
                          </div>
                        </CardContentCompact>
                      </Card>
                    </div>
                  )}
                </div>
              </div>

              <div className="flex-shrink-0 flex">
                <div className="w-full">
                  <QueryInputSection
                    company={chatContext.company}
                    area={chatContext.area}
                    onOpenConfigSidebar={onOpenConfigSidebar}
                  />
                </div>
              </div>
            </>
          )}
        </div>
      </TranscriptionProvider>
    </CommandProvider>
  );
};

export default ChatComponent;

import { useState, useCallback, useEffect, useRef } from "react";
import { useQuery } from "@tanstack/react-query";
import { queryKeys } from "../lib/queryClient";
import { chatApi } from "../api/chatApi";
import type { Message } from "../types/message";
import type { MessageListResponse } from "../types/chat";
import { useQueryClient } from "@tanstack/react-query";
export function usePaginatedChatMessages(
  chatId: number | null | undefined,
  company_id: number,
  area_id: number,
  pageSize = 15,
  maxPages = 3
) {
  const MAX = pageSize * maxPages;
  const olderBufferRef = useRef<Message[]>([]);
  const [messages, setMessages] = useState<Message[]>([]);
  const [lastKey, setLastKey] = useState<any | null>(null);
  const [loadingInitial, setLoadingInitial] = useState(false);
  const [loadingOlder, setLoadingOlder] = useState(false);
  const [hasMoreOlder, setHasMoreOlder] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const queryClient = useQueryClient();
  // Ref for scroll adjustments (consumer provides container ref)
  const containerRef = useRef<HTMLElement | null>(null);
  // Subscribe to TanStack Query cache for streaming updates & live appends
  const cacheQuery = useQuery<Message[]>({
    queryKey: queryKeys.chat.messages(chatId ?? null),
    queryFn: async () => [], // we only use this to subscribe to cache updates (no network fetch)
    enabled: !!chatId,
    staleTime: Infinity,
    refetchOnWindowFocus: false,
  });

  const loadInitial = useCallback(async () => {
    if (!chatId) {
      setMessages([]);
      setLastKey(null);
      setHasMoreOlder(false);
      return;
    }

    setLoadingInitial(true);

    try {
      const res: MessageListResponse = await chatApi.getMessagesByChat(
        String(chatId),
        company_id,
        area_id,
        pageSize
      );
      // res.messages is oldest -> newest
      setMessages(res.messages || []);
      // Sync cache with TanStack Query
      let initialMessages = res.messages || [];
      if (initialMessages.length > MAX) {
        // recorta los más viejos al buffer
        const excess = initialMessages.length - MAX;
        olderBufferRef.current = initialMessages.slice(0, excess); // guardo los más viejos
        initialMessages = initialMessages.slice(excess); // mantengo solo los últimos MAX
      }
      setMessages(initialMessages);

      queryClient.setQueryData(
        queryKeys.chat.messages(chatId),
        res.messages || []
      );
      setLastKey(res.last_evaluated_key ?? null);
      // Determine if there are more pages. Use LastEvaluatedKey if present, otherwise fall back to total_count
      const totalReturned = (res.messages || []).length;
      const totalCount = (res as any).total_count ?? null;
      const hasMore =
        Boolean(res.last_evaluated_key) ||
        (totalCount !== null && totalCount > totalReturned);
      setHasMoreOlder(Boolean(hasMore));

      setError(null);
    } catch (err: any) {
      setError(err instanceof Error ? err : new Error(String(err)));
      setMessages([]);
      setLastKey(null);
      setHasMoreOlder(false);
    } finally {
      setLoadingInitial(false);
    }
  }, [chatId, company_id, area_id, pageSize]);

  const loadOlder = useCallback(async (): Promise<Message[]> => {
    if (!chatId || !lastKey || loadingOlder) return [];

    setLoadingOlder(true);
    try {
      const res = await chatApi.getMessagesByChat(
        String(chatId),
        company_id,
        area_id,
        pageSize,
        lastKey
      );

      const older = res.messages || [];

      setLastKey(res.last_evaluated_key ?? null);
      setError(null);

      return await new Promise<Message[]>((resolve) => {
        setMessages((prev) => {
          const combined = [...older, ...prev];

          const map = new Map<string, Message>();
          for (const m of combined) map.set(m.created_at, m);

          const deduped = Array.from(map.values()).sort((a, b) =>
            a.created_at > b.created_at ? 1 : -1
          );

          resolve(deduped);
          return deduped;
        });
      }).then((list) => {
        queryClient.setQueryData(queryKeys.chat.messages(chatId), list);
        return list;
      });
    } finally {
      setLoadingOlder(false);
    }
  }, [chatId, company_id, area_id, pageSize, lastKey, loadingOlder, MAX]);

  // Reload when chat changes
  useEffect(() => {
    loadInitial();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [chatId, company_id, area_id]);

  // Load the latest page (most recent messages) without toggling the `loadingInitial` UI
  const loadLatest = useCallback(async (): Promise<Message[]> => {
    if (!chatId) return [];

    try {
      const res: MessageListResponse = await chatApi.getMessagesByChat(
        String(chatId),
        company_id,
        area_id,
        pageSize
      );

      let latestMessages = res.messages || [];

      // aplicar ventana
      if (latestMessages.length > MAX) {
        const excess = latestMessages.length - MAX;
        olderBufferRef.current = latestMessages.slice(0, excess);
        latestMessages = latestMessages.slice(excess);
      }

      setMessages(latestMessages);
      queryClient.setQueryData(queryKeys.chat.messages(chatId), latestMessages);

      setLastKey(res.last_evaluated_key ?? null);

      const totalReturned = (res.messages || []).length;
      const totalCount = (res as any).total_count ?? null;
      const hasMore =
        Boolean(res.last_evaluated_key) ||
        (totalCount !== null && totalCount > totalReturned);

      setHasMoreOlder(Boolean(hasMore));

      // scroll al fondo
      requestAnimationFrame(() => {
        try {
          if (containerRef.current) {
            containerRef.current.scrollTop = containerRef.current.scrollHeight;
          }
        } catch {}
      });

      return latestMessages; // 🔥 ESTO FALTABA
    } catch (err: any) {
      setError(err instanceof Error ? err : new Error(String(err)));
      return [];
    }
  }, [chatId, company_id, area_id, pageSize, MAX]);

  // Subscribe to streaming/cache updates (TanStack Query) and merge live messages
  useEffect(() => {
    let result: Message[] = [];
    if (!chatId) return;
    const cached = cacheQuery.data || [];

    // If cache is non-empty and cache's newest differs from the local newest, merge
    const cacheNewestId = cached.length
      ? cached[cached.length - 1].created_at
      : null;
    const localNewestId = messages.length
      ? messages[messages.length - 1].created_at
      : null;

    if (cacheNewestId && cacheNewestId !== localNewestId) {
      setMessages((prev) => {
        const combined = [...prev, ...cached];
        const map = new Map<string, Message>();
        for (const m of combined) map.set(m.created_at, m);
        const deduped = Array.from(map.values()).sort((a, b) =>
          a.created_at > b.created_at ? 1 : -1
        );

        // Keep only newest MAX messages to respect sliding window
        result = deduped;
        if (deduped.length > MAX) {
          result = deduped.slice(deduped.length - MAX); // mantiene solo los últimos MAX
        }

        // After DOM update, scroll to bottom so streaming is visible
        requestAnimationFrame(() => {
          try {
            if (containerRef.current) {
              containerRef.current.scrollTop =
                containerRef.current.scrollHeight;
            }
          } catch (e) {
            // ignore
          }
        });

        return result;
      });
      queryClient.setQueryData(queryKeys.chat.messages(chatId), result);

      // Clear buffers because server state is authoritative now
      // (preserve user experience by discarding local buffers)
      // Note: we don't expose buffers here; consumers manage their own refs.
    }
  }, [cacheQuery.data, chatId]);

  return {
    messages,
    loadInitial,
    loadLatest,
    loadOlder,
    hasMoreOlder,
    loadingInitial,
    loadingOlder,
    error,
    containerRef,
    setMessages, // expose for rare cases
  };
}

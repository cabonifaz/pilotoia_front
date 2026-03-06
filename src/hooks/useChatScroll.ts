import { useState, useRef, useEffect, useCallback } from 'react';

interface UseChatScrollOptions {
  chatId: number | null | undefined;
  messagesLength: number;
  isFetchingNextPage: boolean;
  streamingMessageId: string | null;
  hasNextPage: boolean;
  fetchNextPage: () => void;
}

export function useChatScroll({
  chatId,
  messagesLength,
  isFetchingNextPage,
  streamingMessageId,
  hasNextPage,
  fetchNextPage,
}: UseChatScrollOptions) {
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const [shouldAutoScroll, setShouldAutoScroll] = useState(true);
  const isUserSendingRef = useRef(false);
  const scrollTimeoutRef = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  const previousScrollHeightRef = useRef<number>(0);

  const scrollToBottom = useCallback((behavior: 'smooth' | 'auto' = 'smooth') => {
    if (scrollContainerRef.current) {
      scrollContainerRef.current.scrollTo({
        top: scrollContainerRef.current.scrollHeight,
        behavior,
      });
    }
  }, []);

  // Reset on chat change
  useEffect(() => {
    setShouldAutoScroll(true);
    previousScrollHeightRef.current = 0;
    if (scrollContainerRef.current) {
      scrollContainerRef.current.scrollTop = scrollContainerRef.current.scrollHeight;
    }
  }, [chatId]);

  // Scroll management
  useEffect(() => {
    const container = scrollContainerRef.current;
    if (!container || isFetchingNextPage) return;

    if (isUserSendingRef.current) {
      container.scrollTop = container.scrollHeight;
      previousScrollHeightRef.current = 0;
      setShouldAutoScroll(true);
      if (scrollTimeoutRef.current) clearTimeout(scrollTimeoutRef.current);
      scrollTimeoutRef.current = setTimeout(() => {
        isUserSendingRef.current = false;
      }, 500);
      return;
    }

    if (previousScrollHeightRef.current > 0) {
      const delta = container.scrollHeight - previousScrollHeightRef.current;
      container.scrollTop = delta;
      previousScrollHeightRef.current = 0;
      return;
    }

    if (shouldAutoScroll || !!streamingMessageId) {
      scrollToBottom('smooth');
    }
  }, [messagesLength, isFetchingNextPage, streamingMessageId, scrollToBottom, shouldAutoScroll]);

  // Cleanup
  useEffect(() => {
    return () => {
      if (scrollTimeoutRef.current) clearTimeout(scrollTimeoutRef.current);
    };
  }, []);

  const handleScroll = useCallback(
    (e: React.UIEvent<HTMLDivElement>) => {
      if (isUserSendingRef.current) return;
      const { scrollTop, scrollHeight, clientHeight } = e.currentTarget;
      setShouldAutoScroll(scrollHeight - scrollTop <= clientHeight + 100);
      if (scrollTop === 0 && hasNextPage && !isFetchingNextPage) {
        previousScrollHeightRef.current = scrollHeight;
        fetchNextPage();
      }
    },
    [hasNextPage, isFetchingNextPage, fetchNextPage],
  );

  const signalUserSending = useCallback(() => {
    previousScrollHeightRef.current = 0;
    isUserSendingRef.current = true;
    setShouldAutoScroll(true);
    if (scrollContainerRef.current) {
      scrollContainerRef.current.scrollTop = scrollContainerRef.current.scrollHeight;
    }
  }, []);

  return { scrollContainerRef, handleScroll, signalUserSending };
}

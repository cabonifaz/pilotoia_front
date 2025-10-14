import { QueryClient } from '@tanstack/react-query';
import { persistQueryClient } from '@tanstack/query-persist-client-core';
import { createSyncStoragePersister } from '@tanstack/query-sync-storage-persister';

// Create a persister for localStorage (user data, chats list, etc)
const localStoragePersister = createSyncStoragePersister({
    storage: window.localStorage,
    key: 'PILOTOIA_REACT_QUERY_OFFLINE_CACHE',
    serialize: JSON.stringify,
    deserialize: JSON.parse,
});

// Create a persister for sessionStorage (chat messages - cleared on tab close)
const sessionStoragePersister = createSyncStoragePersister({
    storage: window.sessionStorage,
    key: 'chat_messages_cache',
    serialize: JSON.stringify,
    deserialize: JSON.parse,
});

// Create QueryClient with optimized defaults
export const queryClient = new QueryClient({
    defaultOptions: {
        queries: {
            // Cache data for 5 minutes by default
            staleTime: 5 * 60 * 1000,
            // Keep inactive queries in cache for 10 minutes
            gcTime: 10 * 60 * 1000,
            // Retry failed requests 3 times with exponential backoff
            retry: 3,
            retryDelay: attemptIndex => Math.min(1000 * 2 ** attemptIndex, 30000),
            // Refetch on window focus for important data
            refetchOnWindowFocus: true,
            // Don't refetch on reconnect by default (can be overridden per query)
            refetchOnReconnect: 'always',
        },
        mutations: {
            // Retry mutations once
            retry: 1,
            // Show loading states
            onMutate: () => {
                // Optional: Global loading state can be managed here
            },
        },
    },
});

// Set up persistence for localStorage (user data, chat lists)
persistQueryClient({
    queryClient,
    persister: localStoragePersister,
    maxAge: 1000 * 60 * 60 * 24, // 24 hours
    hydrateOptions: {},
    dehydrateOptions: {
        shouldDehydrateQuery: (query: any) => {
            const queryKey = query.queryKey;
            // Don't persist chat messages to localStorage
            if (queryKey[0] === 'chat' && queryKey[1] === 'messages') {
                return false;
            }
            // Only persist successful queries that are not too fresh
            return query.state.status === 'success' && query.state.dataUpdatedAt > Date.now() - 1000 * 60;
        },
    },
});

// Set up persistence for sessionStorage (chat messages only)
persistQueryClient({
    queryClient,
    persister: sessionStoragePersister,
    maxAge: 1000 * 60 * 60 * 8, // 8 hours (cleared on tab close anyway)
    hydrateOptions: {},
    dehydrateOptions: {
        shouldDehydrateQuery: (query: any) => {
            const queryKey = query.queryKey;
            // Only persist chat messages to sessionStorage
            if (queryKey[0] === 'chat' && queryKey[1] === 'messages') {
                return query.state.status === 'success';
            }
            return false;
        },
    },
});

// Query keys factory for better organization
export const queryKeys = {
    // User-related queries
    user: {
        current: () => ['user', 'current'] as const,
        profile: (userId: number) => ['user', 'profile', userId] as const,
    },
    // Chat-related queries
    chat: {
        list: (userId: number) => ['chat', 'list', userId] as const,
        messages: (chatId: number | null) => ['chat', 'messages', chatId] as const,
        history: (userId: string, companyId?: string) =>
            ['chat', 'history', { userId, companyId }] as const,
        areas: () => ['chat', 'areas'] as const,
        config: (userId: string, companyId: string) =>
            ['chat', 'config', { userId, companyId }] as const,
    },
} as const;

// Utility functions for cache management
export const invalidateUserQueries = () => {
    queryClient.invalidateQueries({ queryKey: queryKeys.user.current() });
};

export const clearUserCache = () => {
    queryClient.removeQueries({ queryKey: queryKeys.user.current() });
    queryClient.removeQueries({ queryKey: ['user'] });
};

export const clearChatCache = () => {
    queryClient.removeQueries({ queryKey: ['chat'] });
};

export const getUserFromCache = () => {
    return queryClient.getQueryData(queryKeys.user.current());
};
import { QueryClient } from '@tanstack/react-query';

// Note: ALL data is in-memory only with TanStack Query
// No persistence to localStorage or sessionStorage
// Data is cleared when tab closes or on logout

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
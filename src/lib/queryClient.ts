import { QueryClient } from '@tanstack/react-query';
import { persistQueryClient } from '@tanstack/query-persist-client-core';
import { createSyncStoragePersister } from '@tanstack/query-sync-storage-persister';

// Create a persister for localStorage
const localStoragePersister = createSyncStoragePersister({
    storage: window.localStorage,
    key: 'PILOTOIA_REACT_QUERY_OFFLINE_CACHE',
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

// Set up persistence
persistQueryClient({
    queryClient,
    persister: localStoragePersister,
    maxAge: 1000 * 60 * 60 * 24, // 24 hours
    hydrateOptions: {},
    dehydrateOptions: {
        shouldDehydrateQuery: (query: any) => {
            // Only persist successful queries that are not too fresh
            return query.state.status === 'success' && query.state.dataUpdatedAt > Date.now() - 1000 * 60;
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

export const getUserFromCache = () => {
    return queryClient.getQueryData(queryKeys.user.current());
};
import { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { getMenuItems } from '../api/menuItemsApi';
import type { MenuItem } from '@/types/menuItems';
import { useCurrentUser } from './useUserQueries';

// Query key factory
export const menuItemsKeys = {
  all: ['menu-items'] as const,
  list: () => [...menuItemsKeys.all, 'list'] as const,
};

// Hook to fetch menu items for current user
export const useMenuItemsQuery = () => {
  const { user, isAuthenticated } = useCurrentUser();

  return useQuery({
    queryKey: menuItemsKeys.list(),
    queryFn: async (): Promise<MenuItem[]> => {
      const response = await getMenuItems();
      return response.menu_items;
    },
    enabled: isAuthenticated && !!user, // Only fetch if user is logged in
    staleTime: 24 * 60 * 60 * 1000, // 24h - menu items rarely change
    gcTime: 2 * 24 * 60 * 60 * 1000, // 2 days
    refetchOnWindowFocus: false, // Don't refetch on window focus
    retry: 2, // Retry failed requests twice
  });
};

// Hook to get menu items with loading state and allowed paths
export const useMenuItems = () => {
  const { data: menuItems = [], isLoading, error } = useMenuItemsQuery();

  // Compute allowed paths from menu items
  // Backend returns paths like "/rag", "/areas" - we remove leading slash for router matching
  const allowedPaths = useMemo(() => {
    return menuItems
      .filter(item => item.PATH && item.LABEL) // Filter items with valid PATH and LABEL
      .map(item => item.PATH.replace(/^\//, '')); // Remove leading slash: "/rag" → "rag"
  }, [menuItems]);

  return {
    menuItems,
    isLoading,
    error,
    allowedPaths, // Array of allowed route paths for GuardRoute validation
    hasMenuItems: menuItems.length > 0,
  };
};
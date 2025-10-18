import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { authApi } from '../api/authApi';
import { chatApi } from '../api/chatApi';
import type { LoginRequest, LoginResponse } from '../types/auth';
import { queryKeys, clearUserCache } from '../lib/queryClient';
import { toast } from './use-toast';
import JWTUtils, { type DecodedUserData } from '../utils/jwtUtils';

// Custom hook for user authentication state
export const useUserQuery = () => {
    return useQuery({
        queryKey: queryKeys.user.current(),
        queryFn: async (): Promise<DecodedUserData | null> => {
            // Try to get user data from JWT token in sessionStorage
            const token = sessionStorage.getItem('jwt_token');
            if (!token) {
                return null;
            }
            
            // Decode JWT to get user data
            const userData = JWTUtils.decodeToken(token);
            return userData;
        },
        staleTime: 24 * 60 * 60 * 1000, // Consider fresh for 8 hours (match JWT expiration)
        gcTime: 24 * 60 * 60 * 1000, // Keep in cache for 8 hours
        refetchOnWindowFocus: false, // Don't refetch user data on focus
        refetchOnReconnect: false, // Don't refetch user data on reconnect
        retry: false, // Don't retry user queries automatically
    });
};

// Login mutation hook
export const useLoginMutation = () => {
    const queryClient = useQueryClient();
    
    return useMutation({
        mutationFn: async (credentials: LoginRequest): Promise<LoginResponse> => {
            const result = await authApi.login(credentials);
            
            if (result.status === 'success') {
                return result;
            } else {
                throw new Error('Login failed');
            }
        },
        onSuccess: (data: LoginResponse) => {
            // Store JWT in sessionStorage
            if (data.token) {
                sessionStorage.setItem('jwt_token', data.token);
                
                // Decode JWT to get complete user data
                const decodedUserData = JWTUtils.decodeToken(data.token);
                
                if (decodedUserData) {
                    // Remove company_areas from JWT data - will be populated by separate endpoint
                    const { company_areas: _companyAreas, ...userDataWithoutCompanyAreas } = decodedUserData;

                    const userDataForCache = {
                        ...userDataWithoutCompanyAreas,
                        company_areas: [], // Will be populated by useCompanyAreasQuery
                        actual_company_area: null // Will be set after company areas are loaded
                    };

                    // Update the query cache with decoded JWT data (without company_areas)
                    queryClient.setQueryData(queryKeys.user.current(), userDataForCache);

                    // Note: Chats are now fetched per company/area by useUserChatsQuery
                    // No longer storing all chats at login - they'll be fetched when needed

                    // Show success message
                    toast({
                        title: "Éxito",
                        description: `Bienvenido, ${decodedUserData.user}`,
                        variant: "success"
                    });

                    // Trigger company areas fetch to populate the cache
                    queryClient.invalidateQueries({ queryKey: ['user', 'company-areas'] });
                } else {
                    console.error('Failed to decode JWT token');
                }
            }
        },
        onError: (error: Error & { response?: { data?: { result?: { mensaje?: string } } } }) => {
            console.error('Login error:', error);

            // Handle API errors with proper error message
            const errorMessage = error.response?.data?.result?.mensaje ||
                               error.message ||
                               "Error al iniciar sesión";
            
            toast({
                title: "Error de autenticación",
                description: errorMessage,
                variant: "destructive"
            });
        },
    });
};

// Logout mutation hook
export const useLogoutMutation = () => {
    const queryClient = useQueryClient();
    
    return useMutation({
        mutationFn: async (userId?: number): Promise<void> => {
            if (userId) {
                await authApi.logout(userId);
            }
        },
        onSettled: () => {
            // Clear TanStack Query cache
            clearUserCache();

            // Clear chat cache
            queryClient.removeQueries({ queryKey: ['chat'] });

            // Invalidate and remove all user-related queries
            queryClient.clear();

            // Clear sessionStorage
            sessionStorage.removeItem('jwt_token');
            sessionStorage.removeItem('current_chat_id');
            localStorage.removeItem('token');
            localStorage.removeItem('PILOTOIA_REACT_QUERY_OFFLINE_CACHE');

            // Show logout message
            toast({
                title: "Sesión cerrada",
                description: "Has cerrado sesión exitosamente",
                variant: "success"
            });

            // Redirect to login page
            setTimeout(() => {
                window.location.href = '/#/';
            }, 1000);
        },
        onError: (error: Error) => {
            console.error('Logout error:', error);
            // Note: onSettled will still run, so user will be logged out locally
        },
    });
};

// Hook to get current user data from cache
export const useCurrentUser = () => {
    const { data: user, isLoading, error } = useUserQuery();
    
    return {
        user,
        isAuthenticated: !!user && user.status === 'success',
        isLoading,
        error,
    };
};

// Hook for refreshing user data
export const useRefreshUser = () => {
    const queryClient = useQueryClient();
    
    return () => {
        queryClient.invalidateQueries({ queryKey: queryKeys.user.current() });
    };
};

// Hook to check if user has specific role
export const useUserRole = () => {
    const { user } = useCurrentUser();

    return {
        userRole: user?.rol_nombre,
        roleId: user?.id_tipo_rol,
        isAdmin: user?.id_tipo_rol === 1, // Adjust based on your role system
        hasRole: (roleId: number) => user?.id_tipo_rol === roleId,
    };
};

// Hook to fetch and update company areas
export const useCompanyAreasQuery = () => {
    const queryClient = useQueryClient();
    const { user } = useCurrentUser();

    return useQuery({
        queryKey: ['user', 'company-areas'],
        queryFn: async (): Promise<Array<{
            ID_EMPRESA: number;
            EMPRESA: string;
            ID_AREA: number;
            AREA: string;
        }>> => {
            const companyAreas = await (authApi as { getCompanyAreas: () => Promise<Array<{
                ID_EMPRESA: number;
                EMPRESA: string;
                ID_AREA: number;
                AREA: string;
            }>> }).getCompanyAreas();

            // Update the user cache with fresh company areas
            const currentUser = queryClient.getQueryData(queryKeys.user.current()) as DecodedUserData;
            if (currentUser) {
                const updatedUser = {
                    ...currentUser,
                    company_areas: companyAreas,
                    // Only set default area if actual_company_area is null, otherwise preserve user's selection
                    actual_company_area: currentUser.actual_company_area || companyAreas[0] || null
                };
                queryClient.setQueryData(queryKeys.user.current(), updatedUser);

                // Trigger user chats fetch after company areas are loaded
                queryClient.invalidateQueries({ queryKey: ['user', 'chats'] });
            }

            return companyAreas;
        },
        enabled: !!user, // Only run if user is authenticated
        staleTime: 24 * 60 * 60 * 1000, // 24 hours
        gcTime: 24 * 60 * 60 * 1000, // 24 hours
        refetchOnWindowFocus: false,
        retry: 2,
    });
};

// Hook to fetch and update user chats
export const useUserChatsQuery = () => {
    const { user } = useCurrentUser();

    return useQuery({
        queryKey: ['user', 'chats'],
        queryFn: async (): Promise<any[]> => {
            const chats = await chatApi.getUserChats();
            return chats;
        },
        enabled: !!user, // Only run if user is authenticated
        staleTime: 5 * 60 * 1000, // 5 minutes
        gcTime: 10 * 60 * 1000, // 10 minutes
        refetchOnWindowFocus: true,
        retry: 2,
    });
};

// Hook to invalidate company areas (when permissions change)
export const useInvalidateCompanyAreas = () => {
    const queryClient = useQueryClient();

    return () => {
        queryClient.invalidateQueries({ queryKey: ['user', 'company-areas'] });
    };
};

// Hook to invalidate user chats (when chats change)
export const useInvalidateUserChats = () => {
    const queryClient = useQueryClient();

    return () => {
        queryClient.invalidateQueries({ queryKey: ['user', 'chats'] });
    };
};
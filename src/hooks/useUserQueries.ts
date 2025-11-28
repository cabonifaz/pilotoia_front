import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { authApi } from '../api/authApi';
import { chatApi } from '../api/chatApi';
import type { LoginRequest, LoginResponse, DecodedUserData } from '../types/auth';
import { queryKeys, clearUserCache } from '../lib/queryClient';
import { toast } from './use-toast';
import JWTUtils from '../utils/jwtUtils';

// Custom hook for user authentication state
export const useUserQuery = () => {
    const queryClient = useQueryClient();

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

            // Preserve company_areas and actual_company_area from existing cache
            // This prevents wiping out data populated by useCompanyAreasQuery
            const existingData = queryClient.getQueryData(queryKeys.user.current()) as any;
            if (existingData && userData) {
                return {
                    ...userData,
                    company_areas: existingData.company_areas || [],
                    actual_company_area: existingData.actual_company_area || null
                };
            }

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
        onSuccess: () => {
            // Clear TanStack Query cache
            clearUserCache();

            // Clear chat cache
            queryClient.removeQueries({ queryKey: ['chat'] });

            // Invalidate and remove all user-related queries
            queryClient.clear();

            // Clear sessionStorage and localStorage
            sessionStorage.clear();
            localStorage.removeItem('PILOTOIA_REACT_QUERY_OFFLINE_CACHE');

            // Show logout message
            toast({
                title: "Sesión cerrada",
                description: "Has cerrado sesión exitosamente",
                variant: "success"
            });

            // Redirect to login page immediately after logout completes
            window.location.href = '/#/';
        },
        onError: (error: Error) => {
            console.error('Logout error:', error);
            // Don't clear user data on error, but show error message
            toast({
                title: "Error al cerrar sesión",
                description: "Hubo un problema al cerrar sesión en el servidor",
                variant: "destructive"
            });
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

            // Get current user ONCE at the start
            const currentUser = queryClient.getQueryData(queryKeys.user.current()) as DecodedUserData;
            if (!currentUser) return companyAreas;

            // ========= COMPUTE EVERYTHING FIRST (NO CACHE UPDATES YET) =========
            let actualCompanyArea = currentUser.actual_company_area;

            // Verify current selection is still valid (exists in new companyAreas)
            if (actualCompanyArea) {
                const stillExists = companyAreas.find(
                    ca => ca.ID_EMPRESA === actualCompanyArea!.ID_EMPRESA && ca.ID_AREA === actualCompanyArea!.ID_AREA
                );
                if (!stillExists) {
                    actualCompanyArea = null; // Current selection no longer valid
                }
            }

            // If no current selection or it's invalid, determine it now
            if (!actualCompanyArea) {
                // Try sessionStorage first
                const savedCompanyAreaIds = sessionStorage.getItem('selected_company_area_ids');
                if (savedCompanyAreaIds) {
                    try {
                        const { idEmpresa, idArea } = JSON.parse(savedCompanyAreaIds);
                        const found = companyAreas.find(
                            ca => ca.ID_EMPRESA === idEmpresa && ca.ID_AREA === idArea
                        );
                        if (found) {
                            actualCompanyArea = found as any;
                        }
                    } catch (e) {
                        console.error('Error parsing sessionStorage:', e);
                    }
                }

                // Fall back to first item if still no selection
                if (!actualCompanyArea && companyAreas.length > 0) {
                    actualCompanyArea = companyAreas[0] as any;
                }
            }

            // ========= UPDATE CACHE ONCE with complete data =========
            // Find the current actual_company_area from the newly fetched company_areas list
            const updatedActualCompanyArea = actualCompanyArea
              ? companyAreas.find(ca => ca.ID_EMPRESA === actualCompanyArea.ID_EMPRESA && ca.ID_AREA === actualCompanyArea.ID_AREA)
              : actualCompanyArea;

            queryClient.setQueryData(queryKeys.user.current(), {
                ...currentUser,
                company_areas: companyAreas,
                actual_company_area: updatedActualCompanyArea
            });

            return companyAreas;
        },
        enabled: !!user, // Only run if user is authenticated
        staleTime: 60 * 60 * 1000, // 1 hour
        gcTime: 2 * 60 * 60 * 1000, // 2 hours
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
        enabled: !!user && !!(user as any)?.actual_company_area, // Wait for user and actual_company_area
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

// Hook to change company area
export const useChangeCompanyArea = () => {
    const queryClient = useQueryClient();

    return (selectedCompanyArea: any) => {
        const currentUserData = queryClient.getQueryData(queryKeys.user.current()) as any;

        if (currentUserData) {
            // Save to sessionStorage FIRST
            sessionStorage.setItem('selected_company_area_ids', JSON.stringify({
                idEmpresa: selectedCompanyArea.ID_EMPRESA,
                idArea: selectedCompanyArea.ID_AREA
            }));

            // Clear current_chat_id since we're switching company/area
            sessionStorage.removeItem('current_chat_id');

            // Update cache ONCE with new company area
            queryClient.setQueryData(queryKeys.user.current(), {
                ...currentUserData,
                actual_company_area: selectedCompanyArea
            });
        }
    };
};
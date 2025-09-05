import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { authApi, type LoginRequest, type LoginResponse } from '../api/authApi';
import { queryKeys, clearUserCache } from '../lib/queryClient';
import { toast } from './use-toast';

// Custom hook for user authentication state
export const useUserQuery = () => {
    return useQuery({
        queryKey: queryKeys.user.current(),
        queryFn: async (): Promise<LoginResponse | null> => {
            // Try to get user from localStorage first (for persistence)
            const savedUser = localStorage.getItem('user_data');
            if (savedUser) {
                try {
                    const userData = JSON.parse(savedUser);
                    // Validate the user data by making an API call (optional background check)
                    if (userData.user_id) {
                        try {
                            await authApi.getUserInfo(userData.user_id);
                            return userData;
                        } catch (error) {
                            // If user validation fails, clear the stored data
                            localStorage.removeItem('user_data');
                            return null;
                        }
                    }
                    return userData;
                } catch (error) {
                    console.error('Error parsing user data:', error);
                    localStorage.removeItem('user_data');
                    return null;
                }
            }
            return null;
        },
        staleTime: 5 * 60 * 1000, // Consider fresh for 5 minutes
        gcTime: 30 * 60 * 1000, // Keep in cache for 30 minutes
        refetchOnWindowFocus: true, // Refetch when window regains focus
        refetchOnReconnect: true, // Refetch on network reconnect
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
            // Store user data in localStorage for persistence
            localStorage.setItem('user_data', JSON.stringify(data));
            
            // Update the query cache
            queryClient.setQueryData(queryKeys.user.current(), data);
            
            // Show success message
            toast({
                title: "Éxito",
                description: `Bienvenido, ${data.nombres}`,
                variant: "success"
            });
        },
        onError: (error: any) => {
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
            // Always clear cache and localStorage, even if API call fails
            clearUserCache();
            localStorage.removeItem('user_data');
            
            // Invalidate and remove all user-related queries
            queryClient.clear();
            
            // Show logout message
            toast({
                title: "Sesión cerrada",
                description: "Has cerrado sesión exitosamente",
                variant: "success"
            });
            
            // Redirect to login page
            setTimeout(() => {
                window.location.href = '/login';
            }, 1000);
        },
        onError: (error: any) => {
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
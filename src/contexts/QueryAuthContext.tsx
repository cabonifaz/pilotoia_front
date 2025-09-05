import { createContext, useContext } from 'react';
import type { ReactNode } from 'react';
import { type LoginResponse } from '../api/authApi';
import { 
    useCurrentUser, 
    useLoginMutation, 
    useLogoutMutation, 
    useRefreshUser,
    useUserRole
} from '../hooks/useUserQueries';

interface QueryAuthContextType {
    user: LoginResponse | null;
    isAuthenticated: boolean;
    isLoading: boolean;
    login: (usuario: string, clave_acceso: string) => Promise<{ success: boolean; user?: LoginResponse }>;
    logout: () => Promise<void>;
    refreshUser: () => void;
    // Additional TanStack Query benefits
    userRole: string | undefined;
    roleId: number | undefined;
    isAdmin: boolean;
    hasRole: (roleId: number) => boolean;
}

const QueryAuthContext = createContext<QueryAuthContextType | undefined>(undefined);

interface QueryAuthProviderProps {
    children: ReactNode;
}

export const QueryAuthProvider = ({ children }: QueryAuthProviderProps) => {
    const { user, isAuthenticated, isLoading } = useCurrentUser();
    const loginMutation = useLoginMutation();
    const logoutMutation = useLogoutMutation();
    const refreshUser = useRefreshUser();
    const { userRole, roleId, isAdmin, hasRole } = useUserRole();

    const login = async (usuario: string, clave_acceso: string): Promise<{ success: boolean; user?: LoginResponse }> => {
        try {
            const result = await loginMutation.mutateAsync({ usuario, clave_acceso });
            return { success: true, user: result };
        } catch (error) {
            console.error('Login error:', error);
            return { success: false };
        }
    };

    const logout = async (): Promise<void> => {
        const userId = user?.user_id;
        await logoutMutation.mutateAsync(userId);
    };

    const value: QueryAuthContextType = {
        user: user || null,
        isAuthenticated,
        isLoading: isLoading || loginMutation.isPending || logoutMutation.isPending,
        login,
        logout,
        refreshUser,
        userRole,
        roleId,
        isAdmin,
        hasRole,
    };

    return (
        <QueryAuthContext.Provider value={value}>
            {children}
        </QueryAuthContext.Provider>
    );
};

export const useQueryAuthContext = (): QueryAuthContextType => {
    const context = useContext(QueryAuthContext);
    if (context === undefined) {
        throw new Error('useQueryAuthContext must be used within a QueryAuthProvider');
    }
    return context;
};

// Backward compatibility hook - same interface as the old useAuthContext
export const useAuthContext = useQueryAuthContext;
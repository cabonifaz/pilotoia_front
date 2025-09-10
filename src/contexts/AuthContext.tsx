import { createContext, useContext } from 'react';
import type { ReactNode } from 'react';
import { useCurrentUser, useLoginMutation, useLogoutMutation } from '../hooks/useUserQueries';
import type { LoginResponse } from '../api/authApi';
import type { DecodedUserData } from '../utils/jwtUtils';

interface AuthContextType {
    user: DecodedUserData | null;
    isAuthenticated: boolean;
    isLoading: boolean;
    login: (usuario: string, clave_acceso: string) => Promise<{ success: boolean; user?: LoginResponse }>;
    logout: () => Promise<void>;
    refreshUser: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

interface AuthProviderProps {
    children: ReactNode;
}

export const AuthProvider = ({ children }: AuthProviderProps) => {
    const { user, isAuthenticated, isLoading } = useCurrentUser();
    const loginMutation = useLoginMutation();
    const logoutMutation = useLogoutMutation();

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
        try {
            await logoutMutation.mutateAsync(user?.user_id);
        } catch (error) {
            console.error('Logout error:', error);
        }
    };

    const refreshUser = () => {
        // TanStack Query handles refresh automatically
        // This is kept for compatibility but does nothing
    };

    const value: AuthContextType = {
        user: user ?? null,
        isAuthenticated,
        isLoading: isLoading || loginMutation.isPending || logoutMutation.isPending,
        login,
        logout,
        refreshUser
    };

    return (
        <AuthContext.Provider value={value}>
            {children}
        </AuthContext.Provider>
    );
};

export const useAuthContext = (): AuthContextType => {
    const context = useContext(AuthContext);
    if (context === undefined) {
        throw new Error('useAuthContext must be used within an AuthProvider');
    }
    return context;
};
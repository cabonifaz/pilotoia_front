import { createContext, useContext, useState, useEffect } from 'react';
import type { ReactNode } from 'react';
import { authApi, type LoginResponse } from '../api/authApi';

interface AuthContextType {
    user: LoginResponse | null;
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
    const [user, setUser] = useState<LoginResponse | null>(null);
    const [isLoading, setIsLoading] = useState(true);

    // Initialize auth state from session storage
    useEffect(() => {
        const initializeAuth = () => {
            const savedUser = authApi.getUserSession();
            if (savedUser && authApi.isAuthenticated()) {
                setUser(savedUser);
            }
            setIsLoading(false);
        };

        initializeAuth();

        // Listen for storage events (logout from other tabs)
        const handleStorageChange = () => {
            const savedUser = authApi.getUserSession();
            if (!savedUser) {
                setUser(null);
            }
        };

        window.addEventListener('storage', handleStorageChange);
        return () => window.removeEventListener('storage', handleStorageChange);
    }, []);

    const login = async (usuario: string, clave_acceso: string): Promise<{ success: boolean; user?: LoginResponse }> => {
        setIsLoading(true);
        try {
            const result = await authApi.login({ usuario, clave_acceso });
            
            if (result.status === 'success') {
                setUser(result);
                return { success: true, user: result };
            }
            
            return { success: false };
        } catch (error) {
            console.error('Login error:', error);
            return { success: false };
        } finally {
            setIsLoading(false);
        }
    };

    const logout = async (): Promise<void> => {
        setIsLoading(true);
        try {
            if (user?.user_id) {
                await authApi.logout(user.user_id);
            } else {
                authApi.clearUserSession();
            }
            setUser(null);
        } catch (error) {
            console.error('Logout error:', error);
            // Clear local state even if API call fails
            authApi.clearUserSession();
            setUser(null);
        } finally {
            setIsLoading(false);
        }
    };

    const refreshUser = () => {
        const savedUser = authApi.getUserSession();
        setUser(savedUser);
    };

    const value: AuthContextType = {
        user,
        isAuthenticated: !!user && user.status === 'success',
        isLoading,
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
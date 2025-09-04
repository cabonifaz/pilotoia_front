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

    // Initialize auth state from sessionStorage
    useEffect(() => {
        const initializeAuth = () => {
            const savedUser = sessionStorage.getItem('user_session');
            if (savedUser) {
                try {
                    const userData = JSON.parse(savedUser);
                    setUser(userData);
                } catch (error) {
                    console.error('Error parsing user session:', error);
                    sessionStorage.removeItem('user_session');
                }
            }
            setIsLoading(false);
        };

        initializeAuth();

        // Listen for storage events (logout from other tabs)
        const handleStorageChange = () => {
            const savedUser = sessionStorage.getItem('user_session');
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
            
            console.log('*** FRONTEND RECEIVED LOGIN RESULT ***', result);
            console.log('*** RESULT STATUS ***', result.status);
            console.log('*** STATUS CHECK ***', result.status === 'success');
            
            if (result.status === 'success') {
                console.log('*** LOGIN SUCCESS - USER DATA STORED IN SESSION STORAGE ***');
                console.log('USUARIO:', result.usuario);
                console.log('NOMBRES:', result.nombres);
                console.log('APELLIDOS:', result.apellidos);
                console.log('ID_TIPO_ROL:', result.id_tipo_rol);
                console.log('STRING1 (ROL_NOMBRE):', result.rol_nombre);
                console.log('ID_EMPRESA:', result.id_empresa);
                console.log('USER_ID:', result.user_id);
                console.log('JWT TOKEN IN HTTPONLY COOKIE:', result.token === null);
                console.log('*** USER DATA NOW IN SESSION STORAGE ***', result);
                
                // Save to sessionStorage
                sessionStorage.setItem('user_session', JSON.stringify(result));
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
            }
            // Clear sessionStorage and context state - HttpOnly cookie cleared by server
            sessionStorage.removeItem('user_session');
            window.dispatchEvent(new Event('storage')); // Notify other tabs
            setUser(null);
            console.log('*** USER LOGGED OUT - SESSION STORAGE CLEARED ***');
            
            // Redirect to login page
            window.location.href = '/login';
        } catch (error) {
            console.error('Logout error:', error);
            // Clear sessionStorage and context state even if API call fails
            sessionStorage.removeItem('user_session');
            window.dispatchEvent(new Event('storage')); // Notify other tabs
            setUser(null);
            // Still redirect to login even if logout API fails
            window.location.href = '/login';
        } finally {
            setIsLoading(false);
        }
    };

    const refreshUser = () => {
        // Refresh user data from sessionStorage
        const savedUser = sessionStorage.getItem('user_session');
        if (savedUser) {
            try {
                const userData = JSON.parse(savedUser);
                setUser(userData);
                console.log('*** REFRESH USER - SESSION STORAGE BASED AUTH ***');
            } catch (error) {
                console.error('Error parsing user session:', error);
                sessionStorage.removeItem('user_session');
                setUser(null);
            }
        } else {
            setUser(null);
        }
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
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { type LoginFormData, loginSchema } from '../pages/login/LoginForm';
import { useAuthContext } from '../contexts/QueryAuthContext';
import { showErrorToast } from '../utils/errorHandler';

export function useAuth() {
    const { login, isLoading } = useAuthContext();
    const {
        register,
        handleSubmit,
        formState: { errors },
    } = useForm<LoginFormData>({
        resolver: zodResolver(loginSchema),
    });

    const onSubmit = async (data: LoginFormData) => {
        try {
            const result = await login(data.usuario, data.clave_acceso);

            if (result.success) {
                return { success: true, user: result.user };
            } else {
                showErrorToast("Credenciales inválidas");
                return { success: false };
            }
        } catch (error: any) {
            console.error('Error during login:', error);
            
            // Handle API errors with proper error message
            if (error.response?.data?.result?.mensaje) {
                showErrorToast(error.response.data.result.mensaje);
            } else {
                showErrorToast("Error al conectar con el servidor");
            }
            
            return { success: false };
        }
    };

    return { register, handleSubmit, errors, onSubmit, isLoading };
}
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { type LoginFormData, loginSchema } from '../pages/login/LoginForm';
import { useQueryAuthContext } from '../contexts/QueryAuthContext';
import { toast } from './use-toast';
import type { LoginRequest } from '../types/auth';

export function useAuth() {
    const { login, isLoading } = useQueryAuthContext();
    const {
        register,
        handleSubmit,
        setValue,
        formState: { errors },
    } = useForm<LoginFormData>({
        resolver: zodResolver(loginSchema),
    });

    const onSubmit = async (data: LoginRequest) => {
        try {
            const result = await login(data.usuario, data.clave_acceso, data.ref);

            if (result.success) {
                return { success: true, user: result.user };
            } else {
                toast({
                    title: 'Error',
                    description: 'Credenciales inválidas',
                    variant: 'destructive',
                });
                return { success: false };
            }
        } catch (error: any) {
            console.error('Error during login:', error);

            // Handle API errors with proper error message
            const errorMessage = error.response?.data?.result?.mensaje || 'Error al conectar con el servidor';
            toast({
                title: 'Error',
                description: errorMessage,
                variant: 'destructive',
            });

            return { success: false };
        }
    };

    return { register, handleSubmit, setValue, errors, onSubmit, isLoading };
}
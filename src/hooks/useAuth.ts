
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useState } from 'react';
import { authApi } from '../api/authApi';
import { type LoginFormData, loginSchema } from '../pages/login/LoginForm';

export function useAuth() {
    const [isLoading, setIsLoading] = useState(false);
    const {
        register,
        handleSubmit,
        formState: { errors },
    } = useForm<LoginFormData>({
        resolver: zodResolver(loginSchema),
    });

    const onSubmit = async (data: LoginFormData) => {
        setIsLoading(true);
        try {
            const result = await authApi.login(data);

            if (result.result.idTipoMensaje !== 2) {
                return { success: false };
            }

            return { success: true };
        } catch (error) {
            if (!(error instanceof Error)) {
                console.error('Error during login:', error);
            }
            return { success: false };
        } finally {
            setIsLoading(false);
        }
    };

    return { register, handleSubmit, errors, onSubmit, isLoading };
}
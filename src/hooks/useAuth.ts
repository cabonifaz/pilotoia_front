
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useState } from 'react';
import { authApi } from '../api/authApi';
import { type LoginFormData, loginSchema } from '../pages/login/LoginForm';

export function useAtuh() {
    const [isLoading, setIsLoading] = useState(false);
    const {
        register,
        handleSubmit,
        formState: { errors },
        setError,
    } = useForm<LoginFormData>({
        resolver: zodResolver(loginSchema),
    });

    const onSubmit = async (data: LoginFormData) => {
        setIsLoading(true);
        try {
            const userData = await authApi.login(data);
            localStorage.setItem('user', JSON.stringify(userData));

            return { success: true };
            // eslint-disable-next-line @typescript-eslint/no-unused-vars
        } catch (error) {
            setError('root', { message: 'Credenciales inválidas' });
            return { success: false };
        } finally {
            setIsLoading(false);
        }
    };

    return { register, handleSubmit, errors, onSubmit, isLoading };
}
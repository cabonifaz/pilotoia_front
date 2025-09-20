import { useNavigate } from "react-router-dom";
import { Eye, EyeOff, Loader2 } from "lucide-react";
import { useAuth } from "../../hooks/useAuth";
import { useState } from "react";
import { Button } from "@/components/shadcn/button";
import { Input } from "@/components/shadcn/input";
import { Card, CardContent, CardHeader } from "@/components/shadcn/card";

type LoginFormData = {
    usuario: string;
    clave_acceso: string;
};

export const LoginPage = () => {
    const navigate = useNavigate();
    const { register, handleSubmit, errors, onSubmit, isLoading } = useAuth();
    const [showPassword, setShowPassword] = useState(false);

    const handleFormSubmit = async (data: LoginFormData) => {
        const result = await onSubmit(data);
        if (result.success) {
            // Small delay to let browser capture successful login
            setTimeout(() => {
                navigate('/rag');
            }, 100);
        }
    };

    return (
        <section className="min-h-screen w-full bg-slate-50 flex justify-center items-center p-4">
            <Card className="w-full max-w-md">
                <CardHeader className="text-center space-y-4">
                    <div className="flex justify-center">
                        <img
                            src="/fractal-logo.svg"
                            alt="Logo Fractal"
                            className="h-16"
                        />
                    </div>
                    <h2 className="text-2xl font-semibold text-slate-900">
                        Ingresa a tu cuenta
                    </h2>
                </CardHeader>
                
                <CardContent>
                    <form
                        onSubmit={handleSubmit(handleFormSubmit)}
                        className="space-y-4"
                        autoComplete="on"
                        name="loginForm"
                        method="post"
                        action="/login"
                    >
                        <div className="space-y-2">
                            <Input
                                {...register("usuario")}
                                type="text"
                                placeholder="Usuario"
                                disabled={isLoading}
                                className="h-11 text-base"
                                autoComplete="username"
                                name="usuario"
                                id="usuario"
                            />
                            {errors.usuario && (
                                <p className="text-sm text-red-600">{errors.usuario.message}</p>
                            )}
                        </div>

                        <div className="space-y-2">
                            <div className="relative">
                                <Input
                                    {...register("clave_acceso")}
                                    type={showPassword ? "text" : "password"}
                                    placeholder="Contraseña"
                                    disabled={isLoading}
                                    className="h-11 text-base pr-10"
                                    autoComplete="current-password"
                                    name="clave_acceso"
                                    id="clave_acceso"
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowPassword((prev) => !prev)}
                                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700 transition-colors"
                                    tabIndex={-1}
                                >
                                    {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                                </button>
                            </div>
                            {errors.clave_acceso && (
                                <p className="text-sm text-red-600">{errors.clave_acceso.message}</p>
                            )}
                        </div>

                        <Button
                            type="submit"
                            disabled={isLoading}
                            className="w-full h-11 text-base bg-[#0B85C3] hover:bg-[#0B6E99] text-white"
                            size="lg"
                        >
                            {isLoading ? (
                                <Loader2 className="animate-spin" size={20} />
                            ) : (
                                "Ingresar"
                            )}
                        </Button>
                    </form>
                </CardContent>
            </Card>
        </section>
    );
};
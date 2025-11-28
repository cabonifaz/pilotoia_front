import { useNavigate, useLocation } from "react-router-dom";
import { Eye, EyeOff, Loader2 } from "lucide-react";
import { useAuth } from "../../hooks/useAuth";
import { useState, useEffect } from "react";
import { Button } from "@/components/shadcn/button";
import { Input } from "@/components/shadcn/input";
import { Card, CardContent, CardHeader } from "@/components/shadcn/card";
import { Checkbox } from "@/components/shadcn/checkbox";
import CryptoJS from 'crypto-js';

type LoginFormData = {
    usuario: string;
    clave_acceso: string;
};

const REMEMBER_ME_USERNAME_KEY = 'login_remember_username';
const REMEMBER_ME_PASSWORD_KEY = 'login_remember_password';
const LOGIN_URL_PARAM_KEY = 'login_url_param';

const ENCRYPTION_KEY = import.meta.env.VITE_LOGIN_ENCRYPTION_KEY || 'default-fallback-key';

// AES encryption/decryption functions
const encryptData = (data: string): string => {
    return CryptoJS.AES.encrypt(data, ENCRYPTION_KEY).toString();
};

const decryptData = (encryptedData: string): string => {
    try {
        const bytes = CryptoJS.AES.decrypt(encryptedData, ENCRYPTION_KEY);
        return bytes.toString(CryptoJS.enc.Utf8);
    } catch {
        return '';
    }
};

export const LoginPage = () => {
    const navigate = useNavigate();
    const location = useLocation();
    const { register, handleSubmit, errors, onSubmit, isLoading, setValue } = useAuth();
    const [showPassword, setShowPassword] = useState(false);
    const [rememberMe, setRememberMe] = useState(false);

    // Load saved credentials and handle URL parameters on component mount
    useEffect(() => {
        // Extract URL parameter from query string
        const params = new URLSearchParams(location.search);
        const urlParam = params.get('ref');

        if (urlParam) {
            // If URL parameter exists, update localStorage with it
            localStorage.setItem(LOGIN_URL_PARAM_KEY, urlParam);
            // Update URL to use the new parameter
            window.history.replaceState(null, '', `#/?ref=${encodeURIComponent(urlParam)}`);
        } else {
            // If no URL parameter, check localStorage and restore it
            const storedParam = localStorage.getItem(LOGIN_URL_PARAM_KEY);
            if (storedParam) {
                window.history.replaceState(null, '', `#/?ref=${encodeURIComponent(storedParam)}`);
            }
        }

        const savedUsername = localStorage.getItem(REMEMBER_ME_USERNAME_KEY);
        const savedPassword = localStorage.getItem(REMEMBER_ME_PASSWORD_KEY);
        if (savedUsername && savedPassword) {
            const decryptedUsername = decryptData(savedUsername);
            const decryptedPassword = decryptData(savedPassword);
            if (decryptedUsername && decryptedPassword) {
                setValue('usuario', decryptedUsername);
                setValue('clave_acceso', decryptedPassword);
                setRememberMe(true);
            }
        }
    }, [setValue, location]);

    const handleFormSubmit = async (data: LoginFormData) => {
        // Trim whitespace from credentials
        const trimmedData = {
            usuario: data.usuario.trim(),
            clave_acceso: data.clave_acceso.trim()
        };

        // Handle remember me functionality
        if (rememberMe) {
            localStorage.setItem(REMEMBER_ME_USERNAME_KEY, encryptData(trimmedData.usuario));
            localStorage.setItem(REMEMBER_ME_PASSWORD_KEY, encryptData(trimmedData.clave_acceso));
        } else {
            localStorage.removeItem(REMEMBER_ME_USERNAME_KEY);
            localStorage.removeItem(REMEMBER_ME_PASSWORD_KEY);
        }

        // Get the stored URL parameter and include it in the login request
        const storedParam = localStorage.getItem(LOGIN_URL_PARAM_KEY);
        const loginData = {
            ...trimmedData,
            ...(storedParam && { ref: storedParam })
        };

        const result = await onSubmit(loginData);
        if (result.success) {
            navigate('/rag');
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
                                <p className="text-xs text-red-600">{errors.usuario.message}</p>
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
                                <Button
                                    type="button"
                                    variant="ghost"
                                    size="icon"
                                    onClick={() => setShowPassword((prev) => !prev)}
                                    className="absolute right-1 top-1/2 -translate-y-1/2 h-7 w-7"
                                    tabIndex={-1}
                                >
                                    {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                                </Button>
                            </div>
                            {errors.clave_acceso && (
                                <p className="text-xs text-red-600">{errors.clave_acceso.message}</p>
                            )}
                        </div>

                        <div className="flex items-center space-x-2">
                            <Checkbox
                                id="rememberMe"
                                checked={rememberMe}
                                onCheckedChange={(isChecked) => {
                                    setRememberMe(isChecked as boolean);

                                    // Clear localStorage immediately when unchecked
                                    if (!isChecked) {
                                        localStorage.removeItem(REMEMBER_ME_USERNAME_KEY);
                                        localStorage.removeItem(REMEMBER_ME_PASSWORD_KEY);
                                    }
                                }}
                                disabled={isLoading}
                                variant="primary"
                            />
                            <label
                                htmlFor="rememberMe"
                                className="text-xs text-slate-700 font-medium leading-none cursor-pointer"
                            >
                                Recordar usuario
                            </label>
                        </div>

                        <Button
                            type="submit"
                            disabled={isLoading}
                            variant="blue"
                            className="w-full h-11 text-base"
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
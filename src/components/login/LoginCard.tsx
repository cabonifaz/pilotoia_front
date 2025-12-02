import { Eye, EyeOff, Loader2 } from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/shadcn/button";
import { Input } from "@/components/shadcn/input";
import { Card, CardContent, CardHeader } from "@/components/shadcn/card";
import { Checkbox } from "@/components/shadcn/checkbox";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/shadcn/select";
import { useGetCompaniesLogin } from "../../hooks/useCompanyQueries";
import type { LoginFormData } from "../../pages/login/LoginForm";
import type { CompanyLogin } from "../../types/company";

interface LoginCardProps {
    register: any;
    handleSubmit: any;
    errors: any;
    isLoading: boolean;
    onFormSubmit: (data: LoginFormData) => Promise<void>;
    rememberMe: boolean;
    setRememberMe: (value: boolean) => void;
    selectedCompany: string;
    onCompanySelect: (company: string) => void;
    shouldShowCompanySelect: boolean;
    REMEMBER_ME_USERNAME_KEY: string;
    REMEMBER_ME_PASSWORD_KEY: string;
}

export const LoginCard = ({
    register,
    handleSubmit,
    errors,
    isLoading,
    onFormSubmit,
    rememberMe,
    setRememberMe,
    selectedCompany,
    onCompanySelect,
    shouldShowCompanySelect,
    REMEMBER_ME_USERNAME_KEY,
    REMEMBER_ME_PASSWORD_KEY,
}: LoginCardProps) => {
    const [showPassword, setShowPassword] = useState(false);
    const { data: companiesLogin = [] } = useGetCompaniesLogin() as { data: CompanyLogin[] };

    const handleFormSubmit = async (data: LoginFormData) => {
        const trimmedData = {
            usuario: data.usuario.trim(),
            clave_acceso: data.clave_acceso.trim(),
            ref: data.ref
        };

        await onFormSubmit(trimmedData as LoginFormData);
    };

    return (
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
                    {/* Company Selection */}
                    {shouldShowCompanySelect && (
                        <div className="space-y-2">
                            <label className="text-xs text-slate-700 font-medium">
                                Empresa
                            </label>
                            <Select
                                value={selectedCompany}
                                onValueChange={onCompanySelect}
                                disabled={isLoading}
                            >
                                <SelectTrigger className="h-11 text-xs">
                                    <SelectValue placeholder="Selecciona una empresa" />
                                </SelectTrigger>
                                <SelectContent className="max-h-48">
                                    {companiesLogin.map((company: CompanyLogin) => (
                                        <SelectItem key={company.RAZON_SOCIAL} value={company.RAZON_SOCIAL}>
                                            {company.RAZON_SOCIAL}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                    )}

                    {/* Username */}
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

                    {/* Password */}
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

                    {/* Remember Me */}
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

                    {/* Submit Button */}
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
    );
};

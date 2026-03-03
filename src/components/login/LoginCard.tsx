import { Eye, EyeOff, Loader2 } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
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
import { Skeleton } from "../shadcn/skeleton";
import { cn } from "@/lib/utils";

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
  isCompanySelectDisabled?: boolean;
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
  isCompanySelectDisabled = false,
  REMEMBER_ME_USERNAME_KEY,
  REMEMBER_ME_PASSWORD_KEY,
}: LoginCardProps) => {
  const [showPassword, setShowPassword] = useState(false);
  const [isImageLoading, setIsImageLoading] = useState(true);
  // Cámbiala temporalmente por esto:
  const { data: companiesLogin = [], isLoading: isLoadingCompanies } =
    useGetCompaniesLogin();
  // Forzamos el estado de carga

  const handleFormSubmit = async (data: LoginFormData) => {
    const trimmedData = {
      usuario: data.usuario.trim(),
      clave_acceso: data.clave_acceso.trim(),
      ref: data.ref,
    };

    await onFormSubmit(trimmedData as LoginFormData);
  };

  // Find the selected company and determine logo URL
  const selectedCompanyData = companiesLogin.find(
    (company: CompanyLogin) => company.RAZON_SOCIAL === selectedCompany,
  );

  const logoUrl = useMemo(() => {
    if (!selectedCompanyData?.LOGO) return "/fractal-logo.svg";

    // El timestamp solo se genera una vez cuando cambia el LOGO
    return `${import.meta.env.VITE_LOGO_URL_BASE}${selectedCompanyData.LOGO}?v=${Date.now()}`;
  }, [selectedCompanyData?.LOGO]);

  useEffect(() => {
    setIsImageLoading(true);
  }, [logoUrl]);

  return (
    <Card className="w-full max-w-md">
      <CardHeader className="text-center space-y-4">
        <div className="w-full relative flex justify-center items-center min-h-[128px]">
          {isImageLoading && <Skeleton className="w-full h-32 rounded-lg" />}

          <img
            key={logoUrl} // 4. Agregamos una key para forzar el re-montado de la imagen
            src={logoUrl}
            alt={selectedCompanyData?.RAZON_SOCIAL || "Logo Fractal"}
            className={cn(
              "block mx-auto w-full max-h-32 object-contain transition-opacity duration-300",
              isImageLoading ? "opacity-0 absolute" : "opacity-100",
            )}
            onLoad={() => {
              console.log("Imagen cargada con éxito");
              setIsImageLoading(false);
            }}
            onError={() => {
              console.error("Error al cargar la imagen");
              setIsImageLoading(false);
            }}
          />
        </div>
        <h2 className="text-2xl font-semibold text-slate-900 dark:text-slate-50">
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
          <div className="space-y-2">
            <label className="text-xs text-slate-700 font-medium">
              Empresa
            </label>
            <Select
              value={selectedCompany}
              onValueChange={onCompanySelect}
              disabled={
                isLoading || isCompanySelectDisabled || isLoadingCompanies
              } // También deshabilitamos mientras carga
            >
              <SelectTrigger className="h-11 text-xs">
                {isLoadingCompanies ? (
                  <div className="flex items-center gap-2 text-slate-500">
                    <Loader2 className="h-4 w-4 animate-spin" />
                    <span>Cargando empresas...</span>
                  </div>
                ) : (
                  <SelectValue placeholder="Selecciona una empresa" />
                )}
              </SelectTrigger>

              <SelectContent className="max-h-48">
                {companiesLogin.length > 0 ? (
                  companiesLogin.map((company: CompanyLogin) => (
                    <SelectItem
                      key={company.RAZON_SOCIAL}
                      value={company.RAZON_SOCIAL}
                    >
                      {company.RAZON_SOCIAL}
                    </SelectItem>
                  ))
                ) : (
                  <div className="p-2 text-xs text-center text-slate-500">
                    No hay empresas disponibles
                  </div>
                )}
              </SelectContent>
            </Select>
          </div>

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
              <p className="text-xs text-red-600">
                {errors.clave_acceso.message}
              </p>
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

import { useState, useEffect, useMemo } from "react"; // Importamos useMemo
import { Menu } from "lucide-react";
import UserDropdown from "../user/UserDropdown";
import CompanyAreaDropdown from "../user/CompanyAreaDropdown";
import { Button } from "../shadcn/button";
import { useQueryAuthContext } from "../../contexts/QueryAuthContext";
import { toast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";

interface HeaderProps {
  isStreaming?: boolean;
  isMobileMenuOpen: boolean;
  setIsMobileMenuOpen: (isOpen: boolean) => void;
}

const Header = ({
  isStreaming = false,
  isMobileMenuOpen,
  setIsMobileMenuOpen,
}: HeaderProps) => {
  const { user } = useQueryAuthContext();
  const actualCompanyArea = (user as any)?.actual_company_area;

  // Estado de carga
  const [isLogoLoading, setIsLogoLoading] = useState(true);

  // 1. Usamos useMemo para evitar que la URL cambie en cada render
  const logoUrl = useMemo(() => {
    if (!actualCompanyArea?.LOGO) return "/fractal-logo.svg";

    // Solo generamos un nuevo timestamp cuando cambia el string del LOGO en la base de datos
    return `${import.meta.env.VITE_LOGO_URL_BASE}${actualCompanyArea.LOGO}?v=${Date.now()}`;
  }, [actualCompanyArea?.LOGO]);

  // 2. Efecto: Cuando cambia la URL real, activamos el loading
  useEffect(() => {
    setIsLogoLoading(true);
  }, [logoUrl]);

  const handleLoadComplete = () => {
    setIsLogoLoading(false);
  };

  const handleGenerateURL = () => {
    const secretKey = actualCompanyArea?.SECRET_KEY;
    if (!secretKey) {
      toast({
        title: "Error",
        description: "Esta empresa no tiene Secret Key configurada",
        variant: "warning",
      });
      return;
    }
    const cleanKey = secretKey.trim();
    const url = `${window.location.origin}/#/?ref=${cleanKey}`;

    navigator.clipboard
      .writeText(url)
      .then(() =>
        toast({
          title: "URL copiada",
          description: "URL copiada al portapapeles.",
          variant: "success",
        }),
      )
      .catch((err) => console.error("Error al copiar URL:", err));
  };

  return (
    <div className="flex justify-between items-center px-4 md:px-8 py-4 bg-background border-b">
      <div className="flex items-center gap-4 md:gap-6">
        <Button
          variant="ghost"
          size="icon"
          className="h-7 w-7 md:hidden"
          onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
          title="Abrir menú"
        >
          <Menu className="h-4 w-4" />
        </Button>

        {/* Contenedor con tamaño fijo para evitar saltos */}
        <div className="w-[98px] h-8 relative flex items-center justify-start">
          {/* Esqueleto: Se muestra mientras carga */}
          {isLogoLoading && (
            <div className="absolute inset-0 bg-muted animate-pulse rounded-md w-full h-full" />
          )}

          <img
            src={logoUrl}
            alt={actualCompanyArea?.RAZON_SOCIAL || "Logo Fractal"}
            className={cn(
              "w-auto h-auto min-h-4 max-h-8 max-w-full object-contain cursor-pointer transition-opacity duration-300",
              // Si está cargando, ocultamos la imagen (opacity 0) para que no se vea a medias
              isLogoLoading ? "opacity-0" : "opacity-100",
            )}
            onLoad={handleLoadComplete}
            onError={handleLoadComplete} // Importante: Si falla, quitamos el loading también
            onClick={handleGenerateURL}
          />
        </div>
      </div>

      <div className="hidden md:flex items-center gap-4">
        <CompanyAreaDropdown isDisabled={isStreaming} />
        <UserDropdown />
      </div>
    </div>
  );
};

export default Header;

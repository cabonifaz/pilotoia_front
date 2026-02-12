import { useState, useEffect, useMemo, useRef } from "react";
import { Menu } from "lucide-react";
import UserDropdown from "../user/UserDropdown";
import CompanyAreaDropdown from "../user/CompanyAreaDropdown";
import { Button } from "../shadcn/button";
import { Skeleton } from "../shadcn/skeleton"; // Importamos el nuevo componente
import { useQueryAuthContext } from "../../contexts/QueryAuthContext";
import { toast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils"; // Utilidad standard de shadcn para clases condicionales

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

  const [isLogoLoaded, setIsLogoLoaded] = useState(false);
  const imgRef = useRef<HTMLImageElement>(null); // 1. Referencia creada

  const handleGenerateURL = () => {
    const secretKey = actualCompanyArea?.SECRET_KEY;

    if (!secretKey) {
      toast({
        title: "Error",
        description: "Esta empresa no tiene Secret Key configurada",
        variant: "warning", // Asumo que tienes variant warning configurado, sino usa "destructive"
      });
      return;
    }

    const cleanKey = secretKey.trim();
    const url = `${window.location.origin}/#/?ref=${cleanKey}`;

    navigator.clipboard
      .writeText(url)
      .then(() => {
        toast({
          title: "URL copiada",
          description: "La URL de la empresa fue copiada al portapapeles.",
          variant: "success", // O "default" si success no existe en tu config
        });
      })
      .catch((err) => {
        toast({
          title: "Error",
          description: "Hubo un problema al copiar la URL.",
          variant: "destructive",
        });
        console.error("Error al copiar la URL:", err);
      });
  };

  // Determine logo URL based on company logo with cache busting
  const logoUrl = useMemo(() => {
    if (!actualCompanyArea?.LOGO) return "/fractal-logo.svg";
    return `${import.meta.env.VITE_LOGO_URL_BASE}${actualCompanyArea.LOGO}?v=${Date.now()}`;
  }, [actualCompanyArea?.LOGO]);

  // 2. Efecto de detección de carga
  useEffect(() => {
    // Resetear estado al cambiar de URL
    setIsLogoLoaded(false);

    // Si la imagen ya está en caché (común en fractal-logo.svg),
    // .complete será true inmediatamente.
    if (imgRef.current?.complete) {
      setIsLogoLoaded(true);
    }
  }, [logoUrl]);

  return (
    <div className="flex justify-between items-center px-4 md:px-8 py-4 bg-background border-b h-[73px]">
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

        {/* Lógica del Logo con Skeleton */}
        <div className="w-[98px] flex items-center justify-start relative">
          {/* Mostramos Skeleton mientras no esté cargada la imagen */}
          {!isLogoLoaded && <Skeleton className="h-8 w-24 rounded-md" />}

          <img
            src={logoUrl}
            alt={actualCompanyArea?.RAZON_SOCIAL || "Logo Fractal"}
            className={cn(
              "w-auto h-auto min-h-4 max-h-8 max-w-full object-contain cursor-pointer transition-opacity duration-300",
              // Ocultamos la imagen (opacity 0) hasta que cargue para evitar saltos visuales
              isLogoLoaded ? "opacity-100" : "opacity-0 absolute",
            )}
            onLoad={() => setIsLogoLoaded(true)}
            onClick={handleGenerateURL}
          />
        </div>
      </div>

      <div className="hidden md:flex items-center gap-4">
        {/* Si no hay datos de la empresa aún, mostramos Skeletons en lugar de los Dropdowns vacíos */}
        {!actualCompanyArea ? (
          <>
            <Skeleton className="h-9 w-40" />
            <Skeleton className="h-9 w-9 rounded-full" />
          </>
        ) : (
          <>
            <CompanyAreaDropdown isDisabled={isStreaming} />
            <UserDropdown />
          </>
        )}
      </div>
    </div>
  );
};

export default Header;

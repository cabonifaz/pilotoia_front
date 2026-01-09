import { useState, useEffect, useRef } from 'react';
import { X, Upload } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/shadcn/card';
import { Button } from '@/components/shadcn/button';
import { Label } from '@/components/shadcn/label';
import { useUploadCompanyLogo } from '@/hooks/useCompanyQueries';
import { toast } from '@/hooks/use-toast';

interface CompanyLogoSidebarProps {
  isOpen: boolean;
  onClose: () => void;
  idEmpresa: number;
  companyName: string;
  logo: string | null;
}

export const CompanyLogoSidebar = ({
  isOpen,
  onClose,
  idEmpresa,
  companyName,
  logo,
}: CompanyLogoSidebarProps) => {
  const [logoFile, setLogoFile] = useState<File | null>(null);
  const [logoPreview, setLogoPreview] = useState<string | null>(null);
  const logoInputRef = useRef<HTMLInputElement>(null);
  const { mutate: uploadLogo, isPending } = useUploadCompanyLogo();

  // Reset state when sidebar closes
  useEffect(() => {
    if (!isOpen) {
      setLogoFile(null);
      setLogoPreview(null);
    }
  }, [isOpen]);

  // Handle logo file selection
  const handleLogoSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type
    const allowedTypes = ['image/jpeg', 'image/png', 'image/svg+xml'];
    if (!allowedTypes.includes(file.type)) {
      toast({
        title: 'Error',
        description: 'Solo se permiten archivos JPG, PNG o SVG',
        variant: 'destructive',
      });
      return;
    }

    // Validate file size (max 5MB)
    const maxSize = 5 * 1024 * 1024; // 5MB
    if (file.size > maxSize) {
      toast({
        title: 'Error',
        description: 'El tamaño máximo del logo es 5MB',
        variant: 'destructive',
      });
      return;
    }

    setLogoFile(file);

    // Generate preview
    const reader = new FileReader();
    reader.onloadend = () => {
      setLogoPreview(reader.result as string);
    };
    reader.readAsDataURL(file);
  };

  const handleRemoveLogo = () => {
    setLogoFile(null);
    setLogoPreview(null);
    if (logoInputRef.current) {
      logoInputRef.current.value = '';
    }
  };

  const handleSubmit = () => {
    if (!logoFile) {
      return;
    }

    uploadLogo(
      {
        id_empresa: idEmpresa,
        logoFile: logoFile,
      },
      {
        onSuccess: () => {
          setLogoFile(null);
          setLogoPreview(null);
          onClose();
        },
      }
    );
  };

  return (
    <div
      className={`fixed top-16 bottom-0 right-0 w-96 bg-background border-l shadow-lg transform transition-all duration-300 flex flex-col z-50 ${
        isOpen ? 'translate-x-0' : 'translate-x-full'
      }`}
    >
      <Card className="h-full rounded-none border-0 flex flex-col">
        {/* Header del Sidebar */}
        <CardHeader className="pt-3 pb-3 border-b flex-shrink-0">
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <CardTitle className="text-xs">Actualizar logo</CardTitle>
              <CardDescription className="text-xs">
                {companyName}
              </CardDescription>
            </div>
            <Button
              variant="ghost"
              size="icon"
              onClick={onClose}
              disabled={isPending}
            >
              <X className="h-5 w-5" />
            </Button>
          </div>
        </CardHeader>

        {/* Contenido scrollable */}
        <CardContent className="flex-1 overflow-y-auto py-4 space-y-4">
          {/* Logo Upload */}
          <div className="space-y-2">
            <Label className="text-xs">Logo de la empresa</Label>

            {!logoPreview && !logo ? (
              <div
                className="border-2 border-dashed border-gray-300 rounded-lg p-8 hover:border-gray-400 transition-colors cursor-pointer"
                onClick={() => logoInputRef.current?.click()}
              >
                <div className="flex flex-col items-center justify-center gap-2 text-center">
                  <Upload className="w-10 h-10 text-gray-400" />
                  <p className="text-xs font-medium text-gray-600">
                    Subir logo
                  </p>
                  <p className="text-xs text-gray-500">JPG, PNG o SVG (max 5MB)</p>
                </div>
              </div>
            ) : (
              <div className="relative border-2 border-gray-300 rounded-lg p-4">
                <div className="flex flex-col items-center gap-3">
                  <img
                    src={logoPreview || `${import.meta.env.VITE_LOGO_URL_BASE}${logo}?v=${Date.now()}`}
                    alt="Logo preview"
                    className="w-32 h-32 object-contain"
                  />
                  <div className="w-full text-center">
                    {logoFile ? (
                      <>
                        <p className="text-xs font-medium truncate">{logoFile.name}</p>
                        <p className="text-xs text-gray-500">
                          {(logoFile.size / 1024 / 1024).toFixed(2)} MB
                        </p>
                      </>
                    ) : (
                      <p className="text-xs font-medium text-gray-600">Logo actual</p>
                    )}
                  </div>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      if (logoFile) {
                        handleRemoveLogo();
                      } else {
                        logoInputRef.current?.click();
                      }
                    }}
                    disabled={isPending}
                    className="w-full"
                  >
                    Cambiar logo
                  </Button>
                </div>
              </div>
            )}

            <input
              ref={logoInputRef}
              type="file"
              accept=".jpg,.jpeg,.png,.svg"
              onChange={handleLogoSelect}
              className="hidden"
              disabled={isPending}
            />
          </div>

          {/* Info text */}
          <div className="text-xs text-gray-500 bg-gray-50 p-3 rounded-lg">
            <p className="font-medium mb-1">Recomendaciones:</p>
            <ul className="list-disc list-inside space-y-1">
              <li>Usa un fondo transparente para mejores resultados</li>
              <li>Resolución recomendada: 800x800 píxeles</li>
              <li>Formatos: JPG, PNG o SVG</li>
            </ul>
          </div>
        </CardContent>

        {/* Footer */}
        <div className="border-t p-4 flex gap-2 flex-shrink-0">
          <Button
            variant="outline"
            onClick={onClose}
            disabled={isPending}
            className="flex-1"
          >
            Cancelar
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={isPending || !logoFile}
            className="flex-1"
          >
            {isPending ? 'Subiendo...' : 'Actualizar'}
          </Button>
        </div>
      </Card>
    </div>
  );
};

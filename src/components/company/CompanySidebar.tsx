import { useState, useEffect } from 'react';
import { X } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/shadcn/card';
import { Button } from '@/components/shadcn/button';
import { Input } from '@/components/shadcn/input';
import { Label } from '@/components/shadcn/label';
import { useCreateCompany } from '@/hooks/useCompanyQueries';

interface CompanySidebarProps {
  isOpen: boolean;
  onClose: () => void;
}

export const CompanySidebar = ({
  isOpen,
  onClose,
}: CompanySidebarProps) => {
  const [ruc, setRuc] = useState('');
  const [razonSocial, setRazonSocial] = useState('');
  const { mutate: createCompany, isPending } = useCreateCompany();

  // Reset state when sidebar closes
  useEffect(() => {
    if (!isOpen) {
      setRuc('');
      setRazonSocial('');
    }
  }, [isOpen]);

  const handleSubmit = () => {
    if (!ruc.trim() || !razonSocial.trim()) {
      return;
    }

    createCompany(
      {
        ruc: ruc.trim(),
        razon_social: razonSocial.trim(),
      },
      {
        onSuccess: () => {
          setRuc('');
          setRazonSocial('');
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
              <CardTitle className="text-xs">Agregar empresa</CardTitle>
              <CardDescription className="text-xs">Agregue una nueva empresa.</CardDescription>
            </div>
            <Button
              variant="ghost"
              size="icon"
              onClick={onClose}
            >
              <X className="h-5 w-5" />
            </Button>
          </div>
        </CardHeader>

        {/* Contenido scrollable con altura definida */}
        <CardContent className="flex-1 overflow-y-auto py-4 space-y-4">
          {/* RUC Input */}
          <div className="space-y-2">
            <Label htmlFor="ruc" className="text-xs">RUC</Label>
            <Input
              id="ruc"
              type="text"
              inputMode="numeric"
              placeholder="Ingrese el RUC"
              value={ruc}
              onChange={(e) => {
                const value = e.target.value.replace(/\D/g, '');
                setRuc(value);
              }}
              disabled={isPending}
            />
          </div>

          {/* Razón Social Input */}
          <div className="space-y-2">
            <Label htmlFor="razon-social" className="text-xs">Razón Social</Label>
            <Input
              id="razon-social"
              type="text"
              placeholder="Ingrese la razón social"
              value={razonSocial}
              onChange={(e) => setRazonSocial(e.target.value)}
              disabled={isPending}
            />
          </div>
        </CardContent>

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
            disabled={isPending || !ruc.trim() || !razonSocial.trim()}
            className="flex-1"
          >
            {isPending ? 'Guardando...' : 'Agregar'}
          </Button>
        </div>
      </Card>
    </div>
  );
};
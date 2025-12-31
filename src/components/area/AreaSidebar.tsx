import { useState, useEffect } from 'react';
import { X } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/shadcn/card';
import { Button } from '@/components/shadcn/button';
import { Input } from '@/components/shadcn/input';
import { Label } from '@/components/shadcn/label';
import { useCreateArea } from '@/hooks/useAreaQueries';
import { useQueryAuthContext } from '@/contexts/QueryAuthContext';

interface AreaSidebarProps {
  isOpen: boolean;
  onClose: () => void;
  id_empresa: number;
}

export const AreaSidebar = ({
  isOpen,
  onClose,
  id_empresa,
}: AreaSidebarProps) => {
  const { user } = useQueryAuthContext();
  const [area, setArea] = useState('');
  const { mutate: createArea, isPending } = useCreateArea(id_empresa);

  // Reset state when sidebar closes
  useEffect(() => {
    if (!isOpen) {
      setArea('');
    }
  }, [isOpen]);

  const handleSubmit = () => {
    if (!area.trim()) {
      return;
    }

    createArea(
      {
        id_empresa,
        area: area.trim(),
      },
      {
        onSuccess: () => {
          setArea('');
          onClose();
        },
      }
    );
  };

  return (
    <div
      className={`fixed top-16 bottom-0 right-0 w-96 bg-background border-l shadow-lg transform transition-all duration-300 flex flex-col ${
        isOpen ? 'translate-x-0' : 'translate-x-full'
      }`}
    >
      <Card className="h-full rounded-none border-0 flex flex-col">
        {/* Header del Sidebar */}
        <CardHeader className="pb-3 border-b flex-shrink-0">
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-xs">Agregar área</CardTitle>
              <CardDescription className="text-xs">
                {(user as any)?.actual_company_area?.EMPRESA && (
                  <span className="font-semibold">{(user as any)?.actual_company_area?.EMPRESA}</span>
                )}
                {(user as any)?.actual_company_area?.EMPRESA && ' - '}
                Agregue una nueva área.
              </CardDescription>
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
          {/* Area Input */}
          <div className="space-y-2">
            <Label htmlFor="area" className="text-xs">Área</Label>
            <Input
              id="area"
              type="text"
              placeholder="Ingrese el nombre del área"
              value={area}
              onChange={(e) => setArea(e.target.value)}
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
            disabled={isPending || !area.trim() || ['default', 'general'].includes(area.trim().toLowerCase())}
            className="flex-1"
          >
            {isPending ? 'Guardando...' : 'Agregar'}
          </Button>
        </div>
      </Card>
    </div>
  );
};
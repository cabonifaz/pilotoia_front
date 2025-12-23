import { useState, useEffect } from 'react';
import { X } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/shadcn/card';
import { Button } from '@/components/shadcn/button';
import { Input } from '@/components/shadcn/input';
import { Label } from '@/components/shadcn/label';
import { Checkbox } from '@/components/shadcn/checkbox';
import { Switch } from '@/components/shadcn/switch';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/shadcn/select';
import { useCreateAgente } from '@/hooks/useAgentsQueries';
import { useGetAreas } from '@/hooks/useAreaQueries';
import { useQueryAuthContext } from '@/contexts/QueryAuthContext';

interface AgentsSidebarProps {
  isOpen: boolean;
  onClose: () => void;
  id_empresa?: number;
}

export const AgentsSidebar = ({
  isOpen,
  onClose,
  id_empresa: propsIdEmpresa,
}: AgentsSidebarProps) => {
  const { user } = useQueryAuthContext();
  const contextIdEmpresa = (user as any)?.actual_company_area?.ID_EMPRESA;
  const id_empresa = propsIdEmpresa || contextIdEmpresa;

  const [numeroTelf, setNumeroTelf] = useState('');
  const [idTipoAgente, setIdTipoAgente] = useState('1'); // 1 = WhatsApp
  const [accesoGeneral, setAccesoGeneral] = useState(0); // 0 = cerrado, 1 = abierto
  const [selectedAreas, setSelectedAreas] = useState<number[]>([]);
  const [isInitialized, setIsInitialized] = useState(false);

  const { mutate: createAgente, isPending } = useCreateAgente(id_empresa);
  const { data: areasData } = useGetAreas(id_empresa);

  // Initialize areas when sidebar opens and areas data is available
  useEffect(() => {
    if (isOpen && areasData && !isInitialized) {
      setIsInitialized(true);
    }
  }, [isOpen, areasData, isInitialized]);

  // Reset state when sidebar closes
  useEffect(() => {
    if (!isOpen) {
      setNumeroTelf('');
      setIdTipoAgente('1');
      setAccesoGeneral(0);
      setSelectedAreas([]);
      setIsInitialized(false);
    }
  }, [isOpen]);

  const handleSubmit = () => {
    if (!numeroTelf.trim() || selectedAreas.length === 0) {
      return;
    }

    const areasString = selectedAreas.join(',');

    createAgente(
      {
        numero_telf: numeroTelf.trim(),
        id_tipo_agente: parseInt(idTipoAgente),
        id_empresa,
        acceso_general: accesoGeneral,
        areas_string: areasString,
      },
      {
        onSuccess: () => {
          setNumeroTelf('');
          setIdTipoAgente('1');
          setAccesoGeneral(0);
          setSelectedAreas([]);
          onClose();
        },
      }
    );
  };

  const handleAreaToggle = (areaId: number) => {
    setSelectedAreas((prevAreas) =>
      prevAreas.includes(areaId)
        ? prevAreas.filter((id) => id !== areaId)
        : [...prevAreas, areaId]
    );
  };

  // Filter areas: show all areas except Default and General
  const displayedAreas = areasData?.areas?.filter((area) => {
    return !['Default', 'General'].includes(area.AREA);
  }) || [];

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
              <CardTitle className="text-xs">Agregar agente</CardTitle>
              <CardDescription className="text-xs">Agregue un nuevo agente.</CardDescription>
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
          {/* Telefono Input */}
          <div className="space-y-2">
            <Label htmlFor="telefono" className="text-xs">Teléfono</Label>
            <Input
              id="telefono"
              type="tel"
              placeholder="Ingrese el número de teléfono"
              value={numeroTelf}
              onChange={(e) => setNumeroTelf(e.target.value)}
              disabled={isPending}
              pattern="[0-9\-\+\(\)\s]*"
              maxLength={20}
            />
          </div>

          {/* Tipo de Agente Select */}
          <div className="space-y-2">
            <Label className="text-xs">Tipo de Agente</Label>
            <Select value={idTipoAgente} onValueChange={setIdTipoAgente} disabled={isPending}>
              <SelectTrigger>
                <SelectValue placeholder="Selecciona un tipo" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="1">WhatsApp</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Acceso General Switch */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label htmlFor="acceso-general" className="text-xs">Acceso General</Label>
              <div className="flex items-center gap-2">
                <span className="text-xs text-muted-foreground">
                  {accesoGeneral === 0 ? 'Cerrado' : 'Abierto'}
                </span>
                <Switch
                  id="acceso-general"
                  checked={accesoGeneral === 1}
                  onCheckedChange={(checked) => setAccesoGeneral(checked ? 1 : 0)}
                  disabled={isPending}
                />
              </div>
            </div>
            <p className="text-xs text-muted-foreground">
              {accesoGeneral === 0
                ? 'El agente solo atiende usuarios registrados'
                : 'El agente atiende usuarios registrados y no registrados'}
            </p>
          </div>

          {/* Áreas Checkboxes */}
          <div className="space-y-2">
            <Label className="text-xs">Áreas con Acceso</Label>
            <div className="space-y-2 max-h-40 overflow-y-auto border rounded-md p-2">
              {displayedAreas && displayedAreas.length > 0 ? (
                displayedAreas.map((area) => (
                  <div key={area.ID_AREA} className="flex items-center gap-2">
                    <Checkbox
                      id={`area-${area.ID_AREA}`}
                      checked={selectedAreas.includes(area.ID_AREA)}
                      onCheckedChange={() => handleAreaToggle(area.ID_AREA)}
                      disabled={isPending}
                    />
                    <label
                      htmlFor={`area-${area.ID_AREA}`}
                      className="text-xs cursor-pointer"
                    >
                      {area.AREA}
                    </label>
                  </div>
                ))
              ) : (
                <p className="text-xs text-muted-foreground">No hay áreas disponibles</p>
              )}
            </div>
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
            disabled={isPending || !numeroTelf.trim() || selectedAreas.length === 0}
            className="flex-1"
          >
            {isPending ? 'Guardando...' : 'Agregar'}
          </Button>
        </div>
      </Card>
    </div>
  );
};
import { useState, useEffect } from 'react';
import { X } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/shadcn/card';
import { Button } from '@/components/shadcn/button';
import { Label } from '@/components/shadcn/label';
import { Checkbox } from '@/components/shadcn/checkbox';
import { useUpdateAgenteAccess } from '@/hooks/useAgentsQueries';
import { useGetAreas } from '@/hooks/useAreaQueries';
import { useQueryAuthContext } from '@/contexts/QueryAuthContext';
import type { Agente } from '@/types/agents';

interface AgentsSidebarAccessProps {
  isOpen: boolean;
  onClose: () => void;
  id_empresa?: number;
  agent: Agente | null;
  agentAreas?: string[];
}

export const AgentsSidebarAccess = ({
  isOpen,
  onClose,
  id_empresa: propsIdEmpresa,
  agent: selectedAgent,
  agentAreas = [],
}: AgentsSidebarAccessProps) => {
  const { user } = useQueryAuthContext();
  const contextIdEmpresa = (user as any)?.actual_company_area?.ID_EMPRESA;
  const id_empresa = propsIdEmpresa || contextIdEmpresa;

  const [selectedAreas, setSelectedAreas] = useState<number[]>([]);

  const { mutate: updateAccess, isPending } = useUpdateAgenteAccess(id_empresa);
  const { data: areasData } = useGetAreas(id_empresa);

  // Get General area ID for auto-default
  const generalAreaId = areasData?.areas?.find((area) => area.AREA === 'General')?.ID_AREA;

  // Initialize form with agent data when sidebar opens
  useEffect(() => {
    if (isOpen && selectedAgent && areasData?.areas) {
      if (agentAreas && agentAreas.length > 0) {
        const selectedAreaIds = areasData.areas
          .filter((area) => agentAreas.includes(area.AREA))
          .map((area) => area.ID_AREA);

        if (selectedAreaIds.length === 0 && generalAreaId) {
          setSelectedAreas([generalAreaId]);
        } else {
          setSelectedAreas(selectedAreaIds);
        }
      } else {
        if (generalAreaId) {
          setSelectedAreas([generalAreaId]);
        } else {
          setSelectedAreas([]);
        }
      }
    }
  }, [isOpen, selectedAgent, areasData, agentAreas, generalAreaId]);

  // Reset state when sidebar closes
  useEffect(() => {
    if (!isOpen) {
      setSelectedAreas([]);
    }
  }, [isOpen]);

  // Check if there are any changes from the original data
  const originalAreaIds = selectedAgent && areasData?.areas
    ? areasData.areas
        .filter((area) => agentAreas.includes(area.AREA))
        .map((area) => area.ID_AREA)
    : [];

  const hasChanges =
    selectedAreas.length !== originalAreaIds.length ||
    !selectedAreas.every(id => originalAreaIds.includes(id));

  const handleSubmit = () => {
    if (!selectedAgent || selectedAreas.length === 0 || !hasChanges) {
      return;
    }

    const areasString = selectedAreas.join(',');

    updateAccess(
      {
        id_agente: selectedAgent.ID_AGENTE,
        id_empresa,
        areas_string: areasString,
      },
      {
        onSuccess: () => {
          setSelectedAreas([]);
          onClose();
        },
      }
    );
  };

  const handleAreaToggle = (areaId: number) => {
    setSelectedAreas((prevAreas) => {
      if (prevAreas.includes(areaId)) {
        const newAreas = prevAreas.filter((id) => id !== areaId);
        // If no areas left, revert to General
        if (newAreas.length === 0 && generalAreaId) {
          return [generalAreaId];
        }
        return newAreas;
      } else {
        // Remove General if it's there and add the new area
        if (generalAreaId && prevAreas.includes(generalAreaId)) {
          return [areaId];
        }
        return [...prevAreas, areaId];
      }
    });
  };

  // Filter areas: show all areas except Default and General
  const displayedAreas = areasData?.areas?.filter((area) => {
    return !['Default', 'General'].includes(area.AREA);
  }) || [];

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
              <CardTitle className="text-xs">Actualizar acceso</CardTitle>
              <CardDescription className="text-xs">
                {(user as any)?.actual_company_area?.EMPRESA && (
                  <span className="font-semibold">{(user as any)?.actual_company_area?.EMPRESA}</span>
                )}
                {(user as any)?.actual_company_area?.EMPRESA && ' - '}
                {selectedAgent ? `Agente ${selectedAgent.NUMERO_TELF}` : 'Actualice las áreas del agente.'}
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
          {/* Agente Display */}
          <div className="space-y-2">
            <Label className="text-xs">Agente</Label>
            <div className="text-xs font-medium p-2 bg-muted rounded-md">
              {selectedAgent?.NUMERO_TELF || 'N/A'}
            </div>
          </div>

          {/* Áreas Checkboxes */}
          <div className="space-y-2">
            <Label className="text-xs">Áreas con Acceso</Label>
            <p className="text-xs text-muted-foreground bg-muted p-2 rounded">
              La información del área General está disponible para todos los agentes
            </p>
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
            disabled={isPending || selectedAreas.length === 0 || !hasChanges}
            className="flex-1"
          >
            {isPending ? 'Actualizando...' : 'Actualizar'}
          </Button>
        </div>
      </Card>
    </div>
  );
};

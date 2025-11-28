import { useState, useEffect } from 'react';
import { X } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/shadcn/card';
import { Button } from '@/components/shadcn/button';
import { Label } from '@/components/shadcn/label';
import { Checkbox } from '@/components/shadcn/checkbox';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/shadcn/select';
import { useUpdateUsuarioAccess } from '@/hooks/useUsersQueries';
import { useGetAreas } from '@/hooks/useAreaQueries';
import { useQueryAuthContext } from '@/contexts/QueryAuthContext';
import type { Usuario } from '@/types/users';

interface UsersSidebarAccessProps {
  isOpen: boolean;
  onClose: () => void;
  id_empresa?: number;
  user: Usuario | null;
  userAreas?: string[];
}

export const UsersSidebarAccess = ({
  isOpen,
  onClose,
  id_empresa: propsIdEmpresa,
  user: selectedUser,
  userAreas = [],
}: UsersSidebarAccessProps) => {
  const { user } = useQueryAuthContext();
  const contextIdEmpresa = (user as any)?.actual_company_area?.ID_EMPRESA;
  const id_empresa = propsIdEmpresa || contextIdEmpresa;

  const [idTipoRol, setIdTipoRol] = useState('3');
  const [selectedAreas, setSelectedAreas] = useState<number[]>([]);

  const { mutate: updateAccess, isPending } = useUpdateUsuarioAccess(id_empresa);
  const { data: areasData } = useGetAreas(id_empresa);

  // Get General area ID for Administrador role
  const generalAreaId = areasData?.areas?.find((area) => area.AREA === 'General')?.ID_AREA;

  // Initialize form with user data when sidebar opens
  useEffect(() => {
    if (isOpen && selectedUser && areasData?.areas) {
      setIdTipoRol(selectedUser.ID_TIPO_ROL.toString());
      // Initialize with user's current areas by matching area names
      if (userAreas && userAreas.length > 0) {
        const selectedAreaIds = areasData.areas
          .filter((area) => userAreas.includes(area.AREA))
          .map((area) => area.ID_AREA);
        setSelectedAreas(selectedAreaIds);
      } else {
        setSelectedAreas([]);
      }
    }
  }, [isOpen, selectedUser, areasData, userAreas]);

  // Reset state when sidebar closes
  useEffect(() => {
    if (!isOpen) {
      setIdTipoRol('3');
      setSelectedAreas([]);
    }
  }, [isOpen]);

  const handleSubmit = () => {
    if (!selectedUser || selectedAreas.length === 0) {
      return;
    }

    const areasString = selectedAreas.join(',');

    updateAccess(
      {
        id_usuario: selectedUser.ID_USUARIO,
        nuevo_rol: parseInt(idTipoRol),
        areas_string: areasString,
        id_empresa,
      },
      {
        onSuccess: () => {
          setIdTipoRol('3');
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

  // Auto-select General area when role changes to Administrador (2)
  useEffect(() => {
    if (idTipoRol === '2') {
      // Administrador: automatically select General area
      if (generalAreaId) {
        setSelectedAreas([generalAreaId]);
      } else if (areasData?.areas) {
        const generalArea = areasData.areas.find((area) => area.AREA === 'General');
        if (generalArea) {
          setSelectedAreas([generalArea.ID_AREA]);
        }
      }
    } else if (idTipoRol === '3') {
      // Usuario: reset areas to empty
      setSelectedAreas([]);
    }
  }, [idTipoRol, generalAreaId, areasData]);

  // Filter areas based on role
  const displayedAreas = areasData?.areas?.filter((area) => {
    if (idTipoRol === '2') {
      // Administrador: only show Default and General areas
      return ['Default', 'General'].includes(area.AREA);
    } else {
      // Usuario: show all areas except Default and General
      return !['Default', 'General'].includes(area.AREA);
    }
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
              <CardTitle className="text-xs">Actualizar acceso</CardTitle>
              <CardDescription className="text-xs">Actualice el rol y áreas del usuario.</CardDescription>
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
          {/* Usuario Display */}
          <div className="space-y-2">
            <Label className="text-xs">Usuario</Label>
            <div className="text-sm font-medium p-2 bg-muted rounded-md">
              {selectedUser?.USUARIO || 'N/A'}
            </div>
          </div>

          {/* Rol Select */}
          <div className="space-y-2">
            <Label className="text-xs">Rol</Label>
            <Select value={idTipoRol} onValueChange={setIdTipoRol} disabled={isPending}>
              <SelectTrigger>
                <SelectValue placeholder="Selecciona un rol" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="2">Administrador</SelectItem>
                <SelectItem value="3">Usuario</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Áreas Checkboxes */}
          <div className="space-y-2">
            <Label className="text-xs">Áreas {idTipoRol === '2' && '(Automático)'}</Label>
            {idTipoRol === '3' && (
              <p className="text-xs text-muted-foreground bg-muted p-2 rounded">
                La información del área General está disponible para todos los usuarios
              </p>
            )}
            <div className="space-y-2 max-h-40 overflow-y-auto border rounded-md p-2">
              {displayedAreas && displayedAreas.length > 0 ? (
                displayedAreas.map((area) => (
                  <div key={area.ID_AREA} className="flex items-center gap-2">
                    <Checkbox
                      id={`area-${area.ID_AREA}`}
                      checked={selectedAreas.includes(area.ID_AREA)}
                      onCheckedChange={() => handleAreaToggle(area.ID_AREA)}
                      disabled={isPending || idTipoRol === '2'}
                    />
                    <label
                      htmlFor={`area-${area.ID_AREA}`}
                      className={`text-xs ${idTipoRol === '2' ? 'text-muted-foreground' : 'cursor-pointer'}`}
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
            disabled={isPending || selectedAreas.length === 0}
            className="flex-1"
          >
            {isPending ? 'Actualizando...' : 'Actualizar'}
          </Button>
        </div>
      </Card>
    </div>
  );
};
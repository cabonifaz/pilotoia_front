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

        // If no areas matched (or only General/Default which are hidden), default to General
        if (selectedAreaIds.length === 0 && generalAreaId) {
          setSelectedAreas([generalAreaId]);
        } else {
          setSelectedAreas(selectedAreaIds);
        }
      } else {
        // If no user areas, default to General
        if (generalAreaId) {
          setSelectedAreas([generalAreaId]);
        } else {
          setSelectedAreas([]);
        }
      }
    }
  }, [isOpen, selectedUser, areasData, userAreas, generalAreaId]);

  // Reset state when sidebar closes
  useEffect(() => {
    if (!isOpen) {
      setIdTipoRol('3');
      setSelectedAreas([]);
    }
  }, [isOpen]);

  // Check if there are any changes from the original data
  const originalRoleId = selectedUser?.ID_TIPO_ROL.toString();
  const originalAreaIds = selectedUser && areasData?.areas
    ? areasData.areas
        .filter((area) => userAreas.includes(area.AREA))
        .map((area) => area.ID_AREA)
    : [];

  const hasChanges = idTipoRol !== originalRoleId ||
    selectedAreas.length !== originalAreaIds.length ||
    !selectedAreas.every(id => originalAreaIds.includes(id));

  const handleSubmit = () => {
    if (!selectedUser || selectedAreas.length === 0 || !hasChanges) {
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
    setSelectedAreas((prevAreas) => {
      if (prevAreas.includes(areaId)) {
        // Unchecking an area
        const newAreas = prevAreas.filter((id) => id !== areaId);
        // If no areas left for Supervisor or Usuario (role 3), revert to General
        if (newAreas.length === 0 && ['3', '5'].includes(idTipoRol) && generalAreaId) {
          return [generalAreaId];
        }
        return newAreas;
      } else {
        // Checking an area
        // For Supervisor or Usuario (role 3 or 5), remove General if it's there and add the new area
        if (['3', '5'].includes(idTipoRol) && generalAreaId && prevAreas.includes(generalAreaId)) {
          return [areaId];
        }
        return [...prevAreas, areaId];
      }
    });
  };

  const handleRoleChange = (newRole: string) => {
    setIdTipoRol(newRole);
    // Auto-select General area when manually changing role
    if (generalAreaId) {
      setSelectedAreas([generalAreaId]);
    } else if (areasData?.areas) {
      const generalArea = areasData.areas.find((area) => area.AREA === 'General');
      if (generalArea) {
        setSelectedAreas([generalArea.ID_AREA]);
      }
    }
  };

  // Filter areas based on role
  const displayedAreas = areasData?.areas?.filter((area) => {
    if (idTipoRol === '2') {
      // Administrador: only show Default and General areas
      return ['Default', 'General'].includes(area.AREA);
    } else {
      // Supervisor or Usuario: show all areas except Default and General
      return !['Default', 'General'].includes(area.AREA);
    }
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
                Actualice el rol y áreas del usuario.
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
          {/* Usuario Display */}
          <div className="space-y-2">
            <Label className="text-xs">Usuario</Label>
            <div className="text-xs font-medium p-2 bg-muted rounded-md">
              {selectedUser?.USUARIO || 'N/A'}
            </div>
          </div>

          {/* Rol Select */}
          <div className="space-y-2">
            <Label className="text-xs">Rol</Label>
            <Select value={idTipoRol} onValueChange={handleRoleChange} disabled={isPending}>
              <SelectTrigger className="h-9">
                <SelectValue placeholder="Selecciona un rol" />
              </SelectTrigger>
              <SelectContent className="text-sm">
                <SelectItem value="2">Administrador</SelectItem>
                <SelectItem value='5'>Supervisor</SelectItem>
                <SelectItem value="3">Usuario</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Áreas Checkboxes */}
          <div className="space-y-2">
            <Label className="text-xs">Áreas {idTipoRol === '2' && '(Automático)'}</Label>
            {['3', '5'].includes(idTipoRol) && (
              <p className="text-xs text-muted-foreground bg-muted p-2 rounded">
                El usuario tendra acceso al área General por defecto
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
                      {idTipoRol === '2' && area.AREA === 'General' ? <strong>Todas</strong> : area.AREA}
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
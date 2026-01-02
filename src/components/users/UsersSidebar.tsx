import { useState, useEffect } from 'react';
import { X, Eye, EyeOff } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/shadcn/card';
import { Button } from '@/components/shadcn/button';
import { Input } from '@/components/shadcn/input';
import { Label } from '@/components/shadcn/label';
import { Checkbox } from '@/components/shadcn/checkbox';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/shadcn/select';
import { useCreateUsuario } from '@/hooks/useUsersQueries';
import { useGetAreas } from '@/hooks/useAreaQueries';
import { useQueryAuthContext } from '@/contexts/QueryAuthContext';

interface UsersSidebarProps {
  isOpen: boolean;
  onClose: () => void;
  id_empresa?: number;
}

export const UsersSidebar = ({
  isOpen,
  onClose,
  id_empresa: propsIdEmpresa,
}: UsersSidebarProps) => {
  const { user } = useQueryAuthContext();
  const contextIdEmpresa = (user as any)?.actual_company_area?.ID_EMPRESA;
  const id_empresa = propsIdEmpresa || contextIdEmpresa;

  const [nuevoUsuario, setNuevoUsuario] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [nombres, setNombres] = useState('');
  const [apellidos, setApellidos] = useState('');
  const [telefono, setTelefono] = useState('');
  const [idTipoRol, setIdTipoRol] = useState('3');
  const [selectedAreas, setSelectedAreas] = useState<number[]>([]);
  const [isInitialized, setIsInitialized] = useState(false);

  const { mutate: createUsuario, isPending } = useCreateUsuario(id_empresa);
  const { data: areasData } = useGetAreas(id_empresa);

  // Get General area ID for Administrador role
  const generalAreaId = areasData?.areas?.find((area) => area.AREA === 'General')?.ID_AREA;

  // Initialize areas when sidebar opens and areas data is available
  useEffect(() => {
    if (isOpen && areasData && !isInitialized && generalAreaId) {
      // Since default role is Usuario (3), initialize with General area
      setSelectedAreas([generalAreaId]);
      setIsInitialized(true);
    }
  }, [isOpen, areasData, isInitialized, generalAreaId]);

  // Reset state when sidebar closes
  useEffect(() => {
    if (!isOpen) {
      setNuevoUsuario('');
      setPassword('');
      setNombres('');
      setApellidos('');
      setTelefono('');
      setIdTipoRol('3');
      setSelectedAreas([]);
      setIsInitialized(false);
    }
  }, [isOpen]);

  const handleSubmit = () => {
    if (!nuevoUsuario.trim() || !password.trim() || !nombres.trim() || !apellidos.trim() || selectedAreas.length === 0) {
      return;
    }

    const areasString = selectedAreas.join(',');

    createUsuario(
      {
        nuevo_usuario: nuevoUsuario.trim(),
        password: password.trim(),
        nombres: nombres.trim(),
        apellidos: apellidos.trim(),
        telefono: telefono.trim() || null,
        nuevo_rol: parseInt(idTipoRol),
        id_empresa,
        areas_string: areasString,
      },
      {
        onSuccess: () => {
          setNuevoUsuario('');
          setPassword('');
          setNombres('');
          setApellidos('');
          setTelefono('');
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
        // If no areas left for Usuario (role 3), revert to General
        if (newAreas.length === 0 && idTipoRol === '3' && generalAreaId) {
          return [generalAreaId];
        }
        return newAreas;
      } else {
        // Checking an area
        // For Usuario (role 3), remove General if it's there and add the new area
        if (idTipoRol === '3' && generalAreaId && prevAreas.includes(generalAreaId)) {
          return [areaId];
        }
        return [...prevAreas, areaId];
      }
    });
  };

  // Auto-select General area when role changes to Administrador (2) or Usuario (3)
  useEffect(() => {
    if (idTipoRol === '2') {
      // Administrador: automatically select General area
      if (generalAreaId) {
        setSelectedAreas([generalAreaId]);
      } else if (areasData?.areas) {
        // Try to find General area ID if not already found
        const generalArea = areasData.areas.find((area) => area.AREA === 'General');
        if (generalArea) {
          setSelectedAreas([generalArea.ID_AREA]);
        }
      }
    } else if (idTipoRol === '3') {
      // Usuario: automatically select General area by default
      if (generalAreaId) {
        setSelectedAreas([generalAreaId]);
      } else if (areasData?.areas) {
        const generalArea = areasData.areas.find((area) => area.AREA === 'General');
        if (generalArea) {
          setSelectedAreas([generalArea.ID_AREA]);
        }
      }
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
        <CardHeader className="pt-3 pb-3 border-b flex-shrink-0">
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <CardTitle className="text-xs">Agregar usuario</CardTitle>
              <CardDescription className="text-xs">
                {(user as any)?.actual_company_area?.EMPRESA && (
                  <span className="font-semibold">{(user as any)?.actual_company_area?.EMPRESA}</span>
                )}
                {(user as any)?.actual_company_area?.EMPRESA && ' - '}
                Agregue un nuevo usuario.
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
          {/* Usuario Input */}
          <div className="space-y-2">
            <Label htmlFor="usuario" className="text-xs">Usuario</Label>
            <Input
              id="usuario"
              type="text"
              placeholder="Ingrese el usuario"
              value={nuevoUsuario}
              onChange={(e) => setNuevoUsuario(e.target.value)}
              disabled={isPending}
            />
          </div>

          {/* Password Input */}
          <div className="space-y-2">
            <Label htmlFor="password" className="text-xs">Contraseña</Label>
            <div className="relative">
              <Input
                id="password"
                type={showPassword ? "text" : "password"}
                placeholder="Ingrese la contraseña"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                disabled={isPending}
                className="pr-10"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700 focus:outline-none"
                disabled={isPending}
              >
                {showPassword ? (
                  <EyeOff className="h-4 w-4" />
                ) : (
                  <Eye className="h-4 w-4" />
                )}
              </button>
            </div>
          </div>

          {/* Nombres Input */}
          <div className="space-y-2">
            <Label htmlFor="nombres" className="text-xs">Nombres</Label>
            <Input
              id="nombres"
              type="text"
              placeholder="Ingrese los nombres"
              value={nombres}
              onChange={(e) => setNombres(e.target.value)}
              disabled={isPending}
            />
          </div>

          {/* Apellidos Input */}
          <div className="space-y-2">
            <Label htmlFor="apellidos" className="text-xs">Apellidos</Label>
            <Input
              id="apellidos"
              type="text"
              placeholder="Ingrese los apellidos"
              value={apellidos}
              onChange={(e) => setApellidos(e.target.value)}
              disabled={isPending}
            />
          </div>

          {/* Telefono Input */}
          <div className="space-y-2">
            <Label htmlFor="telefono" className="text-xs">Teléfono (Opcional)</Label>
            <Input
              id="telefono"
              type="tel"
              placeholder="Ingrese el teléfono"
              value={telefono}
              onChange={(e) => setTelefono(e.target.value)}
              disabled={true}
              pattern="[0-9\-\+\(\)\s]*"
            />
          </div>

          {/* Rol Select */}
          <div className="space-y-2">
            <Label className="text-xs">Rol</Label>
            <Select value={idTipoRol} onValueChange={setIdTipoRol} disabled={isPending} >
              <SelectTrigger className="h-9">
                <SelectValue placeholder="Selecciona un rol" />
              </SelectTrigger>
              <SelectContent className="text-sm">
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
            disabled={isPending || !nuevoUsuario.trim() || !password.trim() || !nombres.trim() || !apellidos.trim() || selectedAreas.length === 0}
            className="flex-1"
          >
            {isPending ? 'Guardando...' : 'Agregar'}
          </Button>
        </div>
      </Card>
    </div>
  );
};
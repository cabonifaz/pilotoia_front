import { useState, useEffect } from 'react';
import { X } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/shadcn/card';
import { Button } from '@/components/shadcn/button';
import { Input } from '@/components/shadcn/input';
import { Label } from '@/components/shadcn/label';
import { useUpdateUsuario } from '@/hooks/useUsersQueries';
import { useQueryAuthContext } from '@/contexts/QueryAuthContext';
import type { Usuario } from '@/types/users';

interface UsersSidebarUpdateProps {
  isOpen: boolean;
  onClose: () => void;
  id_empresa?: number;
  user: Usuario | null;
}

export const UsersSidebarUpdate = ({
  isOpen,
  onClose,
  id_empresa: propsIdEmpresa,
  user: selectedUser,
}: UsersSidebarUpdateProps) => {
  const { user } = useQueryAuthContext();
  const contextIdEmpresa = (user as any)?.actual_company_area?.ID_EMPRESA;
  const id_empresa = propsIdEmpresa || contextIdEmpresa;

  const [usuario, setUsuario] = useState('');
  const [nombres, setNombres] = useState('');
  const [apellidos, setApellidos] = useState('');
  const [telefono, setTelefono] = useState('');

  const { mutate: updateUsuario, isPending } = useUpdateUsuario(id_empresa);

  // Initialize form with user data when sidebar opens
  useEffect(() => {
    if (isOpen && selectedUser) {
      setUsuario(selectedUser.USUARIO);
      setNombres(selectedUser.NOMBRES);
      setApellidos(selectedUser.APELLIDOS);
      setTelefono(selectedUser.TELEFONO || '');
    }
  }, [isOpen, selectedUser]);

  // Reset state when sidebar closes
  useEffect(() => {
    if (!isOpen) {
      setUsuario('');
      setNombres('');
      setApellidos('');
      setTelefono('');
    }
  }, [isOpen]);

  const hasChanges = selectedUser && (
    usuario !== selectedUser.USUARIO ||
    nombres !== selectedUser.NOMBRES ||
    apellidos !== selectedUser.APELLIDOS ||
    telefono !== (selectedUser.TELEFONO || '')
  );

  const handleSubmit = () => {
    if (!selectedUser || !usuario.trim() || !nombres.trim() || !apellidos.trim() || !hasChanges) {
      return;
    }

    updateUsuario(
      {
        id_usuario: selectedUser.ID_USUARIO,
        usuario: usuario.trim(),
        nombres: nombres.trim(),
        apellidos: apellidos.trim(),
        telefono: telefono.trim() || null,
      },
      {
        onSuccess: () => {
          setUsuario('');
          setNombres('');
          setApellidos('');
          setTelefono('');
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
              <CardTitle className="text-xs">Actualizar usuario</CardTitle>
              <CardDescription className="text-xs">Actualice un usuario.</CardDescription>
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
              value={usuario}
              onChange={(e) => setUsuario(e.target.value)}
              disabled={isPending}
            />
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
              disabled={isPending}
              pattern="[0-9\-\+\(\)\s]*"
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
            disabled={isPending || !usuario.trim() || !nombres.trim() || !apellidos.trim() || !hasChanges}
            className="flex-1"
          >
            {isPending ? 'Actualizando...' : 'Actualizar'}
          </Button>
        </div>
      </Card>
    </div>
  );
};
import { useState, useEffect } from 'react';
import { X } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/shadcn/card';
import { Button } from '@/components/shadcn/button';
import { Input } from '@/components/shadcn/input';
import { Label } from '@/components/shadcn/label';
import { useUpdateUsuarioPassword } from '@/hooks/useUsersQueries';
import { useQueryAuthContext } from '@/contexts/QueryAuthContext';
import type { Usuario } from '@/types/users';

interface UsersSidebarPasswordProps {
  isOpen: boolean;
  onClose: () => void;
  id_empresa?: number;
  user: Usuario | null;
}

export const UsersSidebarPassword = ({
  isOpen,
  onClose,
  id_empresa: propsIdEmpresa,
  user: selectedUser,
}: UsersSidebarPasswordProps) => {
  const { user } = useQueryAuthContext();
  const contextIdEmpresa = (user as any)?.actual_company_area?.ID_EMPRESA;
  const id_empresa = propsIdEmpresa || contextIdEmpresa;

  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  const { mutate: updatePassword, isPending } = useUpdateUsuarioPassword(id_empresa);

  // Reset state when sidebar closes
  useEffect(() => {
    if (!isOpen) {
      setNewPassword('');
      setConfirmPassword('');
    }
  }, [isOpen]);

  const handleSubmit = () => {
    if (!selectedUser || !newPassword.trim()) {
      return;
    }

    if (newPassword !== confirmPassword) {
      return;
    }

    updatePassword(
      {
        id_usuario: selectedUser.ID_USUARIO,
        clave_acceso: newPassword.trim(),
      },
      {
        onSuccess: () => {
          setNewPassword('');
          setConfirmPassword('');
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
              <CardTitle className="text-xs">Cambiar contraseña</CardTitle>
              <CardDescription className="text-xs">Actualice la contraseña del usuario.</CardDescription>
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
          {/* Nueva Contraseña Input */}
          <div className="space-y-2">
            <Label htmlFor="newPassword" className="text-xs">Nueva contraseña</Label>
            <Input
              id="newPassword"
              type="password"
              placeholder="Ingrese la nueva contraseña"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              disabled={isPending}
            />
          </div>

          {/* Confirmar Contraseña Input */}
          <div className="space-y-2">
            <Label htmlFor="confirmPassword" className="text-xs">Confirmar contraseña</Label>
            <Input
              id="confirmPassword"
              type="password"
              placeholder="Confirme la contraseña"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              disabled={isPending}
            />
          </div>

          {newPassword && confirmPassword && newPassword !== confirmPassword && (
            <div className="text-xs text-destructive">
              Las contraseñas no coinciden
            </div>
          )}
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
            disabled={isPending || !newPassword.trim() || newPassword !== confirmPassword}
            className="flex-1"
          >
            {isPending ? 'Cambiando...' : 'Cambiar contraseña'}
          </Button>
        </div>
      </Card>
    </div>
  );
};
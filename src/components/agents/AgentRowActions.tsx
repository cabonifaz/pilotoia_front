import { Edit2, MoreVertical, UserX, UserCheck, Key, Lock, Power } from 'lucide-react';
import { Button } from '@/components/shadcn/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/shadcn/dropdown-menu';
import { useQueryAuthContext } from '@/contexts/QueryAuthContext';

interface AgentRowActionsProps {
  status: number;
  operativo: number;
  onEdit: () => void;
  onToggleStatus: () => void;
  onToggleOperativo: () => void;
  onRegenerateSecretKey: () => void;
  onChangeAccess: () => void;
}

export const AgentRowActions = ({
  status,
  operativo,
  onEdit,
  onToggleStatus,
  onToggleOperativo,
  onRegenerateSecretKey,
  onChangeAccess,
}: AgentRowActionsProps) => {
  const { user } = useQueryAuthContext();
  const isSuperAdmin = (user as any)?.id_tipo_rol === 1;
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          size="sm"
          className="h-6 w-6 p-0"
        >
          <MoreVertical className="h-4 w-4" />
          <span className="sr-only">Abrir menú</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuItem
          onClick={onEdit}
          className="flex items-center gap-2 cursor-pointer"
        >
          <Edit2 className="h-4 w-4" />
          <span>Editar</span>
        </DropdownMenuItem>
        <DropdownMenuItem
          onClick={onToggleStatus}
          className="flex items-center gap-2 cursor-pointer"
        >
          {status === 1 ? (
            <>
              <UserX className="h-4 w-4" />
              <span>Desactivar</span>
            </>
          ) : (
            <>
              <UserCheck className="h-4 w-4" />
              <span>Activar</span>
            </>
          )}
        </DropdownMenuItem>
        {isSuperAdmin && status === 1 && (
          <DropdownMenuItem
            onClick={onToggleOperativo}
            className="flex items-center gap-2 cursor-pointer"
          >
            <Power className="h-4 w-4" />
            <span>{operativo === 1 ? 'Marcar inoperativo' : 'Marcar operativo'}</span>
          </DropdownMenuItem>
        )}
        {isSuperAdmin && (
          <DropdownMenuItem
            onClick={onRegenerateSecretKey}
            className="flex items-center gap-2 cursor-pointer"
          >
            <Key className="h-4 w-4" />
            <span>Regenerar secret key</span>
          </DropdownMenuItem>
        )}
        <DropdownMenuItem
          onClick={onChangeAccess}
          className="flex items-center gap-2 cursor-pointer"
        >
          <Lock className="h-4 w-4" />
          <span>Cambiar acceso</span>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
};

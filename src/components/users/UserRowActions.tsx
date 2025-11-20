import { Edit2, MoreVertical, UserX, UserCheck } from 'lucide-react';
import { Button } from '@/components/shadcn/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/shadcn/dropdown-menu';

interface UserRowActionsProps {
  status: number;
  onEdit: () => void;
  onToggleStatus: () => void;
}

export const UserRowActions = ({
  status,
  onEdit,
  onToggleStatus,
}: UserRowActionsProps) => {
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
      </DropdownMenuContent>
    </DropdownMenu>
  );
};

import { Edit2, Trash2, RotateCw, MoreVertical } from 'lucide-react';
import { Button } from '@/components/shadcn/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/shadcn/dropdown-menu';

interface AreaRowActionsProps {
  areaId: number;
  status: number; // 1 = Activo, 0 = Inactivo
  onEdit: () => void;
  onDelete: (areaId: number) => void;
  onReactivate: (areaId: number) => void;
}

export const AreaRowActions = ({
  areaId,
  status,
  onEdit,
  onDelete,
  onReactivate,
}: AreaRowActionsProps) => {
  const isActive = status === 1;

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
        {isActive ? (
          <DropdownMenuItem
            onClick={() => onDelete(areaId)}
            className="flex items-center gap-2 cursor-pointer text-red-600"
          >
            <Trash2 className="h-4 w-4" />
            <span>Desactivar</span>
          </DropdownMenuItem>
        ) : (
          <DropdownMenuItem
            onClick={() => onReactivate(areaId)}
            className="flex items-center gap-2 cursor-pointer text-green-600"
          >
            <RotateCw className="h-4 w-4" />
            <span>Reactivar</span>
          </DropdownMenuItem>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
};

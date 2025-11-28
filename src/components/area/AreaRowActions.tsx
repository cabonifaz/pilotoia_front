import { Edit2, Trash2, RotateCw, MoreVertical, BrainCircuit } from 'lucide-react';
import { Button } from '@/components/shadcn/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/shadcn/dropdown-menu';

interface AreaRowActionsProps {
  areaId: number;
  areaName: string;
  status: number; // 1 = Activo, 0 = Inactivo
  onEdit: () => void;
  onDelete: (areaId: number) => void;
  onReactivate: (areaId: number) => void;
  onConfigureAi?: () => void;
}

export const AreaRowActions = ({
  areaId,
  areaName,
  status,
  onEdit,
  onDelete,
  onReactivate,
  onConfigureAi,
}: AreaRowActionsProps) => {
  const isActive = status === 1;
  const isSpecialArea = ['Default', 'General'].includes(areaName);

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
        {!isSpecialArea && (
          <DropdownMenuItem
            onClick={onEdit}
            className="flex items-center gap-2 cursor-pointer"
          >
            <Edit2 className="h-4 w-4" />
            <span>Editar</span>
          </DropdownMenuItem>
        )}
        {onConfigureAi && (
          <DropdownMenuItem
            onClick={onConfigureAi}
            className="flex items-center gap-2 cursor-pointer"
          >
            <BrainCircuit className="h-4 w-4" />
            <span>Configuración de IA</span>
          </DropdownMenuItem>
        )}
        {!isSpecialArea && (
          isActive ? (
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
          )
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
};

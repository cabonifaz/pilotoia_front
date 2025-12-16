import { Trash2, RotateCw, MoreVertical, Image } from 'lucide-react';
import { Button } from '@/components/shadcn/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from '@/components/shadcn/dropdown-menu';

interface CompanyRowActionsProps {
  companyId: number;
  status: number; // 1 = Activo, 0 = Inactivo
  onDelete: (companyId: number) => void;
  onReactivate: (companyId: number) => void;
  onUpdateLogo: (companyId: number) => void;
  isPending?: boolean;
}

export const CompanyRowActions = ({
  companyId,
  status,
  onDelete,
  onReactivate,
  onUpdateLogo,
  isPending = false,
}: CompanyRowActionsProps) => {
  const isActive = status === 1;
  const isDefaultCompany = companyId === 1;

  if (isDefaultCompany) {
    return null;
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          size="sm"
          className="h-6 w-6 p-0"
          disabled={isPending}
        >
          <MoreVertical className="h-4 w-4" />
          <span className="sr-only">Abrir menú</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        {isActive && (
          <>
            <DropdownMenuItem
              onClick={() => onUpdateLogo(companyId)}
              disabled={isPending}
              className="flex items-center gap-2 cursor-pointer"
            >
              <Image className="h-4 w-4" />
              <span>Actualizar logo</span>
            </DropdownMenuItem>
            <DropdownMenuSeparator />
          </>
        )}
        {isActive ? (
          <DropdownMenuItem
            onClick={() => onDelete(companyId)}
            disabled={isPending}
            className="flex items-center gap-2 cursor-pointer text-red-600"
          >
            <Trash2 className="h-4 w-4" />
            <span>Desactivar</span>
          </DropdownMenuItem>
        ) : (
          <DropdownMenuItem
            onClick={() => onReactivate(companyId)}
            disabled={isPending}
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

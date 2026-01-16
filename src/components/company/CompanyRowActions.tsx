import { Trash2, RotateCw, MoreVertical, Image, Link } from "lucide-react";
import { Button } from "@/components/shadcn/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from "@/components/shadcn/dropdown-menu";

interface CompanyRowActionsProps {
  companyId: number;
  companyName: string;
  companyLogo: string | null;
  status: number; // 1 = Activo, 0 = Inactivo
  secretKey: string;
  onDelete: (companyId: number) => void;
  onReactivate: (companyId: number) => void;
  onUpdateLogo: (companyId: number, companyName: string, companyLogo: string | null) => void;  // 👈 CAMBIAR AQUÍ
  onGenerateURL: (secretKey: string) => void;
  isPending?: boolean;
}

export const CompanyRowActions = ({
  companyId,
  companyName,
  companyLogo,
  status,
  secretKey,
  onDelete,
  onReactivate,
  onUpdateLogo,
  onGenerateURL,
  isPending = false,
}: CompanyRowActionsProps) => {
  const isActive = status === 1;
  const isDefaultCompany = companyId === 1;

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
        {isDefaultCompany ? (
          <DropdownMenuItem
            onClick={() => onGenerateURL(secretKey)}
            disabled={isPending}
            className="flex items-center gap-2 cursor-pointer"
          >
            <Link className="h-4 w-4" />
            <span>Generar URL</span>
          </DropdownMenuItem>
        ) : (
          <>
            {isActive && (
              <>
                <DropdownMenuItem
                  onClick={() => onUpdateLogo(companyId, companyName, companyLogo)}
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
              <>
                <DropdownMenuItem
                  onClick={() => onDelete(companyId)}
                  disabled={isPending}
                  className="flex items-center gap-2 cursor-pointer text-red-600"
                >
                  <Trash2 className="h-4 w-4" />
                  <span>Desactivar</span>
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  onClick={() => onGenerateURL(secretKey)}
                  disabled={isPending}
                  className="flex items-center gap-2 cursor-pointer"
                >
                  <Link className="h-4 w-4" />
                  <span>Generar URL</span>
                </DropdownMenuItem>
                <DropdownMenuSeparator />
              </>
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
          </>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
};
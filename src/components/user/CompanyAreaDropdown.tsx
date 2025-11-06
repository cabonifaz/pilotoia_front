import { ChevronsUpDown } from 'lucide-react';
import { Button } from '@/components/shadcn/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/shadcn/dropdown-menu';
import { useQueryAuthContext } from '../../contexts/QueryAuthContext';
import { useQueryClient } from '@tanstack/react-query';
import { queryKeys } from '../../lib/queryClient';
import { toast } from '../../hooks/use-toast';

interface CompanyAreaDropdownProps {
  isDisabled?: boolean;
}

const CompanyAreaDropdown = ({ isDisabled = false }: CompanyAreaDropdownProps) => {
  const { user } = useQueryAuthContext();
  const queryClient = useQueryClient();

  // Get actual company and area info
  const actualCompanyArea = (user as any)?.actual_company_area;
  const companyName = actualCompanyArea?.EMPRESA;
  const areaName = actualCompanyArea?.AREA;

  const currentKey = actualCompanyArea ?
    `${actualCompanyArea.ID_EMPRESA}-${actualCompanyArea.ID_AREA}` : '';

  const handleCompanyAreaChange = async (selectedCompanyArea: any) => {
    try {
      const currentUserData = queryClient.getQueryData(queryKeys.user.current()) as any;

      if (currentUserData) {
        const updatedUserData = {
          ...currentUserData,
          actual_company_area: selectedCompanyArea
        };
        // Update the cache with the new company area (optimistic update)
        queryClient.setQueryData(queryKeys.user.current(), updatedUserData);

        // Save only the IDs to sessionStorage for persistence across page reloads
        sessionStorage.setItem('selected_company_area_ids', JSON.stringify({
          idEmpresa: selectedCompanyArea.ID_EMPRESA,
          idArea: selectedCompanyArea.ID_AREA
        }));
      }

      toast({
        title: "Éxito",
        description: `Empresa/área cambiada a ${selectedCompanyArea.EMPRESA} - ${selectedCompanyArea.AREA}`,
        variant: "success"
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "No se pudo cambiar la empresa/área. Inténtalo de nuevo.",
        variant: "destructive"
      });
    }
  };

  if (!user) {
    return null;
  }

  // Check if user has multiple company areas
  const hasMultipleCompanyAreas = user.company_areas && user.company_areas.length > 1;

  if (!companyName) {
    return null;
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="outline"
          disabled={isDisabled}
          className="flex items-center gap-2 px-3 py-1.5 h-auto text-sm text-muted-foreground hover:text-foreground disabled:opacity-50"
        >
          <div className="flex items-center gap-2">
            <span className="font-medium">{companyName}</span>
            {areaName && (
              <>
                <span>•</span>
                <span>{areaName}</span>
              </>
            )}
            {hasMultipleCompanyAreas && (
              <ChevronsUpDown className="h-3 w-3" />
            )}
          </div>
        </Button>
      </DropdownMenuTrigger>

      {hasMultipleCompanyAreas && (
        <DropdownMenuContent align="end" className="w-56">
          {user.company_areas?.map((companyArea: any) => {
            const key = `${companyArea.ID_EMPRESA}-${companyArea.ID_AREA}`;
            const isCurrent = key === currentKey;

            return (
              !isCurrent && (
                <DropdownMenuItem
                  key={key}
                  onClick={() => handleCompanyAreaChange(companyArea)}
                  className="cursor-pointer"
                >
                  <span>{companyArea.EMPRESA} • {companyArea.AREA}</span>
                </DropdownMenuItem>
              )
            );
          })}
        </DropdownMenuContent>
      )}
    </DropdownMenu>
  );
};

export default CompanyAreaDropdown;
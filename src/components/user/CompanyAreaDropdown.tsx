import { ChevronsUpDown } from 'lucide-react';
import { Button } from '@/components/shadcn/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/shadcn/dropdown-menu';
import { useQueryAuthContext } from '../../contexts/QueryAuthContext';
import { useChangeCompanyArea } from '../../hooks/useUserQueries';
import { toast } from '../../hooks/use-toast';

interface CompanyAreaDropdownProps {
  isDisabled?: boolean;
}

const CompanyAreaDropdown = ({ isDisabled = false }: CompanyAreaDropdownProps) => {
  const { user } = useQueryAuthContext();
  const changeCompanyArea = useChangeCompanyArea();

  // Get actual company and area info
  const actualCompanyArea = (user as any)?.actual_company_area;
  const companyName = actualCompanyArea?.EMPRESA;
  const areaName = actualCompanyArea?.AREA;

  const currentKey = actualCompanyArea ?
    `${actualCompanyArea.ID_EMPRESA}-${actualCompanyArea.ID_AREA}` : '';

  const handleCompanyAreaChange = (selectedCompanyArea: any) => {
    try {
      changeCompanyArea(selectedCompanyArea);

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
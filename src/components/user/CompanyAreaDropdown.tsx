import { useState } from 'react';
import { ChevronDown, Building2 } from 'lucide-react';
import { Button } from '@/components/shadcn/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/shadcn/dropdown-menu';
import { useAuthContext } from '../../contexts/QueryAuthContext';
import CompanyAreaModal from './CompanyAreaModal';
import type { DecodedUserData } from '../../utils/jwtUtils';

const CompanyAreaDropdown = () => {
  const { user } = useAuthContext();
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Get actual company and area info
  const actualCompanyArea = (user as any)?.actual_company_area;
  const companyName = actualCompanyArea?.EMPRESA;
  const areaName = actualCompanyArea?.AREA;

  const handleCompanyAreaChange = () => {
    setIsModalOpen(true);
  };

  if (!user) {
    return null;
  }

  // Check if user has multiple company areas and role permissions
  const hasMultipleCompanyAreas = user.company_areas && user.company_areas.length > 1;
  const isSuperAdmin = user.id_tipo_rol === 1;
  const isAdmin = user.id_tipo_rol === 2;

  // SuperAdmin and Admin can change areas if they have multiple, User cannot
  const canChangeCompanyArea = hasMultipleCompanyAreas && (isSuperAdmin || isAdmin);

  if (!companyName) {
    return null;
  }

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            variant="ghost"
            className="flex items-center gap-2 px-3 py-1.5 h-auto text-sm text-muted-foreground hover:text-foreground"
          >
            <div className="flex items-center gap-2">
              <span className="font-medium">{companyName}</span>
              {areaName && (
                <>
                  <span>•</span>
                  <span>{areaName}</span>
                </>
              )}
              {canChangeCompanyArea && (
                <ChevronDown className="h-3 w-3" />
              )}
            </div>
          </Button>
        </DropdownMenuTrigger>

        {canChangeCompanyArea && (
          <DropdownMenuContent align="end" className="w-48">
            <DropdownMenuItem
              onClick={handleCompanyAreaChange}
              className="cursor-pointer"
            >
              <Building2 className="h-4 w-4 mr-2" />
              Cambiar Empresa/Area
            </DropdownMenuItem>
          </DropdownMenuContent>
        )}
      </DropdownMenu>

      {/* Company/Area Selection Modal */}
      {canChangeCompanyArea && (
        <CompanyAreaModal
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          user={user as DecodedUserData}
        />
      )}
    </>
  );
};

export default CompanyAreaDropdown;
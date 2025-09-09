import { useState } from 'react';
import { ChevronDown, LogOut, User, Building2 } from 'lucide-react';
import { Button } from '@/components/shadcn/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from '@/components/shadcn/dropdown-menu';
import { useAuthContext } from '../../contexts/QueryAuthContext';
import CompanyAreaModal from './CompanyAreaModal';

const UserDropdown = () => {
  const { user, logout } = useAuthContext();
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const handleLogout = async () => {
    setIsLoggingOut(true);
    try {
      await logout();
      // Redirect will be handled by the auth context or interceptors
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      setIsLoggingOut(false);
    }
  };

  const handleCompanyAreaChange = () => {
    setIsModalOpen(true);
  };


  if (!user) {
    return null;
  }

  // Check if user has multiple company areas
  const hasMultipleCompanyAreas = user.company_areas && user.company_areas.length > 1;

  return (
    <>
      <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button 
          variant="ghost" 
          className="flex items-center gap-2 px-3 py-2 h-auto"
        >
          <div className="flex items-center gap-2">
            <User className="h-4 w-4" />
            <span className="text-sm font-medium">
              {user.usuario}
            </span>
            <ChevronDown className="h-4 w-4" />
          </div>
        </Button>
      </DropdownMenuTrigger>
      
      <DropdownMenuContent align="end" className="w-48">
        {hasMultipleCompanyAreas && (
          <>
            <DropdownMenuItem 
              onClick={handleCompanyAreaChange}
              className="cursor-pointer"
            >
              <Building2 className="h-4 w-4 mr-2" />
              Cambiar Empresa/Area
            </DropdownMenuItem>
            <DropdownMenuSeparator />
          </>
        )}
        <DropdownMenuItem 
          onClick={handleLogout}
          disabled={isLoggingOut}
          className="cursor-pointer bg-red-500 text-white hover:bg-red-600 focus:bg-red-600"
        >
          <LogOut className="h-4 w-4 mr-2 text-white" />
          {isLoggingOut ? 'Cerrando sesión...' : 'Cerrar sesión'}
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>

    {/* Company/Area Selection Modal */}
    {hasMultipleCompanyAreas && (
      <CompanyAreaModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        user={user}
      />
    )}
  </>
  );
};

export default UserDropdown;
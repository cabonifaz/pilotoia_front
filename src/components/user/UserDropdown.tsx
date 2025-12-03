import { useState } from 'react';
import { ChevronDown, LogOut, User, Shield, Lock } from 'lucide-react';
import { Button } from '@/components/shadcn/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/shadcn/dropdown-menu';
import { useQueryAuthContext } from '../../contexts/QueryAuthContext';

const UserDropdown = () => {
  const { user, logout } = useQueryAuthContext();
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  const handleLogout = async () => {
    setIsLoggingOut(true);
    try {
      await logout();
      // Redirect is handled by useLogoutMutation with ref preservation
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      setIsLoggingOut(false);
    }
  };

  if (!user) {
    return null;
  }

  // Determine icon based on role
  const getRoleIcon = () => {
    switch (user.id_tipo_rol) {
      case 1: // SuperAdmin
        return <Shield className="h-4 w-4" />;
      case 2: // Admin
        return <Lock className="h-4 w-4" />;
      case 3: // User
      default:
        return <User className="h-4 w-4" />;
    }
  };

  return (
    <>
      <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          className="flex items-center gap-2 px-3 py-2 h-auto text-xs hover:text-foreground"
        >
          <div className="flex items-center gap-2">
            {getRoleIcon()}
            <span className="text-xs font-medium">
              {user.nombres} {user.apellidos}
            </span>
            <ChevronDown className="h-4 w-4" />
          </div>
        </Button>
      </DropdownMenuTrigger>
      
      <DropdownMenuContent align="end" className="w-48">
        <DropdownMenuItem
          onClick={handleLogout}
          disabled={isLoggingOut}
          className="cursor-pointer bg-red-500 text-white hover:bg-red-600 hover:text-white focus:bg-red-600 focus:text-white"
        >
          <LogOut className="h-4 w-4 mr-2 text-white" />
          {isLoggingOut ? 'Cerrando sesión...' : 'Cerrar sesión'}
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  </>
  );
};

export default UserDropdown;
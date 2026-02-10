import { useState, useEffect } from 'react';
import { Search, CirclePlus } from 'lucide-react';
import { Button } from '@/components/shadcn/button';
import { Input } from '@/components/shadcn/input';
import { UsersTable, UsersSidebar, UsersSidebarUpdate, UsersSidebarPassword, UsersSidebarAccess } from '@/components/users';
import { useQueryAuthContext } from '@/contexts/QueryAuthContext';
import type { Usuario } from '@/types/users';

const UsersManagement = () => {
  const { user } = useQueryAuthContext();
  const id_empresa = (user as any)?.actual_company_area?.ID_EMPRESA;

  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isUpdateSidebarOpen, setIsUpdateSidebarOpen] = useState(false);
  const [isPasswordSidebarOpen, setIsPasswordSidebarOpen] = useState(false);
  const [isAccessSidebarOpen, setIsAccessSidebarOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState<Usuario | null>(null);
  const [selectedUserAreas, setSelectedUserAreas] = useState<string[]>([]);
  const [searchInput, setSearchInput] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');

  // Close all sidebars when company changes
  useEffect(() => {
    setIsSidebarOpen(false);
    setIsUpdateSidebarOpen(false);
    setIsPasswordSidebarOpen(false);
    setIsAccessSidebarOpen(false);
    setSelectedUser(null);
    setSelectedUserAreas([]);
  }, [id_empresa]);

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(searchInput);
    }, 500);
    return () => clearTimeout(timer);
  }, [searchInput]);

  const closeSidebar = () => {
    setIsSidebarOpen(false);
  };

  const closeUpdateSidebar = () => {
    setIsUpdateSidebarOpen(false);
    setSelectedUser(null);
  };

  const closePasswordSidebar = () => {
    setIsPasswordSidebarOpen(false);
    setSelectedUser(null);
  };

  const closeAccessSidebar = () => {
    setIsAccessSidebarOpen(false);
    setSelectedUser(null);
  };

  const handleEditUser = (userToEdit: Usuario) => {
    setSelectedUser(userToEdit);
    setIsUpdateSidebarOpen(true);
  };

  const handleChangePassword = (userToChangePassword: Usuario) => {
    setSelectedUser(userToChangePassword);
    setIsPasswordSidebarOpen(true);
  };

  const handleChangeAccess = (userToChangeAccess: Usuario, userAreaList?: string[]) => {
    setSelectedUser(userToChangeAccess);
    setSelectedUserAreas(userAreaList || []);
    setIsAccessSidebarOpen(true);
  };

  return (
    <div className="flex flex-1 overflow-hidden h-full">
      <div className="flex flex-col flex-1 overflow-hidden transition-all duration-300 h-full">
        <div className="flex flex-col flex-1 overflow-hidden p-4 md:p-8 gap-4 h-full min-h-0">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
              <Input
                placeholder="Buscar usuarios"
                value={searchInput}
                onChange={(e) => setSearchInput(e.target.value)}
                className="pl-10"
              />
            </div>
            <Button onClick={() => setIsSidebarOpen(true)} variant="blue" className="gap-2" size="sm">
              <CirclePlus className="h-4 w-4 flex-shrink-0" />
              Agregar usuario
            </Button>
          </div>
          <UsersTable 
            searchTerm={debouncedSearch} 
            onEditUser={handleEditUser} 
            onChangePassword={handleChangePassword} 
            onChangeAccess={handleChangeAccess} 
          />
        </div>
      </div>
      <UsersSidebar isOpen={isSidebarOpen} onClose={closeSidebar} id_empresa={id_empresa} />
      <UsersSidebarUpdate isOpen={isUpdateSidebarOpen} onClose={closeUpdateSidebar} id_empresa={id_empresa} user={selectedUser} />
      <UsersSidebarPassword isOpen={isPasswordSidebarOpen} onClose={closePasswordSidebar} id_empresa={id_empresa} user={selectedUser} />
      <UsersSidebarAccess isOpen={isAccessSidebarOpen} onClose={closeAccessSidebar} id_empresa={id_empresa} user={selectedUser} userAreas={selectedUserAreas} />
    </div>
  );
};

export default UsersManagement;
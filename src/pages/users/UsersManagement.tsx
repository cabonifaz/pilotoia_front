import { useState } from 'react';
import { Search, ChevronsUpDown, CirclePlus } from 'lucide-react';
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
  const [searchTerm, setSearchTerm] = useState('');
  const [sortBy, setSortBy] = useState<'usuario' | 'nombres' | 'area' | 'rol' | null>(null);

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
      {/* Main Content */}
      <div
        className={`flex flex-col flex-1 overflow-hidden transition-all duration-300 h-full`}
      >
        {/* Header and Table Wrapper */}
        <div className="flex flex-col flex-1 overflow-hidden p-4 md:p-8 gap-4 h-full min-h-0">
          {/* Search and Controls */}
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
              <Input
                placeholder="Buscar usuarios"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>

            {/* Sort/Filter Buttons */}
            <div className="flex flex-wrap gap-2">
              <Button
                variant={sortBy === 'usuario' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setSortBy(sortBy === 'usuario' ? null : 'usuario')}
                className="gap-2"
              >
                <ChevronsUpDown className="h-4 w-4 flex-shrink-0" />
                Usuario
              </Button>
              <Button
                variant={sortBy === 'nombres' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setSortBy(sortBy === 'nombres' ? null : 'nombres')}
                className="gap-2"
              >
                <ChevronsUpDown className="h-4 w-4 flex-shrink-0" />
                Nombres
              </Button>
              <Button
                variant={sortBy === 'area' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setSortBy(sortBy === 'area' ? null : 'area')}
                className="gap-2"
              >
                <ChevronsUpDown className="h-4 w-4 flex-shrink-0" />
                Área
              </Button>
              <Button
                variant={sortBy === 'rol' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setSortBy(sortBy === 'rol' ? null : 'rol')}
                className="gap-2"
              >
                <ChevronsUpDown className="h-4 w-4 flex-shrink-0" />
                Rol
              </Button>

              <Button onClick={() => setIsSidebarOpen(true)} variant="blue" className="gap-2">
                <CirclePlus className="h-4 w-4 flex-shrink-0" />
                Agregar usuario
              </Button>
            </div>
          </div>

          {/* Table Section */}
          <UsersTable searchTerm={searchTerm} sortBy={sortBy} onEditUser={handleEditUser} onChangePassword={handleChangePassword} onChangeAccess={handleChangeAccess} />
        </div>
      </div>

      {/* Right Sidebar - Create User */}
      <UsersSidebar
        isOpen={isSidebarOpen}
        onClose={closeSidebar}
        id_empresa={id_empresa}
      />

      {/* Right Sidebar - Update User */}
      <UsersSidebarUpdate
        isOpen={isUpdateSidebarOpen}
        onClose={closeUpdateSidebar}
        id_empresa={id_empresa}
        user={selectedUser}
      />

      {/* Right Sidebar - Change Password */}
      <UsersSidebarPassword
        isOpen={isPasswordSidebarOpen}
        onClose={closePasswordSidebar}
        id_empresa={id_empresa}
        user={selectedUser}
      />

      {/* Right Sidebar - Change Access */}
      <UsersSidebarAccess
        isOpen={isAccessSidebarOpen}
        onClose={closeAccessSidebar}
        id_empresa={id_empresa}
        user={selectedUser}
        userAreas={selectedUserAreas}
      />
    </div>
  );
};

export default UsersManagement;
import { useState } from 'react';
import { Search, ChevronsUpDown, CirclePlus } from 'lucide-react';
import { Button } from '@/components/shadcn/button';
import { Input } from '@/components/shadcn/input';
import { UsersTable, UsersSidebar } from '@/components/users';
import { useQueryAuthContext } from '@/contexts/QueryAuthContext';

const UsersManagement = () => {
  const { user } = useQueryAuthContext();
  const id_empresa = (user as any)?.actual_company_area?.ID_EMPRESA;

  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [sortBy, setSortBy] = useState<'usuario' | 'nombres' | 'area' | 'rol' | null>(null);

  const closeSidebar = () => {
    setIsSidebarOpen(false);
  };

  return (
    <div className="flex flex-1 overflow-hidden h-full">
      {/* Main Content */}
      <div
        className={`flex flex-col flex-1 overflow-hidden transition-all duration-300 h-full`}
      >
        {/* Header and Table Wrapper */}
        <div className="flex flex-col flex-1 overflow-hidden p-8 gap-4 h-full min-h-0">
          {/* Search and Controls */}
          <div className="flex items-center justify-between gap-2">
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
            <Button
              variant={sortBy === 'usuario' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setSortBy(sortBy === 'usuario' ? null : 'usuario')}
              className="gap-2"
            >
              <ChevronsUpDown className="h-4 w-4" />
              Usuario
            </Button>
            <Button
              variant={sortBy === 'nombres' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setSortBy(sortBy === 'nombres' ? null : 'nombres')}
              className="gap-2"
            >
              <ChevronsUpDown className="h-4 w-4" />
              Nombres
            </Button>
            <Button
              variant={sortBy === 'area' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setSortBy(sortBy === 'area' ? null : 'area')}
              className="gap-2"
            >
              <ChevronsUpDown className="h-4 w-4" />
              Área
            </Button>
            <Button
              variant={sortBy === 'rol' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setSortBy(sortBy === 'rol' ? null : 'rol')}
              className="gap-2"
            >
              <ChevronsUpDown className="h-4 w-4" />
              Rol
            </Button>

            <Button onClick={() => setIsSidebarOpen(true)} variant="blue" className="gap-2">
              <CirclePlus className="h-4 w-4" />
              Agregar usuario
            </Button>
          </div>

          {/* Table Section */}
          <UsersTable searchTerm={searchTerm} sortBy={sortBy} />
        </div>
      </div>

      {/* Right Sidebar - Upload Panel */}
      <UsersSidebar
        isOpen={isSidebarOpen}
        onClose={closeSidebar}
        id_empresa={id_empresa}
      />
    </div>
  );
};

export default UsersManagement;
import { useState } from 'react';
import { Search, ChevronsUpDown, CirclePlus } from 'lucide-react';
import { Button } from '@/components/shadcn/button';
import { Input } from '@/components/shadcn/input';
import { AiTable, AiSidebar } from '@/components/aiModels';
import { useQueryAuthContext } from '@/contexts/QueryAuthContext';

const AiManagement = () => {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [sortBy, setSortBy] = useState<'nombre' | 'proveedor' | 'tipo' | null>(null);
  const { user } = useQueryAuthContext();

  const closeSidebar = () => {
    setIsSidebarOpen(false);
  };

  // Get the current company ID from user's actual_company_area
  const id_empresa = (user as any)?.actual_company_area?.ID_EMPRESA;

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
                placeholder="Buscar modelos"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>

            {/* Sort/Filter Buttons */}
            <Button
              variant={sortBy === 'nombre' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setSortBy(sortBy === 'nombre' ? null : 'nombre')}
              className="gap-2"
            >
              <ChevronsUpDown className="h-4 w-4" />
              Nombre
            </Button>
            <Button
              variant={sortBy === 'proveedor' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setSortBy(sortBy === 'proveedor' ? null : 'proveedor')}
              className="gap-2"
            >
              <ChevronsUpDown className="h-4 w-4" />
              Proveedor
            </Button>
            <Button
              variant={sortBy === 'tipo' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setSortBy(sortBy === 'tipo' ? null : 'tipo')}
              className="gap-2"
            >
              <ChevronsUpDown className="h-4 w-4" />
              Tipo
            </Button>

            <Button onClick={() => setIsSidebarOpen(true)} variant="blue" className="gap-2">
              <CirclePlus className="h-4 w-4" />
              Agregar modelo
            </Button>
          </div>

          {/* Table Section */}
          <AiTable searchTerm={searchTerm} sortBy={sortBy} />
        </div>
      </div>

      {/* Right Sidebar - Area Panel */}
      {id_empresa && (
        <AiSidebar
          isOpen={isSidebarOpen}
          onClose={closeSidebar}
          id_empresa={id_empresa}
        />
      )}
    </div>
  );
};

export default AiManagement;
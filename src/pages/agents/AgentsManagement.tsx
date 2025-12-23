import { useState } from 'react';
import { Search, ChevronsUpDown, CirclePlus } from 'lucide-react';
import { Button } from '@/components/shadcn/button';
import { Input } from '@/components/shadcn/input';
import { AgentsTable, AgentsSidebar } from '@/components/agents';
import { useQueryAuthContext } from '@/contexts/QueryAuthContext';

const AgentsManagement = () => {
  const { user } = useQueryAuthContext();
  const id_empresa = (user as any)?.actual_company_area?.ID_EMPRESA;

  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [sortBy, setSortBy] = useState<'telefono' | 'tipo' | 'area' | 'estado' | null>(null);

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
        <div className="flex flex-col flex-1 overflow-hidden p-4 md:p-8 gap-4 h-full min-h-0">
          {/* Search and Controls */}
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
              <Input
                placeholder="Buscar agentes"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>

            {/* Sort/Filter Buttons */}
            <div className="flex flex-wrap gap-2">
              <Button
                variant={sortBy === 'telefono' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setSortBy(sortBy === 'telefono' ? null : 'telefono')}
                className="gap-2"
              >
                <ChevronsUpDown className="h-4 w-4 flex-shrink-0" />
                Teléfono
              </Button>
              <Button
                variant={sortBy === 'tipo' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setSortBy(sortBy === 'tipo' ? null : 'tipo')}
                className="gap-2"
              >
                <ChevronsUpDown className="h-4 w-4 flex-shrink-0" />
                Tipo
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
                variant={sortBy === 'estado' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setSortBy(sortBy === 'estado' ? null : 'estado')}
                className="gap-2"
              >
                <ChevronsUpDown className="h-4 w-4 flex-shrink-0" />
                Estado
              </Button>

              <Button onClick={() => setIsSidebarOpen(true)} variant="blue" className="gap-2">
                <CirclePlus className="h-4 w-4 flex-shrink-0" />
                Agregar agente
              </Button>
            </div>
          </div>

          {/* Table Section */}
          <AgentsTable searchTerm={searchTerm} sortBy={sortBy} />
        </div>
      </div>

      {/* Right Sidebar - Create Agent */}
      <AgentsSidebar
        isOpen={isSidebarOpen}
        onClose={closeSidebar}
        id_empresa={id_empresa}
      />
    </div>
  );
};

export default AgentsManagement;
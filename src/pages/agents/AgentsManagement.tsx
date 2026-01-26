import { useState, useEffect } from 'react';
import { Search, CirclePlus } from 'lucide-react';
import { Button } from '@/components/shadcn/button';
import { Input } from '@/components/shadcn/input';
import { AgentsTable, AgentsSidebar } from '@/components/agents';
import { useQueryAuthContext } from '@/contexts/QueryAuthContext';

const AgentsManagement = () => {
  const { user } = useQueryAuthContext();
  const id_empresa = (user as any)?.actual_company_area?.ID_EMPRESA;

  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [searchInput, setSearchInput] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');

  // Debounce search input
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(searchInput);
    }, 500);
    return () => clearTimeout(timer);
  }, [searchInput]);

  const closeSidebar = () => {
    setIsSidebarOpen(false);
  };

  return (
    <div className="flex flex-1 overflow-hidden h-full">
      <div className="flex flex-col flex-1 overflow-hidden transition-all duration-300 h-full">
        <div className="flex flex-col flex-1 overflow-hidden p-4 md:p-8 gap-4 h-full min-h-0">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
              <Input
                placeholder="Buscar agentes"
                value={searchInput}
                onChange={(e) => setSearchInput(e.target.value)}
                className="pl-10"
              />
            </div>
            <Button onClick={() => setIsSidebarOpen(true)} variant="blue" className="gap-2" size="sm">
              <CirclePlus className="h-4 w-4 flex-shrink-0" />
              Agregar agente
            </Button>
          </div>
          <AgentsTable searchTerm={debouncedSearch} />
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
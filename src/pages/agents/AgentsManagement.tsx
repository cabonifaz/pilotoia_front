import { useState, useEffect } from 'react';
import { Search, CirclePlus } from 'lucide-react';
import { Button } from '@/components/shadcn/button';
import { Input } from '@/components/shadcn/input';
import { AgentsTable, AgentsSidebar, AgentsSidebarUpdate, AgentsSidebarAccess } from '@/components/agents';
import { useQueryAuthContext } from '@/contexts/QueryAuthContext';
import {
  useUpdateAgenteStatus,
  useUpdateAgenteOperativo,
  useUpdateAgenteSecretKey,
} from '@/hooks/useAgentsQueries';
import type { Agente } from '@/types/agents';

const AgentsManagement = () => {
  const { user } = useQueryAuthContext();
  const id_empresa = (user as any)?.actual_company_area?.ID_EMPRESA;

  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isUpdateSidebarOpen, setIsUpdateSidebarOpen] = useState(false);
  const [isAccessSidebarOpen, setIsAccessSidebarOpen] = useState(false);
  const [selectedAgent, setSelectedAgent] = useState<Agente | null>(null);
  const [selectedAgentAreas, setSelectedAgentAreas] = useState<string[]>([]);
  const [searchInput, setSearchInput] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');

  const { mutate: toggleStatus } = useUpdateAgenteStatus(id_empresa);
  const { mutate: toggleOperativo } = useUpdateAgenteOperativo(id_empresa);
  const { mutate: regenerateSecretKey } = useUpdateAgenteSecretKey(id_empresa);

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
    setSelectedAgent(null);
  };

  const closeAccessSidebar = () => {
    setIsAccessSidebarOpen(false);
    setSelectedAgent(null);
  };

  const handleEditAgent = (agent: Agente) => {
    setSelectedAgent(agent);
    setIsUpdateSidebarOpen(true);
  };

  const handleToggleStatus = (idAgente: number, currentStatus: number) => {
    toggleStatus({ id_agente: idAgente, status: currentStatus === 1 ? 0 : 1 });
  };

  const handleToggleOperativo = (idAgente: number, currentOperativo: number) => {
    toggleOperativo({ id_agente: idAgente, operativo: currentOperativo === 1 ? 0 : 1 });
  };

  const handleRegenerateSecretKey = (idAgente: number) => {
    regenerateSecretKey({ id_agente: idAgente });
  };

  const handleChangeAccess = (agent: Agente, agentAreaList: string[]) => {
    setSelectedAgent(agent);
    setSelectedAgentAreas(agentAreaList || []);
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
          <AgentsTable
            searchTerm={debouncedSearch}
            onEditAgent={handleEditAgent}
            onToggleStatus={handleToggleStatus}
            onToggleOperativo={handleToggleOperativo}
            onRegenerateSecretKey={handleRegenerateSecretKey}
            onChangeAccess={handleChangeAccess}
          />
        </div>
      </div>
      <AgentsSidebar isOpen={isSidebarOpen} onClose={closeSidebar} id_empresa={id_empresa} />
      <AgentsSidebarUpdate isOpen={isUpdateSidebarOpen} onClose={closeUpdateSidebar} id_empresa={id_empresa} agent={selectedAgent} />
      <AgentsSidebarAccess isOpen={isAccessSidebarOpen} onClose={closeAccessSidebar} id_empresa={id_empresa} agent={selectedAgent} agentAreas={selectedAgentAreas} />
    </div>
  );
};

export default AgentsManagement;

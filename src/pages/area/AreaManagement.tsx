import { useState } from 'react';
import { Search, ChevronsUpDown, CirclePlus } from 'lucide-react';
import { Button } from '@/components/shadcn/button';
import { Input } from '@/components/shadcn/input';
import { AreaTable, AreaSidebar, AreaAiSidebar } from '@/components/area';
import { useQueryAuthContext } from '@/contexts/QueryAuthContext';

const AreaManagement = () => {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isAiSidebarOpen, setIsAiSidebarOpen] = useState(false);
  const [selectedAreaForAi, setSelectedAreaForAi] = useState<{ id_area: number; id_empresa: number } | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [sortBy, setSortBy] = useState<'area' | 'fecha_creacion' | null>(null);
  const { user } = useQueryAuthContext();

  const closeSidebar = () => {
    setIsSidebarOpen(false);
  };

  const closeAiSidebar = () => {
    setIsAiSidebarOpen(false);
    setSelectedAreaForAi(null);
  };

  const handleConfigureAi = (id_area: number, id_empresa: number) => {
    setSelectedAreaForAi({ id_area, id_empresa });
    setIsAiSidebarOpen(true);
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
                placeholder="Buscar áreas"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>

            {/* Sort/Filter Buttons */}
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
              variant={sortBy === 'fecha_creacion' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setSortBy(sortBy === 'fecha_creacion' ? null : 'fecha_creacion')}
              className="gap-2"
            >
              <ChevronsUpDown className="h-4 w-4" />
              Fecha
            </Button>

            <Button onClick={() => setIsSidebarOpen(true)} variant="blue" className="gap-2">
              <CirclePlus className="h-4 w-4" />
              Agregar área
            </Button>
          </div>

          {/* Table Section */}
          <AreaTable searchTerm={searchTerm} sortBy={sortBy} onConfigureAi={handleConfigureAi} />
        </div>
      </div>

      {/* Right Sidebar - Area Panel */}
      {id_empresa && (
        <AreaSidebar
          isOpen={isSidebarOpen}
          onClose={closeSidebar}
          id_empresa={id_empresa}
        />
      )}

      {/* Right Sidebar - AI Config Panel */}
      {selectedAreaForAi && (
        <AreaAiSidebar
          isOpen={isAiSidebarOpen}
          onClose={closeAiSidebar}
          id_empresa={selectedAreaForAi.id_empresa}
          id_area={selectedAreaForAi.id_area}
        />
      )}
    </div>
  );
};

export default AreaManagement;
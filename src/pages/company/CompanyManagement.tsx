import { useState } from 'react';
import { Search, ChevronsUpDown, CirclePlus } from 'lucide-react';
import { Button } from '@/components/shadcn/button';
import { Input } from '@/components/shadcn/input';
import { CompanyTable, CompanySidebar } from '@/components/company';

const CompanyManagement = () => {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [sortBy, setSortBy] = useState<'ruc' | 'razon_social' | null>(null);

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
                placeholder="Buscar empresas"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>

            {/* Sort/Filter Buttons */}
            <div className="flex flex-wrap gap-2">
              <Button
                variant={sortBy === 'ruc' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setSortBy(sortBy === 'ruc' ? null : 'ruc')}
                className="gap-2"
              >
                <ChevronsUpDown className="h-4 w-4 flex-shrink-0" />
                RUC
              </Button>
              <Button
                variant={sortBy === 'razon_social' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setSortBy(sortBy === 'razon_social' ? null : 'razon_social')}
                className="gap-2"
              >
                <ChevronsUpDown className="h-4 w-4 flex-shrink-0" />
                Razón Social
              </Button>

              <Button onClick={() => setIsSidebarOpen(true)} variant="blue" className="gap-2">
                <CirclePlus className="h-4 w-4 flex-shrink-0" />
                Agregar empresa
              </Button>
            </div>
          </div>

          {/* Table Section */}
          <CompanyTable searchTerm={searchTerm} sortBy={sortBy} />
        </div>
      </div>

      {/* Right Sidebar - Upload Panel */}
      <CompanySidebar
        isOpen={isSidebarOpen}
        onClose={closeSidebar}
      />
    </div>
  );
};

export default CompanyManagement;
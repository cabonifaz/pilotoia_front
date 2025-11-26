import { useState } from 'react';
import { Search, ChevronsUpDown, CirclePlus } from 'lucide-react';
import { Button } from '@/components/shadcn/button';
import { Input } from '@/components/shadcn/input';
import { DocumentsTable, UploadSidebar } from '@/components/upload';

const DocumentUpload = () => {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [sortBy, setSortBy] = useState<'status' | null>(null);

  const closeSidebar = () => {
    setIsSidebarOpen(false);
  };

  return (
    <div className="flex flex-1 overflow-hidden h-full">
      <div className={`flex flex-col flex-1 overflow-hidden transition-all duration-300 h-full`}>
        <div className="flex flex-col flex-1 overflow-hidden p-8 gap-4 h-full min-h-0">
          <div className="flex items-center justify-between gap-2">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
              <Input
                placeholder="Buscar documentos"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            <Button
              variant={sortBy === 'status' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setSortBy(sortBy === 'status' ? null : 'status')}
              className="gap-2"
            >
              <ChevronsUpDown className="h-4 w-4" />
              Estado
            </Button>

            <Button onClick={() => setIsSidebarOpen(true)} variant="blue" className="gap-2">
              <CirclePlus className="h-4 w-4" />
              Agregar documentos
            </Button>
          </div>
          <DocumentsTable searchTerm={searchTerm} sortBy={sortBy} />
        </div>
      </div>

      <UploadSidebar
        isOpen={isSidebarOpen}
        onClose={closeSidebar}
      />
    </div>
  );
};

export default DocumentUpload;

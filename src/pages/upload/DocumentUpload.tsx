import { useState, useEffect } from 'react';
import { useDebounce } from 'use-debounce';
import { Search, CirclePlus, Trash2 } from 'lucide-react';
import { Button } from '@/components/shadcn/button';
import { Input } from '@/components/shadcn/input';
import { DocumentsTable, UploadSidebar } from '@/components/upload';
import { useDeleteKnowledge } from '@/hooks/useProcessingLogs';
import { useCurrentUser } from '@/hooks/useUserQueries';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/shadcn/dialog';

const DocumentUpload = () => {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedRows, setSelectedRows] = useState<string[]>([]);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [uploadTrigger, setUploadTrigger] = useState(0); 

  // Debounce search term
  const [debouncedSearchTerm] = useDebounce(searchTerm, 500);

  const { user } = useCurrentUser();
  const id_empresa = (user as any)?.actual_company_area?.ID_EMPRESA;
  const areaName = user?.actual_company_area?.AREA || 'esta área';
  const deleteMutation = useDeleteKnowledge();

  // Close sidebar and dialog when company changes
  useEffect(() => {
    setIsSidebarOpen(false);
    setIsDeleteDialogOpen(false);
    setSelectedRows([]);
  }, [id_empresa]);

  const closeSidebar = () => {
    setIsSidebarOpen(false);
  };

  const handleUploadSuccess = () => {
    setUploadTrigger(prev => prev + 1); // Forzar refetch en DocumentsTable
  };

  const handleDeleteClick = () => {
    if (selectedRows.length > 0) {
      setIsDeleteDialogOpen(true);
    }
  };

  const handleConfirmDelete = async () => {
    // Convert string IDs to numbers for the API
    const numericIds = selectedRows.map(id => parseInt(id, 10));

    await deleteMutation.mutateAsync(numericIds);

    // Clear selection and close dialog
    setSelectedRows([]);
    setIsDeleteDialogOpen(false);
  };

  const handleCancelDelete = () => {
    setIsDeleteDialogOpen(false);
  };

  return (
    <div className="flex flex-1 overflow-hidden h-full">
      <div className={`flex flex-col flex-1 overflow-hidden transition-all duration-300 h-full`}>
        <div className="flex flex-col flex-1 overflow-hidden p-4 md:p-8 gap-4 h-full min-h-0">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
              <Input
                placeholder="Buscar documentos"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            <div className="flex flex-wrap gap-2">
              {/* ELIMINADO: Botón de ordenar por estado */}

              <Button
                variant="destructive"
                size="sm"
                onClick={handleDeleteClick}
                disabled={selectedRows.length === 0}
                className="gap-2 transition-all duration-300 ease-in-out"
              >
                <Trash2 className="h-4 w-4 flex-shrink-0 transition-transform duration-300 ease-in-out" />
                <span className="hidden md:inline">Eliminar</span>
              </Button>

              <Button onClick={() => setIsSidebarOpen(true)} variant="blue" className="gap-2" size="sm">
                <CirclePlus className="h-4 w-4 flex-shrink-0" />
                Agregar documentos
              </Button>
            </div>
          </div>
          <DocumentsTable
            searchTerm={debouncedSearchTerm}
            selectedRows={selectedRows}
            onSelectionChange={setSelectedRows}
            uploadTrigger={uploadTrigger}
          />
        </div>
      </div>

      <UploadSidebar
        isOpen={isSidebarOpen}
        onClose={closeSidebar}
        onUploadSuccess={handleUploadSuccess}
      />

      <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Confirmar eliminación</DialogTitle>
            <DialogDescription>
              ¿Deseas eliminar {selectedRows.length} documento(s) del conocimiento del área {areaName}?
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={handleCancelDelete}
              disabled={deleteMutation.isPending}
            >
              Cancelar
            </Button>
            <Button
              variant="destructive"
              onClick={handleConfirmDelete}
              disabled={deleteMutation.isPending}
            >
              {deleteMutation.isPending ? 'Eliminando...' : 'Eliminar'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default DocumentUpload;
import { useState, useEffect } from 'react';
import { useDebounce } from 'use-debounce';
import { Search, CirclePlus, ChevronDown } from 'lucide-react';
import { Button } from '@/components/shadcn/button';
import { Input } from '@/components/shadcn/input';
import { DocumentsTable, UploadSidebar } from '@/components/upload';
import { useDeleteRagDocuments } from '@/hooks/useDeleteRagDocuments';
import { useRetryIngestionBatch } from '@/hooks/useRetryIngestionBatch';
import { useDisableRagDocumentsBatch } from '@/hooks/useDisableRagDocumentsBatch';
import { useEnableRagDocumentsBatch } from '@/hooks/useEnableRagDocumentsBatch';
import type { DocumentSelection } from '@/components/upload/DocumentsTable';
import { useCurrentUser } from '@/hooks/useUserQueries';
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuSub,
  DropdownMenuSubTrigger,
  DropdownMenuSubContent,
} from '@/components/shadcn/dropdown-menu';
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
  const [selectedRows, setSelectedRows] = useState<DocumentSelection>({ enabled: [], disabled: [] });
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [uploadTrigger, setUploadTrigger] = useState(0);
  const [clearSelectionTrigger, setClearSelectionTrigger] = useState(0);

  const [debouncedSearchTerm] = useDebounce(searchTerm, 500);

  const { user } = useCurrentUser();
  const id_empresa = (user as any)?.actual_company_area?.ID_EMPRESA;
  const areaName = user?.actual_company_area?.AREA || 'esta área';

  const deleteMutation = useDeleteRagDocuments();
  const retryBatchMutation = useRetryIngestionBatch();
  const disableBatchMutation = useDisableRagDocumentsBatch();
  const enableBatchMutation = useEnableRagDocumentsBatch();

  useEffect(() => {
    setIsSidebarOpen(false);
    setIsDeleteDialogOpen(false);
    setSelectedRows({ enabled: [], disabled: [] });
  }, [id_empresa]);

  const closeSidebar = () => {
    setIsSidebarOpen(false);
  };

  const handleUploadSuccess = () => {
    setUploadTrigger(prev => prev + 1);
  };

  const allSelectedIds = [...selectedRows.enabled, ...selectedRows.disabled];
  const totalSelected = allSelectedIds.length;

  const handleDeleteClick = () => {
    if (totalSelected > 0) {
      setIsDeleteDialogOpen(true);
    }
  };

  const handleConfirmDelete = async () => {
    const numericIds = allSelectedIds.map(id => parseInt(id, 10));
    await deleteMutation.mutateAsync(
      { idDocumentos: numericIds, idEmpresa: id_empresa },
      {
        onSuccess: () => {
          setSelectedRows([]);
          setIsDeleteDialogOpen(false);
          setClearSelectionTrigger(t => t + 1);
        },
      },
    );
  };

  const handleCancelDelete = () => {
    setIsDeleteDialogOpen(false);
  };

  const handleRetryBatch = (idEtapa: number) => {
    const numericIds = allSelectedIds.map(id => parseInt(id, 10));
    retryBatchMutation.mutate(
      { idDocumentos: numericIds, idEmpresa: id_empresa, idEtapa },
      { onSuccess: () => setClearSelectionTrigger(t => t + 1) },
    );
  };

  const handleDisableBatch = () => {
    const numericIds = selectedRows.enabled.map(id => parseInt(id, 10));
    disableBatchMutation.mutate(
      { idDocumentos: numericIds, idEmpresa: id_empresa },
      { onSuccess: () => setClearSelectionTrigger(t => t + 1) },
    );
  };

  const handleEnableBatch = () => {
    const numericIds = selectedRows.disabled.map(id => parseInt(id, 10));
    enableBatchMutation.mutate(
      { idDocumentos: numericIds, idEmpresa: id_empresa },
      { onSuccess: () => setClearSelectionTrigger(t => t + 1) },
    );
  };

  const isBatchPending =
    retryBatchMutation.isPending || disableBatchMutation.isPending ||
    enableBatchMutation.isPending || deleteMutation.isPending;

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
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={totalSelected === 0 || isBatchPending}
                    className="gap-2"
                  >
                    Acciones
                    <ChevronDown className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuSub>
                    <DropdownMenuSubTrigger>
                      Reintentar
                    </DropdownMenuSubTrigger>
                    <DropdownMenuSubContent>
                      <DropdownMenuItem onClick={() => handleRetryBatch(1)}>
                        Extracción
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => handleRetryBatch(2)}>
                        Segmentación
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => handleRetryBatch(3)}>
                        Vectorización
                      </DropdownMenuItem>
                    </DropdownMenuSubContent>
                  </DropdownMenuSub>
                  {selectedRows.enabled.length > 0 && (
                    <DropdownMenuItem onClick={handleDisableBatch}>
                      Deshabilitar
                    </DropdownMenuItem>
                  )}
                  {selectedRows.disabled.length > 0 && (
                    <DropdownMenuItem onClick={handleEnableBatch}>
                      Habilitar
                    </DropdownMenuItem>
                  )}
                  <DropdownMenuSeparator />
                  <DropdownMenuItem
                    onClick={handleDeleteClick}
                    className="text-destructive focus:text-destructive"
                  >
                    Eliminar
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>

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
            clearSelectionTrigger={clearSelectionTrigger}
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
              ¿Deseas eliminar {totalSelected} documento(s) del conocimiento del área {areaName}?
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

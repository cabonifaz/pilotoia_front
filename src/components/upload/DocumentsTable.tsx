import { useState, useMemo } from 'react';
import { ChevronLeft, ChevronRight, Search, ChevronsUpDown, CirclePlus, FileText } from 'lucide-react';
import { Card, CardContent, CardHeader } from '@/components/shadcn/card';
import { Button } from '@/components/shadcn/button';
import { Input } from '@/components/shadcn/input';
import { Badge } from '@/components/shadcn/badge';
import { useProcessingLogs } from '@/hooks/useProcessingLogs';

// Map process_stage to status display
const getStatusFromStage = (stage: number, isError: boolean) => {
  if (isError) {
    return { label: 'Error', variant: 'destructive' as const };
  }

  const stages: Record<number, { label: string; variant: 'info' | 'purple' | 'gray' | 'warning' | 'orange' | 'success' | 'teal' | 'cyan' | 'pink' }> = {
    0: { label: 'Subiendo', variant: 'info' },
    1: { label: 'Evaluando', variant: 'purple' },
    2: { label: 'En cola', variant: 'gray' },
    3: { label: 'Extrayendo datos', variant: 'cyan' },
    4: { label: 'Normalizando', variant: 'teal' },
    5: { label: 'Dividiendo en partes', variant: 'warning' },
    6: { label: 'Generando representaciones', variant: 'orange' },
    7: { label: 'Guardando en la base de datos', variant: 'pink' },
    8: { label: 'Completado', variant: 'success' },
  };

  return stages[stage] || { label: 'Desconocido', variant: 'gray' as const };
};

// Extract filename from pdf_key (format: process_id/filename.pdf)
const extractFilename = (pdfKey: string): string => {
  const parts = pdfKey.split('/');
  return parts[parts.length - 1] || pdfKey;
};

// Format date to readable format
const formatDate = (isoDate: string): string => {
  const date = new Date(isoDate);
  return date.toLocaleDateString('es-ES', {
    day: '2-digit',
    month: 'short',
    year: 'numeric'
  });
};

interface DocumentsTableProps {
  onAddClick: () => void;
}

export const DocumentsTable = ({ onAddClick }: DocumentsTableProps) => {
  const [currentPage, setCurrentPage] = useState(1);
  const [searchTerm, setSearchTerm] = useState('');
  const [sortBy, setSortBy] = useState<'area' | 'status' | null>(null);

  // Fetch company uploads (companyId is automatically retrieved from user context inside the hook)
  const { data: uploads, isLoading, error } = useProcessingLogs({
    limit: 100,
    enabled: true,
  });

  // Process and filter documents
  const processedDocuments = useMemo(() => {
    if (!uploads) return [];

    return uploads
      .map(upload => ({
        id: upload.process_id,
        name: extractFilename(upload.pdf_key),
        area: `Área ${upload.area_id}`,
        createdDate: formatDate(upload.created_at),
        uploadedBy: `Usuario ${upload.uploaded_by_id}`,
        status: getStatusFromStage(upload.process_stage, upload.is_error),
        rawData: upload,
      }))
      .filter(doc =>
        doc.name.toLowerCase().includes(searchTerm.toLowerCase())
      );
  }, [uploads, searchTerm]);

  // Sort documents with default and user-selected sorting
  const sortedDocuments = useMemo(() => {
    let sorted = [...processedDocuments];

    // Apply user-selected sorting first if any
    if (sortBy === 'area') {
      sorted.sort((a, b) => a.area.localeCompare(b.area));
    } else if (sortBy === 'status') {
      sorted.sort((a, b) => a.status.label.localeCompare(b.status.label));
    } else {
      // Default sorting: by created_at (most recent first), then by process_stage (lower first)
      sorted.sort((a, b) => {
        // Primary sort: created_at descending (most recent first)
        const dateA = new Date(a.rawData.created_at).getTime();
        const dateB = new Date(b.rawData.created_at).getTime();

        if (dateB !== dateA) {
          return dateB - dateA; // Most recent first
        }

        // Secondary sort: process_stage ascending (lower status first)
        return a.rawData.process_stage - b.rawData.process_stage;
      });
    }

    return sorted;
  }, [processedDocuments, sortBy]);

  const itemsPerPage = 5;
  const totalPages = Math.ceil(sortedDocuments.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const displayedDocuments = sortedDocuments.slice(startIndex, startIndex + itemsPerPage);

  return (
    <Card className="flex-1 flex flex-col min-h-0">
      <CardHeader className="pb-3">
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

          {/* Sort/Filter Buttons - on the same row as search */}
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
            variant={sortBy === 'status' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setSortBy(sortBy === 'status' ? null : 'status')}
            className="gap-2"
          >
            <ChevronsUpDown className="h-4 w-4" />
            Estado
          </Button>

          <Button onClick={onAddClick} variant="secondary" className="gap-2">
            <CirclePlus className="h-4 w-4" />
            Agregar documentos
          </Button>
        </div>
      </CardHeader>

      <CardContent className="flex-1 flex flex-col min-h-0 overflow-hidden">
        {/* Loading State */}
        {isLoading && (
          <div className="flex-1 flex items-center justify-center">
            <p className="text-muted-foreground">Cargando documentos...</p>
          </div>
        )}

        {/* Error State */}
        {error && (
          <div className="flex-1 flex items-center justify-center">
            <p className="text-red-500">Error: {error.message}</p>
          </div>
        )}

        {/* Empty State */}
        {!isLoading && !error && displayedDocuments.length === 0 && (
          <div className="flex-1 flex items-center justify-center">
            <p className="text-muted-foreground">No se encontraron documentos</p>
          </div>
        )}

        {/* Table */}
        {!isLoading && !error && displayedDocuments.length > 0 && (
          <>
            <div className="flex-1 overflow-y-auto">
              <table className="w-full text-xs">
                <thead>
                  <tr className="border-b">
                    <th className="text-left py-3 px-4 font-medium">
                      <input type="checkbox" className="rounded" />
                    </th>
                    <th className="text-left py-3 px-4 font-medium">Nombre</th>
                    <th className="text-left py-3 px-4 font-medium">Área</th>
                    <th className="text-left py-3 px-4 font-medium">Creado el</th>
                    <th className="text-left py-3 px-4 font-medium">Subido por</th>
                    <th className="text-left py-3 px-4 font-medium">Estado</th>
                    <th className="text-left py-3 px-4 font-medium"></th>
                  </tr>
                </thead>
                <tbody>
                  {displayedDocuments.map((doc) => (
                    <tr key={doc.id} className="border-b hover:bg-muted/50">
                      <td className="py-3 px-4">
                        <input type="checkbox" className="rounded" />
                      </td>
                      <td className="py-3 px-4 flex items-center gap-2">
                        <FileText className="h-4 w-4 text-blue-500" />
                        <span>{doc.name}</span>
                      </td>
                      <td className="py-3 px-4">{doc.area}</td>
                      <td className="py-3 px-4">{doc.createdDate}</td>
                      <td className="py-3 px-4">{doc.uploadedBy}</td>
                      <td className="py-3 px-4">
                        <Badge variant={doc.status.variant}>{doc.status.label}</Badge>
                      </td>
                      <td className="py-3 px-4">
                        <button className="text-muted-foreground hover:text-foreground">...</button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            <div className="flex items-center justify-between pt-4 border-t">
              <p className="text-sm text-muted-foreground">
                Mostrando {startIndex + 1}-{Math.min(startIndex + itemsPerPage, sortedDocuments.length)} de {sortedDocuments.length} documentos
              </p>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                  disabled={currentPage === 1}
                >
                  <ChevronLeft className="h-4 w-4" />
                  Anterior
                </Button>

                <div className="flex gap-1">
                  {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                    <Button
                      key={page}
                      variant={currentPage === page ? 'default' : 'outline'}
                      size="sm"
                      onClick={() => setCurrentPage(page)}
                    >
                      {page}
                    </Button>
                  ))}
                </div>

                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
                  disabled={currentPage === totalPages}
                >
                  Siguiente
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
};

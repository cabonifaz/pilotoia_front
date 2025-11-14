import { useState, useMemo, useRef, useEffect } from 'react';
import { ChevronLeft, ChevronRight, FileText } from 'lucide-react';
import { Card, CardContent, CardHeader } from '@/components/shadcn/card';
import { Button } from '@/components/shadcn/button';
import { Badge } from '@/components/shadcn/badge';
import { Checkbox } from '@/components/shadcn/checkbox';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/shadcn/table';
import { Loader } from '@/components/loader/Loader';
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
  searchTerm: string;
  sortBy: 'area' | 'status' | null;
}

export const DocumentsTable = ({ searchTerm, sortBy }: DocumentsTableProps) => {
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(5);
  const tableContainerRef = useRef<HTMLDivElement>(null);

  // Fetch company uploads (companyId is automatically retrieved from user context inside the hook)
  const { data: uploads, isLoading, error } = useProcessingLogs({
    limit: 100,
    enabled: true,
  });

  // Automatically calculate items per page based on container height
  useEffect(() => {
    const calculateItemsPerPage = () => {
      if (tableContainerRef.current) {
        const containerHeight = tableContainerRef.current.clientHeight;
        const rowHeight = 45; // Height of each table row
        const headerHeight = 45; // Height of table header
        const availableHeight = containerHeight - headerHeight;
        const calculatedItems = Math.floor(availableHeight / rowHeight);
        setItemsPerPage(Math.max(5, calculatedItems));
      }
    };

    calculateItemsPerPage();
    window.addEventListener('resize', calculateItemsPerPage);
    return () => window.removeEventListener('resize', calculateItemsPerPage);
  }, []);

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

  const totalPages = Math.ceil(sortedDocuments.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const displayedDocuments = sortedDocuments.slice(startIndex, startIndex + itemsPerPage);

  return (
    <Card className="flex-1 flex flex-col min-h-0">
      <CardHeader className="pb-3">
        <div className="flex flex-col items-start gap-1">
          <h1 className="text-2xl font-bold text-foreground">Documentos</h1>
          <p className="text-xs text-muted-foreground">
            Gestiona todos los documentos de la empresa.
          </p>
        </div>
      </CardHeader>

      <CardContent className="flex-1 flex flex-col min-h-0 overflow-hidden gap-4 relative">
        {/* Loading State */}
        {isLoading && (
          <Loader text="Cargando documentos..." />
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
            <div ref={tableContainerRef} className="flex-1 min-h-0 border rounded-lg">
              <div className="h-full overflow-y-auto">
                <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-12"></TableHead>
                    <TableHead>Nombre</TableHead>
                    <TableHead>Área</TableHead>
                    <TableHead>Creado el</TableHead>
                    <TableHead>Subido por</TableHead>
                    <TableHead>Estado</TableHead>
                    <TableHead className="w-12"></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {displayedDocuments.map((doc) => (
                    <TableRow key={doc.id}>
                      <TableCell>
                        <Checkbox />
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <FileText className="h-4 w-4 text-blue-500" />
                          <span>{doc.name}</span>
                        </div>
                      </TableCell>
                      <TableCell>{doc.area}</TableCell>
                      <TableCell>{doc.createdDate}</TableCell>
                      <TableCell>{doc.uploadedBy}</TableCell>
                      <TableCell>
                        <Badge variant={doc.status.variant}>{doc.status.label}</Badge>
                      </TableCell>
                      <TableCell>
                        <button className="text-muted-foreground hover:text-foreground">...</button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
              </div>
            </div>

            {/* Pagination */}
            <div className="flex flex-col items-center gap-2 flex-shrink-0">
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
              <p className="text-xs text-muted-foreground">
                Mostrando {startIndex + 1}-{Math.min(startIndex + itemsPerPage, sortedDocuments.length)} de {sortedDocuments.length} documentos
              </p>
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
};

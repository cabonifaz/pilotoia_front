import { useState, useMemo, useRef, useEffect } from 'react';
import { ChevronLeft, ChevronRight, FileText } from 'lucide-react';
import { Card, CardContent, CardHeader } from '@/components/shadcn/card';
import { Button } from '@/components/shadcn/button';
import { Badge } from '@/components/shadcn/badge';
import { Checkbox } from '@/components/shadcn/checkbox';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/shadcn/table';
import { Loader } from '@/components/loader/Loader';
import { useProcessingLogs } from '@/hooks/useProcessingLogs';
import type { KnowledgeLoadResponse } from '@/types/upload';

type BadgeVariant = "success" | "gray" | "destructive" | "info" | "purple" | "cyan" | "warning" | "orange" | "teal" | "default" | "outline" | "secondary" | "pink" | null | undefined;

type StatusBadge = {
  label: string;
  variant?: BadgeVariant
}

// Map process_stage to status display
const getStatusFromStage = (idEstadoProceso: number, estadoProceso: string) => {
  const badgeColorMap: { [key: number]: BadgeVariant } = {
    0: 'cyan',      // State 0 - Subiendo (Uploading)
    1: 'warning',   // State 1 - En cola (In queue)
    2: 'purple',    // State 2 - Procesando (Processing)
    3: 'info',      // State 3 - Texto extraído (Text extracted)
    4: 'orange',    // State 4 - Texto segmentado (Text segmented)
    5: 'teal',      // State 5 - Segmentos vectorizados (Segments vectorized)
    6: 'success',   // State 6 - Cargado (Loaded/Completed)
    7: 'destructive', // State 7 - Error
  }

  let statusBadge: StatusBadge = { label: estadoProceso }

  if (idEstadoProceso < 0) {
    statusBadge.variant = 'destructive' as const;
  } else {
    statusBadge.variant = badgeColorMap[idEstadoProceso] || 'secondary' as const;
  }

  return statusBadge || { label: 'Desconocido', variant: 'secondary' as const };
};

// Format date to readable format with time
const formatDate = (isoDate: string): string => {
  const date = new Date(isoDate);
  return date.toLocaleDateString('es-ES', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });
};

interface DocumentsTableProps {
  searchTerm: string;
  sortBy: 'status' | null;
}

export const DocumentsTable = ({ searchTerm, sortBy }: DocumentsTableProps) => {
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(5);
  const tableContainerRef = useRef<HTMLDivElement>(null);

  const pollingInterval = Number(import.meta.env.VITE_POLLING_INTERVAL) || 30000;

  const hasProcessingDocuments = (uploads: KnowledgeLoadResponse[] | undefined): boolean => {
    if (!uploads || uploads.length === 0) return false;
    return uploads.some((upload: KnowledgeLoadResponse) => upload.id_estado_proceso !== 6);
  };

  const { data: uploads, isLoading, error } = useProcessingLogs({
    enabled: true,
    refetchInterval: (query: { state: { data: KnowledgeLoadResponse[] | undefined } }): number | false => {
      return hasProcessingDocuments(query.state.data) ? pollingInterval : false;
    },
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

    const timer = setTimeout(calculateItemsPerPage, 100);
    window.addEventListener('resize', calculateItemsPerPage);
    return () => {
      clearTimeout(timer);
      window.removeEventListener('resize', calculateItemsPerPage);
    };
  }, [uploads]);

  // Reset to first page when search term or sort changes
  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, sortBy]);

  // Process and filter documents
  const processedDocuments = useMemo(() => {
    if (!uploads) return [];

    return uploads
      .map(upload => ({
        id: upload.id,
        id_usuario: upload.id_usuario,
        usuario_carga: upload.usuario_carga || 'Sistema',
        id_empresa: upload.id_empresa,
        empresa: upload.empresa || 'Sin empresa',
        id_area: upload.id_area,
        area: upload.area || 'Sin área',
        id_estado_proceso: upload.id_estado_proceso,
        estado_proceso: upload.estado_proceso,
        embedding_model_provider: upload.embedding_model_provider,
        embedding_model: upload.embedding_model,
        name: upload.documento || 'Sin nombre',
        fecha_ultima_actualizacion: upload.fecha_ultima_actualizacion,
        createdDate: formatDate(upload.fecha_inicio),
        fecha_extraccion: upload.fecha_extraccion,
        fecha_segmentacion: upload.fecha_segmentacion,
        fecha_vectorizacion: upload.fecha_vectorizacion,
        fecha_finalizado: upload.fecha_finalizado,
        status: getStatusFromStage(upload.id_estado_proceso, upload.estado_proceso),
        rawData: upload,
      }))
      .filter(doc =>
        doc.name && doc.name.toLowerCase().includes(searchTerm.toLowerCase())
      );
  }, [uploads, searchTerm]);

  // Sort documents with default and user-selected sorting
  const sortedDocuments = useMemo(() => {
    let sorted = [...processedDocuments];

    // Apply user-selected sorting first if any
    if (sortBy === 'status') {
      sorted.sort((a, b) => a.status.label.localeCompare(b.status.label));
    } else {
      // Default sorting: by created_at (most recent first), then by process_stage (lower first)
      sorted.sort((a, b) => {
        // Primary sort: created_at descending (most recent first)
        const dateA = new Date(a.rawData.fecha_inicio).getTime();
        const dateB = new Date(b.rawData.fecha_inicio).getTime();

        if (dateB !== dateA) {
          return dateB - dateA; // Most recent first
        }

        // Secondary sort: process_stage ascending (lower status first)
        return a.rawData.id_estado_proceso - b.rawData.id_estado_proceso;
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
        {isLoading && (
          <Loader text="Cargando documentos..." />
        )}

        {error && (
          <div className="flex-1 flex items-center justify-center">
            <p className="text-red-500">Error: {error.message}</p>
          </div>
        )}

        {!isLoading && !error && displayedDocuments.length === 0 && (
          <div className="flex-1 flex items-center justify-center">
            <p className="text-muted-foreground">No se encontraron documentos</p>
          </div>
        )}

        {!isLoading && !error && displayedDocuments.length > 0 && (
          <>
            <div ref={tableContainerRef} className="flex-1 min-h-0 border rounded-lg">
              <div className="h-full overflow-y-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-12"></TableHead>
                      <TableHead>Nombre</TableHead>
                      <TableHead>Usuario Carga</TableHead>
                      <TableHead>Modelo Embedding</TableHead>
                      <TableHead>Creado el</TableHead>
                      <TableHead>Extracción</TableHead>
                      <TableHead>Segmentación</TableHead>
                      <TableHead>Vectorización</TableHead>
                      <TableHead>Finalizado</TableHead>
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
                        <TableCell>{doc.usuario_carga}</TableCell>
                        <TableCell>{doc.embedding_model}</TableCell>
                        <TableCell>{doc.createdDate}</TableCell>
                        <TableCell>{doc.fecha_extraccion ? formatDate(doc.fecha_extraccion) : '-'}</TableCell>
                        <TableCell>{doc.fecha_segmentacion ? formatDate(doc.fecha_segmentacion) : '-'}</TableCell>
                        <TableCell>{doc.fecha_vectorizacion ? formatDate(doc.fecha_vectorizacion) : '-'}</TableCell>
                        <TableCell>{doc.fecha_finalizado ? formatDate(doc.fecha_finalizado) : '-'}</TableCell>
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

            <div className="flex flex-col items-center gap-2 flex-shrink-0">
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                  disabled={currentPage === 1}
                >
                  <ChevronLeft className="h-4 w-4" />
                  <span className="hidden md:inline">Anterior</span>
                </Button>

                <div className="hidden md:flex gap-1">
                  {(() => {
                    const maxButtons = 5;
                    const halfRange = Math.floor(maxButtons / 2);
                    let startPage = Math.max(1, currentPage - halfRange);
                    let endPage = Math.min(totalPages, startPage + maxButtons - 1);

                    if (endPage - startPage + 1 < maxButtons) {
                      startPage = Math.max(1, endPage - maxButtons + 1);
                    }

                    const pages = [];

                    if (startPage > 1) {
                      pages.push(1);
                      if (startPage > 2) {
                        pages.push('...');
                      }
                    }

                    for (let i = startPage; i <= endPage; i++) {
                      pages.push(i);
                    }

                    if (endPage < totalPages) {
                      if (endPage < totalPages - 1) {
                        pages.push('...');
                      }
                      pages.push(totalPages);
                    }

                    return pages.map((page, idx) => (
                      <Button
                        key={`${page}-${idx}`}
                        variant={currentPage === page ? 'default' : 'outline'}
                        size="sm"
                        onClick={() => typeof page === 'number' && setCurrentPage(page)}
                        disabled={page === '...'}
                      >
                        {page}
                      </Button>
                    ));
                  })()}
                </div>

                <div className="flex md:hidden gap-1">
                  {(() => {
                    const maxButtons = 4;
                    const halfRange = Math.floor(maxButtons / 2);
                    let startPage = Math.max(1, currentPage - halfRange);
                    let endPage = Math.min(totalPages, startPage + maxButtons - 1);

                    if (endPage - startPage + 1 < maxButtons) {
                      startPage = Math.max(1, endPage - maxButtons + 1);
                    }

                    const pages = [];
                    for (let i = startPage; i <= endPage; i++) {
                      pages.push(i);
                    }

                    return pages.map((page) => (
                      <Button
                        key={page}
                        variant={currentPage === page ? 'default' : 'outline'}
                        size="sm"
                        onClick={() => setCurrentPage(page)}
                      >
                        {page}
                      </Button>
                    ));
                  })()}
                </div>

                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
                  disabled={currentPage === totalPages}
                >
                  <span className="hidden md:inline">Siguiente</span>
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

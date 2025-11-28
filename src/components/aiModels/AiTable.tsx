import { useState, useMemo, useRef, useEffect } from 'react';
import { ChevronLeft, ChevronRight, Cpu } from 'lucide-react';
import { Card, CardContent, CardHeader } from '@/components/shadcn/card';
import { Button } from '@/components/shadcn/button';
import { Badge } from '@/components/shadcn/badge';
import { Checkbox } from '@/components/shadcn/checkbox';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/shadcn/table';
import { Loader } from '@/components/loader/Loader';
import { useGetModels } from '@/hooks/useIAModelsQueries';

// Get parameter label and value based on model type
const getExtraParameterLabel = (tipo: string): string => {
  if (tipo.includes('Embeddings')) {
    return 'Vector Size';
  } else if (tipo.includes('Text') || tipo.includes('Vision')) {
    return 'Max Tokens';
  }
  return 'Parameter';
};

interface AiTableProps {
  searchTerm: string;
  sortBy: 'nombre' | 'proveedor' | 'tipo' | null;
}

export const AiTable = ({ searchTerm, sortBy }: AiTableProps) => {
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(5);
  const tableContainerRef = useRef<HTMLDivElement>(null);

  const { data, isLoading, error } = useGetModels();


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

    const timer = setTimeout(calculateItemsPerPage);
    window.addEventListener('resize', calculateItemsPerPage);
    return () => {
      clearTimeout(timer);
      window.removeEventListener('resize', calculateItemsPerPage);
    };
  }, [data]);

  // Reset to first page when search term or sort changes
  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, sortBy]);

  const processedModels = useMemo(() => {
    if (!data?.models) return [];

    return data.models
      .filter(model =>
        model.NOMBRE.toLowerCase().includes(searchTerm.toLowerCase())
      );
  }, [data?.models, searchTerm]);

  // Sort models
  const sortedModels = useMemo(() => {
    let sorted = [...processedModels];

    if (sortBy === 'nombre') {
      sorted.sort((a, b) => a.NOMBRE.localeCompare(b.NOMBRE));
    } else if (sortBy === 'proveedor') {
      sorted.sort((a, b) => a.PROVEEDOR.localeCompare(b.PROVEEDOR));
    } else if (sortBy === 'tipo') {
      sorted.sort((a, b) => a.TIPO.localeCompare(b.TIPO));
    }

    return sorted;
  }, [processedModels, sortBy]);

  const totalPages = Math.ceil(sortedModels.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const displayedModels = sortedModels.slice(startIndex, startIndex + itemsPerPage);

  return (
    <Card className="flex-1 flex flex-col min-h-0">
      <CardHeader className="pb-3">
        <div className="flex flex-col items-start gap-1">
          <h1 className="text-2xl font-bold text-foreground">Modelos IA</h1>
          <p className="text-xs text-muted-foreground">
            Lista de modelos de IA disponibles.
          </p>
        </div>
      </CardHeader>

      <CardContent className="flex-1 flex flex-col min-h-0 overflow-hidden gap-4 relative">
        {/* Loading State */}
        {isLoading && (
          <Loader text="Cargando modelos..." />
        )}

        {/* Error State */}
        {error && (
          <div className="flex-1 flex items-center justify-center">
            <p className="text-red-500">Error: {error.message}</p>
          </div>
        )}

        {/* Empty State */}
        {!isLoading && !error && displayedModels.length === 0 && (
          <div className="flex-1 flex items-center justify-center">
            <p className="text-muted-foreground">No se encontraron modelos</p>
          </div>
        )}

        {/* Table */}
        {!isLoading && !error && displayedModels.length > 0 && (
          <>
            <div ref={tableContainerRef} className="flex-1 min-h-0 border rounded-lg">
              <div className="h-full overflow-y-auto">
                <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-12"></TableHead>
                    <TableHead>Nombre</TableHead>
                    <TableHead>Identificador</TableHead>
                    <TableHead>Proveedor</TableHead>
                    <TableHead>Tipo</TableHead>
                    <TableHead>Parámetro</TableHead>
                    <TableHead>Estado</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {displayedModels.map((model) => (
                    <TableRow key={model.ID_MODELO}>
                      <TableCell>
                        <Checkbox />
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Cpu className="h-4 w-4 text-blue-500" />
                          <span>{model.NOMBRE}</span>
                        </div>
                      </TableCell>
                      <TableCell className="text-sm font-mono">{model.IDENTIFICADOR}</TableCell>
                      <TableCell>{model.PROVEEDOR}</TableCell>
                      <TableCell>{model.TIPO}</TableCell>
                      <TableCell>
                        <span className="text-muted-foreground">{getExtraParameterLabel(model.TIPO)}:</span>
                        <span className="ml-1 font-medium">{model.EXTRA.toLocaleString()}</span>
                      </TableCell>
                      <TableCell>
                        <Badge variant={model.ID_ESTADO_REGISTRO === 1 ? 'success' : 'destructive'}>
                          {model.ID_ESTADO_REGISTRO === 1 ? 'Activo' : 'Inactivo'}
                        </Badge>
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
                Mostrando {startIndex + 1}-{Math.min(startIndex + itemsPerPage, sortedModels.length)} de {sortedModels.length} modelos
              </p>
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
};
import { useState, useMemo, useRef, useEffect } from 'react';
import { ChevronLeft, ChevronRight, FolderOpen } from 'lucide-react';
import { Card, CardContent, CardHeader } from '@/components/shadcn/card';
import { Button } from '@/components/shadcn/button';
import { Badge } from '@/components/shadcn/badge';
import { Checkbox } from '@/components/shadcn/checkbox';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/shadcn/table';
import { Loader } from '@/components/loader/Loader';
import { useGetAreas } from '@/hooks/useAreaQueries';
import { useQueryAuthContext } from '@/contexts/QueryAuthContext';
import { AreaRowActions } from './AreaRowActions';

// Format date to readable format
const formatDate = (isoDate: string): string => {
  const date = new Date(isoDate);
  return date.toLocaleDateString('es-ES', {
    day: '2-digit',
    month: 'short',
    year: 'numeric'
  });
};

interface AreaTableProps {
  searchTerm: string;
  sortBy: 'area' | 'fecha_creacion' | null;
}

export const AreaTable = ({ searchTerm, sortBy }: AreaTableProps) => {
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(5);
  const tableContainerRef = useRef<HTMLDivElement>(null);

  const { user } = useQueryAuthContext();
  const id_empresa = (user as any)?.actual_company_area?.ID_EMPRESA;

  const { data, isLoading, error } = useGetAreas(id_empresa || 0);

  const handleEditArea = (areaId: number) => {
    console.log(`Edit area: ${areaId}`);
    // TODO: Implement edit functionality
  };

  const handleDeleteArea = (areaId: number) => {
    console.log(`Delete area: ${areaId}`);
    // TODO: Implement delete functionality
  };

  const handleReactivateArea = (areaId: number) => {
    console.log(`Reactivate area: ${areaId}`);
    // TODO: Implement reactivate functionality
  };

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

  const processedAreas = useMemo(() => {
    if (!data?.areas) return [];

    return data.areas
      .filter(area =>
        area.AREA.toLowerCase().includes(searchTerm.toLowerCase())
      );
  }, [data?.areas, searchTerm]);

  // Sort areas
  const sortedAreas = useMemo(() => {
    let sorted = [...processedAreas];

    if (sortBy === 'area') {
      sorted.sort((a, b) => a.AREA.localeCompare(b.AREA));
    } else if (sortBy === 'fecha_creacion') {
      sorted.sort((a, b) => {
        const dateA = new Date(a.FCHCRE).getTime();
        const dateB = new Date(b.FCHCRE).getTime();
        return dateB - dateA;
      });
    } else {
      // Default sorting: by created date (most recent first)
      sorted.sort((a, b) => {
        const dateA = new Date(a.FCHCRE).getTime();
        const dateB = new Date(b.FCHCRE).getTime();
        return dateB - dateA;
      });
    }

    return sorted;
  }, [processedAreas, sortBy]);

  const totalPages = Math.ceil(sortedAreas.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const displayedAreas = sortedAreas.slice(startIndex, startIndex + itemsPerPage);

  return (
    <Card className="flex-1 flex flex-col min-h-0">
      <CardHeader className="pb-3">
        <div className="flex flex-col items-start gap-1">
          <h1 className="text-2xl font-bold text-foreground">Áreas</h1>
          <p className="text-xs text-muted-foreground">
            Gestiona las áreas disponibles.
          </p>
        </div>
      </CardHeader>

      <CardContent className="flex-1 flex flex-col min-h-0 overflow-hidden gap-4 relative">
        {/* Loading State */}
        {isLoading && (
          <Loader text="Cargando áreas..." />
        )}

        {/* Error State */}
        {error && (
          <div className="flex-1 flex items-center justify-center">
            <p className="text-red-500">Error: {error.message}</p>
          </div>
        )}

        {/* Empty State */}
        {!isLoading && !error && displayedAreas.length === 0 && (
          <div className="flex-1 flex items-center justify-center">
            <p className="text-muted-foreground">No se encontraron áreas</p>
          </div>
        )}

        {/* Table */}
        {!isLoading && !error && displayedAreas.length > 0 && (
          <>
            <div ref={tableContainerRef} className="flex-1 min-h-0 border rounded-lg">
              <div className="h-full overflow-y-auto">
                <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-12"></TableHead>
                    <TableHead>Área</TableHead>
                    <TableHead>ID Área</TableHead>
                    <TableHead>Fecha de Creación</TableHead>
                    <TableHead>Estado</TableHead>
                    <TableHead className="w-12"></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {displayedAreas.map((area) => (
                    <TableRow key={area.ID_AREA}>
                      <TableCell>
                        <Checkbox />
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <FolderOpen className="h-4 w-4 text-amber-500" />
                          <span>{area.AREA}</span>
                        </div>
                      </TableCell>
                      <TableCell>{area.ID_AREA}</TableCell>
                      <TableCell>{formatDate(area.FCHCRE)}</TableCell>
                      <TableCell>
                        <Badge variant={area.ID_ESTADO_REGISTRO === 1 ? 'success' : 'destructive'}>
                          {area.ID_ESTADO_REGISTRO === 1 ? 'Activo' : 'Inactivo'}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <AreaRowActions
                          areaId={area.ID_AREA}
                          areaName={area.AREA}
                          status={area.ID_ESTADO_REGISTRO}
                          onEdit={handleEditArea}
                          onDelete={handleDeleteArea}
                          onReactivate={handleReactivateArea}
                        />
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
                Mostrando {startIndex + 1}-{Math.min(startIndex + itemsPerPage, sortedAreas.length)} de {sortedAreas.length} áreas
              </p>
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
};
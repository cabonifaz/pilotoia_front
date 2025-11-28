import { useState, useMemo, useRef, useEffect } from 'react';
import { ChevronLeft, ChevronRight, FolderOpen, Check, X } from 'lucide-react';
import { Card, CardContent, CardHeader } from '@/components/shadcn/card';
import { Button } from '@/components/shadcn/button';
import { Badge } from '@/components/shadcn/badge';
import { Checkbox } from '@/components/shadcn/checkbox';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/shadcn/table';
import { Loader } from '@/components/loader/Loader';
import { useGetAreas, useUpdateAreaStatus, useUpdateAreaName } from '@/hooks/useAreaQueries';
import { useQueryAuthContext } from '@/contexts/QueryAuthContext';
import { AreaRowActions } from '@/components/area';
import { Input } from '@/components/shadcn/input';

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
  onConfigureAi?: (areaId: number, idEmpresa: number) => void;
}

export const AreaTable = ({ searchTerm, sortBy, onConfigureAi }: AreaTableProps) => {
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(5);
  const [editingAreaId, setEditingAreaId] = useState<number | null>(null);
  const [editingAreaName, setEditingAreaName] = useState<string>('');
  const [originalAreaName, setOriginalAreaName] = useState<string>('');
  const tableContainerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const { user } = useQueryAuthContext();
  const id_empresa = (user as any)?.actual_company_area?.ID_EMPRESA;

  const { data, isLoading, error } = useGetAreas(id_empresa);
  const updateAreaStatus = useUpdateAreaStatus(id_empresa);
  const updateAreaName = useUpdateAreaName(id_empresa);

  const handleEditArea = (areaId: number, currentName: string) => {
    setEditingAreaId(areaId);
    setEditingAreaName(currentName);
    setOriginalAreaName(currentName);
  };

  const handleDeleteArea = (areaId: number) => {
    updateAreaStatus.mutate({
      id_empresa,
      id_area: areaId,
      status: 0
    });
  };

  const handleReactivateArea = (areaId: number) => {
    updateAreaStatus.mutate({
      id_empresa,
      id_area: areaId,
      status: 1
    });
  };

  const handleSaveAreaName = async () => {
    if (!editingAreaId || editingAreaName.trim() === '') {
      setEditingAreaId(null);
      return;
    }

    if (editingAreaName.trim() === originalAreaName) {
      setEditingAreaId(null);
      return;
    }

    try {
      const result = await updateAreaName.mutateAsync({
        id_empresa,
        id_area: editingAreaId,
        area: editingAreaName.trim()
      });

      // Check if the stored procedure returned an error (ID_TIPO_MENSAJE = 1)
      if (result.results?.[0]?.ID_TIPO_MENSAJE === 1) {
        // Revert the change
        setEditingAreaName(originalAreaName);
      }

      // Clear editing state
      setEditingAreaId(null);
      setEditingAreaName('');
      setOriginalAreaName('');
    } catch (error) {
      // On error, revert the change
      setEditingAreaName(originalAreaName);
      setEditingAreaId(null);
    }
  };

  const handleCancelEdit = () => {
    setEditingAreaName(originalAreaName);
    setEditingAreaId(null);
    setOriginalAreaName('');
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleSaveAreaName();
    } else if (e.key === 'Escape') {
      handleCancelEdit();
    }
  };

  // Focus input when editing starts
  useEffect(() => {
    if (editingAreaId !== null && inputRef.current) {
      inputRef.current.focus();
      inputRef.current.select();
    }
  }, [editingAreaId]);

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
                        {editingAreaId === area.ID_AREA ? (
                          <div className="flex items-center gap-2">
                            <FolderOpen className="h-4 w-4 text-amber-500 flex-shrink-0" />
                            <Input
                              ref={inputRef}
                              value={editingAreaName}
                              onChange={(e) => setEditingAreaName(e.target.value)}
                              onKeyDown={handleKeyDown}
                              onBlur={handleSaveAreaName}
                              className="h-8 text-sm"
                              disabled={updateAreaName.isPending}
                            />
                            <div className="flex items-center gap-1">
                              <Button
                                size="sm"
                                variant="ghost"
                                className="h-6 w-6 p-0"
                                onClick={handleSaveAreaName}
                                disabled={updateAreaName.isPending}
                              >
                                <Check className="h-4 w-4 text-green-600" />
                              </Button>
                              <Button
                                size="sm"
                                variant="ghost"
                                className="h-6 w-6 p-0"
                                onClick={handleCancelEdit}
                                disabled={updateAreaName.isPending}
                              >
                                <X className="h-4 w-4 text-red-600" />
                              </Button>
                            </div>
                          </div>
                        ) : (
                          <div className="flex items-center gap-2">
                            <FolderOpen className="h-4 w-4 text-amber-500" />
                            <span>{area.AREA}</span>
                          </div>
                        )}
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
                          onEdit={() => handleEditArea(area.ID_AREA, area.AREA)}
                          onDelete={handleDeleteArea}
                          onReactivate={handleReactivateArea}
                          onConfigureAi={onConfigureAi ? () => onConfigureAi(area.ID_AREA, id_empresa) : undefined}
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
                Mostrando {startIndex + 1}-{Math.min(startIndex + itemsPerPage, sortedAreas.length)} de {sortedAreas.length} áreas
              </p>
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
};
import { useState, useMemo, useRef, useEffect } from 'react';
import { ChevronLeft, ChevronRight, Phone } from 'lucide-react';
import { Card, CardContent, CardHeader } from '@/components/shadcn/card';
import { Button } from '@/components/shadcn/button';
import { Badge } from '@/components/shadcn/badge';
import { Checkbox } from '@/components/shadcn/checkbox';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/shadcn/table';
import { Loader } from '@/components/loader/Loader';
import { useGetAgentes } from '@/hooks/useAgentsQueries';
import { useQueryAuthContext } from '@/contexts/QueryAuthContext';
import type { Agente } from '@/types/agents';

interface AgentsTableProps {
  searchTerm: string;
  sortBy: 'telefono' | 'tipo' | 'area' | 'estado' | null;
  onEditAgent?: (agent: Agente) => void;
  onChangeStatus?: (agent: Agente) => void;
  onChangeAccess?: (agent: Agente, agentAreas: string[]) => void;
}

export const AgentsTable = ({ searchTerm, sortBy }: AgentsTableProps) => {
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(5);
  const tableContainerRef = useRef<HTMLDivElement>(null);

  const { user } = useQueryAuthContext();
  const id_empresa = (user as any)?.actual_company_area?.ID_EMPRESA;

  const { data, isLoading, error } = useGetAgentes(id_empresa);

  // Calculate items per page based on available height
  useEffect(() => {
    const calculateItemsPerPage = () => {
      if (tableContainerRef.current) {
        const containerHeight = tableContainerRef.current.clientHeight;
        const rowHeight = 45; // Approximate height of a table row in pixels
        const headerHeight = 45; // Approximate height of table header
        const availableHeight = containerHeight - headerHeight;
        const calculatedItems = Math.floor(availableHeight / rowHeight);
        // Be conservative - calculate for items that will definitely fit
        setItemsPerPage(Math.max(3, Math.ceil(calculatedItems * 0.9)));
      }
    };

    const timer = setTimeout(calculateItemsPerPage, 100);
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

  const processedAgentes = useMemo(() => {
    if (!data?.agentes) return [];

    return data.agentes
      .filter(agente =>
        (agente.NUMERO_TELF || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
        agente.AREA.toLowerCase().includes(searchTerm.toLowerCase())
      );
  }, [data?.agentes, searchTerm]);

  // Group agentes by ID_AGENTE
  const groupedAgentes = useMemo(() => {
    const grouped = new Map<number, typeof processedAgentes>();

    processedAgentes.forEach(agente => {
      if (!grouped.has(agente.ID_AGENTE)) {
        grouped.set(agente.ID_AGENTE, []);
      }
      grouped.get(agente.ID_AGENTE)!.push(agente);
    });

    return Array.from(grouped.values());
  }, [processedAgentes]);

  // Sort grouped agentes
  const sortedAgentes = useMemo(() => {
    let sorted = [...groupedAgentes];

    if (sortBy === 'telefono') {
      sorted.sort((a, b) => (a[0].NUMERO_TELF || '').localeCompare(b[0].NUMERO_TELF || ''));
    } else if (sortBy === 'tipo') {
      sorted.sort((a, b) => a[0].ID_TIPO_AGENTE - b[0].ID_TIPO_AGENTE);
    } else if (sortBy === 'area') {
      sorted.sort((a, b) => a[0].AREA.localeCompare(b[0].AREA));
    } else if (sortBy === 'estado') {
      sorted.sort((a, b) => a[0].ESTADO_OPERATIVO - b[0].ESTADO_OPERATIVO);
    } else {
      // Default sorting: by phone number
      sorted.sort((a, b) => (a[0].NUMERO_TELF || '').localeCompare(b[0].NUMERO_TELF || ''));
    }

    return sorted;
  }, [groupedAgentes, sortBy]);

  const totalPages = Math.ceil(sortedAgentes.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const displayedAgentes = sortedAgentes.slice(startIndex, startIndex + itemsPerPage);

  return (
    <Card className="flex-1 flex flex-col min-h-0">
      <CardHeader className="pb-3">
        <div className="flex flex-col items-start gap-1">
          <h1 className="text-2xl font-bold text-foreground">Agentes</h1>
          <p className="text-xs text-muted-foreground">
            Gestiona los agentes de la empresa.
          </p>
        </div>
      </CardHeader>

      <CardContent className="flex-1 flex flex-col min-h-0 overflow-hidden gap-4 relative">
        {/* Loading State */}
        {isLoading && (
          <Loader text="Cargando agentes..." />
        )}

        {/* Error State */}
        {error && (
          <div className="flex-1 flex items-center justify-center">
            <p className="text-red-500">Error: {error.message}</p>
          </div>
        )}

        {/* Empty State */}
        {!isLoading && !error && displayedAgentes.length === 0 && (
          <div className="flex-1 flex items-center justify-center">
            <p className="text-muted-foreground">No se encontraron agentes</p>
          </div>
        )}

        {/* Table */}
        {!isLoading && !error && displayedAgentes.length > 0 && (
          <>
            <div ref={tableContainerRef} className="flex-1 min-h-0 border rounded-lg">
              <div className="h-full overflow-y-auto">
                <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-12"></TableHead>
                    <TableHead>Teléfono</TableHead>
                    <TableHead>Tipo de Agente</TableHead>
                    <TableHead>Áreas con Acceso</TableHead>
                    <TableHead>Acceso General</TableHead>
                    <TableHead>Estado Operativo</TableHead>
                    <TableHead>Estado</TableHead>
                    <TableHead className="w-12"></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {displayedAgentes.map((agenteGroup) => (
                    <TableRow key={agenteGroup[0].ID_AGENTE}>
                      <TableCell>
                        <Checkbox />
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Phone className="h-4 w-4 text-blue-500" />
                          <span>{agenteGroup[0].NUMERO_TELF || 'N/A'}</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant={agenteGroup[0].ID_TIPO_AGENTE === 1 ? 'success' : 'default'}>
                          {agenteGroup[0].ID_TIPO_AGENTE === 1 ? 'WhatsApp' : `Tipo ${agenteGroup[0].ID_TIPO_AGENTE}`}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex flex-col gap-1">
                          {agenteGroup.map((agente) => (
                            <span key={agente.ID_AGENTE_EMPR_AREA}>
                              {['Default', 'General'].includes(agente.AREA) ? <strong>Todas</strong> : agente.AREA}
                            </span>
                          ))}
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant={agenteGroup[0].ACCESO_GENERAL === 1 ? 'success' : 'outline'}>
                          {agenteGroup[0].ACCESO_GENERAL === 1 ? 'Sí' : 'No'}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Badge variant={agenteGroup[0].ESTADO_OPERATIVO === 1 ? 'success' : 'destructive'}>
                          {agenteGroup[0].ESTADO_OPERATIVO === 1 ? 'Operativo' : 'Inoperativo'}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Badge variant={agenteGroup[0].ID_ESTADO_REGISTRO === 1 ? 'success' : 'destructive'}>
                          {agenteGroup[0].ID_ESTADO_REGISTRO === 1 ? 'Activo' : 'Inactivo'}
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
                Mostrando {startIndex + 1}-{Math.min(startIndex + itemsPerPage, sortedAgentes.length)} de {sortedAgentes.length} agentes
              </p>
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
};
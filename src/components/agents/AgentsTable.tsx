import { useState, useEffect } from 'react';
import { ChevronLeft, ChevronRight, Phone, Filter } from 'lucide-react';
import { Card, CardContent, CardHeader } from '@/components/shadcn/card';
import { Button } from '@/components/shadcn/button';
import { Badge } from '@/components/shadcn/badge';
import { Checkbox } from '@/components/shadcn/checkbox';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/shadcn/table';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/shadcn/dropdown-menu';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/shadcn/select';
import { Loader } from '@/components/loader/Loader';
import { useGetAgentesPaginated } from '@/hooks/useAgentsQueries';
import { useQueryAuthContext } from '@/contexts/QueryAuthContext';

interface AgentsTableProps {
  searchTerm: string;
}

export const AgentsTable = ({ searchTerm }: AgentsTableProps) => {
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [orderField, setOrderField] = useState<'NUMERO_TELF' | 'ID_TIPO_AGENTE' | 'ACCESO_GENERAL' | 'ESTADO_OPERATIVO' | 'AREA' | 'ID_ESTADO_REGISTRO'>('NUMERO_TELF');
  const [orderDirection, setOrderDirection] = useState<'ASC' | 'DESC'>('ASC');
  const [statusFilter, setStatusFilter] = useState<number | null>(null);
  const [operativeFilter, setOperativeFilter] = useState<number | null>(null);

  const { user } = useQueryAuthContext();
  const id_empresa = (user as any)?.actual_company_area?.ID_EMPRESA;

  // Server-side pagination query
  const { data, isLoading, error } = useGetAgentesPaginated(
    id_empresa || 0,
    currentPage,
    pageSize,
    searchTerm,
    orderField,
    orderDirection,
    statusFilter,
    operativeFilter
  );

  // Reset to first page when search term or filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, statusFilter, operativeFilter]);

  // Handle column sort
  const handleSort = (field: 'NUMERO_TELF' | 'ID_TIPO_AGENTE' | 'ACCESO_GENERAL' | 'ESTADO_OPERATIVO' | 'AREA' | 'ID_ESTADO_REGISTRO') => {
    if (orderField === field) {
      // Toggle direction if same field
      setOrderDirection(orderDirection === 'ASC' ? 'DESC' : 'ASC');
    } else {
      // New field, set to ASC
      setOrderField(field);
      setOrderDirection('ASC');
    }
    setCurrentPage(1);
  };

  // Handle page size change
  const handlePageSizeChange = (value: string) => {
    setPageSize(Number(value));
    setCurrentPage(1);
  };

  const agentes = data?.data || [];
  const totalPages = data?.pagination?.total_pages || 0;
  const totalRecords = data?.pagination?.total_records || 0;

  // Group agentes by ID_AGENTE (same agent can have multiple areas)
  const groupedAgentes = agentes.reduce((acc, agente) => {
    const existing = acc.find(group => group[0].ID_AGENTE === agente.ID_AGENTE);
    if (existing) {
      existing.push(agente);
    } else {
      acc.push([agente]);
    }
    return acc;
  }, [] as typeof agentes[]);

  if (!id_empresa) {
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
        <CardContent className="flex-1 flex items-center justify-center">
          <p className="text-muted-foreground">No se pudo cargar la información de la empresa</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="flex-1 flex flex-col min-h-0">
      <CardHeader className="pb-3">
        <div className="flex justify-between items-start">
          <div className="flex flex-col items-start gap-1">
            <h1 className="text-2xl font-bold text-foreground">Agentes</h1>
            <p className="text-xs text-muted-foreground">
              Gestiona los agentes de la empresa.
            </p>
          </div>

          {/* Page size selector - Top right */}
          {!isLoading && !error && groupedAgentes.length > 0 && (
            <div className="flex items-center gap-2">
              <span className="text-sm text-muted-foreground">Filas por página:</span>
              <Select value={pageSize.toString()} onValueChange={handlePageSizeChange}>
                <SelectTrigger className="w-[80px]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="10">10</SelectItem>
                  <SelectItem value="15">15</SelectItem>
                  <SelectItem value="25">25</SelectItem>
                </SelectContent>
              </Select>
            </div>
          )}
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

        {/* Table - Always show when not loading/error */}
        {!isLoading && !error && (
          <>
            <div className="flex-1 min-h-0 border rounded-lg">
              <div className="h-full overflow-y-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-12"></TableHead>
                      <TableHead>
                        <button
                          onClick={() => handleSort('NUMERO_TELF')}
                          className="flex items-center gap-1 hover:text-foreground"
                        >
                          Teléfono
                          {orderField === 'NUMERO_TELF' && (
                            <span>{orderDirection === 'ASC' ? '↑' : '↓'}</span>
                          )}
                        </button>
                      </TableHead>
                      <TableHead>
                        <button
                          onClick={() => handleSort('ID_TIPO_AGENTE')}
                          className="flex items-center gap-1 hover:text-foreground"
                        >
                          Tipo de Agente
                          {orderField === 'ID_TIPO_AGENTE' && (
                            <span>{orderDirection === 'ASC' ? '↑' : '↓'}</span>
                          )}
                        </button>
                      </TableHead>
                      <TableHead>
                        <button
                          onClick={() => handleSort('AREA')}
                          className="flex items-center gap-1 hover:text-foreground"
                        >
                          Áreas con Acceso
                          {orderField === 'AREA' && (
                            <span>{orderDirection === 'ASC' ? '↑' : '↓'}</span>
                          )}
                        </button>
                      </TableHead>
                      <TableHead>
                        <button
                          onClick={() => handleSort('ACCESO_GENERAL')}
                          className="flex items-center gap-1 hover:text-foreground"
                        >
                          Acceso General
                          {orderField === 'ACCESO_GENERAL' && (
                            <span>{orderDirection === 'ASC' ? '↑' : '↓'}</span>
                          )}
                        </button>
                      </TableHead>
                      <TableHead>
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => handleSort('ESTADO_OPERATIVO')}
                            className="flex items-center gap-1 hover:text-foreground"
                          >
                            Estado Operativo
                            {orderField === 'ESTADO_OPERATIVO' && (
                              <span>{orderDirection === 'ASC' ? '↑' : '↓'}</span>
                            )}
                          </button>
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button
                                variant="ghost"
                                size="sm"
                                className={`h-6 w-6 p-0 ${operativeFilter !== null ? 'text-blue-600' : ''}`}
                              >
                                <Filter className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="start">
                              <DropdownMenuItem
                                onClick={() => {
                                  setOperativeFilter(null);
                                  setCurrentPage(1);
                                }}
                                className={operativeFilter === null ? 'bg-accent' : ''}
                              >
                                Todos
                              </DropdownMenuItem>
                              <DropdownMenuItem
                                onClick={() => {
                                  setOperativeFilter(1);
                                  setCurrentPage(1);
                                }}
                                className={operativeFilter === 1 ? 'bg-accent' : ''}
                              >
                                Operativo
                              </DropdownMenuItem>
                              <DropdownMenuItem
                                onClick={() => {
                                  setOperativeFilter(0);
                                  setCurrentPage(1);
                                }}
                                className={operativeFilter === 0 ? 'bg-accent' : ''}
                              >
                                Inoperativo
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </div>
                      </TableHead>
                      <TableHead>
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => handleSort('ID_ESTADO_REGISTRO')}
                            className="flex items-center gap-1 hover:text-foreground"
                          >
                            Estado
                            {orderField === 'ID_ESTADO_REGISTRO' && (
                              <span>{orderDirection === 'ASC' ? '↑' : '↓'}</span>
                            )}
                          </button>
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button
                                variant="ghost"
                                size="sm"
                                className={`h-6 w-6 p-0 ${statusFilter !== null ? 'text-blue-600' : ''}`}
                              >
                                <Filter className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="start">
                              <DropdownMenuItem
                                onClick={() => {
                                  setStatusFilter(null);
                                  setCurrentPage(1);
                                }}
                                className={statusFilter === null ? 'bg-accent' : ''}
                              >
                                Todos
                              </DropdownMenuItem>
                              <DropdownMenuItem
                                onClick={() => {
                                  setStatusFilter(1);
                                  setCurrentPage(1);
                                }}
                                className={statusFilter === 1 ? 'bg-accent' : ''}
                              >
                                Activo
                              </DropdownMenuItem>
                              <DropdownMenuItem
                                onClick={() => {
                                  setStatusFilter(0);
                                  setCurrentPage(1);
                                }}
                                className={statusFilter === 0 ? 'bg-accent' : ''}
                              >
                                Inactivo
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </div>
                      </TableHead>
                      <TableHead className="w-12"></TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {groupedAgentes.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={8} className="h-24 text-center">
                          <p className="text-muted-foreground">
                            {statusFilter === 1 && operativeFilter === 1
                              ? 'No se encontraron agentes activos y operativos'
                              : statusFilter === 0 && operativeFilter === 0
                                ? 'No se encontraron agentes inactivos e inoperativos'
                                : statusFilter === 1
                                  ? 'No se encontraron agentes activos'
                                  : statusFilter === 0
                                    ? 'No se encontraron agentes inactivos'
                                    : operativeFilter === 1
                                      ? 'No se encontraron agentes operativos'
                                      : operativeFilter === 0
                                        ? 'No se encontraron agentes inoperativos'
                                        : searchTerm
                                          ? `No se encontraron agentes que coincidan con "${searchTerm}"`
                                          : 'No hay agentes registrados'}
                          </p>
                        </TableCell>
                      </TableRow>
                    ) : (
                      groupedAgentes.map((agenteGroup) => (
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
                              {agenteGroup[0].ACCESO_GENERAL === 1 ? (
                                <strong>Todas</strong>
                              ) : (
                                agenteGroup.map((agente) => (
                                  <span key={agente.ID_AGENTE_EMPR_AREA}>
                                    {agente.AREA}
                                  </span>
                                ))
                              )}
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
                          <TableCell>
                            {/* Add actions here if needed */}
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </div>
            </div>

            {/* Pagination - Only show when there's data */}
            {groupedAgentes.length > 0 && (
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
                  Mostrando {(currentPage - 1) * pageSize + 1}-{Math.min(currentPage * pageSize, totalRecords)} de {totalRecords} agentes
                </p>
              </div>
            )}
          </>
        )}
      </CardContent>
    </Card>
  );
};
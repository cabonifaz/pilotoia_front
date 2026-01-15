import { useState, useRef, useEffect } from 'react';
import { ChevronLeft, ChevronRight, Building2 } from 'lucide-react';
import { Card, CardContent, CardHeader } from '@/components/shadcn/card';
import { Button } from '@/components/shadcn/button';
import { Badge } from '@/components/shadcn/badge';
import { Checkbox } from '@/components/shadcn/checkbox';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/shadcn/table';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/shadcn/select';
import { Loader } from '@/components/loader/Loader';
import { useGetCompaniesPaginated, useUpdateCompanyStatus } from '@/hooks/useCompanyQueries';
import { CompanyRowActions } from '@/components/company';
import { toast } from '@/hooks/use-toast';

// Format date to readable format
const formatDate = (isoDate: string): string => {
  const date = new Date(isoDate);
  return date.toLocaleDateString('es-ES', {
    day: '2-digit',
    month: 'short',
    year: 'numeric'
  });
};

interface CompanyTableProps {
  searchTerm: string;
  sortBy: 'ruc' | 'razon_social' | null;
  onUpdateLogo: (companyId: number) => void;
}

export const CompanyTable = ({ searchTerm, onUpdateLogo }: CompanyTableProps) => {
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [orderField, setOrderField] = useState<'ID_EMPRESA' | 'RUC' | 'RAZON_SOCIAL' | 'FCHCRE' | 'FCHMOD' | 'ID_ESTADO_REGISTRO'>('RAZON_SOCIAL');
  const [orderDirection, setOrderDirection] = useState<'ASC' | 'DESC'>('ASC');
  const tableContainerRef = useRef<HTMLDivElement>(null);

  // Usar hook de paginación del servidor
  const { data, isLoading, error } = useGetCompaniesPaginated(
    currentPage,
    pageSize,
    searchTerm,
    orderField,
    orderDirection
  );

  const updateCompanyStatus = useUpdateCompanyStatus();

  const handleDeleteCompany = (companyId: number) => {
    updateCompanyStatus.mutate({
      id_empresa: companyId,
      status: 0
    });
  };

  const handleReactivateCompany = (companyId: number) => {
    updateCompanyStatus.mutate({
      id_empresa: companyId,
      status: 1
    });
  };

  const handleGenerateURL = (secretKey: string) => {
    const url = `${window.location.origin}/#/?ref=${secretKey}`;

    navigator.clipboard.writeText(url)
      .then(() => {
        toast({
          title: "URL copiada",
          description: "La URL de la empresa fue copiada al portapapeles.",
          variant: "success",
        });
      })
      .catch((err) => {
        toast({
          title: "Error",
          description: "Hubo un problema al copiar la URL.",
          variant: "warning",
        });
        console.error('Error al copiar la URL:', err);
      });
  };

  // Reset to first page when search term changes
  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm]);

  // Reset to first page when page size changes
  const handlePageSizeChange = (value: string) => {
    setPageSize(Number(value));
    setCurrentPage(1);
  };

  // Handle column sort
  const handleSort = (field: 'ID_EMPRESA' | 'RUC' | 'RAZON_SOCIAL' | 'FCHCRE') => {
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

  const companies = data?.data || [];
  const pagination = data?.pagination || {
    total_records: 0,
    current_page: 1,
    page_size: 10,
    total_pages: 0
  };

  const totalPages = pagination.total_pages;
  const startIndex = (pagination.current_page - 1) * pagination.page_size + 1;
  const endIndex = Math.min(
    pagination.current_page * pagination.page_size,
    pagination.total_records
  );

  return (
    <Card className="flex-1 flex flex-col min-h-0">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          {/* Título a la izquierda */}
          <div className="flex flex-col items-start gap-1">
            <h1 className="text-2xl font-bold text-foreground">Empresas</h1>
            <p className="text-xs text-muted-foreground">
              Gestiona las empresas disponibles.
            </p>
          </div>

          {/* Selector */}
          {!isLoading && !error && companies.length > 0 && (
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
          <Loader text="Cargando empresas..." />
        )}

        {/* Error State */}
        {error && (
          <div className="flex-1 flex items-center justify-center">
            <p className="text-red-500">Error: {error.message}</p>
          </div>
        )}

        {/* Empty State */}
        {!isLoading && !error && companies.length === 0 && (
          <div className="flex-1 flex items-center justify-center">
            <p className="text-muted-foreground">No se encontraron empresas</p>
          </div>
        )}

        {/* Table */}
        {!isLoading && !error && companies.length > 0 && (
          <>
            <div ref={tableContainerRef} className="flex-1 min-h-0 border rounded-lg">
              <div className="h-full overflow-y-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-12"></TableHead>
                      <TableHead>
                        <button 
                          onClick={() => handleSort('RUC')}
                          className="flex items-center gap-1 hover:text-foreground"
                        >
                          RUC
                          {orderField === 'RUC' && (
                            <span>{orderDirection === 'ASC' ? '↑' : '↓'}</span>
                          )}
                        </button>
                      </TableHead>
                      <TableHead>
                        <button 
                          onClick={() => handleSort('RAZON_SOCIAL')}
                          className="flex items-center gap-1 hover:text-foreground"
                        >
                          Razón Social
                          {orderField === 'RAZON_SOCIAL' && (
                            <span>{orderDirection === 'ASC' ? '↑' : '↓'}</span>
                          )}
                        </button>
                      </TableHead>
                      <TableHead>
                        <button 
                          onClick={() => handleSort('FCHCRE')}
                          className="flex items-center gap-1 hover:text-foreground"
                        >
                          Fecha de Creación
                          {orderField === 'FCHCRE' && (
                            <span>{orderDirection === 'ASC' ? '↑' : '↓'}</span>
                          )}
                        </button>
                      </TableHead>
                      <TableHead>Estado</TableHead>
                      <TableHead className="w-12"></TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {companies.map((company) => (
                      <TableRow key={company.ID_EMPRESA}>
                        <TableCell>
                          <Checkbox />
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <Building2 className="h-4 w-4 text-blue-500" />
                            <span>{company.RUC}</span>
                          </div>
                        </TableCell>
                        <TableCell>{company.RAZON_SOCIAL}</TableCell>
                        <TableCell>{formatDate(company.FCHCRE)}</TableCell>
                        <TableCell>
                          <Badge variant={company.ID_ESTADO_REGISTRO === 1 ? 'success' : 'destructive'}>
                            {company.ID_ESTADO_REGISTRO === 1 ? 'Activo' : 'Inactivo'}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <CompanyRowActions
                            companyId={company.ID_EMPRESA}
                            status={company.ID_ESTADO_REGISTRO}
                            secretKey={company.SECRET_KEY}
                            onDelete={handleDeleteCompany}
                            onReactivate={handleReactivateCompany}
                            onUpdateLogo={onUpdateLogo}
                            onGenerateURL={handleGenerateURL}
                            isPending={updateCompanyStatus.isPending}
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
                Mostrando {startIndex}-{endIndex} de {pagination.total_records} empresas
              </p>
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
};
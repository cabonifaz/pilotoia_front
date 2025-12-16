import { useState, useMemo, useRef, useEffect } from 'react';
import { ChevronLeft, ChevronRight, Building2 } from 'lucide-react';
import { Card, CardContent, CardHeader } from '@/components/shadcn/card';
import { Button } from '@/components/shadcn/button';
import { Badge } from '@/components/shadcn/badge';
import { Checkbox } from '@/components/shadcn/checkbox';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/shadcn/table';
import { Loader } from '@/components/loader/Loader';
import { useGetCompanies, useUpdateCompanyStatus } from '@/hooks/useCompanyQueries';
import { CompanyRowActions } from '@/components/company';

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

export const CompanyTable = ({ searchTerm, sortBy, onUpdateLogo }: CompanyTableProps) => {
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(8);
  const tableContainerRef = useRef<HTMLDivElement>(null);

  const { data, isLoading, error } = useGetCompanies();
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

  // Calculate items per page based on available height
  useEffect(() => {
    const calculateItemsPerPage = () => {
      if (tableContainerRef.current) {
        const containerHeight = tableContainerRef.current.clientHeight;
        const rowHeight = 45; // Approximate height of a table row in pixels
        const headerHeight = 45; // Approximate height of table header
        const availableHeight = containerHeight - headerHeight;
        const calculatedItems = Math.floor(availableHeight / rowHeight);
        setItemsPerPage(Math.max(5, calculatedItems)); // Minimum 5 items
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

  const processedCompanies = useMemo(() => {
    if (!data?.companies) return [];

    return data.companies
      .filter(company =>
        company.RUC.toLowerCase().includes(searchTerm.toLowerCase()) ||
        company.RAZON_SOCIAL.toLowerCase().includes(searchTerm.toLowerCase())
      );
  }, [data?.companies, searchTerm]);

  // Sort companies
  const sortedCompanies = useMemo(() => {
    let sorted = [...processedCompanies];

    if (sortBy === 'ruc') {
      sorted.sort((a, b) => a.RUC.localeCompare(b.RUC));
    } else if (sortBy === 'razon_social') {
      sorted.sort((a, b) => a.RAZON_SOCIAL.localeCompare(b.RAZON_SOCIAL));
    } else {
      // Default sorting: by created date (most recent first)
      sorted.sort((a, b) => {
        const dateA = new Date(a.FCHCRE).getTime();
        const dateB = new Date(b.FCHCRE).getTime();
        return dateB - dateA;
      });
    }

    return sorted;
  }, [processedCompanies, sortBy]);

  const totalPages = Math.ceil(sortedCompanies.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const displayedCompanies = sortedCompanies.slice(startIndex, startIndex + itemsPerPage);

  return (
    <Card className="flex-1 flex flex-col min-h-0">
      <CardHeader className="pb-3">
        <div className="flex flex-col items-start gap-1">
          <h1 className="text-2xl font-bold text-foreground">Empresas</h1>
          <p className="text-xs text-muted-foreground">
            Gestiona las empresas disponibles.
          </p>
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
        {!isLoading && !error && displayedCompanies.length === 0 && (
          <div className="flex-1 flex items-center justify-center">
            <p className="text-muted-foreground">No se encontraron empresas</p>
          </div>
        )}

        {/* Table */}
        {!isLoading && !error && displayedCompanies.length > 0 && (
          <>
            <div ref={tableContainerRef} className="flex-1 min-h-0 border rounded-lg">
              <div className="h-full overflow-y-auto">
                <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-12"></TableHead>
                    <TableHead>RUC</TableHead>
                    <TableHead>Razón Social</TableHead>
                    <TableHead>Fecha de Creación</TableHead>
                    <TableHead>Estado</TableHead>
                    <TableHead className="w-12"></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {displayedCompanies.map((company) => (
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
                          onDelete={handleDeleteCompany}
                          onReactivate={handleReactivateCompany}
                          onUpdateLogo={onUpdateLogo}
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
                Mostrando {startIndex + 1}-{Math.min(startIndex + itemsPerPage, sortedCompanies.length)} de {sortedCompanies.length} empresas
              </p>
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
};
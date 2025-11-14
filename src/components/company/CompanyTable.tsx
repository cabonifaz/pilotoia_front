import { useState, useMemo } from 'react';
import { ChevronLeft, ChevronRight, Building2 } from 'lucide-react';
import { Card, CardContent, CardHeader } from '@/components/shadcn/card';
import { Button } from '@/components/shadcn/button';
import { Badge } from '@/components/shadcn/badge';
import { Checkbox } from '@/components/shadcn/checkbox';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/shadcn/table';
import { Loader } from '@/components/loader/Loader';
import { useGetCompanies } from '@/hooks/useCompanyQueries';

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
}

export const CompanyTable = ({ searchTerm, sortBy }: CompanyTableProps) => {
  const [currentPage, setCurrentPage] = useState(1);

  const { data, isLoading, error } = useGetCompanies();

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

  const itemsPerPage = 5;
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
            <div className="flex-1 min-h-0 border rounded-lg">
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
                Mostrando {startIndex + 1}-{Math.min(startIndex + itemsPerPage, sortedCompanies.length)} de {sortedCompanies.length} empresas
              </p>
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
};
import { useState, useMemo, useRef, useEffect } from 'react';
import { ChevronLeft, ChevronRight, User } from 'lucide-react';
import { Card, CardContent, CardHeader } from '@/components/shadcn/card';
import { Button } from '@/components/shadcn/button';
import { Badge } from '@/components/shadcn/badge';
import { Checkbox } from '@/components/shadcn/checkbox';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/shadcn/table';
import { Loader } from '@/components/loader/Loader';
import { useGetUsuarios, useUpdateUsuarioStatus } from '@/hooks/useUsersQueries';
import { useQueryAuthContext } from '@/contexts/QueryAuthContext';
import { UserRowActions } from './UserRowActions';
import type { Usuario } from '@/types/users';

interface UsersTableProps {
  searchTerm: string;
  sortBy: 'usuario' | 'nombres' | 'area' | 'rol' | null;
  onEditUser: (user: Usuario) => void;
  onChangePassword: (user: Usuario) => void;
  onChangeAccess: (user: Usuario, userAreas: string[]) => void;
}

export const UsersTable = ({ searchTerm, sortBy, onEditUser, onChangePassword, onChangeAccess }: UsersTableProps) => {
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(5);
  const tableContainerRef = useRef<HTMLDivElement>(null);

  const { user } = useQueryAuthContext();
  const id_empresa = (user as any)?.actual_company_area?.ID_EMPRESA;

  const { data, isLoading, error } = useGetUsuarios(id_empresa);
  const updateStatus = useUpdateUsuarioStatus(id_empresa);

  const handleToggleStatus = (userId: number, currentStatus: number) => {
    const newStatus = currentStatus === 1 ? 0 : 1;
    updateStatus.mutate({
      id_usuario: userId,
      status: newStatus,
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

  const processedUsuarios = useMemo(() => {
    if (!data?.usuarios) return [];

    return data.usuarios
      .filter(usuario =>
        usuario.USUARIO.toLowerCase().includes(searchTerm.toLowerCase()) ||
        usuario.NOMBRES.toLowerCase().includes(searchTerm.toLowerCase()) ||
        usuario.APELLIDOS.toLowerCase().includes(searchTerm.toLowerCase()) ||
        usuario.AREA.toLowerCase().includes(searchTerm.toLowerCase())
      );
  }, [data?.usuarios, searchTerm]);

  // Group usuarios by ID_USUARIO
  const groupedUsuarios = useMemo(() => {
    const grouped = new Map<number, typeof processedUsuarios>();

    processedUsuarios.forEach(usuario => {
      if (!grouped.has(usuario.ID_USUARIO)) {
        grouped.set(usuario.ID_USUARIO, []);
      }
      grouped.get(usuario.ID_USUARIO)!.push(usuario);
    });

    return Array.from(grouped.values());
  }, [processedUsuarios]);

  // Sort grouped usuarios
  const sortedUsuarios = useMemo(() => {
    let sorted = [...groupedUsuarios];

    if (sortBy === 'usuario') {
      sorted.sort((a, b) => a[0].USUARIO.localeCompare(b[0].USUARIO));
    } else if (sortBy === 'nombres') {
      sorted.sort((a, b) => a[0].NOMBRES.localeCompare(b[0].NOMBRES));
    } else if (sortBy === 'area') {
      sorted.sort((a, b) => a[0].AREA.localeCompare(b[0].AREA));
    } else if (sortBy === 'rol') {
      sorted.sort((a, b) => a[0].ROL.localeCompare(b[0].ROL));
    } else {
      // Default sorting: by username
      sorted.sort((a, b) => a[0].USUARIO.localeCompare(b[0].USUARIO));
    }

    return sorted;
  }, [groupedUsuarios, sortBy]);

  const totalPages = Math.ceil(sortedUsuarios.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const displayedUsuarios = sortedUsuarios.slice(startIndex, startIndex + itemsPerPage);

  // Assign badge variant based on role ID
  const getRoleBadgeVariant = (idTipoRol: number): 'info' | 'default' | 'outline' | 'teal' => {
    const variants: Array<'info' | 'default' | 'outline' | 'teal'> = ['info', 'default', 'outline', 'teal'];
    return variants[(idTipoRol - 1) % 4];
  };

  return (
    <Card className="flex-1 flex flex-col min-h-0">
      <CardHeader className="pb-3">
        <div className="flex flex-col items-start gap-1">
          <h1 className="text-2xl font-bold text-foreground">Usuarios</h1>
          <p className="text-xs text-muted-foreground">
            Gestiona los usuarios de la empresa.
          </p>
        </div>
      </CardHeader>

      <CardContent className="flex-1 flex flex-col min-h-0 overflow-hidden gap-4 relative">
        {/* Loading State */}
        {isLoading && (
          <Loader text="Cargando usuarios..." />
        )}

        {/* Error State */}
        {error && (
          <div className="flex-1 flex items-center justify-center">
            <p className="text-red-500">Error: {error.message}</p>
          </div>
        )}

        {/* Empty State */}
        {!isLoading && !error && displayedUsuarios.length === 0 && (
          <div className="flex-1 flex items-center justify-center">
            <p className="text-muted-foreground">No se encontraron usuarios</p>
          </div>
        )}

        {/* Table */}
        {!isLoading && !error && displayedUsuarios.length > 0 && (
          <>
            <div ref={tableContainerRef} className="flex-1 min-h-0 border rounded-lg">
              <div className="h-full overflow-y-auto">
                <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-12"></TableHead>
                    <TableHead>Usuario</TableHead>
                    <TableHead>Nombres</TableHead>
                    <TableHead>Apellidos</TableHead>
                    <TableHead>Áreas con Acceso</TableHead>
                    <TableHead>Rol</TableHead>
                    <TableHead>Estado</TableHead>
                    <TableHead className="w-12"></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {displayedUsuarios.map((usuarioGroup) => (
                    <TableRow key={usuarioGroup[0].ID_USUARIO}>
                      <TableCell>
                        <Checkbox />
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <User className="h-4 w-4 text-blue-500" />
                          <span>{usuarioGroup[0].USUARIO}</span>
                        </div>
                      </TableCell>
                      <TableCell>{usuarioGroup[0].NOMBRES}</TableCell>
                      <TableCell>{usuarioGroup[0].APELLIDOS}</TableCell>
                      <TableCell>
                        <div className="flex flex-col gap-1">
                          {usuarioGroup[0].ID_TIPO_ROL === 2 ? (
                            <strong>Todas</strong>
                          ) : (
                            usuarioGroup.map((usuario) => (
                              <span key={usuario.ID_USUARIO_EMPR_AREA}>
                                {usuario.AREA}
                              </span>
                            ))
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant={getRoleBadgeVariant(usuarioGroup[0].ID_TIPO_ROL)}>
                          {usuarioGroup[0].ROL}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Badge variant={usuarioGroup[0].ID_ESTADO_REGISTRO === 1 ? 'success' : 'destructive'}>
                          {usuarioGroup[0].ID_ESTADO_REGISTRO === 1 ? 'Activo' : 'Inactivo'}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <UserRowActions
                          status={usuarioGroup[0].ID_ESTADO_REGISTRO}
                          onEdit={() => onEditUser(usuarioGroup[0])}
                          onToggleStatus={() => handleToggleStatus(usuarioGroup[0].ID_USUARIO, usuarioGroup[0].ID_ESTADO_REGISTRO)}
                          onChangePassword={() => onChangePassword(usuarioGroup[0])}
                          onChangeAccess={() => onChangeAccess(usuarioGroup[0], usuarioGroup.map((u) => u.AREA))}
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
                Mostrando {startIndex + 1}-{Math.min(startIndex + itemsPerPage, sortedUsuarios.length)} de {sortedUsuarios.length} usuarios
              </p>
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
};
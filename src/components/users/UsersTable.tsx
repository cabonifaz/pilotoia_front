import { useState, useEffect } from 'react';
import { ChevronLeft, ChevronRight, User, Filter } from 'lucide-react';
import { Card, CardContent, CardHeader } from '@/components/shadcn/card';
import { Button } from '@/components/shadcn/button';
import { Badge } from '@/components/shadcn/badge';
import { Checkbox } from '@/components/shadcn/checkbox';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/shadcn/table';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/shadcn/dropdown-menu';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/shadcn/select';
import { Loader } from '@/components/loader/Loader';
import { useGetUsuariosPaginated, useUpdateUsuarioStatus } from '@/hooks/useUsersQueries';
import { useQueryAuthContext } from '@/contexts/QueryAuthContext';
import { UserRowActions } from './UserRowActions';
import type { Usuario } from '@/types/users';

interface UsersTableProps {
  searchTerm: string;
  onEditUser: (user: Usuario) => void;
  onChangePassword: (user: Usuario) => void;
  onChangeAccess: (user: Usuario, userAreas: string[]) => void;
}

export const UsersTable = ({ 
  searchTerm, 
  onEditUser, 
  onChangePassword, 
  onChangeAccess 
}: UsersTableProps) => {
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [orderField, setOrderField] = useState<'USUARIO' | 'NOMBRES' | 'APELLIDOS' | 'TELEFONO' | 'AREA' | 'ROL' | 'ID_ESTADO_REGISTRO'>('APELLIDOS');
  const [orderDirection, setOrderDirection] = useState<'ASC' | 'DESC'>('ASC');
  const [statusFilter, setStatusFilter] = useState<number | null>(null);

  const { user } = useQueryAuthContext();
  const id_empresa = (user as any)?.actual_company_area?.ID_EMPRESA;

  // Server-side pagination query
  const { data, isLoading, error } = useGetUsuariosPaginated(
    id_empresa || 0,
    currentPage,
    pageSize,
    searchTerm,
    orderField,
    orderDirection,
    statusFilter
  );

  const updateStatus = useUpdateUsuarioStatus(id_empresa);

  const handleToggleStatus = (userId: number, currentStatus: number) => {
    const newStatus = currentStatus === 1 ? 0 : 1;
    updateStatus.mutate({
      id_usuario: userId,
      status: newStatus,
    });
  };

  // Reset to first page when search term or status filter changes
  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, statusFilter]);

  // Handle column sort
  const handleSort = (field: 'USUARIO' | 'NOMBRES' | 'APELLIDOS' | 'TELEFONO' | 'AREA' | 'ROL' | 'ID_ESTADO_REGISTRO') => {
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
    setCurrentPage(1); // Reset to first page when changing page size
  };

  const usuarios = data?.data || [];
  const totalPages = data?.pagination?.total_pages || 0;
  const totalRecords = data?.pagination?.total_records || 0;

  // Group usuarios by ID_USUARIO (same user can have multiple areas)
  const groupedUsuarios = usuarios.reduce((acc, usuario) => {
    const existing = acc.find(group => group[0].ID_USUARIO === usuario.ID_USUARIO);
    if (existing) {
      existing.push(usuario);
    } else {
      acc.push([usuario]);
    }
    return acc;
  }, [] as Usuario[][]);

  // Assign badge variant based on role ID
  const getRoleBadgeVariant = (idTipoRol: number): 'info' | 'default' | 'outline' | 'teal' => {
    const variants: Array<'info' | 'default' | 'outline' | 'teal'> = ['info', 'default', 'outline', 'teal'];
    return variants[(idTipoRol - 1) % 4];
  };

  if (!id_empresa) {
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
            <h1 className="text-2xl font-bold text-foreground">Usuarios</h1>
            <p className="text-xs text-muted-foreground">
              Gestiona los usuarios de la empresa.
            </p>
          </div>

          {/* Page size selector - Top right */}
          {!isLoading && !error && groupedUsuarios.length > 0 && (
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
          <Loader text="Cargando usuarios..." />
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
                          onClick={() => handleSort('USUARIO')}
                          className="flex items-center gap-1 hover:text-foreground"
                        >
                          Usuario
                          {orderField === 'USUARIO' && (
                            <span>{orderDirection === 'ASC' ? '↑' : '↓'}</span>
                          )}
                        </button>
                      </TableHead>
                      <TableHead>
                        <button
                          onClick={() => handleSort('NOMBRES')}
                          className="flex items-center gap-1 hover:text-foreground"
                        >
                          Nombres
                          {orderField === 'NOMBRES' && (
                            <span>{orderDirection === 'ASC' ? '↑' : '↓'}</span>
                          )}
                        </button>
                      </TableHead>
                      <TableHead>
                        <button
                          onClick={() => handleSort('APELLIDOS')}
                          className="flex items-center gap-1 hover:text-foreground"
                        >
                          Apellidos
                          {orderField === 'APELLIDOS' && (
                            <span>{orderDirection === 'ASC' ? '↑' : '↓'}</span>
                          )}
                        </button>
                      </TableHead>
                      <TableHead>
                        <button
                          onClick={() => handleSort('TELEFONO')}
                          className="flex items-center gap-1 hover:text-foreground"
                        >
                          Teléfono
                          {orderField === 'TELEFONO' && (
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
                          onClick={() => handleSort('ROL')}
                          className="flex items-center gap-1 hover:text-foreground"
                        >
                          Rol
                          {orderField === 'ROL' && (
                            <span>{orderDirection === 'ASC' ? '↑' : '↓'}</span>
                          )}
                        </button>
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
                    {groupedUsuarios.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={9} className="h-24 text-center">
                          <p className="text-muted-foreground">
                            {statusFilter === 1
                              ? 'No se encontraron usuarios activos'
                              : statusFilter === 0
                                ? 'No se encontraron usuarios inactivos'
                                : searchTerm
                                  ? `No se encontraron usuarios que coincidan con "${searchTerm}"`
                                  : 'No hay usuarios registrados'}
                          </p>
                        </TableCell>
                      </TableRow>
                    ) : (
                      groupedUsuarios.map((usuarioGroup) => (
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
                          <TableCell>{usuarioGroup[0].TELEFONO || '-'}</TableCell>
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
                      ))
                    )}
                  </TableBody>
                </Table>
              </div>
            </div>

            {/* Pagination - Only show when there's data */}
            {groupedUsuarios.length > 0 && (
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
                  Mostrando {(currentPage - 1) * pageSize + 1}-{Math.min(currentPage * pageSize, totalRecords)} de {totalRecords} usuarios
                </p>
              </div>
            )}
          </>
        )}
      </CardContent>
    </Card>
  );
};
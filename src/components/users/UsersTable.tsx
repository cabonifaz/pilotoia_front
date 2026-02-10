import { useState, useMemo, useCallback, useEffect } from "react";
import {
  DndContext,
  KeyboardSensor,
  MouseSensor,
  TouchSensor,
  closestCenter,
  type DragEndEvent,
  useSensor,
  useSensors,
} from "@dnd-kit/core";
import {
  arrayMove,
  SortableContext,
  horizontalListSortingStrategy,
  useSortable,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import {
  useReactTable,
  getCoreRowModel,
  flexRender,
  createColumnHelper,
  type Header,
} from "@tanstack/react-table";
import {
  ChevronLeft,
  ChevronRight,
  User,
  Filter,
  ArrowUp,
  ArrowDown,
} from "lucide-react";

import { Card, CardContent, CardHeader } from "@/components/shadcn/card";
import { Button } from "@/components/shadcn/button";
import { Badge } from "@/components/shadcn/badge";
import { Checkbox } from "@/components/shadcn/checkbox";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/shadcn/table";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/shadcn/dropdown-menu";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/shadcn/select";

import { Loader } from "@/components/loader/Loader";
import {
  useGetUsuariosPaginated,
  useUpdateUsuarioStatus,
} from "@/hooks/useUsersQueries";
import { useQueryAuthContext } from "@/contexts/QueryAuthContext";
import { UserRowActions } from "./UserRowActions";
import type { Usuario } from "@/types/users";

// --- COMPONENTE DE CABECERA ARRASTRABLE (Reutilizable) ---
interface DraggableTableHeaderProps {
  header: Header<Usuario[], unknown>;
  onSortClick: (field: string) => void;
  orderField: string | null;
  orderDirection: "ASC" | "DESC";
}

const DraggableTableHeader = ({
  header,
  onSortClick,
  orderField,
  orderDirection,
}: DraggableTableHeaderProps) => {
  const columnId = header.column.id;
  const isStatic = columnId === "select" || columnId === "actions";
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({
    id: columnId,
    disabled: isStatic,
  });

  const columnSize = header.column.getSize();

  const style = {
    transform: CSS.Translate.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
    zIndex: isDragging ? 100 : 1,
    position: "relative" as const,
    width: columnSize,
    minWidth: columnSize,
    maxWidth: columnSize,
  };

  // Definir qué columnas permiten ordenamiento por API
  const isSortable = [
    "USUARIO",
    "NOMBRES",
    "APELLIDOS",
    "TELEFONO",
    "AREA",
    "ROL",
    "ID_ESTADO_REGISTRO",
  ].includes(columnId);

  return (
    <TableHead
      ref={setNodeRef}
      style={style}
      className={`bg-white border-b ${isStatic ? "px-1 text-center" : ""}`}
    >
      <div
        className={`flex items-center ${isStatic ? "justify-center" : "gap-2"}`}
      >
        {!isStatic && (
          <div
            {...attributes}
            {...listeners}
            className="cursor-grab active:cursor-grabbing text-muted-foreground/50"
          >
            ::
          </div>
        )}
        <div
          className={`flex items-center gap-1 ${isSortable ? "cursor-pointer select-none" : ""}`}
          onClick={() => isSortable && onSortClick(columnId)}
        >
          {flexRender(header.column.columnDef.header, header.getContext())}
          {isSortable &&
            orderField === columnId &&
            (orderDirection === "ASC" ? (
              <ArrowUp className="h-3 w-3" />
            ) : (
              <ArrowDown className="h-3 w-3" />
            ))}
        </div>
      </div>
    </TableHead>
  );
};

// --- TIPOS Y PROPS ---
interface UsersTableProps {
  searchTerm: string;
  onEditUser: (user: Usuario) => void;
  onChangePassword: (user: Usuario) => void;
  onChangeAccess: (user: Usuario, userAreas: string[]) => void;
}

// Helper para asignar variantes de badge según el rol
const getRoleBadgeVariant = (
  idTipoRol: number,
): "info" | "default" | "outline" | "teal" => {
  const variants: Array<"info" | "default" | "outline" | "teal"> = [
    "info",
    "default",
    "outline",
    "teal",
  ];
  return variants[(idTipoRol - 1) % 4];
};

// Dado que agrupamos usuarios, la fila de la tabla es un array de Usuario
const columnHelper = createColumnHelper<Usuario[]>();

export const UsersTable = ({
  searchTerm,
  onEditUser,
  onChangePassword,
  onChangeAccess,
}: UsersTableProps) => {
  // --- ESTADOS ---
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [orderField, setOrderField] = useState<string>("APELLIDOS");
  const [orderDirection, setOrderDirection] = useState<"ASC" | "DESC">("ASC");
  const [statusFilter, setStatusFilter] = useState<number | null>(null);
  const [rowSelection, setRowSelection] = useState({});

  // Estado para el orden de columnas
  const [columnOrder, setColumnOrder] = useState<string[]>([
    "select",
    "USUARIO",
    "NOMBRES",
    "APELLIDOS",
    "TELEFONO",
    "AREA",
    "ROL",
    "ID_ESTADO_REGISTRO",
    "actions",
  ]);

  // Contexto y Queries
  const { user } = useQueryAuthContext();
  const id_empresa = (user as any)?.actual_company_area?.ID_EMPRESA;

  const { data, isLoading, error } = useGetUsuariosPaginated(
    id_empresa || 0,
    currentPage,
    pageSize,
    searchTerm,
    orderField as any,
    orderDirection,
    statusFilter,
  );

  const updateStatus = useUpdateUsuarioStatus(id_empresa);

  // --- MANEJADORES ---
  const handleToggleStatus = useCallback(
    (userId: number, currentStatus: number) => {
      const newStatus = currentStatus === 1 ? 0 : 1;
      updateStatus.mutate({
        id_usuario: userId,
        status: newStatus,
      });
    },
    [updateStatus],
  );

  // Reset page when filters change
  useEffect(() => {
    setCurrentPage(1);
    setRowSelection({});
  }, [searchTerm, statusFilter, pageSize]);

  const handleSortClick = useCallback(
    (field: string) => {
      if (orderField === field) {
        setOrderDirection((prev) => (prev === "ASC" ? "DESC" : "ASC"));
      } else {
        setOrderField(field);
        setOrderDirection("ASC");
      }
      setCurrentPage(1);
    },
    [orderField],
  );

  const handlePageSizeChange = useCallback((value: string) => {
    setPageSize(Number(value));
    setCurrentPage(1);
  }, []);

  const handleStatusFilterChange = useCallback((status: number | null) => {
    setStatusFilter(status);
    setCurrentPage(1);
  }, []);

  // --- DND LOGIC ---
  const sensors = useSensors(
    useSensor(MouseSensor, { activationConstraint: { distance: 8 } }),
    useSensor(TouchSensor),
    useSensor(KeyboardSensor),
  );

  function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event;
    if (active && over && active.id !== over.id) {
      if (over.id === "select" || over.id === "actions") return;
      setColumnOrder((items) => {
        const oldIndex = items.indexOf(active.id as string);
        const newIndex = items.indexOf(over.id as string);
        return arrayMove(items, oldIndex, newIndex);
      });
    }
  }

  // --- PROCESAMIENTO DE DATOS (Agrupación) ---
  const usuarios = data?.data || [];

  const groupedUsuarios = useMemo(() => {
    return usuarios.reduce((acc, usuario) => {
      const existing = acc.find(
        (group) => group[0].ID_USUARIO === usuario.ID_USUARIO,
      );
      if (existing) {
        existing.push(usuario);
      } else {
        acc.push([usuario]);
      }
      return acc;
    }, [] as Usuario[][]);
  }, [usuarios]);

  // --- COLUMNAS TANSTACK ---
  // --- COLUMNAS TANSTACK ---
  const columns = useMemo(
    () => [
      columnHelper.display({
        id: "select",
        header: ({ table }) => (
          <Checkbox
            checked={
              table.getIsAllPageRowsSelected() ||
              (table.getIsSomePageRowsSelected() && "indeterminate")
            }
            onCheckedChange={(value) =>
              table.toggleAllPageRowsSelected(!!value)
            }
            aria-label="Seleccionar todos"
          />
        ),
        cell: ({ row }) => (
          <Checkbox
            checked={row.getIsSelected()}
            onCheckedChange={(value) => row.toggleSelected(!!value)}
            aria-label="Seleccionar fila"
          />
        ),
        // AUMENTADO: De 30 a 45 para más espacio
        size: 45,
        minSize: 45,
        maxSize: 45,
      }),
      columnHelper.accessor((row) => row[0].USUARIO, {
        id: "USUARIO",
        header: "Usuario",
        cell: (info) => (
          <div className="flex items-center gap-2">
            <User className="h-4 w-4 text-blue-500" />
            <span>{info.getValue()}</span>
          </div>
        ),
      }),
      columnHelper.accessor((row) => row[0].NOMBRES, {
        id: "NOMBRES",
        header: "Nombres",
      }),
      columnHelper.accessor((row) => row[0].APELLIDOS, {
        id: "APELLIDOS",
        header: "Apellidos",
      }),
      columnHelper.accessor((row) => row[0].TELEFONO, {
        id: "TELEFONO",
        header: "Teléfono",
        cell: (info) => {
          const telefono = info.getValue();
          if (!telefono) return "-";

          const codigoPais = info.row.original[0].CODIGO_PAIS || "";
          if (!codigoPais) return telefono;

          const [codigoNumerico, codigoIso] = codigoPais.split('-');
          const localNumber = telefono.startsWith(codigoNumerico)
            ? telefono.slice(codigoNumerico.length)
            : telefono;

          return (
            <div className="flex items-center gap-2">
              <img
                src={`https://flagcdn.com/w20/${codigoIso.toLowerCase()}.png`}
                alt={codigoIso}
                className="w-5 h-3 object-cover"
              />
              <span>+{codigoNumerico} {localNumber}</span>
            </div>
          );
        },
      }),
      columnHelper.accessor((row) => row, {
        id: "AREA",
        header: "Áreas con Acceso",
        cell: (info) => {
          const userGroup = info.getValue();
          const firstUser = userGroup[0];

          if (firstUser.ID_TIPO_ROL === 2) {
            return <strong>Todas</strong>;
          }
          return (
            <div className="flex flex-col gap-1">
              {userGroup.map((u) => (
                <span key={u.ID_USUARIO_EMPR_AREA}>{u.AREA}</span>
              ))}
            </div>
          );
        },
      }),
      columnHelper.accessor((row) => row[0].ROL, {
        id: "ROL",
        header: "Rol",
        cell: (info) => {
          const roleId = info.row.original[0].ID_TIPO_ROL;
          return (
            <Badge variant={getRoleBadgeVariant(roleId)}>
              {info.getValue()}
            </Badge>
          );
        },
      }),
      columnHelper.accessor((row) => row[0].ID_ESTADO_REGISTRO, {
        id: "ID_ESTADO_REGISTRO",
        header: () => (
          <div className="flex items-center gap-2">
            <span>Estado</span>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="ghost"
                  size="sm"
                  className={`h-6 w-6 p-0 ${statusFilter !== null ? "text-blue-600" : ""}`}
                >
                  <Filter className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="start">
                <DropdownMenuItem
                  onClick={() => handleStatusFilterChange(null)}
                >
                  Todos
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => handleStatusFilterChange(1)}>
                  Activo
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => handleStatusFilterChange(0)}>
                  Inactivo
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        ),
        cell: (info) => (
          <Badge variant={info.getValue() === 1 ? "success" : "destructive"}>
            {info.getValue() === 1 ? "Activo" : "Inactivo"}
          </Badge>
        ),
      }),
      columnHelper.display({
        id: "actions",
        cell: (info) => {
          const user = info.row.original[0];
          const areas = info.row.original.map((u) => u.AREA);
          return (
            <UserRowActions
              status={user.ID_ESTADO_REGISTRO}
              onEdit={() => onEditUser(user)}
              onToggleStatus={() =>
                handleToggleStatus(user.ID_USUARIO, user.ID_ESTADO_REGISTRO)
              }
              onChangePassword={() => onChangePassword(user)}
              onChangeAccess={() => onChangeAccess(user, areas)}
            />
          );
        },
        // REDUCIDO: De 50 a 40 para ocupar menos espacio
        size: 40,
        minSize: 40,
        maxSize: 40,
      }),
    ],
    [
      statusFilter,
      handleStatusFilterChange,
      onEditUser,
      handleToggleStatus,
      onChangePassword,
      onChangeAccess,
    ],
  );

  const table = useReactTable({
    data: groupedUsuarios,
    columns,
    state: {
      columnOrder,
      rowSelection,
    },
    onColumnOrderChange: setColumnOrder,
    onRowSelectionChange: setRowSelection,
    getCoreRowModel: getCoreRowModel(),
    getRowId: (row) => row[0].ID_USUARIO.toString(),
    manualPagination: true,
  });
  useEffect(() => {
    setRowSelection({});
  }, [currentPage]);
  const draggableColumns = useMemo(
    () => columnOrder.filter((id) => id !== "select" && id !== "actions"),
    [columnOrder],
  );

  const totalPages = data?.pagination?.total_pages || 0;
  const totalRecords = data?.pagination?.total_records || 0;

  const startIndex = (currentPage - 1) * pageSize + 1;
  const endIndex = Math.min(currentPage * pageSize, totalRecords);

  if (!id_empresa) {
    return (
      <Card className="flex-1 flex flex-col min-h-0">
        <CardHeader className="pb-3">
          <h1 className="text-2xl font-bold text-foreground">Usuarios</h1>
          <p className="text-xs text-muted-foreground">
            Gestiona los usuarios de la empresa.
          </p>
        </CardHeader>
        <CardContent className="flex-1 flex items-center justify-center">
          <p className="text-muted-foreground">
            No se pudo cargar la información de la empresa
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="flex-1 flex flex-col min-h-0">
      <CardHeader className="pb-3">
        <div className="flex justify-between items-center">
          <div className="flex flex-col items-start gap-1">
            <h1 className="text-2xl font-bold text-foreground">Usuarios</h1>
            <p className="text-xs text-muted-foreground">
              Gestiona los usuarios de la empresa.
            </p>
          </div>

          {!isLoading && !error && groupedUsuarios.length > 0 && (
            <div className="hidden md:flex items-center gap-2">
              <span className="text-sm text-muted-foreground whitespace-nowrap">
                Filas por página:
              </span>
              <Select
                value={pageSize.toString()}
                onValueChange={handlePageSizeChange}
              >
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
        {isLoading && <Loader text="Cargando usuarios..." />}

        {error && (
          <div className="flex-1 flex items-center justify-center">
            <p className="text-red-500">Error: {error.message}</p>
          </div>
        )}

        {!isLoading && !error && (
          <>
            <DndContext
              sensors={sensors}
              collisionDetection={closestCenter}
              onDragEnd={handleDragEnd}
            >
              <div className="flex-1 min-h-0 border rounded-lg">
                <div className="h-full overflow-y-auto">
                  <Table>
                    <TableHeader className="sticky top-0 z-20 bg-white shadow-sm">
                      {table.getHeaderGroups().map((headerGroup) => (
                        <TableRow key={headerGroup.id}>
                          <SortableContext
                            items={draggableColumns}
                            strategy={horizontalListSortingStrategy}
                          >
                            {headerGroup.headers.map((header) => (
                              <DraggableTableHeader
                                key={header.id}
                                header={header}
                                onSortClick={handleSortClick}
                                orderField={orderField}
                                orderDirection={orderDirection}
                              />
                            ))}
                          </SortableContext>
                        </TableRow>
                      ))}
                    </TableHeader>
                    <TableBody>
                      {table.getRowModel().rows.length === 0 ? (
                        <TableRow>
                          <TableCell
                            colSpan={columns.length}
                            className="h-24 text-center"
                          >
                            <p className="text-muted-foreground">
                              {statusFilter !== null
                                ? `No se encontraron usuarios ${statusFilter === 1 ? "activos" : "inactivos"}`
                                : searchTerm
                                  ? `No se encontraron coincidencias para "${searchTerm}"`
                                  : "No hay usuarios registrados"}
                            </p>
                          </TableCell>
                        </TableRow>
                      ) : (
                        table.getRowModel().rows.map((row) => (
                          <TableRow key={row.id}>
                            {row.getVisibleCells().map((cell) => (
                              <TableCell
                                key={cell.id}
                                style={{
                                  width: cell.column.getSize(),
                                  minWidth: cell.column.getSize(),
                                  maxWidth: cell.column.getSize(),
                                }}
                                className={
                                  ["select", "actions"].includes(cell.column.id)
                                    ? "px-1 text-center"
                                    : undefined
                                }
                              >
                                {flexRender(
                                  cell.column.columnDef.cell,
                                  cell.getContext(),
                                )}
                              </TableCell>
                            ))}
                          </TableRow>
                        ))
                      )}
                    </TableBody>
                  </Table>
                </div>
              </div>
            </DndContext>

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

                  {/* Desktop Pagination */}
                  <div className="hidden md:flex gap-1">
                    {(() => {
                      const maxButtons = 5;
                      const halfRange = Math.floor(maxButtons / 2);
                      let startPage = Math.max(1, currentPage - halfRange);
                      const endPage = Math.min(
                        totalPages,
                        startPage + maxButtons - 1,
                      );

                      if (endPage - startPage + 1 < maxButtons) {
                        startPage = Math.max(1, endPage - maxButtons + 1);
                      }

                      const pages = [];
                      if (startPage > 1) {
                        pages.push(1);
                        if (startPage > 2) pages.push("...");
                      }
                      for (let i = startPage; i <= endPage; i++) {
                        pages.push(i);
                      }
                      if (endPage < totalPages) {
                        if (endPage < totalPages - 1) pages.push("...");
                        pages.push(totalPages);
                      }

                      return pages.map((page, idx) => (
                        <Button
                          key={`${page}-${idx}`}
                          variant={currentPage === page ? "default" : "outline"}
                          size="sm"
                          onClick={() =>
                            typeof page === "number" && setCurrentPage(page)
                          }
                          disabled={page === "..."}
                        >
                          {page}
                        </Button>
                      ));
                    })()}
                  </div>

                  {/* Mobile Pagination */}
                  <div className="flex md:hidden gap-1">
                    {/* ... (Simplificado para mobile, igual que el original) ... */}
                    <Button variant="outline" size="sm" disabled>
                      {currentPage} / {totalPages}
                    </Button>
                  </div>

                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() =>
                      setCurrentPage(Math.min(totalPages, currentPage + 1))
                    }
                    disabled={currentPage === totalPages}
                  >
                    <span className="hidden md:inline">Siguiente</span>
                    <ChevronRight className="h-4 w-4" />
                  </Button>
                </div>
                <p className="text-xs text-muted-foreground">
                  Mostrando {startIndex}-{endIndex} de {totalRecords} usuarios
                </p>
              </div>
            )}
          </>
        )}
      </CardContent>
    </Card>
  );
};

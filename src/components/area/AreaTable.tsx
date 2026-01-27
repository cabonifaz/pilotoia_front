import { useState, useRef, useEffect, useMemo, useCallback, memo } from "react";
import {
  ChevronLeft,
  ChevronRight,
  FolderOpen,
  Check,
  X,
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
  useUpdateAreaStatus,
  useUpdateAreaName,
  useGetAreasPaginated,
} from "@/hooks/useAreaQueries";
import { useQueryAuthContext } from "@/contexts/QueryAuthContext";
import { AreaRowActions } from "@/components/area";
import { Input } from "@/components/shadcn/input";
import {
  useReactTable,
  getCoreRowModel,
  flexRender,
  createColumnHelper,
  type Header,
} from "@tanstack/react-table";
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
import type { Area } from "@/types/area";

// --- COMPONENTE CABECERA ARRASTRABLE ---
interface DraggableTableHeaderProps {
  header: Header<any, unknown>;
  onSortClick: (field: any) => void;
  orderField: string;
  orderDirection: "ASC" | "DESC";
}

const DraggableTableHeader = ({
  header,
  onSortClick,
  orderField,
  orderDirection,
}: DraggableTableHeaderProps) => {
  const isStatic = ["select", "actions"].includes(header.id);
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({
    id: header.id,
    disabled: isStatic, // Desactiva el hook si es estática
  });

  const style = {
    transform: CSS.Translate.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
    zIndex: isDragging ? 100 : 1,
    position: "relative" as const,
  };

  const isSortable = ["AREA", "FCHCRE", "ID_ESTADO_REGISTRO"].includes(
    header.id,
  );

  const columnSize = header.column.getSize();
  const headerStyle = {
    ...style,
    width: columnSize,
    minWidth: columnSize,
    maxWidth: columnSize,
  };

  return (
    <TableHead
      ref={setNodeRef}
      style={headerStyle}
      className={`bg-white border-b ${isStatic ? "px-1 text-center" : ""}`}
    >
      <div className={`flex items-center ${isStatic ? "justify-center" : "gap-2"}`}>
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
          onClick={() => isSortable && onSortClick(header.id)}
        >
          {flexRender(header.column.columnDef.header, header.getContext())}
          {isSortable &&
            orderField === header.id &&
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
// Format date to readable format
const formatDate = (isoDate: string): string => {
  const date = new Date(isoDate);
  return date.toLocaleDateString("es-ES", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
};
const columnHelper = createColumnHelper<Area>();

// --- EDITABLE AREA CELL (extracted to prevent recreation on parent re-render) ---
interface EditableAreaCellProps {
  initialValue: string;
  onSave: (name: string) => void;
  onCancel: () => void;
  isPending: boolean;
}

const EditableAreaCell = memo(function EditableAreaCell({
  initialValue,
  onSave,
  onCancel,
  isPending,
}: EditableAreaCellProps) {
  const [value, setValue] = useState(initialValue);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    inputRef.current?.focus();
    inputRef.current?.select();
  }, []);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") onSave(value);
    if (e.key === "Escape") onCancel();
  };

  return (
    <div
      className="flex items-center gap-2"
      onClick={(e) => e.stopPropagation()}
    >
      <FolderOpen className="h-4 w-4 text-amber-500 flex-shrink-0" />
      <Input
        ref={inputRef}
        value={value}
        onChange={(e) => setValue(e.target.value)}
        onKeyDown={handleKeyDown}
        className="h-8 text-sm min-w-[150px]"
        disabled={isPending}
      />
      <div className="flex items-center gap-1">
        <Button
          size="sm"
          variant="ghost"
          className="h-6 w-6 p-0"
          onMouseDown={(e) => {
            e.preventDefault();
            onSave(value);
          }}
          disabled={isPending}
        >
          <Check className="h-4 w-4 text-green-600" />
        </Button>
        <Button
          size="sm"
          variant="ghost"
          className="h-6 w-6 p-0"
          onMouseDown={(e) => {
            e.preventDefault();
            onCancel();
          }}
          disabled={isPending}
        >
          <X className="h-4 w-4 text-red-600" />
        </Button>
      </div>
    </div>
  );
});

interface AreaTableProps {
  searchTerm: string;
  onConfigureAi?: (areaId: number, idEmpresa: number, areaName: string) => void;
}

export const AreaTable = ({ searchTerm, onConfigureAi }: AreaTableProps) => {
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [orderField, setOrderField] = useState<"AREA" | "FCHCRE" | "ID_ESTADO_REGISTRO">("AREA");
  const [orderDirection, setOrderDirection] = useState<"ASC" | "DESC">("ASC");
  const [statusFilter, setStatusFilter] = useState<number | null>(null);
  const [editingAreaId, setEditingAreaId] = useState<number | null>(null);
  const [originalAreaName, setOriginalAreaName] = useState<string>("");
  const [columnOrder, setColumnOrder] = useState<string[]>([
    "select",
    "AREA",
    "FCHCRE",
    "ID_ESTADO_REGISTRO",
    "actions",
  ]);
  const { user } = useQueryAuthContext();
  const id_empresa = (user as any)?.actual_company_area?.ID_EMPRESA;
  const [rowSelection, setRowSelection] = useState({});

  // Server-side paginatFion query
  const { data, isLoading, error } = useGetAreasPaginated(
    id_empresa || 0,
    currentPage,
    pageSize,
    searchTerm,
    orderField,
    orderDirection,
    statusFilter,
  );

  const updateAreaStatus = useUpdateAreaStatus(id_empresa);
  const updateAreaName = useUpdateAreaName(id_empresa);
  // Sensores DND
  const sensors = useSensors(
    useSensor(MouseSensor, { activationConstraint: { distance: 8 } }),
    useSensor(TouchSensor),
    useSensor(KeyboardSensor),
  );

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;

    if (active && over && active.id !== over.id) {
      // Definimos los IDs prohibidos
      const staticColumns = ["select", "actions"];

      // Si intentamos soltar sobre una columna estática, cancelamos o ajustamos
      if (staticColumns.includes(over.id as string)) return;

      setColumnOrder((items) => {
        const oldIndex = items.indexOf(active.id as string);
        const newIndex = items.indexOf(over.id as string);
        return arrayMove(items, oldIndex, newIndex);
      });
    }
  };

  // Reset editing and selection state when pagination, filters, or sorting change
  useEffect(() => {
    setEditingAreaId(null);
    setOriginalAreaName("");
    setRowSelection({});
  }, [currentPage, pageSize, orderField, orderDirection, statusFilter]);

  const handleSaveAreaName = useCallback(
    async (newName: string) => {
      const nameToSave = newName.trim();

      if (!editingAreaId || !id_empresa || nameToSave === "") {
        setEditingAreaId(null);
        return;
      }

      if (nameToSave === originalAreaName) {
        setEditingAreaId(null);
        return;
      }

      try {
        await updateAreaName.mutateAsync({
          id_empresa,
          id_area: editingAreaId,
          area: nameToSave,
        });

        setEditingAreaId(null);
        setOriginalAreaName("");
      } catch (error) {
        setEditingAreaId(null);
      }
    },
    [editingAreaId, id_empresa, originalAreaName, updateAreaName]
  );

  const handleCancelEdit = useCallback(() => {
    setEditingAreaId(null);
    setOriginalAreaName("");
  }, []);

  // Flag to block interactions while editing
  const isEditing = editingAreaId !== null;

  // Memoized sort handler
  const handleSortClick = useCallback(
    (field: "AREA" | "FCHCRE" | "ID_ESTADO_REGISTRO") => {
      if (isEditing) return;
      setOrderDirection((prev) =>
        orderField === field && prev === "ASC" ? "DESC" : "ASC"
      );
      setOrderField(field);
      setCurrentPage(1);
    },
    [isEditing, orderField]
  );

  // Memoized status filter handler
  const handleStatusFilterChange = useCallback(
    (status: number | null) => {
      if (isEditing) return;
      setStatusFilter(status);
      setCurrentPage(1);
    },
    [isEditing]
  );

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
            disabled={isEditing}
          />
        ),
        cell: ({ row }) => (
          <Checkbox
            checked={row.getIsSelected()}
            onCheckedChange={(value) => row.toggleSelected(!!value)}
            aria-label="Seleccionar fila"
            disabled={isEditing}
          />
        ),
        size: 20,
        minSize: 20,
        maxSize: 20,
      }),
      columnHelper.accessor("AREA", {
        id: "AREA",
        header: "Área",
        cell: (info) => {
          const area = info.row.original;
          const isEditing = editingAreaId === area.ID_AREA;

          if (isEditing) {
            return (
              <EditableAreaCell
                initialValue={area.AREA}
                isPending={updateAreaName.isPending}
                onSave={handleSaveAreaName}
                onCancel={handleCancelEdit}
              />
            );
          }

          return (
            <div className="flex items-center gap-2">
              <FolderOpen className="h-4 w-4 text-amber-500" />
              <span>{area.AREA}</span>
            </div>
          );
        },
      }),
      columnHelper.accessor("FCHCRE", {
        header: "Fecha de Creación",
        cell: (info) => formatDate(info.getValue()),
      }),
      // --- COLUMNA DE ESTADO CON FILTRO INTEGRADO ---
      columnHelper.accessor("ID_ESTADO_REGISTRO", {
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
                  onClick={(e) => e.stopPropagation()}
                  disabled={isEditing}
                >
                  <Filter className="h-3 w-3" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="start">
                <DropdownMenuItem onClick={() => handleStatusFilterChange(null)}>
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
          const rowIsBeingEdited = editingAreaId === info.row.original.ID_AREA;
          const disableOtherRows = isEditing && !rowIsBeingEdited;
          return (
            <AreaRowActions
              areaId={info.row.original.ID_AREA}
              areaName={info.row.original.AREA}
              status={info.row.original.ID_ESTADO_REGISTRO}
              onEdit={() => {
                if (disableOtherRows) return;
                setEditingAreaId(info.row.original.ID_AREA);
                setOriginalAreaName(info.row.original.AREA);
              }}
              onDelete={(id) => {
                if (isEditing) return;
                updateAreaStatus.mutate({ id_empresa, id_area: id, status: 0 });
              }}
              onReactivate={(id) => {
                if (isEditing) return;
                updateAreaStatus.mutate({ id_empresa, id_area: id, status: 1 });
              }}
              onConfigureAi={
                onConfigureAi
                  ? () => {
                      if (isEditing) return;
                      onConfigureAi(
                        info.row.original.ID_AREA,
                        id_empresa,
                        info.row.original.AREA,
                      );
                    }
                  : undefined
              }
            />
          );
        },
        size: 20,
        minSize: 20,
        maxSize: 20,
      }),
    ],
    [
      editingAreaId,
      id_empresa,
      isEditing,
      statusFilter,
      updateAreaName.isPending,
      updateAreaStatus,
      handleSaveAreaName,
      handleCancelEdit,
      handleStatusFilterChange,
      onConfigureAi,
    ],
  );

  const table = useReactTable({
    data: data?.areas || [],
    columns,
    state: {
      columnOrder,
      rowSelection, // <--- Añadir esto
    },
    onColumnOrderChange: setColumnOrder,
    onRowSelectionChange: setRowSelection, // <--- Añadir esto
    getCoreRowModel: getCoreRowModel(),
    manualPagination: true,
    getRowId: (row) => row.ID_AREA.toString(), // Recomendado: usar el ID real
  });

  // Reset to first page when search term or status filter changes
  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, statusFilter]);

  // Handle page size change
  const handlePageSizeChange = useCallback(
    (value: string) => {
      if (isEditing) return;
      setPageSize(Number(value));
      setCurrentPage(1);
    },
    [isEditing]
  );

  const areas = data?.areas || [];
  const totalPages = data?.total_paginas || 0;
  const totalRecords = data?.total_registros || 0;

  if (!id_empresa) {
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
        <div className="flex justify-between items-start">
          <div className="flex flex-col items-start gap-1">
            <h1 className="text-2xl font-bold text-foreground">Áreas</h1>
            <p className="text-xs text-muted-foreground">
              Gestiona las áreas disponibles.
            </p>
          </div>

          {/* Page size selector - Top right */}
          {!isLoading && !error && areas.length > 0 && (
            <div className="flex items-center gap-2">
              <span className="text-sm text-muted-foreground">
                Filas por página:
              </span>
              <Select
                value={pageSize.toString()}
                onValueChange={handlePageSizeChange}
                disabled={isEditing}
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
        {/* Loading State */}
        {isLoading && <Loader text="Cargando áreas..." />}

        {/* Error State */}
        {error && (
          <div className="flex-1 flex items-center justify-center">
            <p className="text-red-500">Error: {error.message}</p>
          </div>
        )}

        {/* Table - Always show when not loading/error */}
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
                            // Filtramos los IDs estáticos para que dnd-kit no los considere parte del flujo de ordenamiento
                            items={columnOrder.filter(
                              (id) => !["select", "actions"].includes(id),
                            )}
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
                      {table.getRowModel().rows.map((row) => (
                        <TableRow key={row.id}>
                          {row.getVisibleCells().map((cell) => {
                            const isCompactColumn = ["select", "actions"].includes(cell.column.id);
                            return (
                              <TableCell
                                key={cell.id}
                                style={{
                                  width: cell.column.getSize(),
                                  minWidth: cell.column.getSize(),
                                  maxWidth: cell.column.getSize(),
                                }}
                                className={isCompactColumn ? "px-1 text-center" : undefined}
                              >
                                {flexRender(
                                  cell.column.columnDef.cell,
                                  cell.getContext(),
                                )}
                              </TableCell>
                            );
                          })}
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </div>

              {/* Pagination and page size selector - Only show when there's data */}
              {areas.length > 0 && (
                <>
                  {/* Pagination controls */}
                  <div className="flex flex-col items-center gap-2 flex-shrink-0">
                    <div className="flex items-center gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() =>
                          setCurrentPage(Math.max(1, currentPage - 1))
                        }
                        disabled={currentPage === 1 || isEditing}
                      >
                        <ChevronLeft className="h-4 w-4" />
                        <span className="hidden md:inline">Anterior</span>
                      </Button>

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
                            if (startPage > 2) {
                              pages.push("...");
                            }
                          }

                          for (let i = startPage; i <= endPage; i++) {
                            pages.push(i);
                          }

                          if (endPage < totalPages) {
                            if (endPage < totalPages - 1) {
                              pages.push("...");
                            }
                            pages.push(totalPages);
                          }

                          return pages.map((page, idx) => (
                            <Button
                              key={`${page}-${idx}`}
                              variant={
                                currentPage === page ? "default" : "outline"
                              }
                              size="sm"
                              onClick={() =>
                                typeof page === "number" && setCurrentPage(page)
                              }
                              disabled={page === "..." || isEditing}
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
                          const endPage = Math.min(
                            totalPages,
                            startPage + maxButtons - 1,
                          );

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
                              variant={
                                currentPage === page ? "default" : "outline"
                              }
                              size="sm"
                              onClick={() => setCurrentPage(page)}
                              disabled={isEditing}
                            >
                              {page}
                            </Button>
                          ));
                        })()}
                      </div>

                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() =>
                          setCurrentPage(Math.min(totalPages, currentPage + 1))
                        }
                        disabled={currentPage === totalPages || isEditing}
                      >
                        <span className="hidden md:inline">Siguiente</span>
                        <ChevronRight className="h-4 w-4" />
                      </Button>
                    </div>
                    <p className="text-xs text-muted-foreground">
                      Mostrando {(currentPage - 1) * pageSize + 1}-
                      {Math.min(currentPage * pageSize, totalRecords)} de{" "}
                      {totalRecords} áreas
                    </p>
                  </div>
                </>
              )}
            </DndContext>
          </>
        )}
      </CardContent>
    </Card>
  );
};

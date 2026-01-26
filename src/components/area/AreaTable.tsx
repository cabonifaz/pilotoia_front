import { useState, useRef, useEffect, useMemo } from "react";
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
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: header.id });

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

  return (
    <TableHead ref={setNodeRef} style={style} className="bg-white border-b">
      <div className="flex items-center gap-2">
        <div
          {...attributes}
          {...listeners}
          className="cursor-grab active:cursor-grabbing text-muted-foreground/50"
        >
          ::
        </div>
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
interface AreaTableProps {
  searchTerm: string;
  onConfigureAi?: (areaId: number, idEmpresa: number, areaName: string) => void;
}

export const AreaTable = ({ searchTerm, onConfigureAi }: AreaTableProps) => {
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [orderField, setOrderField] = useState<
    "AREA" | "FCHCRE" | "ID_ESTADO_REGISTRO"
  >("AREA");
  const [orderDirection, setOrderDirection] = useState<"ASC" | "DESC">("ASC");
  const [statusFilter, setStatusFilter] = useState<number | null>(null);
  const [editingAreaId, setEditingAreaId] = useState<number | null>(null);
  const [editingAreaName, setEditingAreaName] = useState<string>("");
  const [originalAreaName, setOriginalAreaName] = useState<string>("");
  const inputRef = useRef<HTMLInputElement>(null);
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
      setColumnOrder((items) => {
        const oldIndex = items.indexOf(active.id as string);
        const newIndex = items.indexOf(over.id as string);
        return arrayMove(items, oldIndex, newIndex);
      });
    }
  };

  // ... dentro de AreaTable
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
        size: 50,
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
                initialValue={editingAreaName} // Solo se usa al montar
                isPending={updateAreaName.isPending}
                onSave={(newName) => handleSaveAreaName(newName)} // Pasamos el nuevo nombre aquí
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
                  onClick={(e) => e.stopPropagation()} // Importante para que no dispare el sort
                >
                  <Filter className="h-3 w-3" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="start">
                <DropdownMenuItem
                  onClick={() => {
                    setStatusFilter(null);
                    setCurrentPage(1);
                  }}
                >
                  Todos
                </DropdownMenuItem>
                <DropdownMenuItem
                  onClick={() => {
                    setStatusFilter(1);
                    setCurrentPage(1);
                  }}
                >
                  Activo
                </DropdownMenuItem>
                <DropdownMenuItem
                  onClick={() => {
                    setStatusFilter(0);
                    setCurrentPage(1);
                  }}
                >
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
        cell: (info) => (
          <AreaRowActions
            areaId={info.row.original.ID_AREA}
            areaName={info.row.original.AREA}
            status={info.row.original.ID_ESTADO_REGISTRO}
            onEdit={() => {
              setEditingAreaId(info.row.original.ID_AREA);
              setEditingAreaName(info.row.original.AREA);
              setOriginalAreaName(info.row.original.AREA);
            }}
            onDelete={(id) =>
              updateAreaStatus.mutate({ id_empresa, id_area: id, status: 0 })
            }
            onReactivate={(id) =>
              updateAreaStatus.mutate({ id_empresa, id_area: id, status: 1 })
            }
            onConfigureAi={
              onConfigureAi
                ? () =>
                    onConfigureAi(
                      info.row.original.ID_AREA,
                      id_empresa,
                      info.row.original.AREA,
                    )
                : undefined
            }
          />
        ),
        size: 50,
      }),
    ],
    [editingAreaId, id_empresa, statusFilter], // Añadido statusFilter a las dependencias
  );
  const EditableAreaCell = ({
    initialValue,
    onSave,
    onCancel,
    isPending,
  }: {
    initialValue: string;
    onSave: (name: string) => void;
    onCancel: () => void;
    isPending: boolean;
  }) => {
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
  };
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
  // Cambia esto:
  const handleSaveAreaName = async (newName?: string) => {
    // Usa el valor pasado por parámetro o, en su defecto, el del estado
    const nameToSave = (
      typeof newName === "string" ? newName : editingAreaName
    ).trim();

    if (!editingAreaId || !id_empresa || nameToSave === "") {
      setEditingAreaId(null);
      return;
    }

    if (nameToSave === originalAreaName) {
      setEditingAreaId(null);
      return;
    }

    try {
      const result = await updateAreaName.mutateAsync({
        id_empresa,
        id_area: editingAreaId,
        area: nameToSave, // Usamos el nombre procesado
      });

      if (result.results?.[0]?.ID_TIPO_MENSAJE === 1) {
        setEditingAreaName(originalAreaName);
      }

      setEditingAreaId(null);
      setEditingAreaName("");
      setOriginalAreaName("");
    } catch (error) {
      setEditingAreaName(originalAreaName);
      setEditingAreaId(null);
    }
  };

  const handleCancelEdit = () => {
    setEditingAreaName(originalAreaName);
    setEditingAreaId(null);
    setOriginalAreaName("");
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      e.preventDefault();
      handleSaveAreaName();
    } else if (e.key === "Escape") {
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

  // Reset to first page when search term or status filter changes
  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, statusFilter]);

  // Handle page size change
  const handlePageSizeChange = (value: string) => {
    setPageSize(Number(value));
    setCurrentPage(1); // Reset to first page when changing page size
  };

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
                            items={columnOrder}
                            strategy={horizontalListSortingStrategy}
                          >
                            {headerGroup.headers.map((header) => (
                              <DraggableTableHeader
                                key={header.id}
                                header={header}
                                onSortClick={(id) => {
                                  setOrderDirection(
                                    orderField === id &&
                                      orderDirection === "ASC"
                                      ? "DESC"
                                      : "ASC",
                                  );
                                  setOrderField(id);
                                  setCurrentPage(1);
                                }}
                                orderField={orderField}
                                orderDirection={orderDirection}
                              />
                            ))}
                          </SortableContext>
                        </TableRow>
                      ))}
                    </TableHeader>
                    <TableBody>
                      {areas.map((area) => {
                        // Buscamos la fila correspondiente en la instancia de tanstack
                        const row = table
                          .getRowModel()
                          .rows.find(
                            (r) => r.original.ID_AREA === area.ID_AREA,
                          );

                        if (!row) return null;

                        return (
                          <TableRow key={row.id}>
                            {row.getVisibleCells().map((cell) => (
                              <TableCell
                                key={cell.id}
                                style={{ width: cell.column.getSize() }}
                              >
                                {flexRender(
                                  cell.column.columnDef.cell,
                                  cell.getContext(),
                                )}
                              </TableCell>
                            ))}
                          </TableRow>
                        );
                      })}
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
                              disabled={page === "..."}
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
                        disabled={currentPage === totalPages}
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

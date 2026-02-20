import { useState, useMemo, useCallback, useEffect, memo } from "react";
import {
  ChevronLeft,
  ChevronRight,
  FileText,
  LoaderCircle,
  Filter,
  ArrowUp,
  ArrowDown,
} from "lucide-react";
import { Card, CardContent, CardHeader } from "@/components/shadcn/card";
import { Button } from "@/components/shadcn/button";
import { Badge } from "@/components/shadcn/badge";
import { Checkbox } from "@/components/shadcn/checkbox";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
} from "@/components/shadcn/dropdown-menu";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/shadcn/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/shadcn/table";
import { DocumentPreviewModal } from "./DocumentPreviewModal";
import { useProcessingLogsPaginated } from "@/hooks/useProcessingLogs";
import { toast } from "@/hooks/use-toast";

// --- TANSTACK & DND IMPORTS ---
import {
  useReactTable,
  getCoreRowModel,
  flexRender,
  createColumnHelper,
  type Header,
  type RowSelectionState,
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
import TableWithPaginationSkeleton from "../shadcn/table-skeleton";

// --- TIPOS Y AYUDAS ---

type BadgeVariant =
  | "success"
  | "gray"
  | "destructive"
  | "info"
  | "purple"
  | "cyan"
  | "warning"
  | "orange"
  | "teal"
  | "default"
  | "outline"
  | "secondary"
  | "pink"
  | null
  | undefined;

type StatusBadge = {
  label: string;
  variant?: BadgeVariant;
};

const getStatusFromStage = (idEstadoProceso: number, estadoNombre: string) => {
  const badgeColorMap: { [key: number]: BadgeVariant } = {
    0: "cyan",        // Subiendo
    1: "warning",     // En cola (extracción)
    2: "purple",      // Extrayendo texto
    3: "info",        // En cola (segmentación)
    4: "orange",      // Segmentando
    5: "teal",        // En cola (vectorización)
    6: "warning",     // Vectorizando
    7: "success",     // Cargado ← terminal success
    8: "destructive", // Error   ← terminal error
  };

  const statusBadge: StatusBadge = { label: estadoNombre };

  if (idEstadoProceso < 0) {
    statusBadge.variant = "destructive" as const;
  } else {
    statusBadge.variant =
      badgeColorMap[idEstadoProceso] || ("secondary" as const);
  }

  return statusBadge || { label: "Desconocido", variant: "secondary" as const };
};

const formatDate = (isoDate: string | null): string => {
  if (!isoDate) return "-";
  const date = new Date(isoDate);
  return date.toLocaleDateString("es-ES", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
};

interface DocumentData {
  id: string;
  id_documento: number;
  nombre_documento: string;
  ruta_documento: string;
  fchcre: string;
  id_proceso: number;
  nro_intento: number;
  id_estado_proceso: number;
  estado_nombre: string;
  fch_inicio: string | null;
  fch_fin: string | null;
  duracion_seg: number | null;
  mensaje_error: string | null;
  status: StatusBadge;
}

// --- COMPONENTE DE CABECERA ARRASTRABLE ---
interface DraggableTableHeaderProps {
  header: Header<DocumentData, unknown>;
  onSortClick: (field: string) => void;
  orderField: string | null;
  orderDirection: "ASC" | "DESC";
}

const DraggableTableHeader = memo(
  ({
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

    const isSortable = [
      "NOMBRE_DOCUMENTO",
      "FCHCRE",
      "ID_ESTADO_PROCESO",
      "FCH_INICIO",
      "FCH_FIN",
      "DURACION_SEG",
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
  },
);

DraggableTableHeader.displayName = "DraggableTableHeader";

// --- COMPONENTE PRINCIPAL ---

interface DocumentsTableProps {
  searchTerm: string;
  selectedRows?: string[];
  onSelectionChange?: (selectedIds: string[]) => void;
  uploadTrigger?: number;
}

const columnHelper = createColumnHelper<DocumentData>();

export const DocumentsTable = ({
  searchTerm,
  onSelectionChange,
  uploadTrigger,
}: DocumentsTableProps) => {
  // 1. Estados de Paginación y Filtros
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [orderField, setOrderField] = useState<
    | "NOMBRE_DOCUMENTO"
    | "FCHCRE"
    | "ID_ESTADO_PROCESO"
    | "FCH_INICIO"
    | "FCH_FIN"
    | "DURACION_SEG"
  >("FCHCRE");
  const [orderDirection, setOrderDirection] = useState<"ASC" | "DESC">("DESC");
  const [statusFilter, setStatusFilter] = useState<number | null>(null);

  // 2. Estados de Vista Previa (Modal)
  const [previewOpen, setPreviewOpen] = useState(false);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [previewDocName, setPreviewDocName] = useState<string>("");
  const [loadingPreview, setLoadingPreview] = useState(false);

  // 3. Estados de la Tabla (Orden Columnas y Selección)
  const [columnOrder, setColumnOrder] = useState<string[]>(() => [
    "select",
    "NOMBRE_DOCUMENTO",
    "FCHCRE",
    "FCH_INICIO",
    "FCH_FIN",
    "DURACION_SEG",
    "NRO_INTENTO",
    "ID_ESTADO_PROCESO",
    "actions",
  ]);
  const [rowSelection, setRowSelection] = useState<RowSelectionState>({});

  // 4. Reset y Effects
  useEffect(() => {
    if (uploadTrigger && uploadTrigger > 0) {
      setCurrentPage(1);
      setOrderField("FCHCRE");
      setOrderDirection("DESC");
    }
  }, [uploadTrigger]);

  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, statusFilter]);

  // Query de Datos
  const { data, isLoading, isFetching, error } = useProcessingLogsPaginated(
    currentPage,
    pageSize,
    searchTerm,
    orderField,
    orderDirection,
    statusFilter,
  );

  // Transformación de datos para la tabla
  const tableData: DocumentData[] = useMemo(() => {
    return (
      data?.registros?.map((r) => ({
        id: r.ID_DOCUMENTO.toString(),
        id_documento: r.ID_DOCUMENTO,
        nombre_documento: r.NOMBRE_DOCUMENTO,
        ruta_documento: r.RUTA_DOCUMENTO,
        fchcre: r.FCHCRE,
        id_proceso: r.ID_PROCESO,
        nro_intento: r.NRO_INTENTO,
        id_estado_proceso: r.ID_ESTADO_PROCESO,
        estado_nombre: r.ESTADO_NOMBRE,
        fch_inicio: r.FCH_INICIO,
        fch_fin: r.FCH_FIN,
        duracion_seg: r.DURACION_SEG,
        mensaje_error: r.MENSAJE_ERROR,
        status: getStatusFromStage(r.ID_ESTADO_PROCESO, r.ESTADO_NOMBRE),
      })) || []
    );
  }, [data]);

  // Sincronizar selección de TanStack con props externos
  useEffect(() => {
    if (onSelectionChange) {
      const selectedIds = Object.keys(rowSelection);
      onSelectionChange(selectedIds);
    }
  }, [rowSelection, onSelectionChange]);

  // Handlers
  const handleSortClick = useCallback(
    (field: string) => {
      setOrderDirection((prev) =>
        orderField === field && prev === "ASC" ? "DESC" : "ASC",
      );
      setOrderField(field as typeof orderField);
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

  const handleViewDocument = useCallback(
    async (ruta_documento: string, name: string) => {
      try {
        setLoadingPreview(true);
        setPreviewDocName(name);

        const response = await fetch(
          `${import.meta.env.VITE_API_BASE_URL}/api/v1/knowledge/document/url?ruta_documento=${encodeURIComponent(ruta_documento)}`,
        );
        const responseData = await response.json();

        if (!response.ok) {
          throw new Error(
            responseData?.result?.mensaje || "Error al obtener documento",
          );
        }

        setPreviewUrl(responseData.url);
        setPreviewOpen(true);
      } catch (err) {
        console.error(err);
        toast({
          title: "Error",
          description: "No se pudo cargar el documento.",
          variant: "destructive",
        });
      } finally {
        setLoadingPreview(false);
      }
    },
    [],
  );

  // --- DND SETUP ---
  const sensors = useSensors(
    useSensor(MouseSensor, { activationConstraint: { distance: 8 } }),
    useSensor(TouchSensor),
    useSensor(KeyboardSensor),
  );

  const handleDragEnd = useCallback((event: DragEndEvent) => {
    const { active, over } = event;
    if (active && over && active.id !== over.id) {
      if (over.id === "select" || over.id === "actions") return;
      setColumnOrder((items) => {
        const oldIndex = items.indexOf(active.id as string);
        const newIndex = items.indexOf(over.id as string);
        return arrayMove(items, oldIndex, newIndex);
      });
    }
  }, []);

  useEffect(() => {
    setRowSelection({});
  }, [
    currentPage,
    pageSize,
    searchTerm,
    statusFilter,
    orderField,
    orderDirection,
  ]);

  // --- DEFINICIÓN DE COLUMNAS ---
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
        size: 40,
        minSize: 40,
        maxSize: 40,
      }),
      columnHelper.accessor("nombre_documento", {
        id: "NOMBRE_DOCUMENTO",
        header: "Nombre",
        cell: (info) => (
          <div className="flex items-start gap-2">
            <FileText className="h-4 w-4 text-blue-500 mt-1 shrink-0 self-center" />
            <span className="whitespace-normal break-words">
              {info.getValue()}
            </span>
          </div>
        ),
        minSize: 200,
      }),
      columnHelper.accessor("fchcre", {
        id: "FCHCRE",
        header: "Creado el",
        cell: (info) => formatDate(info.getValue()),
      }),
      columnHelper.accessor("fch_inicio", {
        id: "FCH_INICIO",
        header: "Inicio proceso",
        cell: (info) => formatDate(info.getValue()),
      }),
      columnHelper.accessor("fch_fin", {
        id: "FCH_FIN",
        header: "Fin proceso",
        cell: (info) => formatDate(info.getValue()),
      }),
      columnHelper.accessor("duracion_seg", {
        id: "DURACION_SEG",
        header: "Duración (s)",
        cell: (info) => {
          const val = info.getValue();
          return val !== null ? `${val}s` : "-";
        },
      }),
      columnHelper.accessor("nro_intento", {
        id: "NRO_INTENTO",
        header: "Intentos",
      }),
      columnHelper.accessor("status", {
        id: "ID_ESTADO_PROCESO",
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
                  className={statusFilter === null ? "bg-accent" : ""}
                >
                  Todos
                </DropdownMenuItem>
                <DropdownMenuItem
                  onClick={() => handleStatusFilterChange(0)}
                  className={statusFilter === 0 ? "bg-accent" : ""}
                >
                  Subiendo
                </DropdownMenuItem>
                <DropdownMenuItem
                  onClick={() => handleStatusFilterChange(1)}
                  className={statusFilter === 1 ? "bg-accent" : ""}
                >
                  En cola (extracción)
                </DropdownMenuItem>
                <DropdownMenuItem
                  onClick={() => handleStatusFilterChange(2)}
                  className={statusFilter === 2 ? "bg-accent" : ""}
                >
                  Extrayendo texto
                </DropdownMenuItem>
                <DropdownMenuItem
                  onClick={() => handleStatusFilterChange(3)}
                  className={statusFilter === 3 ? "bg-accent" : ""}
                >
                  En cola (segmentación)
                </DropdownMenuItem>
                <DropdownMenuItem
                  onClick={() => handleStatusFilterChange(4)}
                  className={statusFilter === 4 ? "bg-accent" : ""}
                >
                  Segmentando
                </DropdownMenuItem>
                <DropdownMenuItem
                  onClick={() => handleStatusFilterChange(5)}
                  className={statusFilter === 5 ? "bg-accent" : ""}
                >
                  En cola (vectorización)
                </DropdownMenuItem>
                <DropdownMenuItem
                  onClick={() => handleStatusFilterChange(6)}
                  className={statusFilter === 6 ? "bg-accent" : ""}
                >
                  Vectorizando
                </DropdownMenuItem>
                <DropdownMenuItem
                  onClick={() => handleStatusFilterChange(7)}
                  className={statusFilter === 7 ? "bg-accent" : ""}
                >
                  Cargado
                </DropdownMenuItem>
                <DropdownMenuItem
                  onClick={() => handleStatusFilterChange(8)}
                  className={statusFilter === 8 ? "bg-accent" : ""}
                >
                  Error
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        ),
        cell: (info) => (
          <div className="flex flex-col gap-1">
            <div className="flex items-center gap-2">
              <Badge variant={info.getValue().variant}>
                {info.getValue().label}
              </Badge>
              {info.row.original.fch_fin === null &&
                info.row.original.id_estado_proceso !== 7 &&
                info.row.original.id_estado_proceso !== 8 && (
                  <LoaderCircle className="h-4 w-4 animate-spin text-muted-foreground" />
                )}
            </div>
            {info.row.original.id_estado_proceso === 8 &&
              info.row.original.mensaje_error && (
                <span className="text-xs text-destructive">
                  {info.row.original.mensaje_error}
                </span>
              )}
          </div>
        ),
      }),
      columnHelper.display({
        id: "actions",
        cell: (info) => (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button className="text-muted-foreground hover:text-foreground px-2">
                ⋮
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem
                onClick={() =>
                  handleViewDocument(
                    info.row.original.ruta_documento,
                    info.row.original.nombre_documento,
                  )
                }
              >
                Ver documento
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        ),
        size: 40,
      }),
    ],
    [statusFilter, handleStatusFilterChange],
  );

  // --- TABLA INSTANCIA ---
  const table = useReactTable({
    data: tableData,
    columns,
    state: {
      columnOrder,
      rowSelection,
    },
    onColumnOrderChange: setColumnOrder,
    onRowSelectionChange: setRowSelection,
    getCoreRowModel: getCoreRowModel(),
    manualPagination: true,
    getRowId: (row) => row.id,
  });

  const draggableColumns = useMemo(
    () => columnOrder.filter((id) => id !== "select" && id !== "actions"),
    [columnOrder],
  );

  const totalPages = data?.total_paginas || 0;
  const totalRecords = data?.total_registros || 0;
  const startIndex = (currentPage - 1) * pageSize + 1;
  const endIndex = Math.min(currentPage * pageSize, totalRecords);

  return (
    <Card className="flex-1 flex flex-col min-h-0">
      <CardHeader className="pb-3">
        <div className="flex justify-between items-start">
          <div className="flex flex-col items-start gap-1">
            <h1 className="text-2xl font-bold text-foreground">Documentos</h1>
            <p className="text-xs text-muted-foreground">
              Gestiona todos los documentos de la empresa.
            </p>
          </div>

          {!isLoading && !error && tableData.length > 0 && (
            <div className="flex items-center gap-2">
              <span className="text-sm text-muted-foreground hidden md:inline">
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
                  <SelectItem value="50">50</SelectItem>
                </SelectContent>
              </Select>
            </div>
          )}
        </div>
      </CardHeader>

      <CardContent className="flex-1 flex flex-col min-h-0 overflow-hidden gap-4 relative">
        {(isLoading || isFetching) && (
          <div className="absolute inset-0 z-30 bg-white/80 backdrop-blur-[1px] p-6">
            <TableWithPaginationSkeleton
              pageSize={pageSize}
              columnCount={columnOrder.length}
            />
          </div>
        )}

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
              <div
                className={`flex-1 min-h-0 border rounded-lg ${isFetching ? "opacity-20" : "opacity-100"} transition-opacity`}
              >
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
                    <TableBody className="text-xs">
                      {table.getRowModel().rows.length === 0 ? (
                        <TableRow>
                          <TableCell
                            colSpan={columns.length}
                            className="h-24 text-center"
                          >
                            <p className="text-muted-foreground">
                              {statusFilter !== null
                                ? `No se encontraron documentos en el estado seleccionado`
                                : searchTerm
                                  ? `No se encontraron documentos que coincidan con "${searchTerm}"`
                                  : "No hay documentos registrados"}
                            </p>
                          </TableCell>
                        </TableRow>
                      ) : (
                        table.getRowModel().rows.map((row) => (
                          <TableRow key={row.id}>
                            {row.getVisibleCells().map((cell) => {
                              const isCompactColumn = [
                                "select",
                                "actions",
                              ].includes(cell.column.id);
                              return (
                                <TableCell
                                  key={cell.id}
                                  style={{
                                    width: cell.column.getSize(),
                                    minWidth: cell.column.getSize(),
                                    maxWidth: cell.column.getSize(),
                                  }}
                                  className={
                                    isCompactColumn
                                      ? "px-1 text-center"
                                      : undefined
                                  }
                                >
                                  {flexRender(
                                    cell.column.columnDef.cell,
                                    cell.getContext(),
                                  )}
                                </TableCell>
                              );
                            })}
                          </TableRow>
                        ))
                      )}
                    </TableBody>
                  </Table>
                </div>
              </div>
            </DndContext>

            {/* Paginación */}
            {tableData.length > 0 && (
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
                  Mostrando {startIndex}-{endIndex} de {totalRecords} documentos
                </p>
              </div>
            )}
          </>
        )}
      </CardContent>

      <DocumentPreviewModal
        open={previewOpen}
        onOpenChange={setPreviewOpen}
        url={previewUrl}
        documentName={previewDocName}
        loading={loadingPreview}
      />
    </Card>
  );
};

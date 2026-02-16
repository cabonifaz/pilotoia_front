import { useState, useMemo, useEffect, useCallback, memo } from "react";
import {
  useReactTable,
  getCoreRowModel,
  flexRender,
  createColumnHelper,
  getPaginationRowModel,
  getFilteredRowModel,
  getSortedRowModel,
  type Header,
  type SortingState,
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
import {
  ChevronLeft,
  ChevronRight,
  Cpu,
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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/shadcn/select";
import { useGetModels } from "@/hooks/useIAModelsQueries";
import TableWithPaginationSkeleton from "../shadcn/table-skeleton";

// --- TIPOS ---
interface IAModel {
  ID_MODELO: number;
  NOMBRE: string;
  IDENTIFICADOR: string;
  PROVEEDOR: string;
  TIPO: string;
  EXTRA: number;
  ID_ESTADO_REGISTRO: number;
}

// --- COMPONENTE DE CABECERA ARRASTRABLE ---
interface DraggableTableHeaderProps {
  header: Header<IAModel, unknown>;
}

const DraggableTableHeader = memo(({ header }: DraggableTableHeaderProps) => {
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

  const style = {
    transform: CSS.Translate.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
    zIndex: isDragging ? 100 : 1,
    position: "relative" as const,
    width: header.column.getSize(),
  };

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
          className={`flex items-center gap-1 ${
            header.column.getCanSort() ? "cursor-pointer select-none" : ""
          }`}
          onClick={header.column.getToggleSortingHandler()}
        >
          {flexRender(header.column.columnDef.header, header.getContext())}
          {{
            asc: <ArrowUp className="h-3 w-3" />,
            desc: <ArrowDown className="h-3 w-3" />,
          }[header.column.getIsSorted() as string] ?? null}
        </div>
      </div>
    </TableHead>
  );
});

DraggableTableHeader.displayName = "DraggableTableHeader";

const getExtraParameterLabel = (tipo: string): string => {
  if (tipo.includes("Embeddings")) return "Vector Size";
  if (tipo.includes("Text") || tipo.includes("Vision")) return "Max Tokens";
  return "Parameter";
};

const columnHelper = createColumnHelper<IAModel>();

export const AiTable = ({
  searchTerm,
  sortBy,
}: {
  searchTerm: string;
  sortBy: string | null;
}) => {
  const [rowSelection, setRowSelection] = useState({});
  const [sorting, setSorting] = useState<SortingState>([]);
  const [pageSize, setPageSize] = useState(10);
  const [columnOrder, setColumnOrder] = useState<string[]>(() => [
    "select",
    "NOMBRE",
    "IDENTIFICADOR",
    "PROVEEDOR",
    "TIPO",
    "EXTRA",
    "ID_ESTADO_REGISTRO",
  ]);

  const { data, isLoading, isFetching, error } = useGetModels();

  const sensors = useSensors(
    useSensor(MouseSensor, { activationConstraint: { distance: 8 } }),
    useSensor(TouchSensor),
    useSensor(KeyboardSensor),
  );

  // --- 1. LÓGICA DE COLUMNAS CON TAMAÑOS DEFINIDOS ---
  const columns = useMemo(
    () => [
      columnHelper.display({
        id: "select",
        header: ({ table }) => (
          <Checkbox
            checked={table.getIsAllPageRowsSelected()}
            onCheckedChange={(value) =>
              table.toggleAllPageRowsSelected(!!value)
            }
          />
        ),
        cell: ({ row }) => (
          <Checkbox
            checked={row.getIsSelected()}
            onCheckedChange={(value) => row.toggleSelected(!!value)}
          />
        ),
        size: 50, // Ancho fijo pequeño
      }),
      columnHelper.accessor("NOMBRE", {
        header: "Nombre",
        size: 250, // Esta columna puede ser más ancha
        cell: (info) => (
          <div className="flex items-center gap-2">
            <Cpu className="h-4 w-4 text-blue-500" />
            <span className="font-medium">{info.getValue()}</span>
          </div>
        ),
      }),
      columnHelper.accessor("IDENTIFICADOR", {
        header: "Identificador",
        size: 200,
        cell: (info) => (
          <code className="text-xs bg-muted p-1 rounded">
            {info.getValue()}
          </code>
        ),
      }),
      columnHelper.accessor("PROVEEDOR", {
        header: "Proveedor",
        size: 150,
      }),
      columnHelper.accessor("TIPO", {
        header: "Tipo",
        size: 150,
      }),
      columnHelper.accessor("EXTRA", {
        header: "Parámetro",
        size: 180,
        cell: (info) => (
          <div>
            <span className="text-muted-foreground mr-1">
              {getExtraParameterLabel(info.row.original.TIPO)}:
            </span>
            <span>{Math.floor(info.getValue())}</span>
          </div>
        ),
      }),
      columnHelper.accessor("ID_ESTADO_REGISTRO", {
        header: "Estado",
        size: 120, // Ancho final
        cell: (info) => (
          <Badge variant={info.getValue() === 1 ? "success" : "destructive"}>
            {info.getValue() === 1 ? "Activo" : "Inactivo"}
          </Badge>
        ),
      }),
    ],
    [],
  );

  const table = useReactTable({
    data: data?.models || [],
    columns,
    state: {
      sorting,
      columnOrder,
      rowSelection,
      globalFilter: searchTerm,
    },
    initialState: {
      pagination: {
        pageSize,
      },
    },
    onSortingChange: setSorting,
    onColumnOrderChange: setColumnOrder,
    onRowSelectionChange: setRowSelection,
    getCoreRowModel: getCoreRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getRowId: (row) => row.ID_MODELO.toString(),
  });

  // Reset selection when page or search changes
  useEffect(() => {
    setRowSelection({});
  }, [table.getState().pagination.pageIndex, searchTerm]);

  useEffect(() => {
    if (sortBy) {
      setSorting([{ id: sortBy.toUpperCase(), desc: false }]);
    }
  }, [sortBy]);

  const handleDragEnd = useCallback((event: DragEndEvent) => {
    const { active, over } = event;
    if (active && over && active.id !== over.id) {
      if (over.id === "select") return;
      setColumnOrder((items) => {
        const oldIndex = items.indexOf(active.id as string);
        const newIndex = items.indexOf(over.id as string);
        return arrayMove(items, oldIndex, newIndex);
      });
    }
  }, []);

  const handlePageSizeChange = useCallback(
    (value: string) => {
      const newSize = Number(value);
      setPageSize(newSize);
      table.setPageSize(newSize);
      table.setPageIndex(0);
    },
    [table],
  );

  const draggableColumns = useMemo(
    () => columnOrder.filter((id) => id !== "select"),
    [columnOrder],
  );

  const currentPage = table.getState().pagination.pageIndex + 1;
  const totalPages = table.getPageCount();
  const totalRecords = table.getFilteredRowModel().rows.length;
  const startIndex = (currentPage - 1) * pageSize + 1;
  const endIndex = Math.min(currentPage * pageSize, totalRecords);

  return (
    <Card className="flex-1 flex flex-col min-h-0">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex flex-col items-start gap-1">
            <h1 className="text-2xl font-bold text-foreground">Modelos IA</h1>
            <p className="text-xs text-muted-foreground">
              Gestiona los modelos disponibles.
            </p>
          </div>

          {!isLoading && !error && totalRecords > 0 && (
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
        {(isLoading || isFetching) && (
          <div className="absolute inset-0 z-30 bg-white/80 backdrop-blur-[1px] p-6">
            <TableWithPaginationSkeleton
              pageSize={pageSize}
              columnCount={columnOrder.length}
            />
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
                  <Table className="w-full table-fixed">
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
                            colSpan={columnOrder.length}
                            className="h-24 text-center"
                          >
                            <p className="text-muted-foreground">
                              {searchTerm
                                ? `No se encontraron coincidencias para "${searchTerm}"`
                                : "No hay modelos registrados"}
                            </p>
                          </TableCell>
                        </TableRow>
                      ) : (
                        table.getRowModel().rows.map((row) => (
                          <TableRow
                            key={row.id}
                            data-state={row.getIsSelected() && "selected"}
                          >
                            {row.getVisibleCells().map((cell) => (
                              <TableCell
                                key={cell.id}
                                style={{ width: cell.column.getSize() }}
                                className={
                                  cell.column.id === "select"
                                    ? "px-1 text-center"
                                    : "truncate"
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

            {totalRecords > 0 && (
              <div className="flex flex-col items-center gap-2 flex-shrink-0">
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => table.previousPage()}
                    disabled={!table.getCanPreviousPage()}
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

                      const pages: (number | string)[] = [];
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
                            typeof page === "number" &&
                            table.setPageIndex(page - 1)
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
                    <Button variant="outline" size="sm" disabled>
                      {currentPage} / {totalPages}
                    </Button>
                  </div>

                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => table.nextPage()}
                    disabled={!table.getCanNextPage()}
                  >
                    <span className="hidden md:inline">Siguiente</span>
                    <ChevronRight className="h-4 w-4" />
                  </Button>
                </div>
                <p className="text-xs text-muted-foreground">
                  Mostrando {startIndex}-{endIndex} de {totalRecords} modelos
                </p>
              </div>
            )}
          </>
        )}
      </CardContent>
    </Card>
  );
};

import { useState, useMemo, useCallback, useEffect, memo } from "react";
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
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/shadcn/dropdown-menu";
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
  Building2,
  Filter,
  ArrowUp,
  ArrowDown,
} from "lucide-react";
import {
  useGetCompaniesPaginated,
  useUpdateCompanyStatus,
} from "@/hooks/useCompanyQueries";
import { CompanyRowActions } from "@/components/company";
import { toast } from "@/hooks/use-toast";
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
// --- COMPONENTE DE CABECERA ARRASTRABLE ---
interface DraggableTableHeaderProps {
  header: Header<Company, unknown>;
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
      "RUC",
      "RAZON_SOCIAL",
      "FCHCRE",
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
  },
);

DraggableTableHeader.displayName = "DraggableTableHeader";

// Format date to readable format
const formatDate = (isoDate: string): string => {
  const date = new Date(isoDate);
  return date.toLocaleDateString("es-ES", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
};

interface CompanyTableProps {
  searchTerm: string;
  // sortBy: 'ruc' | 'razon_social' | null;
  onUpdateLogo: (
    companyId: number,
    companyName: string,
    companyLogo: string | null,
  ) => void;
}
interface Company {
  ID_EMPRESA: number;
  RUC: string;
  RAZON_SOCIAL: string;
  FCHCRE: string;
  ID_ESTADO_REGISTRO: number;
  LOGO: string | null;
  SECRET_KEY: string;
}

const columnHelper = createColumnHelper<Company>();

export const CompanyTable = ({
  searchTerm,
  onUpdateLogo,
}: CompanyTableProps) => {
  // --- ESTADOS EXISTENTES ---
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [orderField, setOrderField] = useState<
    "ID_EMPRESA" | "RUC" | "RAZON_SOCIAL" | "FCHCRE" | "ID_ESTADO_REGISTRO"
  >("RAZON_SOCIAL");
  const [orderDirection, setOrderDirection] = useState<"ASC" | "DESC">("ASC");
  const [statusFilter, setStatusFilter] = useState<number | null>(null);
  const [rowSelection, setRowSelection] = useState({});
  // 1. Estado para el orden de las columnas
  const [columnOrder, setColumnOrder] = useState<string[]>(() => [
    "select",
    "RUC",
    "RAZON_SOCIAL",
    "FCHCRE",
    "ID_ESTADO_REGISTRO",
    "actions",
  ]);
  const { data, isLoading, isFetching, error } = useGetCompaniesPaginated(
    currentPage,
    pageSize,
    searchTerm,
    orderField,
    orderDirection,
    statusFilter,
  );

  const updateCompanyStatus = useUpdateCompanyStatus();

  // 3. Sensores para DND
  const sensors = useSensors(
    useSensor(MouseSensor, { activationConstraint: { distance: 8 } }),
    useSensor(TouchSensor),
    useSensor(KeyboardSensor),
  );

  // 4. Manejador del final del arrastre
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

  // Memoized handler for generating URL
  const handleGenerateURL = useCallback((secretKey: string) => {
    const url = `${window.location.origin}/#/?ref=${secretKey}`;
    navigator.clipboard
      .writeText(url)
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
          variant: "destructive",
        });
        console.error("Error al copiar la URL:", err);
      });
  }, []);

  // Reset row selection when data context changes
  useEffect(() => {
    setRowSelection({});
  }, [
    currentPage,
    pageSize,
    orderField,
    orderDirection,
    statusFilter,
    searchTerm,
  ]);

  // Memoized sort handler
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

  // Memoized page size handler
  const handlePageSizeChange = useCallback((value: string) => {
    setPageSize(Number(value));
    setCurrentPage(1);
  }, []);

  // Memoized status filter handler
  const handleStatusFilterChange = useCallback((status: number | null) => {
    setStatusFilter(status);
    setCurrentPage(1);
  }, []);

  // --- LÓGICA DE COLUMNAS (TANSTACK) ---
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
        size: 20,
        minSize: 20,
        maxSize: 20,
      }),
      columnHelper.accessor("RUC", {
        header: "RUC",
        cell: (info) => (
          <div className="flex items-center gap-2">
            <Building2 className="h-4 w-4 text-blue-500" />
            <span>{info.getValue()}</span>
          </div>
        ),
      }),
      columnHelper.accessor("RAZON_SOCIAL", {
        header: "Razón Social",
      }),
      columnHelper.accessor("FCHCRE", {
        header: "Fecha de Creación",
        cell: (info) => formatDate(info.getValue()),
      }),
      columnHelper.accessor("ID_ESTADO_REGISTRO", {
        id: "ID_ESTADO_REGISTRO",
        // Header personalizado para incluir tu Dropdown de Filtro
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
        cell: (info) => (
          <CompanyRowActions
            companyId={info.row.original.ID_EMPRESA}
            companyName={info.row.original.RAZON_SOCIAL}
            companyLogo={info.row.original.LOGO}
            status={info.row.original.ID_ESTADO_REGISTRO}
            secretKey={info.row.original.SECRET_KEY}
            onDelete={(id) =>
              updateCompanyStatus.mutate({ id_empresa: id, status: 0 })
            }
            onReactivate={(id) =>
              updateCompanyStatus.mutate({ id_empresa: id, status: 1 })
            }
            onUpdateLogo={onUpdateLogo}
            onGenerateURL={handleGenerateURL}
            isPending={updateCompanyStatus.isPending}
          />
        ),
        size: 20,
        minSize: 20,
        maxSize: 20,
      }),
    ],
    [
      statusFilter,
      updateCompanyStatus,
      onUpdateLogo,
      handleGenerateURL,
      handleStatusFilterChange,
    ],
  );

  const table = useReactTable({
    data: data?.data || [],
    columns,
    state: {
      columnOrder,
      rowSelection, // Agregado
    },
    onColumnOrderChange: setColumnOrder,
    onRowSelectionChange: setRowSelection, // Agregado
    getCoreRowModel: getCoreRowModel(),
    manualPagination: true,
    // Opcional: define cómo identificar cada fila (si no, usa el índice)
    getRowId: (row) => row.ID_EMPRESA.toString(),
  });

  const companies = data?.data || [];
  const pagination = data?.pagination || {
    total_records: 0,
    current_page: 1,
    page_size: 10,
    total_pages: 0,
  };

  const totalPages = pagination.total_pages;
  const startIndex = (pagination.current_page - 1) * pagination.page_size + 1;
  const endIndex = Math.min(
    pagination.current_page * pagination.page_size,
    pagination.total_records,
  );

  const draggableColumns = useMemo(
    () => columnOrder.filter((id) => id !== "select" && id !== "actions"),
    [columnOrder],
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

          {/* Selector - Oculto totalmente en mobile con 'hidden' */}
          {!isLoading && !error && companies.length > 0 && (
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
          <div className="absolute inset-0 z-30 bg-card backdrop-blur-[1px] p-6">
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
                            No se encontraron resultados.
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
            {/* Pagination - Solo mostrar si hay datos */}
            {companies.length > 0 && (
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
                          variant={currentPage === page ? "default" : "outline"}
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
                  Mostrando {startIndex}-{endIndex} de{" "}
                  {pagination.total_records} empresas
                </p>
              </div>
            )}
          </>
        )}
      </CardContent>
    </Card>
  );
};

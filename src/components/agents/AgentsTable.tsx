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
  Filter,
  ArrowUp,
  ArrowDown,
} from "lucide-react";
import { useGetAgentesPaginated } from "@/hooks/useAgentsQueries";
import { useGetParametros } from "@/hooks/useParametrosQueries";
import { useQueryAuthContext } from "@/contexts/QueryAuthContext";
import { AgentRowActions } from "./AgentRowActions";
import type { Agente } from "@/types/agents";
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

// --- TIPOS DE DATOS ---
interface AgentRow {
  ID_AGENTE: number;
  NUMERO_TELF: string;
  CODIGO_PAIS: string;
  ID_TIPO_AGENTE: number;
  AREA: string;
  ACCESO_GENERAL: number;
  ESTADO_OPERATIVO: number;
  ID_ESTADO_REGISTRO: number;
  ID_AGENTE_EMPR_AREA: number;
  ID_EMPRESA: number;
  ID_AREA: number;
}

interface AgentGrouped extends AgentRow {
  AREAS_LIST: string[];
}

// --- COMPONENTE DE CABECERA ARRASTRABLE ---
interface DraggableTableHeaderProps {
  header: Header<AgentGrouped, unknown>;
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

    // Identificar columnas que deben estar centradas
    const isCentered = [
      "ID_TIPO_AGENTE",
      "ACCESO_GENERAL",
      "ESTADO_OPERATIVO",
      "ID_ESTADO_REGISTRO",
      "select",
      "actions",
    ].includes(columnId);

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
      "NUMERO_TELF",
      "ID_TIPO_AGENTE",
      "AREA",
      "ACCESO_GENERAL",
      "ESTADO_OPERATIVO",
      "ID_ESTADO_REGISTRO",
    ].includes(columnId);

    return (
      <TableHead
        ref={setNodeRef}
        style={style}
        // CORRECCIÓN AQUÍ:
        // Si es estático (select/actions), usamos px-1 para igualar al TableBody.
        // Si no, dejamos el padding por defecto o px-4.
        className={`bg-white border-b ${isStatic ? "px-1" : ""} ${
          isCentered ? "text-center" : "text-left"
        }`}
      >
        <div
          className={`flex items-center h-full ${
            isCentered ? "justify-center" : "justify-start gap-2"
          }`}
        >
          {!isStatic && (
            <div
              {...attributes}
              {...listeners}
              className="cursor-grab active:cursor-grabbing text-muted-foreground/50 mr-1"
            >
              ::
            </div>
          )}
          <div
            className={`flex items-center gap-1 ${
              isSortable ? "cursor-pointer select-none" : ""
            }`}
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

interface AgentsTableProps {
  searchTerm: string;
  onEditAgent: (agent: Agente) => void;
  onToggleStatus: (idAgente: number, currentStatus: number) => void;
  onToggleOperativo: (idAgente: number, currentOperativo: number) => void;
  onRegenerateSecretKey: (idAgente: number) => void;
  onChangeAccess: (agent: Agente, agentAreas: string[]) => void;
}

const columnHelper = createColumnHelper<AgentGrouped>();

export const AgentsTable = ({
  searchTerm,
  onEditAgent,
  onToggleStatus,
  onToggleOperativo,
  onRegenerateSecretKey,
  onChangeAccess,
}: AgentsTableProps) => {
  // --- ESTADOS ---
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [orderField, setOrderField] = useState<string>("NUMERO_TELF");
  const [orderDirection, setOrderDirection] = useState<"ASC" | "DESC">("ASC");

  const [statusFilter, setStatusFilter] = useState<number | null>(null);
  const [operativeFilter, setOperativeFilter] = useState<number | null>(null);

  const [rowSelection, setRowSelection] = useState({});

  const [columnOrder, setColumnOrder] = useState<string[]>(() => [
    "select",
    "NUMERO_TELF",
    "ID_TIPO_AGENTE",
    "AREA",
    "ACCESO_GENERAL",
    "ESTADO_OPERATIVO",
    "ID_ESTADO_REGISTRO",
    "actions",
  ]);

  const { user } = useQueryAuthContext();
  const id_empresa = (user as any)?.actual_company_area?.ID_EMPRESA;

  const { parametrosMap } = useGetParametros();
  const tiposAgente = parametrosMap["12"] || [];

  const { data, isLoading, isFetching, error } = useGetAgentesPaginated(
    id_empresa || 0,
    currentPage,
    pageSize,
    searchTerm,
    orderField,
    orderDirection,
    statusFilter,
    operativeFilter,
  );

  // --- SENSORES DND ---
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
    setCurrentPage(1);
    setRowSelection({});
  }, [
    searchTerm,
    statusFilter,
    operativeFilter,
    pageSize,
    orderField,
    orderDirection,
  ]);

  // Handlers
  const handleSortClick = useCallback(
    (field: string) => {
      setOrderDirection((prev) =>
        orderField === field && prev === "ASC" ? "DESC" : "ASC",
      );
      setOrderField(field);
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

  const handleOperativeFilterChange = useCallback((status: number | null) => {
    setOperativeFilter(status);
    setCurrentPage(1);
  }, []);

  // --- DATA PROCESSING ---
  const tableData = useMemo(() => {
    // If useGetAgentesPaginated returns Agente[], and Agente matches AgentRow,
    // you might need a type assertion if the names are slightly different.
    const rawData = (data?.data as AgentRow[]) || [];
    const groupedMap = new Map<number, AgentGrouped>();

    rawData.forEach((item) => {
      if (!groupedMap.has(item.ID_AGENTE)) {
        groupedMap.set(item.ID_AGENTE, {
          ...item,
          AREAS_LIST: [item.AREA],
        });
      } else {
        const existing = groupedMap.get(item.ID_AGENTE)!;
        existing.AREAS_LIST.push(item.AREA);
      }
    });

    return Array.from(groupedMap.values());
  }, [data]);

  // --- COLUMNAS ---
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
      columnHelper.accessor("NUMERO_TELF", {
        header: "Teléfono",
        cell: (info) => {
          const codigoPais = info.row.original.CODIGO_PAIS;
          const numeroTelf = info.getValue();
          const [codigoNumerico, codigoIso] = codigoPais.split("-");
          const localNumber = numeroTelf.startsWith(codigoNumerico)
            ? numeroTelf.slice(codigoNumerico.length)
            : numeroTelf;

          return (
            <div className="flex items-center gap-2">
              <img
                src={`https://flagcdn.com/w20/${codigoIso.toLowerCase()}.png`}
                alt={codigoIso}
                className="w-5 h-3 object-cover"
              />
              <span>
                +{codigoNumerico} {localNumber}
              </span>
            </div>
          );
        },
      }),
      columnHelper.accessor("ID_TIPO_AGENTE", {
        header: "Tipo de Agente",
        cell: (info) => {
          const value = info.getValue();
          const variantMap: Record<number, "success" | "blue" | "outline"> = {
            1: "success",
            2: "blue",
            3: "outline",
          };
          const label =
            tiposAgente.find((t) => t.NUM1 === value)?.STRING1 ||
            `Tipo ${value}`;
          return (
            <div className="flex justify-center">
              <Badge variant={variantMap[value] || "default"}>{label}</Badge>
            </div>
          );
        },
      }),
      columnHelper.accessor("AREA", {
        header: "Áreas con Acceso",
        cell: (info) => {
          const areas = info.row.original.AREAS_LIST;

          return (
            <div className="flex flex-col gap-1">
              {areas.map((area, idx) => (
                <span key={`${info.row.id}-${idx}`}>{area}</span>
              ))}
            </div>
          );
        },
      }),
      columnHelper.accessor("ACCESO_GENERAL", {
        header: "Acceso General",
        cell: (info) => (
          <div className="flex justify-center">
            <Badge variant={info.getValue() === 1 ? "success" : "outline"}>
              {info.getValue() === 1 ? "Sí" : "No"}
            </Badge>
          </div>
        ),
      }),
      columnHelper.accessor("ESTADO_OPERATIVO", {
        id: "ESTADO_OPERATIVO",
        header: () => (
          <div className="flex items-center justify-center gap-2">
            <span>Estado Operativo</span>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="ghost"
                  size="sm"
                  className={`h-6 w-6 p-0 ${operativeFilter !== null ? "text-blue-600" : ""}`}
                >
                  <Filter className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="start">
                <DropdownMenuItem
                  onClick={() => handleOperativeFilterChange(null)}
                >
                  Todos
                </DropdownMenuItem>
                <DropdownMenuItem
                  onClick={() => handleOperativeFilterChange(1)}
                >
                  Operativo
                </DropdownMenuItem>
                <DropdownMenuItem
                  onClick={() => handleOperativeFilterChange(0)}
                >
                  Inoperativo
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        ),
        cell: (info) => (
          <div className="flex justify-center">
            <Badge variant={info.getValue() === 1 ? "success" : "destructive"}>
              {info.getValue() === 1 ? "Operativo" : "Inoperativo"}
            </Badge>
          </div>
        ),
      }),
      columnHelper.accessor("ID_ESTADO_REGISTRO", {
        id: "ID_ESTADO_REGISTRO",
        header: () => (
          <div className="flex items-center justify-center gap-2">
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
          <div className="flex justify-center">
            <Badge variant={info.getValue() === 1 ? "success" : "destructive"}>
              {info.getValue() === 1 ? "Activo" : "Inactivo"}
            </Badge>
          </div>
        ),
      }),
      columnHelper.display({
        id: "actions",
        cell: (info) => {
          const agent = info.row.original;
          return (
            <AgentRowActions
              status={agent.ID_ESTADO_REGISTRO}
              operativo={agent.ESTADO_OPERATIVO}
              onEdit={() => onEditAgent(agent)}
              onToggleStatus={() =>
                onToggleStatus(agent.ID_AGENTE, agent.ID_ESTADO_REGISTRO)
              }
              onToggleOperativo={() =>
                onToggleOperativo(agent.ID_AGENTE, agent.ESTADO_OPERATIVO)
              }
              onRegenerateSecretKey={() =>
                onRegenerateSecretKey(agent.ID_AGENTE)
              }
              onChangeAccess={() => onChangeAccess(agent, agent.AREAS_LIST)}
            />
          );
        },
        size: 40,
        minSize: 40,
        maxSize: 40,
      }),
    ],
    [
      statusFilter,
      operativeFilter,
      handleStatusFilterChange,
      handleOperativeFilterChange,
      onEditAgent,
      onToggleStatus,
      onToggleOperativo,
      onRegenerateSecretKey,
      onChangeAccess,
    ],
  );

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
    getRowId: (row) => row.ID_AGENTE.toString(),
  });

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

  if (!id_empresa) {
    return (
      <Card className="flex-1 flex flex-col min-h-0">
        <CardHeader className="pb-3">
          <h1 className="text-2xl font-bold text-foreground">Agentes</h1>
        </CardHeader>
        <CardContent>
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
        <div className="flex items-center justify-between">
          <div className="flex flex-col items-start gap-1">
            <h1 className="text-2xl font-bold text-foreground">Agentes</h1>
            <p className="text-xs text-muted-foreground">
              Gestiona los agentes de la empresa.
            </p>
          </div>

          {!isLoading && !error && tableData.length > 0 && (
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
        {error && <p className="text-red-500">Error: {error.message}</p>}

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

            {/* Pagination */}
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

                  <div className="flex md:hidden gap-1">
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
                  Mostrando {startIndex}-{endIndex} de{" "}
                  {pagination.total_records} agentes
                </p>
              </div>
            )}
          </>
        )}
      </CardContent>
    </Card>
  );
};

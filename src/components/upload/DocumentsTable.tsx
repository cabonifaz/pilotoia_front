import { useState, useRef, useEffect } from "react";
import {
  ChevronLeft,
  ChevronRight,
  FileText,
  LoaderCircle,
  Filter,
  GripVertical,
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
import { DocumentPreviewModal } from "./DocumentPreviewModal";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/shadcn/table";
import { Loader } from "@/components/loader/Loader";
import { useProcessingLogsPaginated } from "@/hooks/useProcessingLogs";
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
  TouchSensor,
} from "@dnd-kit/core";
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  horizontalListSortingStrategy,
  useSortable,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";

// 1. Definimos la estructura de las columnas
const INITIAL_COLUMNS = [
  { id: "selection", label: "" },
  { id: "NOMBRE_DOCUMENTO", label: "Nombre" },
  { id: "USUARIO_CARGA", label: "Usuario Carga" },
  { id: "EMBEDDING_MODEL", label: "Modelo Embedding" },
  { id: "FCHCRE", label: "Creado el" },
  { id: "FCH_EXTRACCION", label: "Extracción" },
  { id: "FCH_SEGMENTACION", label: "Segmentación" },
  { id: "FCH_VECTORIZACION", label: "Vectorización" },
  { id: "FCHMOD", label: "Finalizado" },
  { id: "ID_ESTADO_PROCESO", label: "Estado" },
  { id: "actions", label: "" },
];
const COLUMN_DEFINITIONS = {
  selection: { label: "Selección", sortable: false },
  NOMBRE_DOCUMENTO: { label: "Nombre", sortable: true },
  USUARIO_CARGA: { label: "Usuario Carga", sortable: true },
  EMBEDDING_MODEL: { label: "Modelo Embedding", sortable: true },
  FCHCRE: { label: "Creado el", sortable: true },
  FCH_EXTRACCION: { label: "Extracción", sortable: true },
  FCH_SEGMENTACION: { label: "Segmentación", sortable: true },
  FCH_VECTORIZACION: { label: "Vectorización", sortable: true },
  FCHMOD: { label: "Finalizado", sortable: true },
  ID_ESTADO_PROCESO: { label: "Estado", sortable: true },
  actions: { label: "", sortable: false },
};
interface SortableHeaderProps {
  columnId: string;
  orderField: string;
  orderDirection: "ASC" | "DESC";
  handleSort: (field: any) => void;
  isAllSelected: boolean;
  handleSelectAll: (checked: boolean) => void;
  statusFilter: number | null;
  setStatusFilter: (status: number | null) => void;
  setCurrentPage: (page: number) => void; // <--- AGREGAR ESTA LÍNEA
}
const ESTADOS_PROCESO = [
  { id: 0, label: "Subiendo" },
  { id: 1, label: "En cola" },
  { id: 2, label: "Procesando" },
  { id: 3, label: "Texto extraído" },
  { id: 4, label: "Texto segmentado" },
  { id: 5, label: "Segmentos vectorizados" },
  { id: 6, label: "Cargado" },
  { id: 7, label: "Error" },
  // Agrega aquí cualquier otro que falte en tu base de datos
];
// 2. Componente de Celda de Encabezado Arrastrable
const SortableHeader = ({
  columnId,
  orderField,
  orderDirection,
  handleSort,
  isAllSelected,
  handleSelectAll,
  statusFilter,
  setStatusFilter,
  setCurrentPage,
}: SortableHeaderProps) => {
  const isStatic = columnId === "selection" || columnId === "actions";

  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({
    id: columnId,
    disabled: isStatic, // <--- ESTO deshabilita el drag para esta celda
  });

  // Dentro de SortableHeader
  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
    backgroundColor: isDragging
      ? "hsl(var(--accent))"
      : "hsl(var(--background))",
    zIndex: isDragging ? 20 : 10,
    touchAction: "none", // <--- AGREGAR ESTO para evitar scroll accidental
  };
  // Función para manejar el sort evitando que dnd-kit se entere
  const onSortClick = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation(); // <--- IMPORTANTE: Evita que el evento suba al contenedor arrastrable
    handleSort(columnId);
  };
  const config =
    COLUMN_DEFINITIONS[columnId as keyof typeof COLUMN_DEFINITIONS];

  const getWidth = (id: string) => {
    switch (id) {
      case "selection":
        return "w-[60px]";
      case "NOMBRE_DOCUMENTO":
        return "w-[250px]"; // Más espacio para nombres
      case "ID_ESTADO_PROCESO":
        return "w-[120px]";
      case "actions":
        return "w-[60px]";
      case "USUARIO_CARGA":
        return "w-[140px]";
      case "EMBEDDING_MODEL":
        return "w-[160px]";
      default:
        return "w-[130px]"; // Un estándar para fechas
    }
  };
  return (
    <TableHead
      ref={setNodeRef}
      style={style}
      // Eliminamos whitespace-nowrap si queremos que quiebre linea,
      // o lo mantenemos con truncate para que no rompa el diseño.
      className={`px-2  ${getWidth(columnId)} overflow-hidden`}
    >
      <div className="flex items-center gap-1 w-full">
        {/* ICONO DE ARRASTRE */}
        {!isStatic && (
          <div
            {...attributes}
            {...listeners}
            className="cursor-grab active:cursor-grabbing hover:text-primary p-1 flex-shrink-0"
          >
            <GripVertical className="h-3 w-3 text-muted-foreground/30" />
          </div>
        )}

        {columnId === "selection" ? (
          <Checkbox
            checked={isAllSelected}
            onCheckedChange={(val) => handleSelectAll(val as boolean)}
          />
        ) : config?.sortable ? (
          <button
            onClick={onSortClick} // <--- Usamos la función con stopPropagation
            className="flex items-center gap-1 hover:text-foreground font-medium text-[11px] tracking-wider overflow-hidden w-full outline-none"
          >
            <span className="truncate text-left flex-1" title={config.label}>
              {config.label}
            </span>
            {orderField === columnId && (
              <span className="text-primary flex-shrink-0">
                {orderDirection === "ASC" ? "↑" : "↓"}
              </span>
            )}
          </button>
        ) : (
          <span
            className="font-bold text-[11px]  tracking-wider truncate flex-1"
            title={config?.label}
          >
            {config?.label}
          </span>
        )}
        {/* FILTRO: Solo aparece si la columna es ID_ESTADO_PROCESO */}
        {columnId === "ID_ESTADO_PROCESO" && (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                size="sm"
                className={`h-6 w-6 p-0 ${statusFilter !== null ? "text-primary" : "text-muted-foreground"}`}
              >
                <Filter className="h-3 w-3" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent
              align="start"
              className="max-h-[300px] overflow-y-auto"
            >
              <DropdownMenuItem
                onClick={() => {
                  setStatusFilter(null);
                  setCurrentPage(1);
                }}
                className={statusFilter === null ? "bg-accent font-bold" : ""}
              >
                Todos los estados
              </DropdownMenuItem>

              {ESTADOS_PROCESO.map((estado) => (
                <DropdownMenuItem
                  key={estado.id}
                  onClick={() => {
                    setStatusFilter(estado.id);
                    setCurrentPage(1);
                  }}
                  className={
                    statusFilter === estado.id ? "bg-accent font-bold" : ""
                  }
                >
                  {estado.label}
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>
        )}
      </div>
    </TableHead>
  );
};
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

const getStatusFromStage = (idEstadoProceso: number, estadoProceso: string) => {
  const badgeColorMap: { [key: number]: BadgeVariant } = {
    0: "cyan",
    1: "warning",
    2: "purple",
    3: "info",
    4: "orange",
    5: "teal",
    6: "success",
    7: "destructive",
  };

  const statusBadge: StatusBadge = { label: estadoProceso };

  if (idEstadoProceso < 0) {
    statusBadge.variant = "destructive" as const;
  } else {
    statusBadge.variant =
      badgeColorMap[idEstadoProceso] || ("secondary" as const);
  }

  return statusBadge || { label: "Desconocido", variant: "secondary" as const };
};

const formatDate = (isoDate: string): string => {
  const date = new Date(isoDate);
  return date.toLocaleDateString("es-ES", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
};

interface DocumentsTableProps {
  searchTerm: string;
  selectedRows?: string[];
  onSelectionChange?: (selectedIds: string[]) => void;
  uploadTrigger?: number;
}

export const DocumentsTable = ({
  searchTerm,
  selectedRows = [],
  onSelectionChange,
  uploadTrigger,
}: DocumentsTableProps) => {
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [columnOrder, setColumnOrder] = useState(
    INITIAL_COLUMNS.map((c) => c.id),
  );
  const [orderField, setOrderField] = useState<
    | "NOMBRE_DOCUMENTO"
    | "FCHMOD"
    | "FCHCRE"
    | "ID_ESTADO_PROCESO"
    | "AREA"
    | "USUARIO_CARGA"
    | "EMBEDDING_MODEL"
    | "FCH_EXTRACCION"
    | "FCH_SEGMENTACION"
    | "FCH_VECTORIZACION"
  >("FCHMOD");
  const [orderDirection, setOrderDirection] = useState<"ASC" | "DESC">("DESC");
  const [statusFilter, setStatusFilter] = useState<number | null>(null);
  const tableContainerRef = useRef<HTMLDivElement>(null);
  const [previewOpen, setPreviewOpen] = useState(false);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [previewDocName, setPreviewDocName] = useState<string>("");
  const [loadingPreview, setLoadingPreview] = useState(false);

  useEffect(() => {
    if (uploadTrigger && uploadTrigger > 0) {
      setCurrentPage(1);
      setOrderField("FCHCRE");
      setOrderDirection("DESC");
    }
  }, [uploadTrigger]);

  // Server-side pagination query for the table
  const { data, isLoading, error } = useProcessingLogsPaginated(
    currentPage,
    pageSize,
    searchTerm,
    orderField,
    orderDirection,
    statusFilter,
  );
  // Sensores para DND
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        // Obliga a mover el mouse 5px antes de considerar que es un arrastre
        // Esto permite que los "clics rápidos" lleguen al botón de ordenamiento
        distance: 5,
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    }),
    useSensor(TouchSensor, {
      activationConstraint: {
        delay: 250,
        tolerance: 5,
      },
    }),
  );

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;

    if (over && active.id !== over.id) {
      // Definimos qué IDs son intocables
      const staticIds = ["selection", "actions"];

      if (staticIds.includes(over.id as string)) return;

      setColumnOrder((items) => {
        const oldIndex = items.indexOf(active.id as string);
        const newIndex = items.indexOf(over.id as string);
        return arrayMove(items, oldIndex, newIndex);
      });
    }
  };

  const handleViewDocument = async (ruta_documento: string, name: string) => {
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
      alert("No se pudo cargar el documento");
    } finally {
      setLoadingPreview(false);
    }
  };

  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, statusFilter]);

  const handleSort = (
    field:
      | "NOMBRE_DOCUMENTO"
      | "FCHMOD"
      | "FCHCRE"
      | "ID_ESTADO_PROCESO"
      | "AREA"
      | "USUARIO_CARGA"
      | "EMBEDDING_MODEL"
      | "FCH_EXTRACCION"
      | "FCH_SEGMENTACION"
      | "FCH_VECTORIZACION",
  ) => {
    if (orderField === field) {
      setOrderDirection(orderDirection === "ASC" ? "DESC" : "ASC");
    } else {
      setOrderField(field);
      setOrderDirection("ASC");
    }
    setCurrentPage(1);
  };

  const handlePageSizeChange = (value: string) => {
    setPageSize(Number(value));
    setCurrentPage(1);
  };

  const displayedDocuments =
    data?.registros?.map((upload) => ({
      id: upload.id,
      id_usuario: upload.id_usuario,
      usuario_carga: upload.usuario_carga || "Sistema",
      id_empresa: upload.id_empresa,
      empresa: upload.empresa || "Sin empresa",
      id_area: upload.id_area,
      area: upload.area || "Sin área",
      id_estado_proceso: upload.id_estado_proceso,
      estado_proceso: upload.estado_proceso,
      embedding_model_provider: upload.embedding_model_provider,
      embedding_model: upload.embedding_model,
      name: upload.documento || "Sin nombre",
      fecha_ultima_actualizacion: upload.fecha_ultima_actualizacion,
      createdDate: formatDate(upload.fecha_inicio),
      fecha_extraccion: upload.fecha_extraccion,
      fecha_segmentacion: upload.fecha_segmentacion,
      fecha_vectorizacion: upload.fecha_vectorizacion,
      fecha_finalizado: upload.fecha_finalizado,
      en_ejecucion: upload.en_ejecucion,
      ruta_documento: upload.ruta_documento,
      status: getStatusFromStage(
        upload.id_estado_proceso,
        upload.estado_proceso,
      ),
    })) || [];

  const totalPages = data?.total_paginas || 0;
  const totalRecords = data?.total_registros || 0;

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      const allIds = displayedDocuments.map((doc) => doc.id);
      onSelectionChange?.(allIds);
    } else {
      onSelectionChange?.([]);
    }
  };

  const handleSelectRow = (docId: string, checked: boolean) => {
    if (checked) {
      onSelectionChange?.([...selectedRows, docId]);
    } else {
      onSelectionChange?.(selectedRows.filter((id) => id !== docId));
    }
  };

  const isAllSelected =
    displayedDocuments.length > 0 &&
    displayedDocuments.every((doc) => selectedRows.includes(doc.id));

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

          {/* Page size selector - Top right */}
          {!isLoading && !error && displayedDocuments.length > 0 && (
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
                  <SelectItem value="50">50</SelectItem>
                </SelectContent>
              </Select>
            </div>
          )}
        </div>
      </CardHeader>

      <CardContent className="flex-1 flex flex-col min-h-0 overflow-hidden gap-4 relative">
        {/* Loading State */}
        {isLoading && <Loader text="Cargando documentos..." />}

        {/* Error State */}
        {error && (
          <div className="flex-1 flex items-center justify-center">
            <p className="text-red-500">Error: {error.message}</p>
          </div>
        )}

        {/* Table - Always show when not loading/error */}
        {!isLoading && !error && (
          <>
            <div
              ref={tableContainerRef}
              className="flex-1 min-h-0 border rounded-lg"
            >
              <div className="h-full overflow-y-auto">
                <DndContext
                  sensors={sensors}
                  collisionDetection={closestCenter}
                  onDragEnd={handleDragEnd}
                >
                  <Table className="table-fixed w-full">
                    <TableHeader>
                      <TableRow>
                        <SortableContext
                          items={columnOrder.filter(
                            (id) => id !== "selection" && id !== "actions",
                          )}
                          strategy={horizontalListSortingStrategy}
                        >
                          {columnOrder.map((columnId) => {
                            // 1. Buscamos la configuración de la columna
                            // Nota: Es mejor usar el objeto COLUMN_DEFINITIONS que definimos antes
                            // pero si usas el array INITIAL_COLUMNS, asegúrate de que exista.

                            return (
                              <SortableHeader
                                key={columnId}
                                columnId={columnId} // El ID único para dnd-kit
                                orderField={orderField} // Estado de ordenamiento (ej: 'FCHMOD')
                                orderDirection={orderDirection} // 'ASC' o 'DESC'
                                handleSort={handleSort} // Tu función original: (field) => { ... }
                                isAllSelected={isAllSelected} // Booleano para el checkbox global
                                handleSelectAll={handleSelectAll} // Función para marcar todos
                                statusFilter={statusFilter} // El estado del filtro de la API
                                setStatusFilter={setStatusFilter} // Función para cambiar el filtro
                                setCurrentPage={setCurrentPage} // Función para cambiar la página
                              />
                            );
                          })}
                        </SortableContext>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {displayedDocuments.map((doc) => (
                        <TableRow key={doc.id}>
                          {columnOrder.map((columnId) => (
                            <TableCell key={`${doc.id}-${columnId}`}>
                              {(() => {
                                switch (columnId) {
                                  case "selection":
                                    return (
                                      <Checkbox
                                        checked={selectedRows.includes(doc.id)}
                                        onCheckedChange={(checked) =>
                                          handleSelectRow(
                                            doc.id,
                                            checked as boolean,
                                          )
                                        }
                                      />
                                    );
                                  case "NOMBRE_DOCUMENTO":
                                    return (
                                      <div className="flex items-center gap-2">
                                        <FileText className="h-4 w-4 text-blue-500" />
                                        <span className="font-medium">
                                          {doc.name}
                                        </span>
                                      </div>
                                    );
                                  case "USUARIO_CARGA":
                                    return doc.usuario_carga;
                                  case "EMBEDDING_MODEL":
                                    return doc.embedding_model;
                                  case "FCHCRE":
                                    return doc.createdDate;
                                  case "FCH_EXTRACCION":
                                    return doc.fecha_extraccion
                                      ? formatDate(doc.fecha_extraccion)
                                      : "-";
                                  case "FCH_SEGMENTACION":
                                    return doc.fecha_segmentacion
                                      ? formatDate(doc.fecha_segmentacion)
                                      : "-";
                                  case "FCH_VECTORIZACION":
                                    return doc.fecha_vectorizacion
                                      ? formatDate(doc.fecha_vectorizacion)
                                      : "-";
                                  case "FCHMOD":
                                    return doc.fecha_finalizado
                                      ? formatDate(doc.fecha_finalizado)
                                      : "-";
                                  case "ID_ESTADO_PROCESO":
                                    return (
                                      <div className="flex items-center gap-2">
                                        <Badge variant={doc.status.variant}>
                                          {doc.status.label}
                                        </Badge>
                                        {doc.en_ejecucion === 1 && (
                                          <LoaderCircle className="h-4 w-4 animate-spin" />
                                        )}
                                      </div>
                                    );
                                  case "actions":
                                    return (
                                      <DropdownMenu>
                                        <DropdownMenuTrigger asChild>
                                          <button className="px-2">⋮</button>
                                        </DropdownMenuTrigger>
                                        <DropdownMenuContent align="end">
                                          <DropdownMenuItem
                                            onClick={() =>
                                              handleViewDocument(
                                                doc.ruta_documento,
                                                doc.name,
                                              )
                                            }
                                          >
                                            Ver documento
                                          </DropdownMenuItem>
                                        </DropdownMenuContent>
                                      </DropdownMenu>
                                    );
                                  default:
                                    return null;
                                }
                              })()}
                            </TableCell>
                          ))}
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </DndContext>
              </div>
            </div>

            {/* Pagination - Only show when there's data */}
            {displayedDocuments.length > 0 && (
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
                      let endPage = Math.min(
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
                      let endPage = Math.min(
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
                  Mostrando {(currentPage - 1) * pageSize + 1}-
                  {Math.min(currentPage * pageSize, totalRecords)} de{" "}
                  {totalRecords} documentos
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

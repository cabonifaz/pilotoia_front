import { useState, useRef, useEffect } from "react";
import {
  ChevronLeft,
  ChevronRight,
  FileText,
  LoaderCircle,
  Filter,
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
import {  useProcessingLogsPaginated } from "@/hooks/useProcessingLogs";

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

  let statusBadge: StatusBadge = { label: estadoProceso };

  if (idEstadoProceso < 0) {
    statusBadge.variant = "destructive" as const;
  } else {
    statusBadge.variant = badgeColorMap[idEstadoProceso] || ("secondary" as const);
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
  const [orderField, setOrderField] = useState<'NOMBRE_DOCUMENTO' | 'FCHMOD' | 'FCHCRE' | 'ID_ESTADO_PROCESO' | 'AREA' | 'USUARIO_CARGA' | 'EMBEDDING_MODEL' | 'FCH_EXTRACCION' | 'FCH_SEGMENTACION' | 'FCH_VECTORIZACION'>('FCHMOD');
  const [orderDirection, setOrderDirection] = useState<'ASC' | 'DESC'>('DESC');
  const [statusFilter, setStatusFilter] = useState<number | null>(null);
  const tableContainerRef = useRef<HTMLDivElement>(null);
  const [previewOpen, setPreviewOpen] = useState(false);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [previewDocName, setPreviewDocName] = useState<string>("");
  const [loadingPreview, setLoadingPreview] = useState(false);


  useEffect(() => {
    if (uploadTrigger && uploadTrigger > 0) {
      setCurrentPage(1);
      setOrderField('FCHCRE');
      setOrderDirection('DESC');
    }
  }, [uploadTrigger]);

  // Server-side pagination query for the table
  const {
    data,
    isLoading,
    error,
  } = useProcessingLogsPaginated(
    currentPage,
    pageSize,
    searchTerm,
    orderField,
    orderDirection,
    statusFilter
  );

  const handleViewDocument = async (ruta_documento: string, name: string) => {
    try {
      setLoadingPreview(true);
      setPreviewDocName(name);

      const response = await fetch(
        `${import.meta.env.VITE_API_BASE_URL}/api/v1/knowledge/document/url?ruta_documento=${encodeURIComponent(ruta_documento)}`
      );

      const responseData = await response.json();

      if (!response.ok) {
        throw new Error(responseData?.result?.mensaje || "Error al obtener documento");
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

  const handleSort = (field: 'NOMBRE_DOCUMENTO' | 'FCHMOD' | 'FCHCRE' | 'ID_ESTADO_PROCESO' | 'AREA' | 'USUARIO_CARGA' | 'EMBEDDING_MODEL' | 'FCH_EXTRACCION' | 'FCH_SEGMENTACION' | 'FCH_VECTORIZACION') => {
    if (orderField === field) {
      setOrderDirection(orderDirection === 'ASC' ? 'DESC' : 'ASC');
    } else {
      setOrderField(field);
      setOrderDirection('ASC');
    }
    setCurrentPage(1);
  };

  const handlePageSizeChange = (value: string) => {
    setPageSize(Number(value));
    setCurrentPage(1);
  };

  const displayedDocuments = data?.registros?.map((upload) => ({
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
    status: getStatusFromStage(upload.id_estado_proceso, upload.estado_proceso),
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
              <span className="text-sm text-muted-foreground">Filas por página:</span>
              <Select value={pageSize.toString()} onValueChange={handlePageSizeChange}>
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
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-12">
                        <Checkbox
                          checked={isAllSelected}
                          onCheckedChange={handleSelectAll}
                          aria-label="Seleccionar todos"
                        />
                      </TableHead>
                      <TableHead>
                        <button
                          onClick={() => handleSort('NOMBRE_DOCUMENTO')}
                          className="flex items-center gap-1 hover:text-foreground"
                        >
                          Nombre
                          {orderField === 'NOMBRE_DOCUMENTO' && (
                            <span>{orderDirection === 'ASC' ? '↑' : '↓'}</span>
                          )}
                        </button>
                      </TableHead>
                      <TableHead>
                        <button
                          onClick={() => handleSort('USUARIO_CARGA')}
                          className="flex items-center gap-1 hover:text-foreground"
                        >
                          Usuario Carga
                          {orderField === 'USUARIO_CARGA' && (
                            <span>{orderDirection === 'ASC' ? '↑' : '↓'}</span>
                          )}
                        </button>
                      </TableHead>
                      <TableHead>
                        <button
                          onClick={() => handleSort('EMBEDDING_MODEL')}
                          className="flex items-center gap-1 hover:text-foreground"
                        >
                          Modelo Embedding
                          {orderField === 'EMBEDDING_MODEL' && (
                            <span>{orderDirection === 'ASC' ? '↑' : '↓'}</span>
                          )}
                        </button>
                      </TableHead>
                      <TableHead>
                        <button
                          onClick={() => handleSort('FCHCRE')}
                          className="flex items-center gap-1 hover:text-foreground"
                        >
                          Creado el
                          {orderField === 'FCHCRE' && (
                            <span>{orderDirection === 'ASC' ? '↑' : '↓'}</span>
                          )}
                        </button>
                      </TableHead>
                      <TableHead>
                        <button
                          onClick={() => handleSort('FCH_EXTRACCION')}
                          className="flex items-center gap-1 hover:text-foreground"
                        >
                          Extracción
                          {orderField === 'FCH_EXTRACCION' && (
                            <span>{orderDirection === 'ASC' ? '↑' : '↓'}</span>
                          )}
                        </button>
                      </TableHead>
                      <TableHead>
                        <button
                          onClick={() => handleSort('FCH_SEGMENTACION')}
                          className="flex items-center gap-1 hover:text-foreground"
                        >
                          Segmentación
                          {orderField === 'FCH_SEGMENTACION' && (
                            <span>{orderDirection === 'ASC' ? '↑' : '↓'}</span>
                          )}
                        </button>
                      </TableHead>
                      <TableHead>
                        <button
                          onClick={() => handleSort('FCH_VECTORIZACION')}
                          className="flex items-center gap-1 hover:text-foreground"
                        >
                          Vectorización
                          {orderField === 'FCH_VECTORIZACION' && (
                            <span>{orderDirection === 'ASC' ? '↑' : '↓'}</span>
                          )}
                        </button>
                      </TableHead>
                      <TableHead>
                        <button
                          onClick={() => handleSort('FCHMOD')}
                          className="flex items-center gap-1 hover:text-foreground"
                        >
                          Finalizado
                          {orderField === 'FCHMOD' && (
                            <span>{orderDirection === 'ASC' ? '↑' : '↓'}</span>
                          )}
                        </button>
                      </TableHead>
                      <TableHead>
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => handleSort('ID_ESTADO_PROCESO')}
                            className="flex items-center gap-1 hover:text-foreground"
                          >
                            Estado
                            {orderField === 'ID_ESTADO_PROCESO' && (
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
                                  setStatusFilter(0);
                                  setCurrentPage(1);
                                }}
                                className={statusFilter === 0 ? 'bg-accent' : ''}
                              >
                                Subiendo
                              </DropdownMenuItem>
                              <DropdownMenuItem
                                onClick={() => {
                                  setStatusFilter(1);
                                  setCurrentPage(1);
                                }}
                                className={statusFilter === 1 ? 'bg-accent' : ''}
                              >
                                En cola
                              </DropdownMenuItem>
                              <DropdownMenuItem
                                onClick={() => {
                                  setStatusFilter(2);
                                  setCurrentPage(1);
                                }}
                                className={statusFilter === 2 ? 'bg-accent' : ''}
                              >
                                Procesando
                              </DropdownMenuItem>
                              <DropdownMenuItem
                                onClick={() => {
                                  setStatusFilter(3);
                                  setCurrentPage(1);
                                }}
                                className={statusFilter === 3 ? 'bg-accent' : ''}
                              >
                                Texto extraído
                              </DropdownMenuItem>
                              <DropdownMenuItem
                                onClick={() => {
                                  setStatusFilter(4);
                                  setCurrentPage(1);
                                }}
                                className={statusFilter === 4 ? 'bg-accent' : ''}
                              >
                                Texto segmentado
                              </DropdownMenuItem>
                              <DropdownMenuItem
                                onClick={() => {
                                  setStatusFilter(5);
                                  setCurrentPage(1);
                                }}
                                className={statusFilter === 5 ? 'bg-accent' : ''}
                              >
                                Segmentos vectorizados
                              </DropdownMenuItem>
                              <DropdownMenuItem
                                onClick={() => {
                                  setStatusFilter(6);
                                  setCurrentPage(1);
                                }}
                                className={statusFilter === 6 ? 'bg-accent' : ''}
                              >
                                Cargado
                              </DropdownMenuItem>
                              <DropdownMenuItem
                                onClick={() => {
                                  setStatusFilter(7);
                                  setCurrentPage(1);
                                }}
                                className={statusFilter === 7 ? 'bg-accent' : ''}
                              >
                                Error
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </div>
                      </TableHead>
                      <TableHead className="w-12"></TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {displayedDocuments.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={12} className="h-24 text-center">
                          <p className="text-muted-foreground">
                            {statusFilter !== null
                              ? `No se encontraron documentos en el estado seleccionado`
                              : searchTerm
                                ? `No se encontraron documentos que coincidan con "${searchTerm}"`
                                : 'No hay documentos registrados'}
                          </p>
                        </TableCell>
                      </TableRow>
                    ) : (
                      displayedDocuments.map((doc) => (
                        <TableRow key={doc.id}>
                          <TableCell>
                            <Checkbox
                              checked={selectedRows.includes(doc.id)}
                              onCheckedChange={(checked) =>
                                handleSelectRow(doc.id, checked as boolean)
                              }
                              aria-label={`Seleccionar ${doc.name}`}
                            />
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center gap-2">
                              <FileText className="h-4 w-4 text-blue-500" />
                              <span>{doc.name}</span>
                            </div>
                          </TableCell>
                          <TableCell>{doc.usuario_carga}</TableCell>
                          <TableCell>{doc.embedding_model}</TableCell>
                          <TableCell>{doc.createdDate}</TableCell>
                          <TableCell>
                            {doc.fecha_extraccion
                              ? formatDate(doc.fecha_extraccion)
                              : "-"}
                          </TableCell>
                          <TableCell>
                            {doc.fecha_segmentacion
                              ? formatDate(doc.fecha_segmentacion)
                              : "-"}
                          </TableCell>
                          <TableCell>
                            {doc.fecha_vectorizacion
                              ? formatDate(doc.fecha_vectorizacion)
                              : "-"}
                          </TableCell>
                          <TableCell>
                            {doc.fecha_finalizado
                              ? formatDate(doc.fecha_finalizado)
                              : "-"}
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center gap-2">
                              <Badge variant={doc.status.variant}>
                                {doc.status.label}
                              </Badge>
                              {doc.en_ejecucion === 1 && (
                                <LoaderCircle className="h-4 w-4 animate-spin text-muted-foreground" />
                              )}
                            </div>
                          </TableCell>
                          <TableCell>
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
                                      doc.ruta_documento,
                                      doc.name
                                    )
                                  }
                                >
                                  Ver documento
                                </DropdownMenuItem>
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
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
                        startPage + maxButtons - 1
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
                        startPage + maxButtons - 1
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
                  Mostrando {(currentPage - 1) * pageSize + 1}-{Math.min(currentPage * pageSize, totalRecords)} de {totalRecords} documentos
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
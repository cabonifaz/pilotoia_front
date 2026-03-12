import { useState } from "react";
import {
  CheckCircle2,
  XCircle,
  LoaderCircle,
  Clock,
  FileText,
  Download,
  BarChart2,
  Layers,
} from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/shadcn/dialog";
import { Badge } from "@/components/shadcn/badge";
import { Button } from "@/components/shadcn/button";
import { Card, CardContent } from "@/components/shadcn/card";
import { useDocumentDetail } from "@/hooks/useDocumentDetail";
import type { RagDocumentStageLog } from "@/types/upload";

// ── helpers ────────────────────────────────────────────────────────────────

function formatTime(iso: string | null): string {
  if (!iso) return "-";
  const d = new Date(iso);
  return d.toLocaleTimeString("es-ES", { hour: "2-digit", minute: "2-digit", second: "2-digit" });
}

function formatDate(iso: string | null): string {
  if (!iso) return "-";
  const d = new Date(iso);
  return d.toLocaleDateString("es-ES", { day: "2-digit", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" });
}

function formatSize(bytes: number | null): string {
  if (bytes == null) return "-";
  if (bytes >= 1_048_576) return `${(bytes / 1_048_576).toFixed(1)} MB`;
  return `${(bytes / 1024).toFixed(1)} kB`;
}

// ── stage icon ──────────────────────────────────────────────────────────────

function StageIcon({ resultado }: { resultado: number | null }) {
  if (resultado === 1)
    return <CheckCircle2 className="h-7 w-7 text-green-500 shrink-0" />;
  if (resultado === 0)
    return <XCircle className="h-7 w-7 text-destructive shrink-0" />;
  return <LoaderCircle className="h-7 w-7 text-muted-foreground shrink-0 animate-spin" />;
}

// ── stage badge ─────────────────────────────────────────────────────────────

function ResultadoBadge({ texto }: { texto: string }) {
  const variant =
    texto === "Éxito" ? "success" :
    texto === "Error" ? "destructive" :
    "warning";
  return <Badge variant={variant as "success" | "destructive" | "warning"}>{texto}</Badge>;
}

// ── artifact download button ─────────────────────────────────────────────────

const ARTIFACT_LABELS: Record<number, string> = { 1: ".MD", 2: ".JSON" };

function ArtifactButton({ etapa }: { etapa: RagDocumentStageLog }) {
  const [loading, setLoading] = useState(false);
  const label = ARTIFACT_LABELS[etapa.id_etapa];
  if (!label || !etapa.ruta_resultado) return null;

  const handleDownload = async () => {
    setLoading(true);
    try {
      const resp = await fetch(
        `${import.meta.env.VITE_API_BASE_URL}/api/v1/knowledge/document/url?ruta_documento=${encodeURIComponent(etapa.ruta_resultado!)}`
      );
      const data = await resp.json();
      if (resp.ok && data.url) window.open(data.url, "_blank");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Button variant="outline" size="sm" onClick={handleDownload} disabled={loading} className="shrink-0 gap-1 text-xs">
      {loading ? <LoaderCircle className="h-3 w-3 animate-spin" /> : <Download className="h-3 w-3" />}
      {label}
    </Button>
  );
}

// ── stage row ────────────────────────────────────────────────────────────────

const STAGE_NAMES: Record<number, string> = {
  1: "Extracción",
  2: "Segmentación",
  3: "Vectorización",
};

function StageRow({ etapa }: { etapa: RagDocumentStageLog }) {
  const name = STAGE_NAMES[etapa.id_etapa] ?? etapa.etapa_nombre;
  const timeRange =
    etapa.fch_inicio
      ? `Inicio ${formatTime(etapa.fch_inicio)}${etapa.fch_fin ? ` • Fin ${formatTime(etapa.fch_fin)}` : ""}`
      : null;

  return (
    <div className="flex items-start gap-3">
      <StageIcon resultado={etapa.resultado} />
      <div className="flex-1 min-w-0">
        <div className="flex flex-wrap items-center gap-2">
          <span className="font-medium text-sm">{name}</span>
          <ResultadoBadge texto={etapa.resultado_texto} />
        </div>
        {timeRange && (
          <p className="text-xs text-muted-foreground mt-0.5">{timeRange}</p>
        )}
        {etapa.resultado === 0 && etapa.mensaje_error && (
          <p className="text-xs text-destructive mt-1 break-words">{etapa.mensaje_error}</p>
        )}
      </div>
      <ArtifactButton etapa={etapa} />
    </div>
  );
}

// ── connector line between stages ────────────────────────────────────────────

function Connector() {
  return <div className="ml-3.5 w-px h-5 bg-border" />;
}

// ── main component ───────────────────────────────────────────────────────────

interface DocumentDetailModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  idDocumento: number | null;
}

export function DocumentDetailModal({ open, onOpenChange, idDocumento }: DocumentDetailModalProps) {
  const { data, isLoading, error } = useDocumentDetail(open ? idDocumento : null);
  const [loadingPdf, setLoadingPdf] = useState(false);

  const handleVerPdf = async () => {
    if (!data?.ruta_documento) return;
    setLoadingPdf(true);
    try {
      const resp = await fetch(
        `${import.meta.env.VITE_API_BASE_URL}/api/v1/knowledge/document/url?ruta_documento=${encodeURIComponent(data.ruta_documento)}`
      );
      const json = await resp.json();
      if (resp.ok && json.url) window.open(json.url, "_blank");
    } finally {
      setLoadingPdf(false);
    }
  };

  // Cost calculations
  const totalCost = data?.etapas.reduce((sum, e) => sum + (e.costo_usd ?? 0), 0) ?? 0;
  const hasCosts = data?.etapas.some((e) => (e.costo_usd ?? 0) > 0);
  const chunkingStage = data?.etapas.find((e) => e.id_etapa === 2);

  // Sort stages by id_etapa for consistent display order
  const stages = data?.etapas ? [...data.etapas].sort((a, b) => a.id_etapa - b.id_etapa) : [];

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Detalles de Procesamiento</DialogTitle>

          {data && (
            <div className="flex items-center justify-between mt-1">
              <div className="flex items-center gap-2 text-sm text-muted-foreground flex-wrap">
                <FileText className="h-4 w-4 shrink-0" />
                <span className="font-medium text-foreground truncate max-w-xs">{data.nombre_documento}</span>
                {data.tamano_bytes != null && (
                  <><span>•</span><span>{formatSize(data.tamano_bytes)}</span></>
                )}
                {data.cant_paginas != null && (
                  <><span>•</span><span>{data.cant_paginas} pág.</span></>
                )}
              </div>
              <Button
                variant="ghost"
                size="sm"
                className="shrink-0 text-xs gap-1"
                onClick={handleVerPdf}
                disabled={loadingPdf}
              >
                {loadingPdf
                  ? <LoaderCircle className="h-3 w-3 animate-spin" />
                  : <FileText className="h-3 w-3" />}
                Ver PDF
              </Button>
            </div>
          )}
        </DialogHeader>

        {/* ── Loading / Error states ── */}
        {isLoading && (
          <div className="flex justify-center items-center py-16">
            <LoaderCircle className="h-8 w-8 animate-spin text-muted-foreground" />
          </div>
        )}

        {error && (
          <p className="text-destructive text-sm py-8 text-center">
            Error al cargar los detalles del documento.
          </p>
        )}

        {/* ── Content ── */}
        {data && (
          <div className="space-y-6">

            {/* Processing Timeline */}
            <section>
              <div className="flex items-center gap-2 mb-4">
                <BarChart2 className="h-4 w-4 text-primary" />
                <h3 className="font-semibold text-sm">Línea de tiempo de procesamiento</h3>
              </div>

              {stages.length === 0 ? (
                <p className="text-sm text-muted-foreground">Sin registros de procesamiento.</p>
              ) : (
                <div>
                  {stages.map((etapa, idx) => (
                    <div key={etapa.id_log}>
                      <StageRow etapa={etapa} />
                      {idx < stages.length - 1 && <Connector />}
                    </div>
                  ))}
                </div>
              )}
            </section>

            {/* Bottom cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">

              {/* Cost card */}
              <Card>
                <CardContent className="pt-4 pb-4">
                  <div className="flex items-center gap-2 mb-3">
                    <BarChart2 className="h-4 w-4 text-primary" />
                    <h4 className="font-semibold text-sm">Costo por etapa</h4>
                  </div>

                  {!hasCosts ? (
                    <p className="text-xs text-muted-foreground">Sin costos registrados.</p>
                  ) : (
                    <div className="space-y-1.5">
                      {stages.filter((e) => (e.costo_usd ?? 0) > 0).map((e) => (
                        <div key={e.id_log} className="flex justify-between text-sm">
                          <span className="text-muted-foreground">{STAGE_NAMES[e.id_etapa] ?? e.etapa_nombre}</span>
                          <span className="font-medium tabular-nums">${e.costo_usd!.toFixed(6)}</span>
                        </div>
                      ))}
                      <div className="border-t my-2" />
                      <div className="flex justify-between text-sm font-semibold">
                        <span>Total</span>
                        <span className="tabular-nums">${totalCost.toFixed(6)}</span>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Chunking details card */}
              <Card>
                <CardContent className="pt-4 pb-4">
                  <div className="flex items-center gap-2 mb-3">
                    <Layers className="h-4 w-4 text-primary" />
                    <h4 className="font-semibold text-sm">Detalles de Segmentación</h4>
                  </div>

                  <div className="text-center py-2">
                    <p className="text-4xl font-bold">
                      {chunkingStage?.cant_chunks ?? "-"}
                    </p>
                    <p className="text-xs text-muted-foreground mt-1">Segmentos generados</p>
                  </div>

                  {chunkingStage && (
                    <div className="mt-3 text-xs text-muted-foreground space-y-1">
                      {chunkingStage.fch_inicio && chunkingStage.fch_fin && (
                        <p>
                          <Clock className="inline h-3 w-3 mr-1" />
                          Duración: {chunkingStage.duracion_seg ?? 0}s
                        </p>
                      )}
                      <p className="text-muted-foreground/70">
                        Inicio {formatDate(chunkingStage.fch_inicio)}
                      </p>
                    </div>
                  )}
                </CardContent>
              </Card>

            </div>

            {/* Process meta */}
            {data.nro_intento > 1 && (
              <p className="text-xs text-muted-foreground text-right">
                Intento #{data.nro_intento} • Registrado {formatDate(data.fchcre)}
              </p>
            )}
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}

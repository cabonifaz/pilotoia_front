import { useRef, useCallback, useState, useEffect } from 'react';
import { Upload, FileText, X, Trash2, CheckCircle2, XCircle } from 'lucide-react';
import { pdfjs } from 'react-pdf';

pdfjs.GlobalWorkerOptions.workerSrc = new URL(
  'pdfjs-dist/build/pdf.worker.min.mjs',
  import.meta.url,
).toString();

async function getPdfPageCount(file: File): Promise<number> {
  const ab = await file.arrayBuffer();
  const pdf = await pdfjs.getDocument({ data: ab }).promise;
  return pdf.numPages;
}
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/shadcn/card';
import { Button } from '@/components/shadcn/button';
import { Label } from '@/components/shadcn/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/shadcn/select';
import { usePresignedUrls } from '@/hooks/usePresignedUrls';
import { useGetAreas } from '@/hooks/useAreaQueries';
import { useGetModels } from '@/hooks/useIAModelsQueries';
import { useQueryAuthContext } from '@/contexts/QueryAuthContext';

type FileStatus = 'idle' | 'uploading' | 'done' | 'error';
type UploadPhase = 'idle' | 'preparing' | 'uploading' | 'registering';

interface UploadedFile {
  file: File;
  id: string;
  pageCount: number | null;
}

interface UploadSidebarProps {
  isOpen: boolean;
  onClose: () => void;
  id_empresa?: number;
  onUploadSuccess?: () => void;
}

const PHASE_LABELS: Record<UploadPhase, string> = {
  idle: 'Agregar',
  preparing: 'Preparando...',
  uploading: 'Subiendo...',
  registering: 'Registrando...',
};

export const UploadSidebar = ({
  isOpen,
  onClose,
  id_empresa: propsIdEmpresa,
  onUploadSuccess,
}: UploadSidebarProps) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [files, setFiles] = useState<UploadedFile[]>([]);
  const [areaId, setAreaId] = useState<number | ''>('');
  const [embeddingModelId, setEmbeddingModelId] = useState('4');
  const [fileStatuses, setFileStatuses] = useState<Record<string, FileStatus>>({});
  const [uploadPhase, setUploadPhase] = useState<UploadPhase>('idle');

  const { user } = useQueryAuthContext();
  const contextIdEmpresa = (user as any)?.actual_company_area?.ID_EMPRESA;
  const contextIdArea = (user as any)?.actual_company_area?.ID_AREA;
  const id_empresa = propsIdEmpresa || contextIdEmpresa;

  const { data: areasData } = useGetAreas(id_empresa || 0);
  const { data: modelsData } = useGetModels();
  const { mutate: generatePresignedUrls, isPending: isGeneratingUrls } = usePresignedUrls();

  // Update values when sidebar opens or company changes
  useEffect(() => {
    if (isOpen && id_empresa) {
      setAreaId(contextIdArea || '');
      setEmbeddingModelId('4');
    }
  }, [isOpen, id_empresa]);

  // Reset all state when sidebar closes
  useEffect(() => {
    if (!isOpen) {
      setFiles([]);
      setAreaId('');
      setEmbeddingModelId('4');
      setFileStatuses({});
      setUploadPhase('idle');
    }
  }, [isOpen]);

  const handleAddFiles = useCallback(async (selectedFiles: FileList | null) => {
    if (!selectedFiles) return;

    const newFiles = Array.from(selectedFiles).map((file) => ({
      file,
      id: `${file.name}-${Date.now()}-${Math.random()}`,
      pageCount: null as number | null,
    }));

    setFiles((prev) => [...prev, ...newFiles]);

    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }

    for (const uf of newFiles) {
      getPdfPageCount(uf.file)
        .then((count) => {
          setFiles((prev) =>
            prev.map((f) => (f.id === uf.id ? { ...f, pageCount: count } : f))
          );
        })
        .catch(() => {});
    }
  }, []);

  const handleRemoveFile = useCallback((fileId: string) => {
    setFiles((prev) => prev.filter((f) => f.id !== fileId));
  }, []);

  const handleFileStatusChange = useCallback((fileId: string, status: FileStatus) => {
    setFileStatuses((prev) => ({ ...prev, [fileId]: status }));
    if (status === 'uploading') {
      setUploadPhase('uploading');
    }
  }, []);

  const handleUpload = () => {
    if (isGeneratingUrls) return;
    if (!id_empresa || areaId === '' || files.length === 0) return;

    const initialStatuses: Record<string, FileStatus> = {};
    files.forEach((f) => { initialStatuses[f.id] = 'idle'; });
    setFileStatuses(initialStatuses);
    setUploadPhase('preparing');

    generatePresignedUrls(
      {
        files: files.map((f) => f.file),
        fileIds: files.map((f) => f.id),
        pageCounts: files.map((f) => f.pageCount),
        areaId: typeof areaId === 'number' ? areaId : undefined,
        embeddingModel: embeddingModelId,
        onFileStatusChange: handleFileStatusChange,
        onRegisterStart: () => setUploadPhase('registering'),
      },
      {
        onSuccess: () => {
          setFiles([]);
          onClose();
          onUploadSuccess?.();
        },
      }
    );
  };

  const handleDrop = useCallback(
    (e: React.DragEvent<HTMLDivElement>) => {
      e.preventDefault();
      handleAddFiles(e.dataTransfer.files);
    },
    [handleAddFiles]
  );

  const handleDragOver = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
  }, []);

  return (
    <div
      className={`fixed top-16 bottom-0 right-0 w-96 bg-background border-l shadow-lg transform transition-all duration-300 flex flex-col z-50 ${
        isOpen ? 'translate-x-0' : 'translate-x-full'
      }`}
    >
      <Card className="h-full rounded-none border-0 flex flex-col">
        {/* Header del Sidebar */}
        <CardHeader className="pt-3 pb-3 border-b flex-shrink-0">
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <CardTitle className="text-xs">Agregar documentos</CardTitle>
              <CardDescription className="text-xs">
                {(user as any)?.actual_company_area?.EMPRESA && (
                  <span className="font-semibold">{(user as any)?.actual_company_area?.EMPRESA}</span>
                )}
                {(user as any)?.actual_company_area?.EMPRESA && ' - '}
                Agregue documentos a la empresa.
              </CardDescription>
            </div>
            <Button
              variant="ghost"
              size="icon"
              onClick={onClose}
              disabled={isGeneratingUrls}
            >
              <X className="h-5 w-5" />
            </Button>
          </div>
        </CardHeader>

        {/* Contenido scrollable */}
        <CardContent className="flex-1 overflow-y-auto py-4 space-y-4">
          {/* Area Select */}
          <div className="space-y-2">
            <Label className="text-xs">Área</Label>
            <Select
              value={areaId === '' ? '' : areaId.toString()}
              onValueChange={(value) => setAreaId(value ? parseInt(value) : '')}
              disabled={isGeneratingUrls || !id_empresa}
            >
              <SelectTrigger>
                <SelectValue placeholder="Selecciona un área" />
              </SelectTrigger>
              <SelectContent>
                {areasData?.areas && areasData.areas.length > 0 ? (
                  areasData.areas.map((area) => (
                    <SelectItem key={area.ID_AREA} value={area.ID_AREA.toString()}>
                      {area.AREA}
                    </SelectItem>
                  ))
                ) : null}
              </SelectContent>
            </Select>
            {areaId !== '' && areasData?.areas && (
              (() => {
                const selectedArea = areasData.areas.find((area) => area.ID_AREA === areaId);
                if (selectedArea && ['Default', 'General'].includes(selectedArea.AREA)) {
                  return (
                    <p className="text-xs text-muted-foreground bg-muted p-2 rounded">
                      Información compartida para todos los usuarios de la empresa
                    </p>
                  );
                }
                return null;
              })()
            )}
          </div>

          {/* Embedding Model Select */}
          <div className="space-y-2">
            <Label className="text-xs">Modelo de Embedding</Label>
            <Select
              value={embeddingModelId}
              onValueChange={(value) => setEmbeddingModelId(value)}
              disabled={isGeneratingUrls}
            >
              <SelectTrigger>
                <SelectValue placeholder="Selecciona un modelo" />
              </SelectTrigger>
              <SelectContent className="max-h-48">
                {modelsData?.models && modelsData.models.length > 0 ? (
                  modelsData.models
                    .filter((model) => model.ID_TIPO === 1)
                    .map((model) => (
                      <SelectItem key={model.ID_MODELO} value={model.ID_MODELO.toString()}>
                        {model.NOMBRE} ({model.PROVEEDOR})
                      </SelectItem>
                    ))
                ) : null}
              </SelectContent>
            </Select>
          </div>

          {/* Drop Zone — hidden while uploading */}
          {!isGeneratingUrls && (
            <div
              className="border-2 border-dashed border-gray-300 rounded-lg p-6 hover:border-gray-400 transition-colors cursor-pointer"
              onDrop={handleDrop}
              onDragOver={handleDragOver}
              onClick={() => fileInputRef.current?.click()}
            >
              <div className="flex flex-col items-center justify-center gap-2 text-center">
                <Upload className="w-8 h-8 text-gray-400" />
                <p className="text-xs font-medium text-gray-600">
                  Arrastra y suelta tus documentos aquí
                </p>
                <p className="text-xs text-gray-500">O haz click para navegar en tus documentos</p>
              </div>
            </div>
          )}

          {/* File List */}
          {files.length > 0 && (
            <div className="space-y-2">
              <p className="text-xs font-medium">
                {isGeneratingUrls
                  ? `${files.length} archivo${files.length > 1 ? 's' : ''} en proceso`
                  : `Seleccionado ${files.length} archivo${files.length > 1 ? 's' : ''}`}
              </p>
              <div className="space-y-2 max-h-64 overflow-y-auto">
                {files.map((file) => {
                  const status = fileStatuses[file.id] || 'idle';

                  if (isGeneratingUrls) {
                    return (
                      <div
                        key={file.id}
                        className="p-3 bg-muted rounded-lg border space-y-1.5"
                      >
                        <div className="flex items-center gap-2">
                          <FileText className="h-4 w-4 text-blue-500 flex-shrink-0" />
                          <p className="text-xs font-medium truncate flex-1">{file.file.name}</p>
                          {status === 'done' && (
                            <CheckCircle2 className="h-4 w-4 text-green-500 flex-shrink-0" />
                          )}
                          {status === 'error' && (
                            <XCircle className="h-4 w-4 text-red-500 flex-shrink-0" />
                          )}
                        </div>
                        <div className="h-1.5 w-full bg-gray-200 rounded-full overflow-hidden">
                          <div
                            className={[
                              'h-full rounded-full transition-all duration-300',
                              status === 'idle' ? 'w-0' : '',
                              status === 'uploading' ? 'w-full bg-blue-500 animate-pulse' : '',
                              status === 'done' ? 'w-full bg-green-500' : '',
                              status === 'error' ? 'w-full bg-red-500' : '',
                            ].join(' ')}
                          />
                        </div>
                        <p className="text-xs text-muted-foreground">
                          {status === 'idle' && 'Esperando...'}
                          {status === 'uploading' && 'Subiendo...'}
                          {status === 'done' && 'Listo'}
                          {status === 'error' && 'Error al subir'}
                        </p>
                      </div>
                    );
                  }

                  return (
                    <div
                      key={file.id}
                      className="flex items-center justify-between p-3 bg-blue-50 rounded-lg border border-blue-200"
                    >
                      <div className="flex items-center gap-2 flex-1 min-w-0">
                        <FileText className="h-4 w-4 text-blue-500 flex-shrink-0" />
                        <div className="min-w-0 flex-1">
                          <p className="text-xs font-medium truncate">{file.file.name}</p>
                          <p className="text-xs text-gray-500">
                            {(file.file.size / 1024 / 1024).toFixed(1)} MB
                            {file.pageCount !== null
                              ? ` · ${file.pageCount} pág.`
                              : ' · contando...'}
                          </p>
                        </div>
                      </div>
                      <button
                        onClick={() => handleRemoveFile(file.id)}
                        className="text-red-500 hover:text-red-700 flex-shrink-0"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          <input
            ref={fileInputRef}
            type="file"
            multiple
            accept=".pdf"
            onChange={(e) => handleAddFiles(e.target.files)}
            className="hidden"
            disabled={isGeneratingUrls}
          />
        </CardContent>

        <div className="border-t p-4 flex gap-2 flex-shrink-0">
          <Button
            variant="outline"
            onClick={onClose}
            disabled={isGeneratingUrls}
            className="flex-1"
          >
            Cancelar
          </Button>
          <Button
            onClick={handleUpload}
            disabled={isGeneratingUrls || !id_empresa || areaId === '' || !embeddingModelId.trim() || files.length === 0 || !user}
            className="flex-1"
          >
            {PHASE_LABELS[uploadPhase]}
          </Button>
        </div>
      </Card>
    </div>
  );
};

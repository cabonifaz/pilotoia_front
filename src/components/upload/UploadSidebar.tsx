import { useRef, useCallback, useState, useEffect } from 'react';
import { Upload, FileText, X, Trash2 } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/shadcn/card';
import { Button } from '@/components/shadcn/button';
import { Input } from '@/components/shadcn/input';
import { Label } from '@/components/shadcn/label';
import { usePresignedUrls } from '@/hooks/usePresignedUrls';
import { useCurrentUser } from '@/hooks/useUserQueries';

interface UploadedFile {
  file: File;
  id: string;
}

interface UploadSidebarProps {
  isOpen: boolean;
  onClose: () => void;
}

export const UploadSidebar = ({
  isOpen,
  onClose,
}: UploadSidebarProps) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [files, setFiles] = useState<UploadedFile[]>([]);
  const [companyId, setCompanyId] = useState<number | ''>('');
  const [areaId, setAreaId] = useState<number | ''>('');
  const [embeddingModel, setEmbeddingModel] = useState('cohere.embed-multilingual-v3');
  const { user } = useCurrentUser();
  const { mutate: generatePresignedUrls, isPending: isGeneratingUrls } = usePresignedUrls();

  // Update values when user area changes or sidebar opens
  useEffect(() => {
    if (isOpen && user?.actual_company_area) {
      setCompanyId(user.actual_company_area.ID_EMPRESA);
      setAreaId(user.actual_company_area.ID_AREA);
      setEmbeddingModel('cohere.embed-multilingual-v3');
    }
  }, [isOpen, user?.actual_company_area]);

  // Reset state when sidebar closes
  useEffect(() => {
    if (!isOpen) {
      setFiles([]);
      setCompanyId('');
      setAreaId('');
      setEmbeddingModel('cohere.embed-multilingual-v3');
    }
  }, [isOpen]);

  const handleAddFiles = useCallback(
    (selectedFiles: FileList | null) => {
      if (!selectedFiles) return;

      const newFiles = Array.from(selectedFiles).map((file) => ({
        file,
        id: `${file.name}-${Date.now()}-${Math.random()}`,
      }));

      setFiles((prev) => [...prev, ...newFiles]);

      // Reset file input value so the same file can be selected again
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    },
    []
  );

  const handleRemoveFile = useCallback((fileId: string) => {
    setFiles((prev) => prev.filter((f) => f.id !== fileId));
  }, []);

  const handleUpload = () => {
    // Prevent duplicate calls if already in progress
    if (isGeneratingUrls) {
      return;
    }

    if (!user || companyId === '' || areaId === '' || files.length === 0) {
      return;
    }

    generatePresignedUrls(
      {
        request: {
          company_id: companyId as number,
          area_id: areaId as number,
          user_id: user.user_id,
          embedding_model: embeddingModel,
          pdf_keys: files.map((f) => f.file.name),
        },
        files: files.map((f) => f.file),
      },
      {
        onSuccess: () => {
          setFiles([]);
          onClose();
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
      className={`fixed inset-y-0 right-0 w-96 bg-background border-l shadow-lg transform transition-all duration-300 flex flex-col ${
        isOpen ? 'translate-x-0' : 'translate-x-full'
      }`}
    >
      <Card className="h-full rounded-none border-0 flex flex-col">
        {/* Header del Sidebar */}
        <CardHeader className="pb-3 border-b flex-shrink-0">
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-xs">Agregar documentos</CardTitle>
              <CardDescription className="text-xs">Agregue documentos a la empresa.</CardDescription>
            </div>
            <button
              onClick={onClose}
              className="text-muted-foreground hover:text-foreground"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
        </CardHeader>

        {/* Contenido scrollable con altura definida */}
        <CardContent className="flex-1 overflow-y-auto py-4 space-y-4">
          {/* Company ID Input */}
          <div className="space-y-2">
            <Label htmlFor="company-id" className="text-xs">ID Empresa</Label>
            <Input
              id="company-id"
              type="number"
              placeholder="ID Empresa"
              value={companyId}
              onChange={(e) => setCompanyId(e.target.value ? parseInt(e.target.value) : '')}
              disabled={isGeneratingUrls}
            />
          </div>

          {/* Area ID Input */}
          <div className="space-y-2">
            <Label htmlFor="area-id" className="text-xs">ID Área</Label>
            <Input
              id="area-id"
              type="number"
              placeholder="ID Área"
              value={areaId}
              onChange={(e) => setAreaId(e.target.value ? parseInt(e.target.value) : '')}
              disabled={isGeneratingUrls}
            />
          </div>

          {/* Embedding Model Input */}
          <div className="space-y-2">
            <Label htmlFor="embedding-model" className="text-xs">Modelo de Embedding</Label>
            <Input
              id="embedding-model"
              type="text"
              placeholder="cohere.embed-multilingual-v3"
              value={embeddingModel}
              onChange={(e) => setEmbeddingModel(e.target.value)}
              disabled={isGeneratingUrls}
            />
          </div>

          {/* Drop Zone */}
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

          {/* Selected Files List */}
          {files.length > 0 && (
            <div className="space-y-2">
              <p className="text-xs font-medium">
                Seleccionado {files.length} archivo{files.length > 1 ? 's' : ''}
              </p>
              <div className="space-y-2 max-h-48 overflow-y-auto">
                {files.map((file) => (
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
                        </p>
                      </div>
                    </div>
                    <button
                      onClick={() => handleRemoveFile(file.id)}
                      disabled={isGeneratingUrls}
                      className="text-red-500 hover:text-red-700 flex-shrink-0"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                ))}
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
            disabled={isGeneratingUrls || companyId === '' || areaId === '' || !embeddingModel.trim() || files.length === 0 || !user}
            className="flex-1"
          >
            {isGeneratingUrls ? 'Subiendo...' : 'Agregar'}
          </Button>
        </div>
      </Card>
    </div>
  );
};

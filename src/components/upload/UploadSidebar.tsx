import { useRef, useCallback } from 'react';
import { Upload, FileText, X, Trash2 } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/shadcn/card';
import { Button } from '@/components/shadcn/button';
import { Input } from '@/components/shadcn/input';
import { Label } from '@/components/shadcn/label';

interface UploadedFile {
  file: File;
  id: string;
}

interface UploadSidebarProps {
  isOpen: boolean;
  onClose: () => void;
  files: UploadedFile[];
  isUploading: boolean;
  companyName: string;
  areaName: string;
  onCompanyNameChange: (value: string) => void;
  onAreaNameChange: (value: string) => void;
  onAddFiles: (files: FileList | null) => void;
  onRemoveFile: (fileId: string) => void;
  onUpload: () => void;
}

export const UploadSidebar = ({
  isOpen,
  onClose,
  files,
  isUploading,
  companyName,
  areaName,
  onCompanyNameChange,
  onAreaNameChange,
  onAddFiles,
  onRemoveFile,
  onUpload,
}: UploadSidebarProps) => {
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = useCallback(
    (selectedFiles: FileList | null) => {
      onAddFiles(selectedFiles);
      // Reset file input value so the same file can be selected again
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    },
    [onAddFiles]
  );

  const handleDrop = useCallback(
    (e: React.DragEvent<HTMLDivElement>) => {
      e.preventDefault();
      handleFileSelect(e.dataTransfer.files);
    },
    [handleFileSelect]
  );

  const handleDragOver = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
  }, []);

  return (
    <div
      className={`fixed inset-y-0 right-0 w-96 bg-background border-l shadow-lg transform transition-all duration-300 flex flex-col ${
        isOpen ? 'translate-x-0' : 'translate-x-full'
      }`}
      style={{ top: '69px', bottom: '0' }}
    >
      <Card className="h-full rounded-none border-0 flex flex-col">
        {/* Header del Sidebar */}
        <CardHeader className="pb-3 border-b flex-shrink-0">
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Agregar documentos</CardTitle>
              <CardDescription>Agregue documentos a la empresa.</CardDescription>
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
          {/* Company Input */}
          <div className="space-y-2">
            <Label htmlFor="company">Nombre de la Empresa</Label>
            <Input
              id="company"
              placeholder="EMPR"
              value={companyName}
              onChange={(e) => onCompanyNameChange(e.target.value)}
            />
          </div>

          {/* Area Input */}
          <div className="space-y-2">
            <Label htmlFor="area">Área</Label>
            <Input
              id="area"
              placeholder="AREA"
              value={areaName}
              onChange={(e) => onAreaNameChange(e.target.value)}
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
              <p className="text-sm font-medium text-gray-600">
                Arrastra y suelta tus documentos aquí
              </p>
              <p className="text-xs text-gray-500">O haz click para navegar en tus documentos</p>
            </div>
          </div>

          {/* Selected Files List */}
          {files.length > 0 && (
            <div className="space-y-2">
              <p className="text-sm font-medium">
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
                        <p className="text-sm font-medium truncate">{file.file.name}</p>
                        <p className="text-xs text-gray-500">
                          {(file.file.size / 1024 / 1024).toFixed(1)} MB
                        </p>
                      </div>
                    </div>
                    <button
                      onClick={() => onRemoveFile(file.id)}
                      disabled={isUploading}
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
            onChange={(e) => handleFileSelect(e.target.files)}
            className="hidden"
            disabled={isUploading}
          />
        </CardContent>

        <div className="border-t p-4 flex gap-2 flex-shrink-0">
          <Button
            variant="outline"
            onClick={onClose}
            disabled={isUploading}
            className="flex-1"
          >
            Cancelar
          </Button>
          <Button
            onClick={onUpload}
            disabled={isUploading || !companyName.trim() || !areaName.trim() || files.length === 0}
            className="flex-1 bg-blue-600 hover:bg-blue-700"
          >
            {isUploading ? 'Subiendo...' : 'Agregar'}
          </Button>
        </div>
      </Card>
    </div>
  );
};

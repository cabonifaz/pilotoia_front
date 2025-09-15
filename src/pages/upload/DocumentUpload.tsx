import { useState, useRef, useCallback, useEffect } from 'react';
import { Upload, FileText, X, Play, Clock, CheckCircle, XCircle } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/shadcn/card';
import { Button } from '@/components/shadcn/button';
import { Input } from '@/components/shadcn/input';
import { Label } from '@/components/shadcn/label';
import { Badge } from '@/components/shadcn/badge';
import Header from '@/components/layout/Header';
import { useDocumentUpload } from '@/hooks/useDocumentUpload';
import { useProcessingLogs } from '@/hooks/useProcessingLogs';

const DocumentUpload = () => {
  const [companyName, setCompanyName] = useState('');
  const [areaName, setAreaName] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);
  const logsContainerRef = useRef<HTMLDivElement>(null);

  // Custom hooks
  const {
    files,
    isUploading,
    isProcessing,
    currentTask,
    addFiles,
    removeFile,
    clearAllFiles,
    uploadAndCreateTask,
    startTaskProcessing,
    updateTaskStatus,
    resetUpload,
  } = useDocumentUpload();

  const {
    logs,
    connectToTask,
    disconnect,
  } = useProcessingLogs();

  // Auto-scroll logs to bottom when new logs arrive
  useEffect(() => {
    if (logsContainerRef.current) {
      logsContainerRef.current.scrollTop = logsContainerRef.current.scrollHeight;
    }
  }, [logs]);

  const handleFileSelect = useCallback((selectedFiles: FileList | null) => {
    addFiles(selectedFiles);
  }, [addFiles]);

  const handleDrop = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    handleFileSelect(e.dataTransfer.files);
  }, [handleFileSelect]);

  const handleDragOver = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
  }, []);

  const handleUpload = async () => {
    await uploadAndCreateTask(companyName, areaName);
  };

  const handleStartProcessing = async () => {
    if (!currentTask) return;

    const success = await startTaskProcessing(currentTask.task_id);
    if (success) {
      // Connect WebSocket for real-time logs
      connectToTask(currentTask.task_id, updateTaskStatus);
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'pending':
        return <Clock className="w-4 h-4 text-yellow-500" />;
      case 'running':
        return <Play className="w-4 h-4 text-blue-500 animate-pulse" />;
      case 'completed':
        return <CheckCircle className="w-4 h-4 text-green-500" />;
      case 'failed':
        return <XCircle className="w-4 h-4 text-red-500" />;
      default:
        return <Clock className="w-4 h-4 text-gray-500" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending':
        return 'bg-yellow-100 text-yellow-800';
      case 'running':
        return 'bg-blue-100 text-blue-800';
      case 'completed':
        return 'bg-green-100 text-green-800';
      case 'failed':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const resetAll = () => {
    resetUpload();
    setCompanyName('');
    setAreaName('');
    disconnect();
  };

  return (
    <div className="h-screen bg-muted/30 flex flex-col">
      <Header />
      
      <div className="flex flex-col lg:flex-row flex-1 overflow-hidden gap-8 p-8">
        {/* Upload Section - 60% width */}
        <div className="flex-1 lg:w-[60%] flex flex-col gap-4 min-h-0">
          <h1 className="text-3xl font-bold text-foreground">Carga de Documentos</h1>
          <div className="flex-1 space-y-6 overflow-y-auto">

            {/* Upload Section */}
            <Card>
              <CardHeader>
                <CardTitle>Subir Archivos PDF</CardTitle>
                <CardDescription>
                  Arrastra y suelta archivos PDF o haz clic para seleccionar
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Company and Area inputs */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="company">Nombre de la Empresa</Label>
                    <Input
                      id="company"
                      value={companyName}
                      onChange={(e) => setCompanyName(e.target.value)}
                      placeholder="Fractal"
                      disabled={isUploading || isProcessing}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="area">Área</Label>
                    <Input
                      id="area"
                      value={areaName}
                      onChange={(e) => setAreaName(e.target.value)}
                      placeholder="Desarrollo"
                      disabled={isUploading || isProcessing}
                    />
                  </div>
                </div>

                {/* Drop zone with horizontal file miniatures */}
                <div className="space-y-4">
                  <div
                    className="border-2 border-dashed border-gray-300 rounded-lg p-4 hover:border-gray-400 transition-colors cursor-pointer"
                    onDrop={handleDrop}
                    onDragOver={handleDragOver}
                    onClick={() => fileInputRef.current?.click()}
                  >
                    <div className="flex items-center justify-center gap-4">
                      <Upload className="w-6 h-6 text-gray-400 flex-shrink-0" />
                      <div className="text-center">
                        <p className="text-sm font-medium text-gray-600">
                          Arrastra archivos PDF o <span className="text-blue-600 underline">haz clic aquí</span>
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* File miniatures - horizontal scroll */}
                  {files.length > 0 && (
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <h3 className="text-sm font-medium">
                          Archivos seleccionados ({files.length})
                        </h3>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={clearAllFiles}
                          disabled={isUploading || isProcessing}
                        >
                          Limpiar todo
                        </Button>
                      </div>
                      
                      <div className="flex gap-3 overflow-x-auto pb-2">
                        {files.map((uploadFile) => (
                          <div
                            key={uploadFile.id}
                            className="flex-shrink-0 relative group bg-gray-50 rounded-lg p-3 w-24 h-20 flex flex-col items-center justify-center border hover:bg-gray-100 transition-colors"
                          >
                            <FileText className="w-6 h-6 text-red-500 mb-1" />
                            <p className="text-xs font-medium text-center truncate w-full" title={uploadFile.file.name}>
                              {uploadFile.file.name}
                            </p>
                            <p className="text-xs text-gray-500">
                              {(uploadFile.file.size / 1024 / 1024).toFixed(1)}MB
                            </p>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => removeFile(uploadFile.id)}
                              disabled={isUploading || isProcessing}
                              className="absolute -top-2 -right-2 h-6 w-6 p-0 bg-red-500 hover:bg-red-600 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                            >
                              <X className="w-3 h-3" />
                            </Button>
                          </div>
                        ))}
                      </div>

                      <Button
                        onClick={handleUpload}
                        disabled={isUploading || isProcessing || !companyName.trim() || !areaName.trim()}
                        className="w-full"
                        size="sm"
                      >
                        {isUploading ? 'Subiendo...' : `Subir ${files.length} archivo${files.length > 1 ? 's' : ''}`}
                      </Button>
                    </div>
                  )}
                  
                  <input
                    ref={fileInputRef}
                    type="file"
                    multiple
                    accept=".pdf"
                    onChange={(e) => handleFileSelect(e.target.files)}
                    className="hidden"
                    disabled={isUploading || isProcessing}
                  />
                </div>
              </CardContent>
            </Card>

            {/* Task Status Section */}
            {currentTask && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    {getStatusIcon(currentTask.status)}
                    <span>Estado del Procesamiento</span>
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="space-y-1">
                      <p className="font-medium">{currentTask.company_name} - {currentTask.area_name}</p>
                      <p className="text-sm text-gray-500">
                        {currentTask.files_processed} de {currentTask.total_files} archivos procesados
                      </p>
                    </div>
                    <Badge className={getStatusColor(currentTask.status)}>
                      {currentTask.status}
                    </Badge>
                  </div>

                  {currentTask.status === 'pending' && (
                    <Button
                      onClick={handleStartProcessing}
                      disabled={isProcessing}
                      className="w-full"
                    >
                      {isProcessing ? 'Iniciando...' : 'Iniciar Procesamiento'}
                    </Button>
                  )}


                  {(currentTask.status === 'completed' || currentTask.status === 'failed') && files.length > 0 && (
                    <Button
                      onClick={resetAll}
                      variant="outline"
                      className="w-full"
                    >
                      Procesar Nuevos Archivos
                    </Button>
                  )}
                </CardContent>
              </Card>
            )}
          </div>
        </div>

        {/* Right Sidebar - 40% width */}
        <div className="lg:w-[40%] flex-shrink-0 space-y-4 overflow-y-auto">
          <Card className="bg-muted/50 border shadow-sm h-full flex flex-col">
            <CardHeader>
              <CardTitle>Logs de Procesamiento</CardTitle>
              <CardDescription>
                Logs en tiempo real del procesamiento de documentos
              </CardDescription>
            </CardHeader>
            <CardContent className="p-0 flex-1 flex flex-col min-h-0">
              <div 
                ref={logsContainerRef}
                className="bg-black text-green-400 p-4 font-mono text-sm flex-1 overflow-y-auto"
              >
                {logs.length === 0 ? (
                  <p className="text-gray-500">Esperando logs...</p>
                ) : (
                  logs.map((log, index) => (
                    <div key={index} className={`mb-1 ${
                      log.type === 'error' ? 'text-red-400' : 
                      log.type === 'status' ? 'text-blue-400' : 
                      'text-green-400'
                    }`}>
                      {log.timestamp && `[${new Date(log.timestamp).toLocaleTimeString()}] `}
                      {log.message}
                    </div>
                  ))
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

    </div>
  );
};

export default DocumentUpload;
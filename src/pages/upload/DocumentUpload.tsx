import { useState, useRef, useCallback } from 'react';
import { Upload, FileText, X, ChevronLeft, ChevronRight, Search, ChevronsUpDown, Plus } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/shadcn/card';
import { Button } from '@/components/shadcn/button';
import { Input } from '@/components/shadcn/input';
import { Label } from '@/components/shadcn/label';
import { Badge } from '@/components/shadcn/badge';
import { useDocumentUpload } from '@/hooks/useDocumentUpload';

// Mock data for documents table
const mockDocuments = [
  {
    id: 1,
    name: 'LoginFlowDocument.docx',
    areas: 'Software Fac...',
    createdDate: '03 Oct 2025',
    uploadedBy: 'Juan Espinoza',
    status: 'Activo',
  },
  {
    id: 2,
    name: 'API_REST_v2_Documentation...',
    areas: 'Software Fac...',
    createdDate: '03 Oct 2025',
    uploadedBy: 'Juan Espinoza',
    status: 'Activo',
  },
  {
    id: 3,
    name: 'Manual_Onboarding_Empleado...',
    areas: 'Recursos Hu...',
    createdDate: '03 Oct 2025',
    uploadedBy: 'Juan Espinoza',
    status: 'Activo',
  },
  {
    id: 4,
    name: 'Encuesta_Clima_laboral_Q2.xlsx',
    areas: 'Recursos Hu...',
    createdDate: '03 Oct 2025',
    uploadedBy: 'Juan Espinoza',
    status: 'Activo',
  },
  {
    id: 5,
    name: 'Encuesta_Clima_laboral_Q3.xlsx',
    areas: 'Recursos Hu...',
    createdDate: '03 Oct 2025',
    uploadedBy: 'Juan Espinoza',
    status: 'Activo',
  },
];

const DocumentUpload = () => {
  const [companyName, setCompanyName] = useState('');
  const [areaName, setAreaName] = useState('');
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [searchTerm, setSearchTerm] = useState('');
  const [sortBy, setSortBy] = useState<'area' | 'status' | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const {
    files,
    isUploading,
    addFiles,
    removeFile,
    clearAllFiles,
    uploadAndCreateTask,
  } = useDocumentUpload();

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
    setIsSidebarOpen(false);
    clearAllFiles();
    setCompanyName('');
    setAreaName('');
  };

  const closeSidebar = () => {
    setIsSidebarOpen(false);
  };

  // Sort documents based on selected filter
  const getSortedDocuments = () => {
    let sorted = [...mockDocuments];

    if (sortBy === 'area') {
      sorted.sort((a, b) => a.areas.localeCompare(b.areas));
    } else if (sortBy === 'status') {
      sorted.sort((a, b) => a.status.localeCompare(b.status));
    }

    return sorted;
  };

  const sortedDocuments = getSortedDocuments();
  const itemsPerPage = 5;
  const totalPages = Math.ceil(sortedDocuments.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const displayedDocuments = sortedDocuments.slice(startIndex, startIndex + itemsPerPage);

  return (
    <div className="flex flex-1 overflow-hidden">
      {/* Main Content */}
      <div className={`flex flex-col flex-1 overflow-hidden transition-all duration-300 ${isSidebarOpen ? 'mr-96' : ''}`}>
        {/* Header and Table Wrapper */}
        <div className="flex flex-col flex-1 overflow-hidden p-8 gap-4">
          {/* Header with Title and Controls */}
          <div className="flex flex-col items-start gap-1">
            <h1 className="text-3xl font-bold text-foreground">Documentos</h1>
            <p className="text-sm text-muted-foreground">Gestiona todos los documentos de la empresa.</p>
          </div>

          {/* Table Section */}
          <Card className="flex-1 flex flex-col min-h-0">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between gap-2">
              <div className="flex-1 relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
                <Input
                  placeholder="Buscar documentos"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>

              {/* Sort/Filter Buttons - on the same row as search */}
              <Button
                variant={sortBy === 'area' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setSortBy(sortBy === 'area' ? null : 'area')}
                className="gap-2"
              >
                <ChevronsUpDown className="h-4 w-4" />
                Área
              </Button>
              <Button
                variant={sortBy === 'status' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setSortBy(sortBy === 'status' ? null : 'status')}
                className="gap-2"
              >
                <ChevronsUpDown className="h-4 w-4" />
                Estado
              </Button>

              <Button onClick={() => setIsSidebarOpen(true)} className="bg-blue-600 hover:bg-blue-700 gap-2">
                <Plus className="h-4 w-4" />
                Agregar documentos
              </Button>
            </div>
          </CardHeader>

          <CardContent className="flex-1 flex flex-col min-h-0 overflow-hidden">
            {/* Table */}
            <div className="flex-1 overflow-y-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b">
                    <th className="text-left py-3 px-4 font-medium">
                      <input type="checkbox" className="rounded" />
                    </th>
                    <th className="text-left py-3 px-4 font-medium">Nombre</th>
                    <th className="text-left py-3 px-4 font-medium">Área(s)</th>
                    <th className="text-left py-3 px-4 font-medium">Creado el</th>
                    <th className="text-left py-3 px-4 font-medium">Subido por</th>
                    <th className="text-left py-3 px-4 font-medium">Estado</th>
                    <th className="text-left py-3 px-4 font-medium"></th>
                  </tr>
                </thead>
                <tbody>
                  {displayedDocuments.map((doc) => (
                    <tr key={doc.id} className="border-b hover:bg-muted/50">
                      <td className="py-3 px-4">
                        <input type="checkbox" className="rounded" />
                      </td>
                      <td className="py-3 px-4 flex items-center gap-2">
                        <FileText className="h-4 w-4 text-blue-500" />
                        <span>{doc.name}</span>
                      </td>
                      <td className="py-3 px-4">{doc.areas}</td>
                      <td className="py-3 px-4">{doc.createdDate}</td>
                      <td className="py-3 px-4">{doc.uploadedBy}</td>
                      <td className="py-3 px-4">
                        <Badge className="bg-green-100 text-green-800">{doc.status}</Badge>
                      </td>
                      <td className="py-3 px-4">
                        <button className="text-muted-foreground hover:text-foreground">...</button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            <div className="flex items-center justify-between pt-4 border-t">
              <p className="text-sm text-muted-foreground">
                Mostrando 1-9 de 32 documentos
              </p>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                  disabled={currentPage === 1}
                >
                  <ChevronLeft className="h-4 w-4" />
                  Anterior
                </Button>

                <div className="flex gap-1">
                  {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                    <Button
                      key={page}
                      variant={currentPage === page ? 'default' : 'outline'}
                      size="sm"
                      onClick={() => setCurrentPage(page)}
                    >
                      {page}
                    </Button>
                  ))}
                </div>

                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
                  disabled={currentPage === totalPages}
                >
                  Siguiente
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
        </div>
      </div>

      {/* Right Sidebar - Upload Panel */}
      <div
        className={`fixed inset-y-0 right-0 w-96 bg-background border-l shadow-lg transform transition-all duration-300 flex flex-col ${
          isSidebarOpen ? 'translate-x-0' : 'translate-x-full'
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
                onClick={closeSidebar} 
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
              <Input id="company" placeholder="EMPR" />
            </div>

            {/* Area Input */}
            <div className="space-y-2">
              <Label htmlFor="area">Área</Label>
              <Input id="area" placeholder="AREA" />
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
                        onClick={() => removeFile(file.id)}
                        disabled={isUploading}
                        className="text-red-500 hover:text-red-700 flex-shrink-0"
                      >
                        <X className="h-4 w-4" />
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
              onClick={closeSidebar}
              disabled={isUploading}
              className="flex-1"
            >
              Cancelar
            </Button>
            <Button
              onClick={handleUpload}
              disabled={isUploading || !companyName.trim() || !areaName.trim() || files.length === 0}
              className="flex-1 bg-blue-600 hover:bg-blue-700"
            >
              {isUploading ? 'Subiendo...' : `Agregar ${files.length > 0 ? files.length : ''} archivo${files.length > 1 ? 's' : ''}`}
            </Button>
          </div>
        </Card>
      </div>
    </div>
  );
};

export default DocumentUpload;

import { useState } from 'react';
import { DocumentsTable, UploadSidebar } from '@/components/upload';
import { useDocumentUpload } from '@/hooks/useDocumentUpload';

const DocumentUpload = () => {
  const [companyName, setCompanyName] = useState('');
  const [areaName, setAreaName] = useState('');
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  const {
    files,
    isUploading,
    addFiles,
    removeFile,
    clearAllFiles,
    uploadAndCreateTask,
  } = useDocumentUpload();

  const handleUpload = async () => {
    await uploadAndCreateTask(companyName, areaName);
    setIsSidebarOpen(false);
    clearAllFiles();
    setCompanyName('');
    setAreaName('');
  };

  const closeSidebar = () => {
    setIsSidebarOpen(false);
    clearAllFiles();
    setCompanyName('');
    setAreaName('');
  };

  return (
    <div className="flex flex-1 overflow-hidden">
      {/* Main Content */}
      <div
        className={`flex flex-col flex-1 overflow-hidden transition-all duration-300 ${
          isSidebarOpen ? 'mr-96' : ''
        }`}
      >
        {/* Header and Table Wrapper */}
        <div className="flex flex-col flex-1 overflow-hidden p-8 gap-4">
          {/* Header with Title and Controls */}
          <div className="flex flex-col items-start gap-1">
            <h1 className="text-3xl font-bold text-foreground">Documentos</h1>
            <p className="text-sm text-muted-foreground">
              Gestiona todos los documentos de la empresa.
            </p>
          </div>

          {/* Table Section */}
          <DocumentsTable onAddClick={() => setIsSidebarOpen(true)} />
        </div>
      </div>

      {/* Right Sidebar - Upload Panel */}
      <UploadSidebar
        isOpen={isSidebarOpen}
        onClose={closeSidebar}
        files={files}
        isUploading={isUploading}
        companyName={companyName}
        areaName={areaName}
        onCompanyNameChange={setCompanyName}
        onAreaNameChange={setAreaName}
        onAddFiles={addFiles}
        onRemoveFile={removeFile}
        onUpload={handleUpload}
      />
    </div>
  );
};

export default DocumentUpload;

import { useState } from 'react';
import { DocumentsTable, UploadSidebar } from '@/components/upload';

const DocumentUpload = () => {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  const closeSidebar = () => {
    setIsSidebarOpen(false);
  };

  return (
    <div className="flex flex-1 overflow-hidden">
      {/* Main Content */}
      <div
        className={`flex flex-col flex-1 overflow-hidden transition-all duration-300`}
      >
        {/* Header and Table Wrapper */}
        <div className="flex flex-col flex-1 overflow-hidden p-8 gap-4">
          {/* Header with Title and Controls */}
          <div className="flex flex-col items-start gap-1">
            <h1 className="text-3xl font-bold text-foreground">Documentos</h1>
            <p className="text-xs text-muted-foreground">
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
      />
    </div>
  );
};

export default DocumentUpload;

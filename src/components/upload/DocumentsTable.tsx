import { useState } from 'react';
import { ChevronLeft, ChevronRight, Search, ChevronsUpDown, CirclePlus, FileText } from 'lucide-react';
import { Card, CardContent, CardHeader } from '@/components/shadcn/card';
import { Button } from '@/components/shadcn/button';
import { Input } from '@/components/shadcn/input';
import { Badge } from '@/components/shadcn/badge';

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

interface DocumentsTableProps {
  onAddClick: () => void;
}

export const DocumentsTable = ({ onAddClick }: DocumentsTableProps) => {
  const [currentPage, setCurrentPage] = useState(1);
  const [searchTerm, setSearchTerm] = useState('');
  const [sortBy, setSortBy] = useState<'area' | 'status' | null>(null);

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

          <Button onClick={onAddClick} className="bg-blue-600 hover:bg-blue-700 gap-2">
            <CirclePlus className="h-4 w-4" />
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
  );
};

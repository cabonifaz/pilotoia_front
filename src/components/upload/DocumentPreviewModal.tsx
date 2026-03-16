import { LoaderCircle } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/shadcn/dialog";

interface DocumentPreviewModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  url: string | null;
  documentName?: string;
  loading?: boolean;
}

export const DocumentPreviewModal = ({
  open,
  onOpenChange,
  url,
  documentName,
  loading = false,
}: DocumentPreviewModalProps) => {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="w-[90vw] max-w-[90vw] h-[90vh] flex flex-col rounded-xl shadow-xl">
        {/* Header */}
        <DialogHeader className="border-b px-3 py-1">
          <DialogTitle className="text-lg font-semibold text-center w-full">
            {documentName || "Documento"}
          </DialogTitle>
        </DialogHeader>

        {/* PDF Viewer */}
        <div className="flex-1 p-0 overflow-hidden">
          {loading && (
            <div className="flex items-center justify-center h-full">
              <LoaderCircle className="h-10 w-10 animate-spin text-muted-foreground" />
            </div>
          )}

          {!loading && url && (
            <iframe
              src={url}
              title={documentName || "Documento"}
              className="w-full h-full border rounded-lg bg-gray-50"
            />
          )}

          {!loading && !url && (
            <div className="flex items-center justify-center h-full text-sm text-muted-foreground">
              No hay documento para mostrar
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};

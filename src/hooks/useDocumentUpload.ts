import { useState, useCallback } from 'react';
import { toast } from '@/hooks/use-toast';
import { uploadFiles, startProcessing, getTaskStatus, type TaskStatus } from '@/api/uploadApi';

interface UploadedFile {
  file: File;
  id: string;
}

export const useDocumentUpload = () => {
  const [files, setFiles] = useState<UploadedFile[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [currentTask, setCurrentTask] = useState<TaskStatus | null>(null);

  const addFiles = useCallback((selectedFiles: FileList | null) => {
    if (!selectedFiles) return;

    const newFiles: UploadedFile[] = [];
    for (let i = 0; i < selectedFiles.length; i++) {
      const file = selectedFiles[i];
      if (file.type === 'application/pdf') {
        newFiles.push({
          file,
          id: `${Date.now()}-${i}`,
        });
      } else {
        toast({
          title: "Archivo no válido",
          description: `${file.name} no es un archivo PDF`,
          variant: "destructive"
        });
      }
    }

    setFiles(prev => {
      // If there's a completed/failed task and we're adding new files, clear the task
      if (currentTask && (currentTask.status === 'completed' || currentTask.status === 'failed')) {
        setCurrentTask(null);
      }
      return [...prev, ...newFiles];
    });
  }, [currentTask]);

  const removeFile = useCallback((fileId: string) => {
    setFiles(prev => prev.filter(f => f.id !== fileId));
  }, []);

  const clearAllFiles = useCallback(() => {
    setFiles([]);
  }, []);

  const uploadAndCreateTask = useCallback(async (companyName: string, areaName: string) => {
    if (files.length === 0) {
      toast({
        title: "Error",
        description: "Selecciona al menos un archivo PDF",
        variant: "destructive"
      });
      return null;
    }

    if (!companyName.trim() || !areaName.trim()) {
      toast({
        title: "Error",
        description: "Completa el nombre de la empresa y área",
        variant: "destructive"
      });
      return null;
    }

    setIsUploading(true);

    try {
      const fileList = files.map(f => f.file);
      const response = await uploadFiles(fileList, companyName.trim(), areaName.trim());
      
      toast({
        title: "Archivos subidos",
        description: `${response.files_uploaded} archivos subidos exitosamente`,
        variant: "default"
      });

      // Get initial task status
      const taskStatus = await getTaskStatus(response.task_id);
      setCurrentTask(taskStatus);
      
      return taskStatus;

    } catch (error) {
      console.error('Upload error:', error);
      toast({
        title: "Error de subida",
        description: "Error al subir los archivos",
        variant: "destructive"
      });
      return null;
    } finally {
      setIsUploading(false);
    }
  }, [files]);

  const startTaskProcessing = useCallback(async (taskId: string) => {
    setIsProcessing(true);

    try {
      await startProcessing(taskId);
      return true;
    } catch (error) {
      console.error('Processing error:', error);
      toast({
        title: "Error de procesamiento",
        description: "Error al iniciar el procesamiento",
        variant: "destructive"
      });
      return false;
    }
  }, []);

  const updateTaskStatus = useCallback(async (status: TaskStatus['status']) => {
    // Update status immediately for responsiveness
    setCurrentTask(prev => prev ? { ...prev, status } : null);

    // Fetch complete task status to get accurate file counts
    if (currentTask?.task_id) {
      try {
        const updatedTask = await getTaskStatus(currentTask.task_id);
        setCurrentTask(updatedTask);
      } catch (error) {
        console.error('Error fetching updated task status:', error);
      }
    }

    if (status === 'completed' || status === 'failed') {
      setIsProcessing(false);
      // Clear files from frontend when processing is finished
      setFiles([]);
    }
  }, [currentTask?.task_id]);

  const resetUpload = useCallback(() => {
    setFiles([]);
    setCurrentTask(null);
    setIsUploading(false);
    setIsProcessing(false);
  }, []);

  return {
    // State
    files,
    isUploading,
    isProcessing,
    currentTask,
    
    // Actions
    addFiles,
    removeFile,
    clearAllFiles,
    uploadAndCreateTask,
    startTaskProcessing,
    updateTaskStatus,
    resetUpload,
  };
};
import apiClient from './apiClient';
import multipartClient from './multipartClient';
import { createWSConnection } from './wsClient';

export interface UploadResponse {
  task_id: string;
  message: string;
  files_uploaded: number;
  status: string;
}

export interface TaskStatus {
  task_id: string;
  status: 'pending' | 'running' | 'completed' | 'failed';
  company_name: string;
  area_name: string;
  created_at: string;
  started_at?: string;
  completed_at?: string;
  error_message?: string;
  files_processed: number;
  total_files: number;
}

export interface ProcessingLogMessage {
  type: 'log' | 'status' | 'error';
  message: string;
  timestamp?: string;
  task_id?: string;
  status?: 'pending' | 'running' | 'completed' | 'failed';
}

// Upload files for processing
export const uploadFiles = async (
  files: File[],
  companyName: string,
  areaName: string
): Promise<UploadResponse> => {
  const formData = new FormData();

  files.forEach(file => {
    formData.append('files', file);
  });
  formData.append('company_name', companyName);
  formData.append('area_name', areaName);

  const response = await multipartClient.post('/v1/processing/upload', formData);

  return response.data;
};

// Start processing uploaded files
export const startProcessing = async (taskId: string): Promise<{ message: string; task_id: string }> => {
  const response = await apiClient.post(`/v1/processing/start/${taskId}`);
  return response.data;
};

// Get task status
export const getTaskStatus = async (taskId: string): Promise<TaskStatus> => {
  const response = await apiClient.get(`/v1/processing/tasks/${taskId}`);
  return response.data;
};

// Get all tasks
export const getAllTasks = async (): Promise<{ tasks: Record<string, TaskStatus> }> => {
  const response = await apiClient.get('/v1/processing/tasks');
  return response.data;
};

// WebSocket connection for real-time logs using centralized client
export const createWebSocketConnection = (
  taskId: string,
  onMessage: (message: ProcessingLogMessage) => void,
  onError?: (error: Event) => void,
  onClose?: (event: CloseEvent) => void,
  onOpen?: () => void
): WebSocket => {
  return createWSConnection({
    endpoint: '/v1/processing/ws/logs',
    params: { task_id: taskId },
    onMessage,
    onError,
    onClose,
    onOpen
  });
};
import apiClient from './apiClient';

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

  const response = await apiClient.post('/v1/processing/upload', formData, {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
  });

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

// WebSocket connection for real-time logs
export const createWebSocketConnection = (
  taskId: string,
  onMessage: (message: ProcessingLogMessage) => void,
  onError?: (error: Event) => void,
  onClose?: (event: CloseEvent) => void
): WebSocket => {
  const wsUrl = `${import.meta.env.VITE_API_BASE_URL?.replace('http', 'ws')}/api/v1/processing/ws/logs?task_id=${taskId}`;
  const websocket = new WebSocket(wsUrl);

  websocket.onopen = () => {
    console.log('WebSocket connected for task:', taskId);
  };

  websocket.onmessage = (event) => {
    try {
      const message: ProcessingLogMessage = JSON.parse(event.data);
      onMessage(message);
    } catch (error) {
      console.error('Error parsing WebSocket message:', error);
    }
  };

  websocket.onerror = (error) => {
    console.error('WebSocket error:', error);
    if (onError) onError(error);
  };

  websocket.onclose = (event) => {
    console.log('WebSocket closed:', event.code, event.reason);
    if (onClose) onClose(event);
  };

  return websocket;
};
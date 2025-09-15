import { useState, useCallback, useEffect, useRef } from 'react';
import { toast } from '@/hooks/use-toast';
import { createWebSocketConnection, type ProcessingLogMessage } from '@/api/uploadApi';

export const useProcessingLogs = () => {
  const [logs, setLogs] = useState<ProcessingLogMessage[]>([]);
  const [isConnected, setIsConnected] = useState(false);
  const websocketRef = useRef<WebSocket | null>(null);

  const addLog = useCallback((log: ProcessingLogMessage) => {
    setLogs(prev => [...prev, log]);
  }, []);

  const clearLogs = useCallback(() => {
    setLogs([]);
  }, []);

  const connectToTask = useCallback((
    taskId: string,
    onStatusChange?: (status: 'pending' | 'running' | 'completed' | 'failed') => void
  ) => {
    // Close existing connection
    if (websocketRef.current) {
      websocketRef.current.close();
    }

    clearLogs();

    const ws = createWebSocketConnection(
      taskId,
      (message: ProcessingLogMessage) => {
        addLog(message);
        
        // Handle status changes
        if (message.type === 'status' && message.status && onStatusChange) {
          onStatusChange(message.status);
        }
      },
      (error) => {
        console.error('WebSocket error:', error);
        toast({
          title: "Error de conexión",
          description: "Error en la conexión de logs en tiempo real",
          variant: "destructive"
        });
        setIsConnected(false);
      },
      (event) => {
        console.log('WebSocket closed:', event.code, event.reason);
        setIsConnected(false);
        
        // Show completion message based on close reason
        if (event.code === 1000 && event.reason === 'Task completed') {
          toast({
            title: "Procesamiento finalizado",
            description: "La conexión de logs se ha cerrado correctamente",
            variant: "default"
          });
        }
      }
    );

    ws.onopen = () => {
      setIsConnected(true);
    };

    websocketRef.current = ws;
    return ws;
  }, [addLog, clearLogs]);

  const disconnect = useCallback(() => {
    if (websocketRef.current) {
      websocketRef.current.close();
      websocketRef.current = null;
    }
    setIsConnected(false);
  }, []);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      disconnect();
    };
  }, [disconnect]);

  return {
    // State
    logs,
    isConnected,
    
    // Actions
    connectToTask,
    disconnect,
    clearLogs,
    addLog,
  };
};
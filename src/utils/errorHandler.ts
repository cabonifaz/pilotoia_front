import { toast } from '../hooks/use-toast';

interface MensajeResponse {
  idTipoMensaje: number;
  mensaje: string;
}

interface StreamErrorEvent {
  result?: MensajeResponse;
  message?: string;
}

/**
 * Centralized error toast handler
 * Handles both HTTP API errors and SSE streaming errors
 */
export const showErrorToast = (
  error: StreamErrorEvent | MensajeResponse | string,
  title = "Error"
) => {
  let description: string;
  let variant: "destructive" | "warning" = "destructive";

  // Handle different error formats
  if (typeof error === 'string') {
    description = error;
  } else if ('result' in error && error.result) {
    // SSE streaming error format
    description = error.result.mensaje;
    variant = error.result.idTipoMensaje === 1 ? "warning" : "destructive";
  } else if ('mensaje' in error) {
    // Direct MensajeResponse format
    description = error.mensaje;
    variant = error.idTipoMensaje === 1 ? "warning" : "destructive";
  } else if ('message' in error) {
    // Fallback to message field
    description = error.message || "Error desconocido";
  } else {
    description = "Error desconocido";
  }

  toast({
    title,
    description,
    variant
  });
};

/**
 * Specific handler for SSE streaming errors
 */
export const showStreamingErrorToast = (errorEvent: StreamErrorEvent) => {
  // Extract the error message from the backend to use as title
  const errorTitle = errorEvent.result?.mensaje || errorEvent.message || "Error en el chat";
  showErrorToast(errorEvent, errorTitle);
};
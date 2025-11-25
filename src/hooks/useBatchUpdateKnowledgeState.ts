import { useMutation, useQueryClient } from '@tanstack/react-query';
import { batchUpdateKnowledgeState } from '../api/uploadApi';
import { toast } from './use-toast';
import type { MensajeResponse } from '@/types/Mensaje';

interface BatchUpdateParams {
  idEstadoProceso: number;
  companyId: number;
  areaId: number;
  onSuccess?: () => void;
  onError?: (error: Error) => void;
}

export const useBatchUpdateKnowledgeState = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ idEstadoProceso, companyId, areaId }: BatchUpdateParams): Promise<MensajeResponse> => {
      // Get the created IDs directly from the query cache using the upload's company/area
      const createdIds = queryClient.getQueryData<number[]>(['created_knowledge_ids', companyId, areaId]) || [];

      if (!createdIds || createdIds.length === 0) {
        throw new Error('No hay documentos para actualizar');
      }

      try {
        const response = await batchUpdateKnowledgeState(createdIds, idEstadoProceso);
        return response;
      } catch (error) {
        console.error('Batch update error:', error);
        throw error;
      }
    },
    retry: false,
    onSuccess: (_, { companyId, areaId }) => {
      // Clear the stored created IDs after successful batch update
      queryClient.removeQueries({
        queryKey: ['created_knowledge_ids', companyId, areaId],
        exact: true,
        type: 'all'
      });

      // Invalidate knowledge query to refresh the list with proper query key
      queryClient.invalidateQueries({ queryKey: ['knowledge', companyId, areaId] });

      toast({
        title: 'Éxito',
        description: 'Estados de documentos actualizados correctamente',
        variant: 'success',
      });
    },
    onError: (error: Error) => {
      toast({
        title: 'Error',
        description: `Error en la actualización: ${error.message}`,
        variant: 'destructive',
      });
    },
  });
};

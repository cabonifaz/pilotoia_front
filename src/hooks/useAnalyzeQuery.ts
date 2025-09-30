import { useState, useCallback } from 'react';
import { chatApi } from '../api/chatApi';

interface AnalysisResult {
  needs_context: boolean;
  context_messages: number;
  needs_system_data: boolean;
  system_calls: Array<{
    entity: string;
    endpoint: string;
    method: string;
    params: Record<string, unknown>;
    missing_required_params: string[];
  }>;
  needs_external_knowledge: boolean;
  semantic_query: string;
  format: string | null;
  query_clean: string;
}

interface UseAnalyzeQueryReturn {
  analysis: AnalysisResult | null;
  isAnalyzing: boolean;
  error: string | null;
  analyzeQuery: (message: string, addMessageCallback?: (content: string) => void) => Promise<void>;
  clearAnalysis: () => void;
}

export const useAnalyzeQuery = (): UseAnalyzeQueryReturn => {
  const [analysis, setAnalysis] = useState<AnalysisResult | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const analyzeQuery = useCallback(async (message: string, addMessageCallback?: (content: string) => void) => {
    if (!message.trim()) return;

    setIsAnalyzing(true);
    setError(null);

    try {
      const response = await chatApi.analyzeQuery(message);

      // Add tasks to chat if callback provided
      if (addMessageCallback) {
        addMessageCallback(JSON.stringify(response.tasks, null, 2));
      }

      setAnalysis(null);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Error analyzing query';
      setError(errorMessage);

      if (addMessageCallback) {
        addMessageCallback('❌ Error analyzing query');
      }
    } finally {
      setIsAnalyzing(false);
    }
  }, []);

  const clearAnalysis = useCallback(() => {
    setAnalysis(null);
    setError(null);
  }, []);

  return {
    analysis,
    isAnalyzing,
    error,
    analyzeQuery,
    clearAnalysis
  };
};
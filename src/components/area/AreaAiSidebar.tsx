import { useState, useCallback, useEffect, useMemo } from 'react';
import { X, Save } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/shadcn/card';
import { Label } from '@/components/shadcn/label';
import { Slider } from '@/components/shadcn/slider';
import { Button } from '@/components/shadcn/button';
import { Switch } from '@/components/shadcn/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/shadcn/select';
import { useGetIaAreaConfig, useUpdateIaAreaConfig } from '@/hooks/useIaConfigQueries';
import { useGetModels } from '@/hooks/useIAModelsQueries';
import { useQueryAuthContext } from '@/contexts/QueryAuthContext';

interface AreaAiSidebarProps {
  isOpen: boolean;
  onClose: () => void;
  id_empresa: number;
  id_area: number;
  area_name: string;
}

export const AreaAiSidebar = ({
  isOpen,
  onClose,
  id_empresa,
  id_area,
  area_name,
}: AreaAiSidebarProps) => {
  const { user } = useQueryAuthContext();
  const { mutate: updateIaConfig, isPending } = useUpdateIaAreaConfig(id_empresa, id_area);
  const { data: fetchedConfig, isLoading, error } = useGetIaAreaConfig(id_empresa, id_area);
  const { data: modelsData } = useGetModels();

  // Filter models by type
  const embeddingsModels = useMemo(() => {
    return modelsData?.models?.filter(m => m.ID_TIPO === 1) ?? [];
  }, [modelsData]);

  const llmModels = useMemo(() => {
    return modelsData?.models?.filter(m => m.ID_TIPO === 2) ?? [];
  }, [modelsData]);

  const [isEditable, setIsEditable] = useState(false);
  const [llmMaxTokensLimit, setLlmMaxTokensLimit] = useState(2048);
  const [editConfig, setEditConfig] = useState({
    id_embeddings: 0,
    id_llm: 0,
    embeddings_dimensions: 0,
    llm_max_tokens: 0,
    llm_temperature: 0,
    llm_top_p: 0,
    rag_top_k_results: 0,
    rag_similarity_threshold: 0,
    rag_alpha: 0,
    role_behavior: '',
  });

  // Load fetched data into edit state when sidebar opens
  useEffect(() => {
    if (isOpen && fetchedConfig?.result) {
      setEditConfig({
        id_embeddings: fetchedConfig.result.id_embeddings,
        id_llm: fetchedConfig.result.id_llm,
        embeddings_dimensions: fetchedConfig.result.embeddings_dimensions,
        llm_max_tokens: fetchedConfig.result.llm_max_tokens,
        llm_temperature: fetchedConfig.result.llm_temperature,
        llm_top_p: fetchedConfig.result.llm_top_p,
        rag_top_k_results: fetchedConfig.result.rag_top_k_results,
        rag_similarity_threshold: fetchedConfig.result.rag_similarity_threshold,
        rag_alpha: fetchedConfig.result.rag_alpha,
        role_behavior: fetchedConfig.result.role_behavior,
      });

      // Set LLM max tokens limit from selected model if available
      const selectedLlmModel = llmModels.find(m => m.ID_MODELO === fetchedConfig.result.id_llm);
      if (selectedLlmModel) {
        setLlmMaxTokensLimit(selectedLlmModel.EXTRA);
      } else {
        setLlmMaxTokensLimit(2048);
      }
    }
  }, [isOpen, fetchedConfig, llmModels]);

  const handleChange = (key: string, value: string | number) => {
    setEditConfig(prev => ({
      ...prev,
      [key]: value,
    }));
  };

  // Save configuration when user clicks button
  const handleSaveConfig = useCallback(() => {
    updateIaConfig({
      id_empresa,
      id_area,
      id_embeddings: editConfig.id_embeddings,
      id_llm: editConfig.id_llm,
      embeddings_dimensions: editConfig.embeddings_dimensions,
      llm_max_tokens: editConfig.llm_max_tokens,
      llm_temperature: editConfig.llm_temperature,
      llm_top_p: editConfig.llm_top_p,
      rag_top_k_results: editConfig.rag_top_k_results,
      rag_similarity_threshold: editConfig.rag_similarity_threshold,
      rag_alpha: editConfig.rag_alpha,
      role_behavior: editConfig.role_behavior,
    }, {
      onSuccess: () => {
        // Deactivate edit mode after successful save
        setIsEditable(false);
      }
    });
  }, [editConfig, updateIaConfig, id_empresa, id_area]);

  if (!fetchedConfig?.result) {
    return (
      <div
        className={`fixed top-16 bottom-0 right-0 w-96 bg-background border-l shadow-lg transform transition-all duration-300 flex flex-col z-50 ${
        isOpen ? 'translate-x-0' : 'translate-x-full'
      }`}
      >
        <Card className="h-full rounded-none border-0 flex flex-col">
          <CardHeader className="pt-3 pb-3 border-b flex-shrink-0">
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <CardTitle className="text-xs">Configuración de IA</CardTitle>
                <CardDescription className="text-xs">
                  {(user as any)?.actual_company_area?.EMPRESA && (
                    <span className="font-semibold">{(user as any)?.actual_company_area?.EMPRESA}</span>
                  )}
                  {area_name && (
                    <span className="font-semibold"> - {area_name}</span>
                  )}
                  {(user as any)?.actual_company_area?.EMPRESA && ' - '}
                  Ajusta los parámetros del modelo.
                </CardDescription>
              </div>
              <button
                onClick={onClose}
                className="text-muted-foreground hover:text-foreground"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
          </CardHeader>

          <CardContent className="flex-1 overflow-y-auto py-4 space-y-4 flex items-center justify-center">
            {isLoading && (
              <span className="text-sm text-muted-foreground">Cargando configuración...</span>
            )}

            {error && (
              <div className="p-3 bg-destructive/10 text-destructive rounded text-sm">
                Error al cargar la configuración.
              </div>
            )}

            {!isLoading && !error && (
              <span className="text-sm text-muted-foreground">No hay datos disponibles</span>
            )}
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div
      className={`fixed top-16 bottom-0 right-0 w-96 bg-background border-l shadow-lg transform transition-all duration-300 flex flex-col z-50 ${
        isOpen ? 'translate-x-0' : 'translate-x-full'
      }`}
    >
      <Card className="h-full rounded-none border-0 flex flex-col">
        {/* Header del Sidebar */}
        <CardHeader className="pt-3 pb-3 border-b flex-shrink-0">
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
              <CardTitle className="text-xs">Configuración de IA</CardTitle>
              <CardDescription className="text-xs">
                {(user as any)?.actual_company_area?.EMPRESA && (
                  <span className="font-semibold">{(user as any)?.actual_company_area?.EMPRESA}</span>
                )}
                {area_name && (
                  <span className="font-semibold"> - {area_name}</span>
                )}
                {(user as any)?.actual_company_area?.EMPRESA && ' - '}
                Ajusta los parámetros del modelo.
              </CardDescription>
            </div>
            <div className="flex items-center gap-2">
              <div className="flex items-center gap-2">
                <Label htmlFor="edit-toggle" className="text-xs cursor-pointer">
                  Editar
                </Label>
                <Switch
                  id="edit-toggle"
                  checked={isEditable}
                  onCheckedChange={setIsEditable}
                />
              </div>
              <button
                onClick={onClose}
                className="text-muted-foreground hover:text-foreground"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
          </div>
        </CardHeader>

        {/* Contenido scrollable con altura definida */}
        <CardContent className="flex-1 overflow-y-auto py-4 space-y-4">
          {/* Configuration Info Section */}
          <div className="bg-muted p-3 rounded space-y-3">
            <div className="text-xs font-semibold text-foreground">Configuración de Modelos</div>

            {/* Embeddings Model Select */}
            <div className="space-y-2">
              <Label className="text-xs">Modelo de Embeddings:</Label>
              <Select
                value={editConfig.id_embeddings.toString()}
                onValueChange={(value) => {
                  const selectedModel = embeddingsModels.find(m => m.ID_MODELO === parseInt(value));
                  if (selectedModel) {
                    handleChange('id_embeddings', selectedModel.ID_MODELO);
                    handleChange('embeddings_dimensions', selectedModel.EXTRA);
                  }
                }}
                disabled={!isEditable || isPending || embeddingsModels.length === 0}
              >
                <SelectTrigger className="w-full text-xs h-8">
                  <SelectValue placeholder="Seleccionar modelo de embeddings" />
                </SelectTrigger>
                <SelectContent className="max-h-48">
                  {embeddingsModels.map((model) => (
                    <SelectItem key={model.ID_MODELO} value={model.ID_MODELO.toString()}>
                      {model.NOMBRE} ({model.PROVEEDOR})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Embeddings Dimensions Display */}
            {editConfig.embeddings_dimensions > 0 && (
              <div className="flex items-center justify-between pt-2 border-t border-muted-foreground/20">
                <span className="text-muted-foreground text-xs">Dimensiones del Vector Generado:</span>
                <span className="font-mono text-xs">{editConfig.embeddings_dimensions}</span>
              </div>
            )}

            {/* LLM Model Select */}
            <div className="space-y-2">
              <Label className="text-xs">Modelo LLM:</Label>
              <Select
                value={editConfig.id_llm.toString()}
                onValueChange={(value) => {
                  const selectedModel = llmModels.find(m => m.ID_MODELO === parseInt(value));
                  if (selectedModel) {
                    handleChange('id_llm', selectedModel.ID_MODELO);
                    // Set max tokens to the model's EXTRA value, and value to half of it
                    const maxTokens = selectedModel.EXTRA;
                    const halfValue = Math.floor(maxTokens / 2);
                    handleChange('llm_max_tokens', halfValue);
                    setLlmMaxTokensLimit(maxTokens);
                  }
                }}
                disabled={!isEditable || isPending || llmModels.length === 0}
              >
                <SelectTrigger className="w-full text-xs h-8">
                  <SelectValue placeholder="Seleccionar modelo LLM" />
                </SelectTrigger>
                <SelectContent className="max-h-48">
                  {llmModels.map((model) => (
                    <SelectItem key={model.ID_MODELO} value={model.ID_MODELO.toString()}>
                      {model.NOMBRE} ({model.PROVEEDOR})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Similarity Threshold */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <Label className="text-foreground font-semibold text-xs">Umbral de Similitud:</Label>
              <span className="text-xs font-mono bg-primary/10 text-primary px-2 py-1 rounded">
                {editConfig.rag_similarity_threshold.toFixed(2)}
              </span>
            </div>
            <p className="text-xs text-muted-foreground">
              Determina qué tan parecido debe ser un documento respecto a la consulta para ser considerado relevante.
            </p>
            <Slider
              value={[editConfig.rag_similarity_threshold]}
              onValueChange={!isEditable || isPending ? undefined : ([value]) => handleChange('rag_similarity_threshold', value)}
              min={0}
              max={1}
              step={0.01}
              className={`w-full ${!isEditable || isPending ? 'cursor-not-allowed opacity-50' : ''}`}
              disabled={!isEditable || isPending}
            />
            <div className="flex justify-between text-xs text-foreground/70">
              <span>0.0</span>
              <span>1.0</span>
            </div>
          </div>

          {/* Temperature */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <Label className="text-foreground font-semibold text-xs">Temperatura:</Label>
              <span className="text-xs font-mono bg-primary/10 text-primary px-2 py-1 rounded">
                {editConfig.llm_temperature.toFixed(2)}
              </span>
            </div>
            <p className="text-xs text-muted-foreground">
              Controla qué tan "creativa" o "arriesgada" es la respuesta del modelo.
            </p>
            <Slider
              value={[editConfig.llm_temperature]}
              onValueChange={!isEditable || isPending ? undefined : ([value]) => handleChange('llm_temperature', value)}
              min={0}
              max={1}
              step={0.1}
              className={`w-full ${!isEditable || isPending ? 'cursor-not-allowed opacity-50' : ''}`}
              disabled={!isEditable || isPending}
            />
            <div className="flex justify-between text-xs text-foreground/70">
              <span>0.0 (Conservador)</span>
              <span>1.0 (Creativo)</span>
            </div>
          </div>

          {/* Max Tokens */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <Label className="text-foreground font-semibold text-xs">Máx. Tokens:</Label>
              <span className="text-xs font-mono bg-primary/10 text-primary px-2 py-1 rounded">
                {editConfig.llm_max_tokens}
              </span>
            </div>
            <p className="text-xs text-muted-foreground">
              Define el tamaño máximo de la respuesta generada por el modelo.
            </p>
            <Slider
              value={[editConfig.llm_max_tokens]}
              onValueChange={!isEditable || isPending ? undefined : ([value]) => handleChange('llm_max_tokens', value)}
              min={256}
              max={llmMaxTokensLimit}
              step={256}
              className={`w-full ${!isEditable || isPending ? 'cursor-not-allowed opacity-50' : ''}`}
              disabled={!isEditable || isPending}
            />
            <div className="flex justify-between text-xs text-foreground/70">
              <span>256</span>
              <span>{llmMaxTokensLimit}</span>
            </div>
          </div>

          {/* Top-K */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <Label className="text-foreground font-semibold text-xs">Top-K Resultados:</Label>
              <span className="text-xs font-mono bg-primary/10 text-primary px-2 py-1 rounded">
                {editConfig.rag_top_k_results}
              </span>
            </div>
            <p className="text-xs text-muted-foreground">
              Cuántos documentos se consideran antes de aplicar otros filtros.
            </p>
            <Slider
              value={[editConfig.rag_top_k_results]}
              onValueChange={!isEditable || isPending ? undefined : ([value]) => handleChange('rag_top_k_results', value)}
              min={1}
              max={20}
              step={1}
              className={`w-full ${!isEditable || isPending ? 'cursor-not-allowed opacity-50' : ''}`}
              disabled={!isEditable || isPending}
            />
            <div className="flex justify-between text-xs text-foreground/70">
              <span>1 (Mínimo)</span>
              <span>20 (Máximo)</span>
            </div>
          </div>

          {/* Alpha */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <Label className="text-foreground font-semibold text-xs">Alpha (Búsqueda Híbrida):</Label>
              <span className="text-xs font-mono bg-primary/10 text-primary px-2 py-1 rounded">
                {editConfig.rag_alpha.toFixed(2)}
              </span>
            </div>
            <p className="text-xs text-muted-foreground">
              Combina búsqueda por palabras clave y búsqueda semántica.
            </p>
            <Slider
              value={[editConfig.rag_alpha]}
              onValueChange={!isEditable || isPending ? undefined : ([value]) => handleChange('rag_alpha', value)}
              min={0}
              max={1}
              step={0.01}
              className={`w-full ${!isEditable || isPending ? 'cursor-not-allowed opacity-50' : ''}`}
              disabled={!isEditable || isPending}
            />
            <div className="flex justify-between text-xs text-foreground/70">
              <span>0.0 (Palabras clave)</span>
              <span>1.0 (Vectorial)</span>
            </div>
          </div>

          {/* LLM Top-P */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <Label className="text-foreground font-semibold text-xs">LLM Top-P:</Label>
              <span className="text-xs font-mono bg-primary/10 text-primary px-2 py-1 rounded">
                {editConfig.llm_top_p.toFixed(2)}
              </span>
            </div>
            <p className="text-xs text-muted-foreground">
              Controla qué tan amplio es el conjunto de palabras que el modelo considera al generar texto.
            </p>
            <Slider
              value={[editConfig.llm_top_p]}
              onValueChange={!isEditable || isPending ? undefined : ([value]) => handleChange('llm_top_p', value)}
              min={0}
              max={1}
              step={0.01}
              className={`w-full ${!isEditable || isPending ? 'cursor-not-allowed opacity-50' : ''}`}
              disabled={!isEditable || isPending}
            />
            <div className="flex justify-between text-xs text-foreground/70">
              <span>0.0</span>
              <span>1.0</span>
            </div>
          </div>

          {/* Role Behavior */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <Label className="text-foreground font-semibold text-xs">Comportamiento del Modelo:</Label>
              <span className="text-xs text-muted-foreground">{editConfig.role_behavior.length}/750</span>
            </div>
            <textarea
              value={editConfig.role_behavior}
              onChange={(e) => {
                if (e.target.value.length <= 750) {
                  handleChange('role_behavior', e.target.value);
                }
              }}
              disabled={!isEditable || isPending}
              className="w-full px-2 py-2 text-xs border rounded bg-background disabled:opacity-50 resize-none h-24 font-mono"
              placeholder="Describe el comportamiento del rol..."
              maxLength={750}
            />
          </div>

          {/* Save Button */}
          <Button
            onClick={handleSaveConfig}
            disabled={!isEditable || isPending}
            className="w-full mt-4"
            variant="default"
          >
            {isPending ? 'Guardando...' : (
              <>
                <Save className="h-4 w-4 mr-2" />
                Guardar Cambios
              </>
            )}
          </Button>
        </CardContent>
      </Card>
    </div>
  );
};

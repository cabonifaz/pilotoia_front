import { useState, useCallback, useRef, useEffect } from 'react';
import { X } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/shadcn/card';
import { Label } from '@/components/shadcn/label';
import { Slider } from '@/components/shadcn/slider';
import { useQueryAuthContext } from '../../contexts/QueryAuthContext';
import { type AIConfig, type ChatContext } from '@/types/aiConfig';

interface AIConfigSidebarProps {
  isOpen: boolean;
  config: AIConfig;
  chatContext: ChatContext;
  onClose: () => void;
  onConfigChange: (config: AIConfig) => void;
  onChatContextChange?: (context: ChatContext) => void;
}

export const AIConfigSidebar = ({
  isOpen,
  config,
  onClose,
  onConfigChange,
}: AIConfigSidebarProps) => {
  const [localConfig, setLocalConfig] = useState(config);
  const { user } = useQueryAuthContext();
  const debounceTimerRef = useRef<NodeJS.Timeout | null>(null);

  // Check if user should have read-only access (Admin or User roles)
  const isReadOnlyRole = user?.id_tipo_rol === 2 || user?.id_tipo_rol === 3;

  // Sync local state when prop changes
  useEffect(() => {
    setLocalConfig(config);
  }, [config]);

  // Debounced config update
  const debouncedConfigChange = useCallback((newConfig: AIConfig) => {
    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
    }

    debounceTimerRef.current = setTimeout(() => {
      onConfigChange(newConfig);
    }, 300);
  }, [onConfigChange]);

  const handleConfigChange = (key: keyof AIConfig, value: string | number) => {
    const newConfig = { ...localConfig, [key]: value };
    setLocalConfig(newConfig);
    debouncedConfigChange(newConfig);
  };

  return (
    <div
      className={`fixed top-16 bottom-0 right-0 w-96 bg-background border-l shadow-lg transform transition-all duration-300 flex flex-col ${
        isOpen ? 'translate-x-0' : 'translate-x-full'
      }`}
    >
      <Card className="h-full rounded-none border-0 flex flex-col">
        {/* Header del Sidebar */}
        <CardHeader className="pb-3 border-b flex-shrink-0">
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-xs">Configuración de IA</CardTitle>
              <CardDescription className="text-xs">Ajusta los parámetros del modelo.</CardDescription>
            </div>
            <button
              onClick={onClose}
              className="text-muted-foreground hover:text-foreground"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
        </CardHeader>

        {/* Contenido scrollable con altura definida */}
        <CardContent className="flex-1 overflow-y-auto py-4 space-y-4">

          {/* Similarity Threshold */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <Label className="text-foreground font-semibold text-xs">Umbral de Similitud:</Label>
              <span className="text-xs font-mono bg-primary/10 text-primary px-2 py-1 rounded">
                {localConfig.similarity_threshold.toFixed(2)}
              </span>
            </div>
            <Slider
              value={[localConfig.similarity_threshold]}
              onValueChange={isReadOnlyRole ? undefined : ([value]) => handleConfigChange('similarity_threshold', value)}
              min={0}
              max={1}
              step={0.01}
              className={`w-full ${isReadOnlyRole ? 'cursor-not-allowed opacity-50' : ''}`}
              disabled={isReadOnlyRole}
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
                {localConfig.temperature.toFixed(2)}
              </span>
            </div>
            <Slider
              value={[localConfig.temperature]}
              onValueChange={isReadOnlyRole ? undefined : ([value]) => handleConfigChange('temperature', value)}
              min={0}
              max={1}
              step={0.1}
              className={`w-full ${isReadOnlyRole ? 'cursor-not-allowed opacity-50' : ''}`}
              disabled={isReadOnlyRole}
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
                {localConfig.max_tokens}
              </span>
            </div>
            <Slider
              value={[localConfig.max_tokens]}
              onValueChange={isReadOnlyRole ? undefined : ([value]) => handleConfigChange('max_tokens', value)}
              min={256}
              max={8192}
              step={256}
              className={`w-full ${isReadOnlyRole ? 'cursor-not-allowed opacity-50' : ''}`}
              disabled={isReadOnlyRole}
            />
            <div className="flex justify-between text-xs text-foreground/70">
              <span>256</span>
              <span>8192</span>
            </div>
          </div>

          {/* Top-K */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <Label className="text-foreground font-semibold text-xs">Top-K Resultados:</Label>
              <span className="text-xs font-mono bg-primary/10 text-primary px-2 py-1 rounded">
                {localConfig.top_k}
              </span>
            </div>
            <Slider
              value={[localConfig.top_k]}
              onValueChange={isReadOnlyRole ? undefined : ([value]) => handleConfigChange('top_k', value)}
              min={1}
              max={20}
              step={1}
              className={`w-full ${isReadOnlyRole ? 'cursor-not-allowed opacity-50' : ''}`}
              disabled={isReadOnlyRole}
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
                {localConfig.alpha.toFixed(2)}
              </span>
            </div>
            <Slider
              value={[localConfig.alpha]}
              onValueChange={isReadOnlyRole ? undefined : ([value]) => handleConfigChange('alpha', value)}
              min={0}
              max={1}
              step={0.01}
              className={`w-full ${isReadOnlyRole ? 'cursor-not-allowed opacity-50' : ''}`}
              disabled={isReadOnlyRole}
            />
            <div className="flex justify-between text-xs text-foreground/70">
              <span>0.0 (Palabras clave)</span>
              <span>1.0 (Vectorial)</span>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

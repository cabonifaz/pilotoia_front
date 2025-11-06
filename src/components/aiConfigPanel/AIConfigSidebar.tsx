import { useState, useCallback, useRef, useEffect } from 'react';
import { X, ChevronDown } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/shadcn/card';
import { Button } from '@/components/shadcn/button';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/shadcn/collapsible';
import { Input } from '@/components/shadcn/input';
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
  chatContext,
  onClose,
  onConfigChange,
  onChatContextChange,
}: AIConfigSidebarProps) => {
  const [isExpanded, setIsExpanded] = useState(true);
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

  const handleChatContextChange = (key: keyof ChatContext, value: string | number) => {
    if (onChatContextChange) {
      const newContext = { ...chatContext, [key]: value };
      onChatContextChange(newContext);
    }
  };

  return (
    <div
      className={`fixed inset-y-0 right-0 w-96 bg-background border-l shadow-lg transform transition-all duration-300 flex flex-col ${
        isOpen ? 'translate-x-0' : 'translate-x-full'
      }`}
      style={{ top: '69px', bottom: '0' }}
    >
      <Card className="h-full rounded-none border-0 flex flex-col">
        {/* Header del Sidebar */}
        <CardHeader className="pb-3 border-b flex-shrink-0">
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Configuración de IA</CardTitle>
              <CardDescription>Ajusta los parámetros del modelo.</CardDescription>
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
          <Collapsible open={isExpanded} onOpenChange={setIsExpanded}>
            <CollapsibleTrigger className="w-full">
              <div className="flex items-center justify-between cursor-pointer hover:bg-accent/50 transition-colors px-2 py-1 rounded">
                <span className="font-semibold text-sm flex items-center gap-2">
                  ⚙️ Configuración General
                </span>
                <ChevronDown
                  className={`h-4 w-4 transition-transform duration-200 ${
                    isExpanded ? 'rotate-180' : ''
                  }`}
                />
              </div>
            </CollapsibleTrigger>

            <CollapsibleContent className="space-y-4 mt-4">
              {/* User (Read-only) */}
              <div className="space-y-2">
                <Label htmlFor="user">Usuario:</Label>
                <Input
                  id="user"
                  type="text"
                  value={chatContext.user}
                  placeholder="Usuario"
                  readOnly
                  className="bg-muted cursor-not-allowed text-xs"
                />
              </div>

              {/* Company */}
              <div className="space-y-2">
                <Label htmlFor="company">Empresa:</Label>
                <Input
                  id="company"
                  type="text"
                  value={chatContext.company}
                  onChange={isReadOnlyRole ? undefined : (e) => handleChatContextChange('company', e.target.value)}
                  placeholder="Empresa"
                  readOnly
                  className="bg-muted cursor-not-allowed text-xs"
                />
              </div>

              {/* Area */}
              <div className="space-y-2">
                <Label htmlFor="area">Área:</Label>
                <Input
                  id="area"
                  type="text"
                  value={chatContext.area}
                  onChange={isReadOnlyRole ? undefined : (e) => handleChatContextChange('area', e.target.value)}
                  placeholder="Área"
                  readOnly
                  className="bg-muted cursor-not-allowed text-xs"
                />
              </div>
            </CollapsibleContent>
          </Collapsible>

          {/* Similarity Threshold */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <Label className="text-foreground font-semibold text-sm">Umbral de Similitud:</Label>
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
              <Label className="text-foreground font-semibold text-sm">Temperatura:</Label>
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
              <Label className="text-foreground font-semibold text-sm">Máx. Tokens:</Label>
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
              <Label className="text-foreground font-semibold text-sm">Top-K Resultados:</Label>
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
              <Label className="text-foreground font-semibold text-sm">Alpha (Búsqueda Híbrida):</Label>
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

        {/* Footer Buttons */}
        <div className="border-t p-4 flex gap-2 flex-shrink-0">
          <Button
            variant="outline"
            onClick={onClose}
            className="flex-1"
          >
            Cerrar
          </Button>
        </div>
      </Card>
    </div>
  );
};

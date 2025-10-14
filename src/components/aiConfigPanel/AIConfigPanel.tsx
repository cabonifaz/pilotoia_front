import { useState, useCallback, useRef, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/shadcn/card';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/shadcn/collapsible';
import { Input } from '@/components/shadcn/input';
import { Label } from '@/components/shadcn/label';
import { Slider } from '@/components/shadcn/slider';
import { ChevronDown } from 'lucide-react';
import { useQueryAuthContext } from '../../contexts/QueryAuthContext';
import { type AIConfig, type ChatContext } from '@/types/aiConfig';

interface AIConfigPanelProps {
  config: AIConfig;
  chatContext: ChatContext;
  onConfigChange: (config: AIConfig) => void;
  onChatContextChange?: (context: ChatContext) => void;
  onExpandedChange?: (expanded: boolean) => void;
}

const AIConfigPanel = ({ config, chatContext, onConfigChange, onChatContextChange, onExpandedChange }: AIConfigPanelProps) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const [localConfig, setLocalConfig] = useState(config);
  const { user } = useQueryAuthContext();
  const debounceTimerRef = useRef<NodeJS.Timeout | null>(null);

  // Check if user should have read-only access (Admin or User roles)
  const isReadOnlyRole = user?.id_tipo_rol === 2 || user?.id_tipo_rol === 3;

  // Sync local state when prop changes
  useEffect(() => {
    setLocalConfig(config);
  }, [config]);

  const toggleExpanded = () => {
    const newExpanded = !isExpanded;
    setIsExpanded(newExpanded);
    onExpandedChange?.(newExpanded);
  };

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
    <Card>
      <Collapsible open={isExpanded} onOpenChange={setIsExpanded}>
        <CollapsibleTrigger asChild>
          <CardHeader 
            className="cursor-pointer hover:bg-accent/50 transition-colors"
            onClick={toggleExpanded}
          >
            <CardTitle className="flex items-center justify-between text-lg">
              <span className="flex items-center gap-2">
                ⚙️ Configuración de IA
              </span>
              <ChevronDown 
                className={`h-4 w-4 transition-transform duration-200 ${
                  isExpanded ? 'rotate-180' : ''
                }`} 
              />
            </CardTitle>
          </CardHeader>
        </CollapsibleTrigger>
        
        <CollapsibleContent>
          <CardContent className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="user">Usuario:</Label>
              <Input
                id="user"
                type="text"
                value={chatContext.user}
                placeholder="Usuario"
                readOnly
                className="bg-muted cursor-not-allowed"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="company">Empresa:</Label>
              <Input
                id="company"
                type="text"
                value={chatContext.company}
                onChange={isReadOnlyRole ? undefined : (e) => handleChatContextChange('company', e.target.value)}
                placeholder="Empresa"
                disabled={isReadOnlyRole}
                className={isReadOnlyRole ? "bg-muted cursor-not-allowed" : ""}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="area">Área:</Label>
              <Input
                id="area"
                type="text"
                value={chatContext.area}
                onChange={isReadOnlyRole ? undefined : (e) => handleChatContextChange('area', e.target.value)}
                placeholder="Área"
                disabled={isReadOnlyRole}
                className={isReadOnlyRole ? "bg-muted cursor-not-allowed" : ""}
              />
            </div>

            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <Label className="text-foreground font-semibold">Umbral de Similitud:</Label>
                <span className="text-sm font-mono bg-primary/10 text-primary px-2 py-1 rounded">
                  {localConfig.similarity_threshold}
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

            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <Label className="text-foreground font-semibold">Temperatura:</Label>
                <span className="text-sm font-mono bg-primary/10 text-primary px-2 py-1 rounded">
                  {localConfig.temperature}
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

            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <Label className="text-foreground font-semibold">Máx. Tokens:</Label>
                <span className="text-sm font-mono bg-primary/10 text-primary px-2 py-1 rounded">
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
                <span>4096</span>
              </div>
            </div>

            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <Label className="text-foreground font-semibold">Top-K Resultados:</Label>
                <span className="text-sm font-mono bg-primary/10 text-primary px-2 py-1 rounded">
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

            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <Label className="text-foreground font-semibold">Alpha (Búsqueda Híbrida):</Label>
                <span className="text-sm font-mono bg-primary/10 text-primary px-2 py-1 rounded">
                  {localConfig.alpha}
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
        </CollapsibleContent>
      </Collapsible>
    </Card>
  );
};

export default AIConfigPanel;
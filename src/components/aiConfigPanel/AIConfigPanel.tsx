import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/shadcn/card';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/shadcn/collapsible';
import { Input } from '@/components/shadcn/input';
import { Label } from '@/components/shadcn/label';
import { Slider } from '@/components/shadcn/slider';
import { ChevronDown } from 'lucide-react';
import { useQueryAuthContext } from '../../contexts/QueryAuthContext';

interface AIConfig {
  user_id: string;
  company_id: string;
  area: string;
  similarity_threshold: number;
  alpha?: number;
  temperature: number;
  max_tokens: number;
  top_k: number;
}

interface AIConfigPanelProps {
  config: AIConfig;
  onConfigChange: (config: AIConfig) => void;
  onExpandedChange?: (expanded: boolean) => void;
}

const AIConfigPanel = ({ config, onConfigChange, onExpandedChange }: AIConfigPanelProps) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const { user } = useQueryAuthContext();

  // Check if user should have read-only access (Admin or User roles)
  const isReadOnlyRole = user?.id_tipo_rol === 2 || user?.id_tipo_rol === 3;

  const toggleExpanded = () => {
    const newExpanded = !isExpanded;
    setIsExpanded(newExpanded);
    onExpandedChange?.(newExpanded);
  };

  const handleConfigChange = (key: keyof AIConfig, value: string | number) => {
    const newConfig = { ...config, [key]: value };
    onConfigChange(newConfig);
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
              <Label htmlFor="user_id">Usuario:</Label>
              <Input
                id="user_id"
                type="text"
                value={config.user_id}
                onChange={(e) => handleConfigChange('user_id', e.target.value)}
                placeholder="Usuario"
                readOnly
                className="bg-muted cursor-not-allowed"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="company_id">Empresa:</Label>
              <Input
                id="company_id"
                type="text"
                value={config.company_id}
                onChange={(e) => handleConfigChange('company_id', e.target.value)}
                placeholder="Empresa"
                readOnly={isReadOnlyRole}
                className={isReadOnlyRole ? "bg-muted cursor-not-allowed" : ""}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="area">Área:</Label>
              <Input
                id="area"
                type="text"
                value={config.area}
                onChange={(e) => handleConfigChange('area', e.target.value)}
                placeholder="Área"
                readOnly={isReadOnlyRole}
                className={isReadOnlyRole ? "bg-muted cursor-not-allowed" : ""}
              />
            </div>

            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <Label className="text-foreground font-semibold">Umbral de Similitud:</Label>
                <span className="text-sm font-mono bg-primary/10 text-primary px-2 py-1 rounded">
                  {config.similarity_threshold}
                </span>
              </div>
              <Slider
                value={[config.similarity_threshold]}
                onValueChange={isReadOnlyRole ? undefined : ([value]) => handleConfigChange('similarity_threshold', value)}
                min={0}
                max={1}
                step={0.1}
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
                  {config.temperature}
                </span>
              </div>
              <Slider
                value={[config.temperature]}
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
                  {config.max_tokens}
                </span>
              </div>
              <Slider
                value={[config.max_tokens]}
                onValueChange={isReadOnlyRole ? undefined : ([value]) => handleConfigChange('max_tokens', value)}
                min={256}
                max={4096}
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
                  {config.top_k}
                </span>
              </div>
              <Slider
                value={[config.top_k]}
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
                  {config.alpha ?? 0.5}
                </span>
              </div>
              <Slider
                value={[config.alpha ?? 0.5]}
                onValueChange={isReadOnlyRole ? undefined : ([value]) => handleConfigChange('alpha', value)}
                min={0}
                max={1}
                step={0.1}
                className={`w-full ${isReadOnlyRole ? 'cursor-not-allowed opacity-50' : ''}`}
                disabled={isReadOnlyRole}
              />
              <div className="flex justify-between text-xs text-foreground/70">
                <span>0.0 (Palabras clave)</span>
                <span>1.0 (Semántico/Vectorial)</span>
              </div>
            </div>
          </CardContent>
        </CollapsibleContent>
      </Collapsible>
    </Card>
  );
};

export default AIConfigPanel;
import { useState } from 'react';
import './AIConfigPanel.css';

interface AIConfig {
  user_id: string;
  company_id: string;
  similarity_threshold: number;
  temperature: number;
  max_tokens: number;
}

interface AIConfigPanelProps {
  onConfigChange: (config: AIConfig) => void;
  initialConfig?: Partial<AIConfig>;
  onExpandedChange?: (expanded: boolean) => void;
}

const AIConfigPanel = ({ onConfigChange, initialConfig, onExpandedChange }: AIConfigPanelProps) => {
  const [config, setConfig] = useState<AIConfig>({
    user_id: initialConfig?.user_id || 'user123',
    company_id: initialConfig?.company_id || 'CIA00001',
    similarity_threshold: initialConfig?.similarity_threshold || 0.4,
    temperature: initialConfig?.temperature || 0.3,
    max_tokens: initialConfig?.max_tokens || 1024,
  });

  const [isExpanded, setIsExpanded] = useState(false);

  const toggleExpanded = () => {
    const newExpanded = !isExpanded;
    setIsExpanded(newExpanded);
    onExpandedChange?.(newExpanded);
  };

  const handleConfigChange = (key: keyof AIConfig, value: string | number) => {
    const newConfig = { ...config, [key]: value };
    setConfig(newConfig);
    onConfigChange(newConfig);
  };

  return (
    <div className="ai-config-panel">
      <div 
        className="config-header"
        onClick={toggleExpanded}
      >
        <h3>⚙️ Configuración de IA</h3>
        <span className={`expand-icon ${isExpanded ? 'expanded' : ''}`}>
          ▼
        </span>
      </div>

      {isExpanded && (
        <div className="config-content">
          <div className="config-group">
            <label className="config-label">Usuario:</label>
            <input
              type="text"
              className="config-input"
              value={config.user_id}
              onChange={(e) => handleConfigChange('user_id', e.target.value)}
              placeholder="user123"
            />
          </div>

          <div className="config-group">
            <label className="config-label">Empresa:</label>
            <input
              type="text"
              className="config-input"
              value={config.company_id}
              onChange={(e) => handleConfigChange('company_id', e.target.value)}
              placeholder="Edificaciones"
            />
          </div>

          <div className="config-group">
            <label className="config-label">
              Umbral de Similitud: 
              <span className="config-value">{config.similarity_threshold}</span>
            </label>
            <input
              type="range"
              className="config-slider"
              min="0"
              max="1"
              step="0.1"
              value={config.similarity_threshold}
              onChange={(e) => handleConfigChange('similarity_threshold', parseFloat(e.target.value))}
            />
            <div className="slider-labels">
              <span>0.0</span>
              <span>1.0</span>
            </div>
          </div>

          <div className="config-group">
            <label className="config-label">
              Temperatura: 
              <span className="config-value">{config.temperature}</span>
            </label>
            <input
              type="range"
              className="config-slider"
              min="0"
              max="1"
              step="0.1"
              value={config.temperature}
              onChange={(e) => handleConfigChange('temperature', parseFloat(e.target.value))}
            />
            <div className="slider-labels">
              <span>0.0 (Conservador)</span>
              <span>1.0 (Creativo)</span>
            </div>
          </div>

          <div className="config-group">
            <label className="config-label">
              Máx. Tokens: 
              <span className="config-value">{config.max_tokens}</span>
            </label>
            <input
              type="range"
              className="config-slider"
              min="256"
              max="4096"
              step="256"
              value={config.max_tokens}
              onChange={(e) => handleConfigChange('max_tokens', parseInt(e.target.value))}
            />
            <div className="slider-labels">
              <span>256</span>
              <span>4096</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AIConfigPanel;
import { createContext, useContext, useEffect, useState, useMemo } from 'react';
import type { ReactNode } from 'react';

export type VlmMode = 'vlm_qa_over_text' | 'vlm_extract_fields' | 'vlm_summarize_doc' | 'vlm_ocr_clean';
export type ChatAction = 'vectorial' | 'vectorial+sql' | 'login' | 'ocr' | 'mcp';

interface CommandContextType {
  // Command selection
  selectedAction: ChatAction;
  onSelectedActionChange: (action: ChatAction) => void;
  isMcpAvailable: boolean;

  // VLM sub-mode (only relevant when selectedAction === 'ocr')
  vlmMode: VlmMode;
  onVlmModeChange: (mode: VlmMode) => void;

  // Command execution
  onSearchVectorial: () => void;
  onSearchVectorialSQL: () => void;
  onAnalyzeImages: () => void;
  onSearchMcp: () => void;
  onCancel: () => void;
  onMainActionChange: (action: () => void) => void;

  // UI state
  isLoading: boolean;
  isAuthenticated: boolean;
  token?: string;

  // User input
  userQuery: string;
  onQueryChange: (query: string) => void;

  // TTS state
  ttsEnabled: boolean;
  onTtsEnabledChange: (enabled: boolean) => void;

  // OCR images
  ocrImages: File[];
  onOcrImagesChange: (files: File[]) => void;
}

const CommandContext = createContext<CommandContextType | undefined>(undefined);

interface CommandProviderProps {
  children: ReactNode;

  // User input
  userQuery: string;
  onQueryChange: (query: string) => void;

  // Loading state
  isLoading: boolean;
  onCancel: () => void;

  // Command execution
  onSearchVectorial: () => void;
  onSearchVectorialSQL: () => void;
  onAnalyzeImages: () => void;
  onSearchMcp: () => void;
  isMcpAvailable: boolean;

  // Auth
  isAuthenticated: boolean;
  token?: string;

  // Main action callback
  onMainActionChange: (action: () => void) => void;

  // TTS state
  ttsEnabled: boolean;
  onTtsEnabledChange: (enabled: boolean) => void;

  // OCR images
  ocrImages: File[];
  onOcrImagesChange: (files: File[]) => void;

  // VLM mode (lifted to parent)
  vlmMode: VlmMode;
  onVlmModeChange: (mode: VlmMode) => void;
}

export const CommandProvider = ({
  children,
  userQuery,
  onQueryChange,
  isLoading,
  onCancel,
  onSearchVectorial,
  onSearchVectorialSQL,
  onAnalyzeImages,
  onSearchMcp,
  isMcpAvailable,
  isAuthenticated,
  token,
  onMainActionChange,
  ttsEnabled,
  onTtsEnabledChange,
  ocrImages,
  onOcrImagesChange,
  vlmMode,
  onVlmModeChange,
}: CommandProviderProps) => {
  const [selectedAction, setSelectedAction] = useState<ChatAction>('vectorial');

  useEffect(() => {
    if (!isMcpAvailable && selectedAction === 'mcp') {
      setSelectedAction('vectorial');
    }
  }, [isMcpAvailable, selectedAction]);

  // Create main action handler based on selectedAction
  useEffect(() => {
    const handleMainButtonClick = () => {
      if (selectedAction === 'vectorial') {
        onSearchVectorial();
      } else if (selectedAction === 'ocr') {
        onAnalyzeImages();
      } else if (selectedAction === 'mcp' && isMcpAvailable) {
        onSearchMcp();
      } /*else if (selectedAction === 'vectorial+sql') {
        onSearchVectorialSQL();
      }
      else if (selectedAction === 'login') {
          handle login
      }*/
    };

    onMainActionChange(handleMainButtonClick);
  }, [selectedAction, isAuthenticated, isMcpAvailable, onSearchVectorial, onSearchVectorialSQL, onAnalyzeImages, onSearchMcp, onMainActionChange]);

  // Memoize context value to prevent unnecessary re-renders
  const value = useMemo<CommandContextType>(
    () => ({
      selectedAction,
      onSelectedActionChange: setSelectedAction,
      isMcpAvailable,
      vlmMode,
      onVlmModeChange,
      onSearchVectorial,
      onSearchVectorialSQL,
      onAnalyzeImages,
      onSearchMcp,
      onCancel,
      onMainActionChange,
      isLoading,
      isAuthenticated,
      token,
      userQuery,
      onQueryChange,
      ttsEnabled,
      onTtsEnabledChange,
      ocrImages,
      onOcrImagesChange,
    }),
    [selectedAction, isMcpAvailable, vlmMode, onVlmModeChange, onSearchVectorial, onSearchVectorialSQL, onAnalyzeImages, onSearchMcp, onCancel, onMainActionChange, isLoading, isAuthenticated, token, userQuery, onQueryChange, ttsEnabled, onTtsEnabledChange, ocrImages, onOcrImagesChange]
  );

  return (
    <CommandContext.Provider value={value}>
      {children}
    </CommandContext.Provider>
  );
};

export const useCommand = () => {
  const context = useContext(CommandContext);
  if (!context) {
    throw new Error('useCommand must be used within CommandProvider');
  }
  return context;
};

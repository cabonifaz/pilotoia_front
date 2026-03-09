import { createContext, useContext, useEffect, useState, useMemo } from 'react';
import type { ReactNode } from 'react';

interface CommandContextType {
  // Command selection
  selectedAction: 'vectorial' | 'vectorial+sql' | 'login' | 'ocr';
  onSelectedActionChange: (action: 'vectorial' | 'vectorial+sql' | 'login' | 'ocr') => void;

  // Command execution
  onSearchVectorial: () => void;
  onSearchVectorialSQL: () => void;
  onAnalyzeImages: () => void;
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
  isAuthenticated,
  token,
  onMainActionChange,
  ttsEnabled,
  onTtsEnabledChange,
  ocrImages,
  onOcrImagesChange,
}: CommandProviderProps) => {
  const [selectedAction, setSelectedAction] = useState<'vectorial' | 'vectorial+sql' | 'login' | 'ocr'>('vectorial');

  // Create main action handler based on selectedAction
  useEffect(() => {
    const handleMainButtonClick = () => {
      if (selectedAction === 'vectorial') {
        onSearchVectorial();
      } else if (selectedAction === 'ocr') {
        onAnalyzeImages();
      } /*else if (selectedAction === 'vectorial+sql') {
        onSearchVectorialSQL();
      }
      else if (selectedAction === 'login') {
          handle login
      }*/
    };

    onMainActionChange(handleMainButtonClick);
  }, [selectedAction, isAuthenticated, onSearchVectorial, onSearchVectorialSQL, onAnalyzeImages, onMainActionChange]);

  // Memoize context value to prevent unnecessary re-renders
  const value = useMemo<CommandContextType>(
    () => ({
      selectedAction,
      onSelectedActionChange: setSelectedAction,
      onSearchVectorial,
      onSearchVectorialSQL,
      onAnalyzeImages,
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
    [selectedAction, onSearchVectorial, onSearchVectorialSQL, onAnalyzeImages, onCancel, onMainActionChange, isLoading, isAuthenticated, token, userQuery, onQueryChange, ttsEnabled, onTtsEnabledChange, ocrImages, onOcrImagesChange]
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

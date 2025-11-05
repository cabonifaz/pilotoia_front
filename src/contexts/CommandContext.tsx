import { createContext, useContext, useEffect, useState, useMemo } from 'react';
import type { ReactNode } from 'react';

interface CommandContextType {
  // Command selection
  selectedAction: 'enviar' | 'agente' | 'login';
  onSelectedActionChange: (action: 'enviar' | 'agente' | 'login') => void;

  // Command execution
  onSend: () => void;
  onAgentSend: () => void;
  onCancel: () => void;
  onMainActionChange: (action: () => void) => void;

  // UI state
  isLoading: boolean;
  isAuthenticated: boolean;
  token?: string;

  // User input
  userQuery: string;
  onQueryChange: (query: string) => void;
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
  onSend: () => void;
  onAgentSend: () => void;

  // Auth
  isAuthenticated: boolean;
  token?: string;

  // Main action callback
  onMainActionChange: (action: () => void) => void;
}

export const CommandProvider = ({
  children,
  userQuery,
  onQueryChange,
  isLoading,
  onCancel,
  onSend,
  onAgentSend,
  isAuthenticated,
  token,
  onMainActionChange,
}: CommandProviderProps) => {
  const [selectedAction, setSelectedAction] = useState<'enviar' | 'agente' | 'login'>('enviar');

  // Create main action handler based on selectedAction
  useEffect(() => {
    const handleMainButtonClick = () => {
      if (selectedAction === 'enviar') {
        onSend();
      }
      // else if (selectedAction === 'agente') {
      //   onAgentSend();
      // } else if (selectedAction === 'login') {
      //   // handle login
      // }
    };

    onMainActionChange(handleMainButtonClick);
  }, [selectedAction, isAuthenticated, onSend, onAgentSend, onMainActionChange]);

  // Memoize context value to prevent unnecessary re-renders
  const value = useMemo<CommandContextType>(
    () => ({
      selectedAction,
      onSelectedActionChange: setSelectedAction,
      onSend,
      onAgentSend,
      onCancel,
      onMainActionChange,
      isLoading,
      isAuthenticated,
      token,
      userQuery,
      onQueryChange,
    }),
    [selectedAction, onSend, onAgentSend, onCancel, onMainActionChange, isLoading, isAuthenticated, token, userQuery, onQueryChange]
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

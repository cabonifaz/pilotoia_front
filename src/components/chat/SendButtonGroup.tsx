import { useState, useEffect } from 'react';
import { Button } from '@/components/shadcn/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/shadcn/dropdown-menu';
import { ChevronDown, Send, Bot, Lock } from 'lucide-react';
import { LoginModal } from '../external-api/LoginModal';

interface SendButtonGroupProps {
  onSend: () => void;
  onAgentSend: () => void;
  disabled: boolean;
  isAuthenticated: boolean;
  selectedAction: 'enviar' | 'agente' | 'login';
  onSelectedActionChange: (action: 'enviar' | 'agente' | 'login') => void;
  onMainActionChange?: (action: () => void) => void;
}

export const SendButtonGroup = ({ onSend, onAgentSend, disabled, isAuthenticated, selectedAction, onSelectedActionChange, onMainActionChange }: SendButtonGroupProps) => {
  const [showLoginModal, setShowLoginModal] = useState(false);

  const handleMainButtonClick = () => {
    if (selectedAction === 'enviar') {
      onSend();
    } else if (selectedAction === 'agente') {
      onAgentSend();
    } else if (selectedAction === 'login') {
      setShowLoginModal(true);
    }
  };

  // Notify parent when the main action changes
  useEffect(() => {
    if (onMainActionChange) {
      onMainActionChange(handleMainButtonClick);
    }
  }, [selectedAction, isAuthenticated, onSend, onAgentSend]);

  // Auto-switch to agente when user logs in while login is selected
  useEffect(() => {
    if (selectedAction === 'login' && isAuthenticated) {
      onSelectedActionChange('agente');
    }
  }, [isAuthenticated, selectedAction, onSelectedActionChange]);

  const getButtonContent = () => {
    if (selectedAction === 'enviar') {
      return (
        <>
          <Send className="h-4 w-4 mr-2" />
          Enviar
        </>
      );
    }
    if (selectedAction === 'agente') {
      return (
        <>
          <Bot className="h-4 w-4 mr-2" />
          Agente
        </>
      );
    }
    return (
      <>
        <Lock className="h-4 w-4 mr-2" />
        External Login
      </>
    );
  };

  return (
    <>
      <div className="flex">
        <Button
          onClick={handleMainButtonClick}
          disabled={selectedAction !== 'login' && disabled}
          size="sm"
          className="rounded-r-none"
        >
          {getButtonContent()}
        </Button>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              size="sm"
              variant="default"
              className="rounded-l-none border-l px-2"
            >
              <ChevronDown className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            {selectedAction !== 'enviar' && (
              <DropdownMenuItem onSelect={() => onSelectedActionChange('enviar')}>
                <Send className="h-4 w-4 mr-2" />
                Enviar
              </DropdownMenuItem>
            )}
            {isAuthenticated && selectedAction !== 'agente' && (
              <DropdownMenuItem onSelect={() => onSelectedActionChange('agente')}>
                <Bot className="h-4 w-4 mr-2" />
                Agente
              </DropdownMenuItem>
            )}
            {!isAuthenticated && selectedAction !== 'login' && (
              <DropdownMenuItem onSelect={() => onSelectedActionChange('login')}>
                <Lock className="h-4 w-4 mr-2" />
                External Login
              </DropdownMenuItem>
            )}
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      <LoginModal
        open={showLoginModal}
        onOpenChange={setShowLoginModal}
        onLoginSuccess={() => setShowLoginModal(false)}
      />
    </>
  );
};

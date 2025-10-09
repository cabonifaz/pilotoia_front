import { useState, useEffect } from 'react';
import { Button } from '@/components/shadcn/button';
/*import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/shadcn/dropdown-menu';*/
import { /*ChevronDown,*/ Send/*, Bot, Lock*/ } from 'lucide-react';
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

export const SendButtonGroup = ({ onSend, onAgentSend, disabled, isAuthenticated, selectedAction, /*onSelectedActionChange,*/ onMainActionChange }: SendButtonGroupProps) => {
  const [showLoginModal, setShowLoginModal] = useState(false);

  const handleMainButtonClick = () => {
    if (selectedAction === 'enviar') {
      onSend();
    }
    // else if (selectedAction === 'agente') {
    //   onAgentSend();
    // } else if (selectedAction === 'login') {
    //   setShowLoginModal(true);
    // }
  };

  // Notify parent when the main action changes
  useEffect(() => {
    if (onMainActionChange) {
      onMainActionChange(handleMainButtonClick);
    }
  }, [selectedAction, isAuthenticated, onSend, onAgentSend]);

  // Auto-switch to agente when user logs in while login is selected
  // useEffect(() => {
  //   if (selectedAction === 'login' && isAuthenticated) {
  //     onSelectedActionChange('agente');
  //   }
  // }, [isAuthenticated, selectedAction, onSelectedActionChange]);

  const getButtonContent = () => {
    if (selectedAction === 'enviar') {
      return (
        <>
          <Send className="h-4 w-4 mr-2" />
          Enviar
        </>
      );
    }
    // if (selectedAction === 'agente') {
    //   return (
    //     <>
    //       <Bot className="h-4 w-4 mr-2" />
    //       Agente
    //     </>
    //   );
    // }
    // return (
    //   <>
    //     <Lock className="h-4 w-4 mr-2" />
    //     External Login
    //   </>
    // );
  };

  return (
    <>
      <Button
        onClick={handleMainButtonClick}
        disabled={selectedAction !== 'login' && disabled}
        size="sm"
      >
        {getButtonContent()}
      </Button>

      <LoginModal
        open={showLoginModal}
        onOpenChange={setShowLoginModal}
        onLoginSuccess={() => setShowLoginModal(false)}
      />
    </>
  );
};

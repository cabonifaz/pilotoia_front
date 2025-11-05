import {
  DropdownMenuItem,
} from '@/components/shadcn/dropdown-menu';
import { Send, /*Bot, Lock*/ } from 'lucide-react';
import { useCommand } from '../../contexts/CommandContext';
//import { LoginModal } from '../external-api/LoginModal';

export const RagModeOptions = () => {
  const { selectedAction, onSelectedActionChange } = useCommand();
  //const [showLoginModal, setShowLoginModal] = useState(false);

  return (
    <>
      <DropdownMenuItem
        onSelect={() => onSelectedActionChange('enviar')}
        className={selectedAction === 'enviar' ? 'bg-accent' : ''}
      >
        <Send className="h-4 w-4 mr-2" />
        Enviar
      </DropdownMenuItem>
      {/* {isAuthenticated && (
        <DropdownMenuItem onSelect={() => onSelectedActionChange('agente')}>
          <Bot className="h-4 w-4 mr-2" />
          Agente
        </DropdownMenuItem>
      )} */}
      {/* {!isAuthenticated && (
        <DropdownMenuItem onSelect={() => onSelectedActionChange('login')}>
          <Lock className="h-4 w-4 mr-2" />
          External Login
        </DropdownMenuItem>
      )} */}

      {/* <LoginModal
        open={showLoginModal}
        onOpenChange={setShowLoginModal}
        onLoginSuccess={() => setShowLoginModal(false)}
      /> */}
    </>
  );
};
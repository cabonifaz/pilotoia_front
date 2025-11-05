import {
  DropdownMenuItem,
} from '@/components/shadcn/dropdown-menu';
import { Tooltip, TooltipTrigger, TooltipContent } from '@/components/shadcn/tooltip';
import { Send, /*Bot, Lock*/ } from 'lucide-react';
import { useCommand } from '../../contexts/CommandContext';
//import { LoginModal } from '../external-api/LoginModal';

export const RagModeOptions = () => {
  const { selectedAction, onSelectedActionChange } = useCommand();
  //const [showLoginModal, setShowLoginModal] = useState(false);

  return (
    <>
      <Tooltip>
        <TooltipTrigger asChild>
          <DropdownMenuItem
            onSelect={() => onSelectedActionChange('vectorial')}
            className={selectedAction === 'vectorial' ? 'border-l-4 border-primary' : ''}
          >
            <Send className="h-4 w-4 mr-2" />
            Búsqueda inteligente
          </DropdownMenuItem>
        </TooltipTrigger>
        <TooltipContent side="right">
          Búsqueda en la base de conocimiento
        </TooltipContent>
      </Tooltip>
      {/* {isAuthenticated && (
        <DropdownMenuItem
          onSelect={() => onSelectedActionChange('vectorial+sql')}
          className={selectedAction === 'vectorial+sql' ? 'bg-primary text-primary-foreground' : ''}
        >
          <Bot className="h-4 w-4 mr-2" />
          Búsqueda avanzada
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
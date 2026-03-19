import {
  DropdownMenuItem,
  DropdownMenuSub,
  DropdownMenuSubTrigger,
  DropdownMenuSubContent,
  DropdownMenuSeparator,
} from '@/components/shadcn/dropdown-menu';
import { Tooltip, TooltipTrigger, TooltipContent } from '@/components/shadcn/tooltip';
import { Send, ScanSearch, MessageSquare, Table2, AlignLeft, ScanText, /*Bot, Lock*/ } from 'lucide-react';
import { useCommand } from '../../contexts/CommandContext';
import { useTranscription } from '../../contexts/TranscriptionContext';
import { SUPPORTED_LANGUAGES } from '../../constants/languages';
import { getOcrPrefill } from '../../constants/ocrTools';
//import { LoginModal } from '../external-api/LoginModal';

export const RagModeOptions = () => {
  const { selectedAction, onSelectedActionChange, vlmMode, onVlmModeChange, onQueryChange } = useCommand();
  const { selectedLanguage } = useTranscription();

  const lang = SUPPORTED_LANGUAGES.find(
    (l) => l.codeOpenAI === selectedLanguage || l.codeAws?.includes(selectedLanguage)
  );
  const nameEnglish = lang?.nameEnglish ?? 'Spanish';

  //const [showLoginModal, setShowLoginModal] = useState(false);

  return (
    <>
      <Tooltip>
        <TooltipTrigger asChild>
          <DropdownMenuItem
            onSelect={() => { onSelectedActionChange('vectorial'); onQueryChange(''); }}
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
      <DropdownMenuSub>
        <DropdownMenuSubTrigger
          onClick={() => onSelectedActionChange('ocr')}
          className={selectedAction === 'ocr' ? 'border-l-4 border-primary' : ''}
        >
          <ScanSearch className="h-4 w-4 mr-2" />
          Análisis de imagen (OCR)
        </DropdownMenuSubTrigger>
        <DropdownMenuSubContent>
          <DropdownMenuItem
            onSelect={() => { onSelectedActionChange('ocr'); onVlmModeChange('vlm_qa_over_text'); onQueryChange(''); }}
            className={selectedAction === 'ocr' && vlmMode === 'vlm_qa_over_text' ? 'border-l-4 border-primary' : ''}
          >
            <MessageSquare className="h-4 w-4 mr-2" />
            Pregunta sobre imagen
          </DropdownMenuItem>
          <DropdownMenuItem
            onSelect={() => { onSelectedActionChange('ocr'); onVlmModeChange('vlm_extract_fields'); onQueryChange(getOcrPrefill(nameEnglish, 'vlm_extract_fields')); }}
            className={selectedAction === 'ocr' && vlmMode === 'vlm_extract_fields' ? 'border-l-4 border-primary' : ''}
          >
            <Table2 className="h-4 w-4 mr-2" />
            Extraer campos
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem
            onSelect={() => { onSelectedActionChange('ocr'); onVlmModeChange('vlm_summarize_doc'); onQueryChange(getOcrPrefill(nameEnglish, 'vlm_summarize_doc')); }}
            className={selectedAction === 'ocr' && vlmMode === 'vlm_summarize_doc' ? 'border-l-4 border-primary' : ''}
          >
            <AlignLeft className="h-4 w-4 mr-2" />
            Resumir documento
          </DropdownMenuItem>
          <DropdownMenuItem
            onSelect={() => { onSelectedActionChange('ocr'); onVlmModeChange('vlm_ocr_clean'); onQueryChange(getOcrPrefill(nameEnglish, 'vlm_ocr_clean')); }}
            className={selectedAction === 'ocr' && vlmMode === 'vlm_ocr_clean' ? 'border-l-4 border-primary' : ''}
          >
            <ScanText className="h-4 w-4 mr-2" />
            Extraer toda la información
          </DropdownMenuItem>
        </DropdownMenuSubContent>
      </DropdownMenuSub>
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

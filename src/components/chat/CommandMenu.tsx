import { Plus } from 'lucide-react';
import { Button } from '@/components/shadcn/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from '@/components/shadcn/dropdown-menu';
import { RagModeOptions } from './RagModeOptions';

interface CommandMenuProps {
  disabled?: boolean;
}

export const CommandMenu = ({ disabled = false }: CommandMenuProps) => {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          type="button"
          variant="ghost"
          size="icon"
          disabled={disabled}
        >
          <Plus className="h-5 w-5" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start">
        <RagModeOptions />
      </DropdownMenuContent>
    </DropdownMenu>
  );
};

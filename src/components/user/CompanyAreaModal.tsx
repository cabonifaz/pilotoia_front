import { useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { Button } from '@/components/shadcn/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/shadcn/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/shadcn/select';
import { queryKeys } from '../../lib/queryClient';
import type { DecodedUserData } from '../../utils/jwtUtils';
import { Loader } from '../loader/Loader';
import { toast } from '../../hooks/use-toast';

interface CompanyAreaModalProps {
  isOpen: boolean;
  onClose: () => void;
  user: DecodedUserData;
}

const CompanyAreaModal = ({ isOpen, onClose, user }: CompanyAreaModalProps) => {
  const [selectedValue, setSelectedValue] = useState<string>('');
  const [isChanging, setIsChanging] = useState(false);
  const queryClient = useQueryClient();

  // Get current company area (actual_company_area)
  const currentCompanyArea = (user as any)?.actual_company_area;
  const currentKey = currentCompanyArea ? 
    `${currentCompanyArea.ID_EMPRESA}-${currentCompanyArea.ID_AREA}` : '';

  const handleConfirm = async () => {
    if (!selectedValue || !user.company_areas) return;
    
    setIsChanging(true);
    try {
      // Find the selected company area
      const selected = user.company_areas.find((ca: any) =>
        `${ca.ID_EMPRESA}-${ca.ID_AREA}` === selectedValue
      );
      
      if (selected) {
        // Update the user data in TanStack Query cache (frontend only)
        const currentUserData = queryClient.getQueryData(queryKeys.user.current()) as any;
        if (currentUserData) {
          const updatedUserData = {
            ...currentUserData,
            actual_company_area: selected
          };
          queryClient.setQueryData(queryKeys.user.current(), updatedUserData);
        }
        
        // Show success message
        toast({
          title: "Éxito",
          description: `Empresa/área cambiada a ${selected.EMPRESA} - ${selected.AREA}`,
          variant: "success"
        });
        
        onClose();
      }
    } catch (error) {
      // Show error message
      toast({
        title: "Error",
        description: "No se pudo cambiar la empresa/área. Inténtalo de nuevo.",
        variant: "destructive"
      });
    } finally {
      setIsChanging(false);
    }
  };

  const handleOpenChange = (open: boolean) => {
    if (!open) {
      onClose();
      setSelectedValue('');
    }
  };

  return (
    <>
      {isChanging && <Loader />}
      <Dialog open={isOpen} onOpenChange={handleOpenChange}>
        <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Cambiar Empresa/Área</DialogTitle>
          <DialogDescription>
            Selecciona la empresa y área con la que deseas trabajar.
          </DialogDescription>
        </DialogHeader>
        
        <div className="grid gap-4 py-4">
          <div className="space-y-2">
            <label className="text-sm font-medium leading-none">
              Empresa / Área
            </label>
            <Select value={selectedValue} onValueChange={setSelectedValue}>
              <SelectTrigger>
                <SelectValue placeholder="Selecciona una empresa y área" />
              </SelectTrigger>
              <SelectContent>
                {user.company_areas?.map((companyArea: any) => {
                  const key = `${companyArea.ID_EMPRESA}-${companyArea.ID_AREA}`;
                  const isCurrent = key === currentKey;
                  
                  return (
                    <SelectItem
                      key={key}
                      value={key}
                      disabled={isCurrent}
                      className={isCurrent ? 'opacity-60 cursor-not-allowed' : ''}
                    >
                      <div className="flex items-center justify-between w-full">
                        <span>{companyArea.EMPRESA} • {companyArea.AREA}</span>
                        {isCurrent && (
                          <span className="text-xs text-muted-foreground ml-2">
                            (Actual)
                          </span>
                        )}
                      </div>
                    </SelectItem>
                  );
                })}
              </SelectContent>
            </Select>
          </div>
        </div>

        <DialogFooter>
          <Button
            type="button"
            variant="outline"
            onClick={() => handleOpenChange(false)}
            disabled={isChanging}
          >
            Cancelar
          </Button>
          <Button
            type="button"
            onClick={handleConfirm}
            disabled={!selectedValue || selectedValue === currentKey || isChanging}
          >
            {isChanging ? 'Cambiando...' : 'Confirmar Cambio'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
    </>
  );
};

export default CompanyAreaModal;
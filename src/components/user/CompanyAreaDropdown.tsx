import { useState, useMemo, useEffect } from "react";
import { ChevronsUpDown, Building2, Network } from "lucide-react";
import { Button } from "@/components/shadcn/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/shadcn/dropdown-menu";
import { useQueryAuthContext } from "../../contexts/QueryAuthContext";
import { useChangeCompanyArea } from "../../hooks/useUserQueries";
import { toast } from "../../hooks/use-toast";
import { cn } from "@/lib/utils";

const CompanyAreaDropdown = ({
  isDisabled = false,
}: {
  isDisabled?: boolean;
}) => {
  const { user } = useQueryAuthContext();
  const changeCompanyArea = useChangeCompanyArea();

  const [selectedCompanyId, setSelectedCompanyId] = useState<number | null>(
    null,
  );
  const [selectedAreaId, setSelectedAreaId] = useState<number | null>(null);

  useEffect(() => {
    const actual = (user as any)?.actual_company_area;
    if (actual) {
      setSelectedCompanyId(actual.ID_EMPRESA);
      setSelectedAreaId(actual.ID_AREA);
    }
  }, [user]);

  if (!user || !user.company_areas) return null;

  // eslint-disable-next-line react-hooks/rules-of-hooks
  const uniqueCompanies = useMemo(() => {
    const companiesMap = new Map();
    user.company_areas.forEach((item: any) => {
      if (!companiesMap.has(item.ID_EMPRESA)) {
        companiesMap.set(item.ID_EMPRESA, item.EMPRESA);
      }
    });
    return Array.from(companiesMap.entries());
  }, [user.company_areas]);

  // eslint-disable-next-line react-hooks/rules-of-hooks
  const availableAreas = useMemo(() => {
    return user.company_areas.filter(
      (item: any) => item.ID_EMPRESA === selectedCompanyId,
    );
  }, [selectedCompanyId, user.company_areas]);

  const currentCompanyName =
    uniqueCompanies.find(([id]) => id === selectedCompanyId)?.[1] ||
    "Seleccionar";
  const currentArea = availableAreas.find(
    (a: any) => a.ID_AREA === selectedAreaId,
  );
  const currentAreaName = currentArea ? currentArea.AREA : "Seleccionar";

  const handleCompanyChange = (companyId: number) => {
    setSelectedCompanyId(companyId);
    const areasOfCompany = user.company_areas.filter(
      (a: any) => a.ID_EMPRESA === companyId,
    );
    const generalArea =
      areasOfCompany.find((a: any) => a.AREA.toUpperCase() === "GENERAL") ||
      areasOfCompany[0];
    if (generalArea) handleAreaChange(generalArea);
  };

  const handleAreaChange = (companyArea: any) => {
    try {
      changeCompanyArea(companyArea);
      toast({
        title: "Actualizado",
        description: `${companyArea.EMPRESA} - ${companyArea.AREA}`,
        variant: "success",
      });
    } catch (error) {
      toast({ title: "Error", variant: "destructive" });
    }
  };

  // Estilo base gris para ambos botones
  const buttonClass =
    "flex-1 justify-between text-xs h-10 px-3 bg-secondary/30 border-border hover:bg-secondary/60 text-foreground transition-colors";

  return (
    <div className="flex flex-col sm:flex-row gap-2 w-full">
      {/* Selector de Empresa */}
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            variant="outline"
            disabled={isDisabled}
            className={cn(buttonClass)}
          >
            <div className="flex items-center gap-3 overflow-hidden">
              <Building2 className="h-3.5 w-3.5 text-muted-foreground flex-shrink-0" />
              <div className="flex flex-col items-start leading-tight overflow-hidden text-left">
                <span className="text-[10px] font-bold text-muted-foreground">
                  Empresa
                </span>
                <span className="truncate font-medium">
                  {currentCompanyName}
                </span>
              </div>
            </div>
            <ChevronsUpDown className="h-3 w-3 opacity-40 ml-2 flex-shrink-0" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent
          align="start"
          className="w-44 max-h-64 overflow-y-auto "
        >
          <DropdownMenuSeparator />
          {uniqueCompanies.map(([id, name]) => (
            <DropdownMenuItem
              key={id}
              onClick={() => handleCompanyChange(id)}
              className={cn(
                id === selectedCompanyId && "bg-accent font-semibold",
              )}
            >
              {name}
            </DropdownMenuItem>
          ))}
        </DropdownMenuContent>
      </DropdownMenu>

      {/* Selector de Área */}
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            variant="outline"
            disabled={isDisabled || !selectedCompanyId}
            className={cn(buttonClass)}
          >
            <div className="flex items-center gap-3 overflow-hidden">
              <Network className="h-3.5 w-3.5 text-muted-foreground flex-shrink-0" />
              <div className="flex flex-col items-start leading-tight overflow-hidden text-left">
                <span className="text-[10px]  font-bold text-muted-foreground">
                  Área
                </span>
                <span className="truncate font-medium">{currentAreaName}</span>
              </div>
            </div>
            <ChevronsUpDown className="h-3 w-3 opacity-40 ml-2 flex-shrink-0" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent
          align="start"
          className="w-[200px] max-h-64 overflow-y-auto "
        >
          <DropdownMenuSeparator />
          {availableAreas.map((item: any) => (
            <DropdownMenuItem
              key={item.ID_AREA}
              onClick={() => handleAreaChange(item)}
              className={cn(
                item.ID_AREA === selectedAreaId && "bg-accent font-bold",
              )}
            >
              {item.AREA}
            </DropdownMenuItem>
          ))}
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
};

export default CompanyAreaDropdown;

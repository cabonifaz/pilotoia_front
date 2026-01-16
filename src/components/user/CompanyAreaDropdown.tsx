import { useState, useMemo, useEffect } from "react";
import { ChevronsUpDown } from "lucide-react";
import { Button } from "@/components/shadcn/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/shadcn/dropdown-menu";
import { useQueryAuthContext } from "../../contexts/QueryAuthContext";
import { useChangeCompanyArea } from "../../hooks/useUserQueries";
import { toast } from "../../hooks/use-toast";

const CompanyAreaDropdown = ({
  isDisabled = false,
}: {
  isDisabled?: boolean;
}) => {
  const { user } = useQueryAuthContext();
  const changeCompanyArea = useChangeCompanyArea();

  const [selectedCompanyId, setSelectedCompanyId] = useState<number | null>(
    null
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

  const uniqueCompanies = useMemo(() => {
    const companiesMap = new Map();
    user.company_areas.forEach((item: any) => {
      if (!companiesMap.has(item.ID_EMPRESA)) {
        companiesMap.set(item.ID_EMPRESA, item.EMPRESA);
      }
    });
    return Array.from(companiesMap.entries());
  }, [user.company_areas]);

  const availableAreas = useMemo(() => {
    return user.company_areas.filter(
      (item: any) => item.ID_EMPRESA === selectedCompanyId
    );
  }, [selectedCompanyId, user.company_areas]);

  const currentCompanyName =
    uniqueCompanies.find(([id]) => id === selectedCompanyId)?.[1] ||
    "Seleccionar Empresa";
  const currentArea = availableAreas.find(
    (a: any) => a.ID_AREA === selectedAreaId
  );
  const currentAreaName = currentArea ? currentArea.AREA : "Seleccionar Área";

  // --- LÓGICA PARA SELECCIONAR ÁREA GENERAL AUTOMÁTICAMENTE ---
  const handleCompanyChange = (companyId: number) => {
    setSelectedCompanyId(companyId);

    // Buscar el área "GENERAL" para esta empresa
    const areasOfCompany = user.company_areas.filter(
      (a: any) => a.ID_EMPRESA === companyId
    );
    const generalArea =
      areasOfCompany.find((a: any) => a.AREA.toUpperCase() === "GENERAL") ||
      areasOfCompany[0]; // Si no hay "General", toma la primera

    if (generalArea) {
      handleAreaChange(generalArea);
    }
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

  return (
    <div className="flex flex-col sm:flex-row gap-2">
      {/* Selector de Empresa */}
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            variant="outline"
            disabled={isDisabled}
            className="justify-between min-w-[160px] text-xs h-9"
          >
            <span className="truncate font-medium">{currentCompanyName}</span>
            <ChevronsUpDown className="h-3 w-3 opacity-50" />
          </Button>
        </DropdownMenuTrigger>
        {/* max-h-48 limita la altura a unos 5-6 elementos y activa el scroll */}
        <DropdownMenuContent
          align="start"
          className="w-44 text-xs max-h-64 overflow-y-auto"
        >
          {uniqueCompanies.map(([id, name]) => (
            <DropdownMenuItem key={id} onClick={() => handleCompanyChange(id)}>
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
            className="justify-between min-w-[160px] text-xs h-9"
          >
            <span className="truncate">{currentAreaName}</span>
            <ChevronsUpDown className="h-3 w-3 opacity-50" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent
          align="start"
          className="w-40 text-xs max-h-64 overflow-y-auto"
        >
          {availableAreas.map((item: any) => (
            <DropdownMenuItem
              key={item.ID_AREA}
              onClick={() => handleAreaChange(item)}
              className={
                item.ID_AREA === selectedAreaId ? "bg-accent font-bold" : ""
              }
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

import { useState, useEffect } from 'react';
import { X } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/shadcn/card';
import { Button } from '@/components/shadcn/button';
import { Input } from '@/components/shadcn/input';
import { Label } from '@/components/shadcn/label';
import { Switch } from '@/components/shadcn/switch';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/shadcn/select';
import { useUpdateDatosAgente } from '@/hooks/useAgentsQueries';
import { useGetPhoneCodes } from '@/hooks/usePhoneCodesQueries';
import { useQueryAuthContext } from '@/contexts/QueryAuthContext';
import type { Agente } from '@/types/agents';
import type { PhoneCode } from '@/types/phoneCodes';

interface AgentsSidebarUpdateProps {
  isOpen: boolean;
  onClose: () => void;
  id_empresa?: number;
  agent: Agente | null;
}

export const AgentsSidebarUpdate = ({
  isOpen,
  onClose,
  id_empresa: propsIdEmpresa,
  agent: selectedAgent,
}: AgentsSidebarUpdateProps) => {
  const { user } = useQueryAuthContext();
  const contextIdEmpresa = (user as any)?.actual_company_area?.ID_EMPRESA;
  const id_empresa = propsIdEmpresa || contextIdEmpresa;

  const [codigoPais, setCodigoPais] = useState('51-PE');
  const [numeroTelf, setNumeroTelf] = useState('');
  const [idTipoAgente, setIdTipoAgente] = useState('1');
  const [accesoGeneral, setAccesoGeneral] = useState(0);

  const { mutate: updateDatosAgente, isPending } = useUpdateDatosAgente(id_empresa);
  const { data: phoneCodesData } = useGetPhoneCodes();

  // Strip country code prefix from stored phone number
  const stripCodigoNumerico = (cp: string, tel: string) => {
    const codigoNumerico = cp.split('-')[0];
    return tel.startsWith(codigoNumerico) ? tel.slice(codigoNumerico.length) : tel;
  };

  // Initialize form with agent data when sidebar opens
  useEffect(() => {
    if (isOpen && selectedAgent) {
      setCodigoPais(selectedAgent.CODIGO_PAIS);
      setNumeroTelf(stripCodigoNumerico(selectedAgent.CODIGO_PAIS, selectedAgent.NUMERO_TELF));
      setIdTipoAgente(selectedAgent.ID_TIPO_AGENTE.toString());
      setAccesoGeneral(selectedAgent.ACCESO_GENERAL);
    }
  }, [isOpen, selectedAgent]);

  // Reset state when sidebar closes
  useEffect(() => {
    if (!isOpen) {
      setCodigoPais('51-PE');
      setNumeroTelf('');
      setIdTipoAgente('1');
      setAccesoGeneral(0);
    }
  }, [isOpen]);

  const hasChanges = selectedAgent && (
    codigoPais !== selectedAgent.CODIGO_PAIS ||
    numeroTelf !== stripCodigoNumerico(selectedAgent.CODIGO_PAIS, selectedAgent.NUMERO_TELF) ||
    idTipoAgente !== selectedAgent.ID_TIPO_AGENTE.toString() ||
    accesoGeneral !== selectedAgent.ACCESO_GENERAL
  );

  const handleSubmit = () => {
    if (!selectedAgent || !numeroTelf.trim() || !hasChanges) {
      return;
    }

    const codigoNumerico = codigoPais.split('-')[0];

    updateDatosAgente(
      {
        id_agente: selectedAgent.ID_AGENTE,
        numero_telf: numeroTelf.trim() ? codigoNumerico + numeroTelf.trim() : "",
        codigo_pais: codigoPais,
        id_tipo_agente: parseInt(idTipoAgente),
        acceso_general: accesoGeneral,
      },
      {
        onSuccess: () => {
          setCodigoPais('51-PE');
          setNumeroTelf('');
          setIdTipoAgente('1');
          setAccesoGeneral(0);
          onClose();
        },
      }
    );
  };

  return (
    <div
      className={`fixed top-16 bottom-0 right-0 w-96 bg-background border-l shadow-lg transform transition-all duration-300 flex flex-col z-50 ${
        isOpen ? 'translate-x-0' : 'translate-x-full'
      }`}
    >
      <Card className="h-full rounded-none border-0 flex flex-col">
        {/* Header del Sidebar */}
        <CardHeader className="pt-3 pb-3 border-b flex-shrink-0">
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <CardTitle className="text-xs">Actualizar agente</CardTitle>
              <CardDescription className="text-xs">
                {(user as any)?.actual_company_area?.EMPRESA && (
                  <span className="font-semibold">{(user as any)?.actual_company_area?.EMPRESA}</span>
                )}
                {(user as any)?.actual_company_area?.EMPRESA && ' - '}
                {selectedAgent ? `Agente ${selectedAgent.NUMERO_TELF}` : 'Actualice un agente.'}
              </CardDescription>
            </div>
            <Button
              variant="ghost"
              size="icon"
              onClick={onClose}
            >
              <X className="h-5 w-5" />
            </Button>
          </div>
        </CardHeader>

        {/* Contenido scrollable con altura definida */}
        <CardContent className="flex-1 overflow-y-auto py-4 space-y-4">
          {/* Telefono Input */}
          <div className="flex gap-2">
            <div className="space-y-2">
              <Label className="text-xs">Código</Label>
              <Select value={codigoPais} onValueChange={setCodigoPais} disabled={isPending}>
                <SelectTrigger className="w-28 h-9">
                  {codigoPais && (() => {
                    const [codigoNumerico, codigoIso] = codigoPais.split('-');
                    const selectedCode = phoneCodesData?.phone_codes?.find(
                      c => `${c.CODIGO_NUMERICO}-${c.CODIGO_ISO}` === codigoPais
                    );
                    return selectedCode ? (
                      <div className="flex items-center gap-2">
                        <img
                          src={`https://flagcdn.com/w20/${selectedCode.CODIGO_ISO.toLowerCase()}.png`}
                          alt={selectedCode.NOMBRE_PAIS}
                          className="w-5 h-3 object-cover"
                        />
                        <span>{selectedCode.PREFIJO_TELEFONICO}</span>
                      </div>
                    ) : (
                      <div className="flex items-center gap-2">
                        <img
                          src={`https://flagcdn.com/w20/${codigoIso.toLowerCase()}.png`}
                          alt={codigoIso}
                          className="w-5 h-3 object-cover"
                        />
                        <span>+{codigoNumerico}</span>
                      </div>
                    );
                  })()}
                </SelectTrigger>
                <SelectContent className="text-sm">
                  {phoneCodesData?.phone_codes?.map((code: PhoneCode) => (
                    <SelectItem
                      key={`${code.CODIGO_NUMERICO}-${code.CODIGO_ISO}`}
                      value={`${code.CODIGO_NUMERICO}-${code.CODIGO_ISO}`}
                    >
                      <div className="flex items-center gap-2">
                        <img
                          src={`https://flagcdn.com/w20/${code.CODIGO_ISO.toLowerCase()}.png`}
                          alt={code.NOMBRE_PAIS}
                          className="w-5 h-3 object-cover"
                        />
                        <span>{code.NOMBRE_PAIS}</span>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="flex-1 space-y-2">
              <Label htmlFor="telefono" className="text-xs">Teléfono</Label>
              <Input
                id="telefono"
                type="tel"
                placeholder="Ingrese el número de teléfono"
                value={numeroTelf}
                onChange={(e) => setNumeroTelf(e.target.value.replace(/[^0-9]/g, ''))}
                disabled={isPending}
                maxLength={12}
                className="h-9 text-sm"
              />
            </div>
          </div>

          {/* Tipo de Agente Select */}
          <div className="space-y-2">
            <Label className="text-xs">Tipo de Agente</Label>
            <Select value={idTipoAgente} onValueChange={setIdTipoAgente} disabled={isPending}>
              <SelectTrigger className="h-9">
                <SelectValue placeholder="Selecciona un tipo" />
              </SelectTrigger>
              <SelectContent className="text-sm">
                <SelectItem value="1">WhatsApp</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Acceso General Switch */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label htmlFor="acceso-general" className="text-xs">Acceso General</Label>
              <div className="flex items-center gap-2">
                <span className="text-xs text-muted-foreground">
                  {accesoGeneral === 0 ? 'Cerrado' : 'Abierto'}
                </span>
                <Switch
                  id="acceso-general"
                  checked={accesoGeneral === 1}
                  onCheckedChange={(checked) => setAccesoGeneral(checked ? 1 : 0)}
                  disabled={isPending}
                />
              </div>
            </div>
            <p className="text-xs text-muted-foreground">
              {accesoGeneral === 0
                ? 'El agente solo atiende usuarios registrados'
                : 'El agente atiende usuarios registrados y no registrados'}
            </p>
          </div>
        </CardContent>

        <div className="border-t p-4 flex gap-2 flex-shrink-0">
          <Button
            variant="outline"
            onClick={onClose}
            disabled={isPending}
            className="flex-1"
          >
            Cancelar
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={isPending || !numeroTelf.trim() || !hasChanges}
            className="flex-1"
          >
            {isPending ? 'Actualizando...' : 'Actualizar'}
          </Button>
        </div>
      </Card>
    </div>
  );
};

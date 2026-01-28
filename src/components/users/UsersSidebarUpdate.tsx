import { useState, useEffect } from 'react';
import { X } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/shadcn/card';
import { Button } from '@/components/shadcn/button';
import { Input } from '@/components/shadcn/input';
import { Label } from '@/components/shadcn/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
} from '@/components/shadcn/select';
import { useUpdateUsuario } from '@/hooks/useUsersQueries';
import { useGetPhoneCodes } from '@/hooks/usePhoneCodesQueries';
import { useQueryAuthContext } from '@/contexts/QueryAuthContext';
import type { Usuario } from '@/types/users';
import type { PhoneCode } from '@/types/phoneCodes';

interface UsersSidebarUpdateProps {
  isOpen: boolean;
  onClose: () => void;
  id_empresa?: number;
  user: Usuario | null;
}

export const UsersSidebarUpdate = ({
  isOpen,
  onClose,
  id_empresa: propsIdEmpresa,
  user: selectedUser,
}: UsersSidebarUpdateProps) => {
  const { user } = useQueryAuthContext();
  const contextIdEmpresa = (user as any)?.actual_company_area?.ID_EMPRESA;
  const id_empresa = propsIdEmpresa || contextIdEmpresa;

  const [usuario, setUsuario] = useState('');
  const [nombres, setNombres] = useState('');
  const [apellidos, setApellidos] = useState('');
  const [codigoPais, setCodigoPais] = useState('51-PE');
  const [telefono, setTelefono] = useState('');

  const { mutate: updateUsuario, isPending } = useUpdateUsuario(id_empresa);
  const { data: phoneCodesData } = useGetPhoneCodes();

  // Strip country code prefix from stored phone number
  const stripCodigoNumerico = (cp: string, tel: string) => {
    const codigoNumerico = cp.split('-')[0];
    return tel.startsWith(codigoNumerico) ? tel.slice(codigoNumerico.length) : tel;
  };

  // Initialize form with user data when sidebar opens
  useEffect(() => {
    if (isOpen && selectedUser) {
      setUsuario(selectedUser.USUARIO);
      setNombres(selectedUser.NOMBRES);
      setApellidos(selectedUser.APELLIDOS);
      const cp = selectedUser.CODIGO_PAIS || '51-PE';
      setCodigoPais(cp);
      setTelefono(stripCodigoNumerico(cp, selectedUser.TELEFONO));
    }
  }, [isOpen, selectedUser]);

  // Reset state when sidebar closes
  useEffect(() => {
    if (!isOpen) {
      setUsuario('');
      setNombres('');
      setApellidos('');
      setCodigoPais('51-PE');
      setTelefono('');
    }
  }, [isOpen]);

  const hasChanges = selectedUser && (() => {
    const cp = selectedUser.CODIGO_PAIS || '51-PE';
    return (
      usuario !== selectedUser.USUARIO ||
      nombres !== selectedUser.NOMBRES ||
      apellidos !== selectedUser.APELLIDOS ||
      codigoPais !== cp ||
      telefono !== stripCodigoNumerico(cp, selectedUser.TELEFONO)
    );
  })();

  const handleSubmit = () => {
    if (!selectedUser || !usuario.trim() || !nombres.trim() || !apellidos.trim() || !hasChanges) {
      return;
    }

    const codigoNumerico = codigoPais.split('-')[0];

    updateUsuario(
      {
        id_usuario: selectedUser.ID_USUARIO,
        usuario: usuario.trim(),
        nombres: nombres.trim(),
        apellidos: apellidos.trim(),
        codigo_pais: codigoPais,
        telefono: telefono.trim() ? codigoNumerico + telefono.trim() : "",
      },
      {
        onSuccess: () => {
          setUsuario('');
          setNombres('');
          setApellidos('');
          setCodigoPais('51-PE');
          setTelefono('');
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
              <CardTitle className="text-xs">Actualizar usuario</CardTitle>
              <CardDescription className="text-xs">
                {(user as any)?.actual_company_area?.EMPRESA && (
                  <span className="font-semibold">{(user as any)?.actual_company_area?.EMPRESA}</span>
                )}
                {(user as any)?.actual_company_area?.EMPRESA && ' - '}
                {selectedUser ? `${selectedUser.NOMBRES} ${selectedUser.APELLIDOS}` : 'Actualice un usuario.'}
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
          {/* Usuario Input */}
          <div className="space-y-2">
            <Label htmlFor="usuario" className="text-xs">Usuario</Label>
            <Input
              id="usuario"
              type="text"
              placeholder="Ingrese el usuario"
              value={usuario}
              onChange={(e) => setUsuario(e.target.value)}
              disabled={isPending}
            />
          </div>

          {/* Nombres Input */}
          <div className="space-y-2">
            <Label htmlFor="nombres" className="text-xs">Nombres</Label>
            <Input
              id="nombres"
              type="text"
              placeholder="Ingrese los nombres"
              value={nombres}
              onChange={(e) => setNombres(e.target.value)}
              disabled={isPending}
            />
          </div>

          {/* Apellidos Input */}
          <div className="space-y-2">
            <Label htmlFor="apellidos" className="text-xs">Apellidos</Label>
            <Input
              id="apellidos"
              type="text"
              placeholder="Ingrese los apellidos"
              value={apellidos}
              onChange={(e) => setApellidos(e.target.value)}
              disabled={isPending}
            />
          </div>

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
                value={telefono}
                onChange={(e) => setTelefono(e.target.value.replace(/[^0-9]/g, ''))}
                disabled={isPending}
                maxLength={12}
                className="h-9 text-sm"
              />
            </div>
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
            disabled={isPending || !usuario.trim() || !nombres.trim() || !apellidos.trim() || !hasChanges}
            className="flex-1"
          >
            {isPending ? 'Actualizando...' : 'Actualizar'}
          </Button>
        </div>
      </Card>
    </div>
  );
};
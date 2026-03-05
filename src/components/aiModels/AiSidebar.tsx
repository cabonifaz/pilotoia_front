import { useState, useEffect } from 'react';
import { X } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/shadcn/card';
import { Button } from '@/components/shadcn/button';
import { Input } from '@/components/shadcn/input';
import { Label } from '@/components/shadcn/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/shadcn/select';
import { useCreateModel } from '@/hooks/useIAModelsQueries';
import { useGetParametros } from '@/hooks/useParametrosQueries';
import type { ModelCreateRequest } from '@/types/iaModels';

interface AiSidebarProps {
  isOpen: boolean;
  onClose: () => void;
  id_empresa: number;
}

export const AiSidebar = ({
  isOpen,
  onClose,
}: AiSidebarProps) => {
  const [formData, setFormData] = useState({
    model: '',
    id_model: '',
    provider: '',
    type_id: '2', // Default to Text Vision
    extra_parameter: '',
  });

  const { mutate: createModel, isPending } = useCreateModel();
  const { parametrosMap } = useGetParametros();
  const tiposModelo = parametrosMap['2'] || [];

  // Reset state when sidebar closes
  useEffect(() => {
    if (!isOpen) {
      setFormData({
        model: '',
        id_model: '',
        provider: '',
        type_id: '2', // Default to Text Vision
        extra_parameter: '',
      });
    }
  }, [isOpen]);

  const handleSubmit = () => {
    if (
      !formData.model.trim() ||
      !formData.id_model.trim() ||
      !formData.provider.trim() ||
      !formData.type_id.trim() ||
      !formData.extra_parameter.trim()
    ) {
      return;
    }

    const request: ModelCreateRequest = {
      model: formData.model.trim(),
      id_model: formData.id_model.trim(),
      provider: formData.provider.trim(),
      type_id: parseInt(formData.type_id),
      extra_parameter: parseInt(formData.extra_parameter),
    };

    createModel(request, {
      onSuccess: () => {
        setFormData({
          model: '',
          id_model: '',
          provider: '',
          type_id: '2', // Default to Text Vision
          extra_parameter: '',
        });
        onClose();
      },
    });
  };

  const getParameterLabel = (): string => {
    if (formData.type_id === '1') {
      return 'Vector Size';
    } else if (formData.type_id === '2') {
      return 'Max Tokens';
    }
    return 'Parámetro Extra';
  };

  const isFormValid =
    formData.model.trim() &&
    formData.id_model.trim() &&
    formData.provider.trim() &&
    formData.type_id.trim() &&
    formData.extra_parameter.trim();

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
              <CardTitle className="text-xs">Agregar modelo IA</CardTitle>
              <CardDescription className="text-xs">Agregue un nuevo modelo de IA.</CardDescription>
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
          {/* Model Name Input */}
          <div className="space-y-2">
            <Label htmlFor="model" className="text-xs">Nombre del Modelo</Label>
            <Input
              id="model"
              type="text"
              placeholder="ej: Claude 3 Haiku"
              value={formData.model}
              onChange={(e) => setFormData({ ...formData, model: e.target.value })}
              disabled={isPending}
            />
          </div>

          {/* Model Identifier Input */}
          <div className="space-y-2">
            <Label htmlFor="id_model" className="text-xs">Identificador del Modelo</Label>
            <Input
              id="id_model"
              type="text"
              placeholder="ej: anthropic.claude-3-haiku-20240307-v1:0"
              value={formData.id_model}
              onChange={(e) => setFormData({ ...formData, id_model: e.target.value })}
              disabled={isPending}
            />
          </div>

          {/* Provider Input */}
          <div className="space-y-2">
            <Label htmlFor="provider" className="text-xs">Proveedor</Label>
            <Input
              id="provider"
              type="text"
              placeholder="ej: Anthropic"
              value={formData.provider}
              onChange={(e) => setFormData({ ...formData, provider: e.target.value })}
              disabled={isPending}
            />
          </div>

          {/* Model Type Select */}
          <div className="space-y-2">
            <Label htmlFor="type_id" className="text-xs">Tipo de Modelo</Label>
            <Select value={formData.type_id} onValueChange={(value) => setFormData({ ...formData, type_id: value })} disabled={isPending}>
              <SelectTrigger id="type_id" className="w-full">
                <SelectValue placeholder="Seleccione un tipo" />
              </SelectTrigger>
              <SelectContent>
                {tiposModelo.map((tipo) => (
                  <SelectItem key={tipo.NUM1} value={String(tipo.NUM1)}>
                    {tipo.STRING1}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Extra Parameter Input */}
          <div className="space-y-2">
            <Label htmlFor="extra_parameter" className="text-xs">{getParameterLabel()}</Label>
            <Input
              id="extra_parameter"
              type="text"
              inputMode="numeric"
              pattern="[0-9]*"
              placeholder={formData.type_id === '1' ? 'ej: 1024' : 'ej: 4096'}
              value={formData.extra_parameter}
              onChange={(e) => {
                const value = e.target.value.replace(/\D/g, '');
                setFormData({ ...formData, extra_parameter: value });
              }}
              disabled={isPending}
            />
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
            disabled={isPending || !isFormValid}
            className="flex-1"
          >
            {isPending ? 'Guardando...' : 'Agregar'}
          </Button>
        </div>
      </Card>
    </div>
  );
};
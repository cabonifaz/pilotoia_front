import { z } from "zod";

export const loginSchema = z.object({
    usuario: z.string().min(3, "El usuario debe tener al menos 3 caracteres"),
    clave_acceso: z.string().min(4, "La contraseña debe tener al menos 4 caracteres"),
});

export type LoginFormData = z.infer<typeof loginSchema>;
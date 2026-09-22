import { z } from "zod";

export const registrarAdministradorSchema = z.object({
  nombre: z.string().trim().min(2, "Escribe un nombre").max(120, "Máximo 120 caracteres"),
  email: z.email("Ingresa un correo válido"),
  telefono: z.string().trim().max(30, "Máximo 30 caracteres").optional().or(z.literal("")),
  password: z.string().min(8, "Mínimo 8 caracteres"),
  copropiedadNombre: z
    .string()
    .trim()
    .min(2, "Escribe el nombre de la copropiedad")
    .max(160, "Máximo 160 caracteres"),
  copropiedadDireccion: z
    .string()
    .trim()
    .min(3, "Escribe la dirección")
    .max(200, "Máximo 200 caracteres"),
  copropiedadCiudad: z
    .string()
    .trim()
    .min(2, "Escribe la ciudad")
    .max(100, "Máximo 100 caracteres"),
});

export type RegistrarAdministradorInput = z.infer<typeof registrarAdministradorSchema>;

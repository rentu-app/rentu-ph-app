import { z } from "zod";
import { emailSchema } from "@/lib/validations/email";
import { RolEnInmueble } from "@prisma/client";

export const invitarResidenteSchema = z.object({
  nombre: z.string().trim().min(2, "Escribe un nombre").max(120, "Máximo 120 caracteres"),
  email: emailSchema(),
  telefono: z.string().trim().max(30, "Máximo 30 caracteres").optional().or(z.literal("")),
  rol: z.enum(RolEnInmueble),
  inmuebleId: z.uuid("Inmueble inválido"),
});

export type InvitarResidenteInput = z.infer<typeof invitarResidenteSchema>;

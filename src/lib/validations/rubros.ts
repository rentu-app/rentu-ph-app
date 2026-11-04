import { z } from "zod";
import { PeriodicidadCosto } from "@prisma/client";
import { montoDecimalSchema } from "@/lib/validations/dinero";

export const rubroSchema = z.object({
  nombre: z.string().trim().min(2, "Escribe un nombre").max(120, "Máximo 120 caracteres"),
  monto: montoDecimalSchema,
  periodicidad: z.enum(PeriodicidadCosto, "Elige la periodicidad"),
  activo: z.boolean(),
});

export const editarRubroSchema = rubroSchema.extend({ rubroId: z.uuid("Rubro inválido") });

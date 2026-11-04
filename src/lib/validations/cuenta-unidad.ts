import { z } from "zod";
import { montoDecimalOpcionalSchema, montoDecimalSchema } from "@/lib/validations/dinero";

const fecha = z
  .string()
  .refine((valor) => !Number.isNaN(Date.parse(valor)), "Fecha inválida");

export const generarCuentaUnidadSchema = z.object({
  inmuebleId: z.uuid("Unidad inválida"),
  periodo: z.string().trim().regex(/^\d{4}-(0[1-9]|1[0-2])$/, "Formato de periodo inválido"),
  montoAdministracion: montoDecimalSchema,
  montoExpensas: montoDecimalOpcionalSchema,
  fechaLimitePago: fecha,
});

export const actualizarCuentaSchema = z.object({
  cuentaId: z.uuid("Cuenta inválida"),
  montoAdministracion: montoDecimalSchema,
  montoExpensas: montoDecimalOpcionalSchema,
  fechaLimitePago: fecha,
});

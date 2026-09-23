import { z } from "zod";
import { CanalNotificacion, EtapaCobro, TipoGestionCobro } from "@prisma/client";

export const ETIQUETAS_ETAPA_COBRO: Record<EtapaCobro, string> = {
  AL_DIA: "Al día",
  RECORDATORIO: "Recordatorio",
  COBRO_PERSUASIVO: "Cobro persuasivo",
  ACUERDO_PAGO: "Acuerdo de pago",
  PREJURIDICO: "Prejurídico",
  JURIDICO: "Jurídico",
};

export const ETIQUETAS_TIPO_GESTION: Record<TipoGestionCobro, string> = {
  NOTA: "Nota",
  LLAMADA: "Llamada",
  VISITA: "Visita",
  CAMBIO_ETAPA: "Cambio de etapa",
  ACUERDO_PAGO: "Acuerdo de pago",
  AVISO_ENVIADO: "Aviso registrado",
};

export const ETIQUETAS_CANAL: Record<CanalNotificacion, string> = {
  CORREO: "Correo",
  WHATSAPP: "WhatsApp",
  CARTA: "Carta física",
};

export const registrarGestionSchema = z.object({
  inmuebleId: z.uuid("Unidad inválida"),
  tipo: z.enum(TipoGestionCobro),
  // `etapaNueva` vacío = "no cambiar la etapa": el administrador puede dejar
  // una nota sin escalar el caso.
  etapaNueva: z
    .union([z.enum(EtapaCobro), z.literal("")])
    .optional()
    .transform((valor) => (valor === "" || valor === undefined ? undefined : valor)),
  nota: z
    .string()
    .trim()
    .min(5, "Describe la gestión (mínimo 5 caracteres)")
    .max(2000, "Máximo 2000 caracteres"),
});

export const registrarAvisoSchema = z.object({
  inmuebleId: z.uuid("Unidad inválida"),
  canal: z.enum(CanalNotificacion),
  asunto: z
    .string()
    .trim()
    .min(5, "Escribe un asunto")
    .max(200, "Máximo 200 caracteres"),
  cuerpo: z
    .string()
    .trim()
    .min(20, "Escribe el mensaje (mínimo 20 caracteres)")
    .max(4000, "Máximo 4000 caracteres"),
});

/**
 * Importación de unidades desde CSV. El archivo llega como texto pegado o
 * como archivo: en ambos casos se valida fila por fila y se reporta cada
 * error con su número de línea. `confirmar` distingue la vista previa
 * (validar sin escribir) de la importación real.
 */
export const importarUnidadesSchema = z.object({
  contenido: z
    .string()
    .trim()
    .min(10, "Pega al menos una fila de datos")
    .max(200_000, "El archivo es demasiado grande (máximo 200.000 caracteres)"),
  confirmar: z
    .union([z.literal("true"), z.literal("false"), z.literal(""), z.undefined()])
    .transform((valor) => valor === "true"),
});

export const FILA_CSV_ESPERADA = "identificador,torre,coeficiente,area_m2";

export const filaUnidadSchema = z.object({
  identificador: z
    .string()
    .trim()
    .min(1, "El identificador es obligatorio")
    .max(60, "Máximo 60 caracteres"),
  torre: z.string().trim().min(1, "La torre es obligatoria").max(60, "Máximo 60 caracteres"),
  // El coeficiente de copropiedad se expresa como fracción de 1 (Ley 675):
  // 0.04167 = 4,167%. Se permite hasta 5 decimales, igual que la columna
  // `Decimal(7,5)` del schema.
  coeficiente: z
    .string()
    .trim()
    .regex(/^0?\.\d{1,5}$|^[01](\.\d{1,5})?$/, "Coeficiente inválido (ej. 0.04167)"),
  areaM2: z
    .string()
    .trim()
    .regex(/^\d{1,6}(\.\d{1,2})?$/, "Área inválida (ej. 72.50)")
    .optional()
    .or(z.literal("")),
});

export type FilaUnidad = z.infer<typeof filaUnidadSchema>;

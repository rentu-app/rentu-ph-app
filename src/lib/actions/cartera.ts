"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { Prisma, TipoGestionCobro } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { getContextoAdministrador } from "@/lib/session";
import {
  filaUnidadSchema,
  importarUnidadesSchema,
  registrarAvisoSchema,
  registrarGestionSchema,
} from "@/lib/validations/cartera";
import type { EstadoAccionFormulario } from "@/lib/types/estado-accion";
import type { ResultadoImportacion } from "@/lib/types/importacion";

export type EstadoAccionCartera = EstadoAccionFormulario;

const SIN_COPROPIEDAD: EstadoAccionCartera = {
  status: "error",
  message: "No tienes una copropiedad asignada todavía.",
};

/** Revalida las vistas que leen cartera. Todas viven bajo /dashboard. */
function revalidarCartera() {
  revalidatePath("/dashboard");
  revalidatePath("/dashboard/cartera");
}

/**
 * Verifica que la unidad pertenezca a la copropiedad activa del
 * administrador autenticado antes de escribir sobre ella.
 */
async function resolverUnidad(inmuebleId: string) {
  const { administrador, copropiedad } = await getContextoAdministrador();
  if (!copropiedad) return { administrador, copropiedad: null, unidad: null };

  const unidad = await prisma.inmueble.findFirst({
    where: { id: inmuebleId, copropiedadId: copropiedad.id, deletedAt: null },
    select: {
      id: true,
      identificador: true,
      etapaCobro: true,
      residentes: {
        where: { activo: true, deletedAt: null },
        select: { usuario: { select: { nombre: true, email: true } } },
      },
    },
  });

  return { administrador, copropiedad, unidad };
}

/**
 * Registra una entrada en la bitácora de gestión de cobro de una unidad y,
 * opcionalmente, cambia su etapa de seguimiento.
 *
 * El cambio de etapa es SIEMPRE una decisión explícita del administrador y
 * queda auditado (etapa anterior → etapa nueva, con autor y fecha). Ningún
 * proceso automático escala una unidad a PREJURIDICO/JURIDICO: esas etapas
 * son clasificación de seguimiento interno, no acciones legales.
 */
export async function registrarGestionCobro(
  _prevState: EstadoAccionCartera,
  formData: FormData
): Promise<EstadoAccionCartera> {
  const validado = registrarGestionSchema.safeParse({
    inmuebleId: formData.get("inmuebleId"),
    tipo: formData.get("tipo"),
    etapaNueva: formData.get("etapaNueva") ?? "",
    nota: formData.get("nota"),
  });

  if (!validado.success) {
    return {
      status: "error",
      message: "Revisa los datos del formulario.",
      errores: z.flattenError(validado.error).fieldErrors,
    };
  }

  const { inmuebleId, tipo, etapaNueva, nota } = validado.data;

  try {
    const { administrador, copropiedad, unidad } = await resolverUnidad(inmuebleId);
    if (!copropiedad) return SIN_COPROPIEDAD;
    if (!unidad) {
      return { status: "error", message: "La unidad no existe en esta copropiedad." };
    }

    const cambiaEtapa = !!etapaNueva && etapaNueva !== unidad.etapaCobro;

    await prisma.$transaction(async (tx) => {
      await tx.gestionCobro.create({
        data: {
          inmuebleId: unidad.id,
          registradoPorId: administrador.id,
          tipo: cambiaEtapa ? TipoGestionCobro.CAMBIO_ETAPA : tipo,
          etapaAnterior: cambiaEtapa ? unidad.etapaCobro : null,
          etapaNueva: cambiaEtapa ? etapaNueva : null,
          nota,
        },
      });

      if (cambiaEtapa) {
        await tx.inmueble.update({
          where: { id: unidad.id },
          data: { etapaCobro: etapaNueva },
        });
      }
    });

    revalidarCartera();

    return {
      status: "success",
      message: cambiaEtapa
        ? `Gestión registrada y ${unidad.identificador} pasó a etapa "${etapaNueva}".`
        : `Gestión registrada en ${unidad.identificador}.`,
    };
  } catch (error) {
    console.error("registrarGestionCobro", error);
    return { status: "error", message: "No se pudo registrar la gestión." };
  }
}

/**
 * Guarda un aviso de cobro en el historial de la unidad.
 *
 * ⚠️ SIMULACIÓN: Rentu no tiene proveedor de correo ni de WhatsApp
 * conectado. Esta acción NO envía nada: redacta y archiva el mensaje para
 * que quede trazabilidad de que el administrador lo emitió, y la fila se
 * guarda con `simulada: true`. La UI lo declara explícitamente en el
 * formulario y en el historial.
 */
export async function registrarAvisoCobro(
  _prevState: EstadoAccionCartera,
  formData: FormData
): Promise<EstadoAccionCartera> {
  const validado = registrarAvisoSchema.safeParse({
    inmuebleId: formData.get("inmuebleId"),
    canal: formData.get("canal"),
    asunto: formData.get("asunto"),
    cuerpo: formData.get("cuerpo"),
  });

  if (!validado.success) {
    return {
      status: "error",
      message: "Revisa los datos del formulario.",
      errores: z.flattenError(validado.error).fieldErrors,
    };
  }

  const { inmuebleId, canal, asunto, cuerpo } = validado.data;

  try {
    const { administrador, copropiedad, unidad } = await resolverUnidad(inmuebleId);
    if (!copropiedad) return SIN_COPROPIEDAD;
    if (!unidad) {
      return { status: "error", message: "La unidad no existe en esta copropiedad." };
    }

    const destinatarios =
      unidad.residentes.map((vinculo) => vinculo.usuario.email).join(", ") ||
      "(la unidad no tiene residentes con correo registrado)";

    await prisma.$transaction(async (tx) => {
      await tx.notificacionCobro.create({
        data: {
          inmuebleId: unidad.id,
          creadoPorId: administrador.id,
          canal,
          asunto,
          cuerpo,
          destinatarios,
          simulada: true,
        },
      });

      await tx.gestionCobro.create({
        data: {
          inmuebleId: unidad.id,
          registradoPorId: administrador.id,
          tipo: TipoGestionCobro.AVISO_ENVIADO,
          nota: `Aviso registrado (${canal}): ${asunto}. Simulación MVP — no se envió mensaje real.`,
        },
      });
    });

    revalidarCartera();

    return {
      status: "success",
      message:
        "Aviso guardado en el historial de la unidad. Simulación MVP: no se envió ningún mensaje real.",
    };
  } catch (error) {
    console.error("registrarAvisoCobro", error);
    return { status: "error", message: "No se pudo registrar el aviso." };
  }
}

function separarCampos(linea: string): string[] {
  // CSV plano: separador `,` o `;` (Excel en configuración regional es-CO
  // exporta con `;`). No se soportan campos con comillas ni comas internas —
  // el formato esperado son cuatro columnas cortas sin texto libre.
  const separador = linea.includes(";") ? ";" : ",";
  return linea.split(separador).map((campo) => campo.trim());
}

/**
 * Importa el padrón de unidades desde un CSV
 * (`identificador,torre,coeficiente,area_m2`).
 *
 * Es una importación REAL, no una maqueta: valida fila por fila, reporta los
 * errores con número de línea y solo escribe cuando el administrador
 * confirma. Es idempotente por `[copropiedadId, identificador]`: una unidad
 * que ya existe se actualiza (torre/coeficiente/área), no se duplica.
 *
 * Alcance deliberado: NO importa cartera histórica ni pagos. Cargar saldos
 * desde un Excel requiere decidir cómo conciliar periodos y recargos, y eso
 * pide una conversación con el administrador antes de codificarse.
 */
export async function importarUnidadesCsv(
  _prevState: ResultadoImportacion,
  formData: FormData
): Promise<ResultadoImportacion> {
  const archivo = formData.get("archivo");
  let contenidoCrudo = String(formData.get("contenido") ?? "");

  if (archivo instanceof File && archivo.size > 0) {
    if (archivo.size > 1_000_000) {
      return { status: "error", message: "El archivo supera 1 MB." };
    }
    contenidoCrudo = await archivo.text();
  }

  const validado = importarUnidadesSchema.safeParse({
    contenido: contenidoCrudo,
    confirmar: formData.get("confirmar") ?? "false",
  });

  if (!validado.success) {
    return {
      status: "error",
      message: "Pega el contenido del CSV o adjunta el archivo.",
      errores: z.flattenError(validado.error).fieldErrors,
    };
  }

  const { contenido, confirmar } = validado.data;

  try {
    const { copropiedad } = await getContextoAdministrador();
    if (!copropiedad) return SIN_COPROPIEDAD;

    const lineas = contenido
      .split(/\r?\n/)
      .map((linea) => linea.trim())
      .filter((linea) => linea.length > 0);

    // Descarta el encabezado si viene.
    const primeraCelda = separarCampos(lineas[0] ?? "")[0]?.toLowerCase();
    const filas = primeraCelda === "identificador" ? lineas.slice(1) : lineas;

    if (filas.length === 0) {
      return { status: "error", message: "El archivo no tiene filas de datos." };
    }
    if (filas.length > 500) {
      return {
        status: "error",
        message: "Máximo 500 filas por importación (divide el archivo).",
      };
    }

    const existentes = await prisma.inmueble.findMany({
      where: { copropiedadId: copropiedad.id },
      select: { identificador: true },
    });
    const identificadoresExistentes = new Set(
      existentes.map((unidad) => unidad.identificador)
    );

    const erroresFila: { linea: number; mensaje: string }[] = [];
    const filasValidas: NonNullable<ResultadoImportacion["filasValidas"]> = [];
    const vistas = new Set<string>();
    const offset = primeraCelda === "identificador" ? 2 : 1;

    filas.forEach((linea, indice) => {
      const numeroLinea = indice + offset;
      const [identificador, torre, coeficiente, areaM2] = separarCampos(linea);

      const resultado = filaUnidadSchema.safeParse({
        identificador,
        torre,
        coeficiente,
        areaM2: areaM2 ?? "",
      });

      if (!resultado.success) {
        erroresFila.push({
          linea: numeroLinea,
          mensaje: resultado.error.issues.map((issue) => issue.message).join(" · "),
        });
        return;
      }

      if (vistas.has(resultado.data.identificador)) {
        erroresFila.push({
          linea: numeroLinea,
          mensaje: `"${resultado.data.identificador}" está repetido en el archivo`,
        });
        return;
      }
      vistas.add(resultado.data.identificador);

      filasValidas.push({
        identificador: resultado.data.identificador,
        torre: resultado.data.torre,
        coeficiente: resultado.data.coeficiente,
        areaM2: resultado.data.areaM2 ? resultado.data.areaM2 : null,
        yaExiste: identificadoresExistentes.has(resultado.data.identificador),
      });
    });

    if (!confirmar) {
      return {
        status: filasValidas.length > 0 ? "success" : "error",
        message:
          filasValidas.length > 0
            ? `Vista previa: ${filasValidas.length} fila(s) válida(s), ${erroresFila.length} con error. Nada se ha guardado todavía.`
            : "Ninguna fila es válida. Revisa los errores y vuelve a intentar.",
        filasValidas,
        erroresFila,
        confirmado: false,
      };
    }

    if (filasValidas.length === 0) {
      return {
        status: "error",
        message: "No hay filas válidas para importar.",
        erroresFila,
        confirmado: false,
      };
    }

    await prisma.$transaction(
      filasValidas.map((fila) =>
        prisma.inmueble.upsert({
          where: {
            copropiedadId_identificador: {
              copropiedadId: copropiedad.id,
              identificador: fila.identificador,
            },
          },
          update: {
            torre: fila.torre,
            coeficiente: new Prisma.Decimal(fila.coeficiente),
            areaM2: fila.areaM2 ? new Prisma.Decimal(fila.areaM2) : null,
            deletedAt: null,
          },
          create: {
            copropiedadId: copropiedad.id,
            identificador: fila.identificador,
            torre: fila.torre,
            coeficiente: new Prisma.Decimal(fila.coeficiente),
            areaM2: fila.areaM2 ? new Prisma.Decimal(fila.areaM2) : null,
          },
        })
      )
    );

    revalidarCartera();
    revalidatePath("/dashboard/residentes");

    const creadas = filasValidas.filter((fila) => !fila.yaExiste).length;
    const actualizadas = filasValidas.length - creadas;

    return {
      status: "success",
      message: `Importación aplicada: ${creadas} unidad(es) creada(s) y ${actualizadas} actualizada(s).${
        erroresFila.length > 0 ? ` ${erroresFila.length} fila(s) se omitieron por errores.` : ""
      }`,
      filasValidas,
      erroresFila,
      confirmado: true,
    };
  } catch (error) {
    console.error("importarUnidadesCsv", error);
    return { status: "error", message: "No se pudo procesar el archivo." };
  }
}

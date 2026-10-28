import { EstadoInmueble } from "@prisma/client";
import {
  convertirCoeficiente,
  detectarFormato,
  normalizarNumero,
  type FormatoCoeficiente,
} from "@/lib/coeficientes";
import { filaUnidadSchema } from "@/lib/validations/cartera";
import type { FilaImportada } from "@/lib/types/importacion";

/**
 * Lectura del CSV de unidades, sin acceso a la base (por eso es probable en
 * aislado). El encabezado se reconoce POR NOMBRE, en cualquier orden y con
 * variantes (`area_m2` / `areaM2` / `área`, `apto` / `unidad`…), sin importar
 * mayúsculas ni tildes.
 */

type Columna = "identificador" | "torre" | "coeficiente" | "area" | "estado";

const ALIAS: Record<Columna, string[]> = {
  identificador: ["identificador", "apto", "apartamento", "unidad", "inmueble", "casa"],
  torre: ["torre", "bloque"],
  coeficiente: ["coeficiente", "coeficientes", "coef"],
  area: ["aream2", "area", "m2"],
  estado: ["estado"],
};

const OBLIGATORIAS: Columna[] = ["identificador", "coeficiente"];
const NOMBRE_COLUMNA: Record<Columna, string> = {
  identificador: "identificador",
  torre: "torre",
  coeficiente: "coeficiente",
  area: "area_m2",
  estado: "estado",
};

/** "Área M2" → "aream2", "area_m2" → "aream2", "ÁREA" → "area". */
function normalizarEncabezado(texto: string): string {
  return texto
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]/g, "");
}

function columnaDe(texto: string): Columna | null {
  const clave = normalizarEncabezado(texto);
  for (const [columna, alias] of Object.entries(ALIAS) as [Columna, string[]][]) {
    if (alias.includes(clave)) return columna;
  }
  return null;
}

function normalizarEstado(texto: string): EstadoInmueble | null {
  const clave = normalizarEncabezado(texto);
  if (clave === "") return EstadoInmueble.OCUPADO;
  if (clave === "ocupado") return EstadoInmueble.OCUPADO;
  if (clave === "desocupado") return EstadoInmueble.DESOCUPADO;
  return null;
}

export type FilaProcesada = Omit<FilaImportada, "yaExiste">;

export type ResultadoProcesoCsv =
  | { error: string }
  | {
      filasValidas: FilaProcesada[];
      erroresFila: { linea: number; mensaje: string }[];
      /** Formato aplicado (el forzado por el usuario o, si no, el detectado). */
      formato: FormatoCoeficiente;
      formatoDetectado: FormatoCoeficiente;
      /** Suma de la columna de coeficientes, ya expresada en porcentaje. */
      sumaPorcentaje: string;
      /** El CSV traía columna `estado` (si no, no se toca el estado al actualizar). */
      tieneEstado: boolean;
    };

export function procesarCsvUnidades(
  contenido: string,
  /** Formato elegido por el usuario; si no viene se autodetecta por la suma. */
  formatoForzado?: FormatoCoeficiente
): ResultadoProcesoCsv {
  const lineas = contenido
    .split(/\r?\n/)
    .map((texto, indice) => ({ linea: indice + 1, texto: texto.trim() }))
    .filter((item) => item.texto.length > 0);

  if (lineas.length === 0) return { error: "El archivo no tiene filas de datos." };

  // Un mismo separador para todo el archivo: `;` si el encabezado/primera
  // línea lo trae (Excel es-CO), `,` si no.
  const separador = lineas[0].texto.includes(";") ? ";" : ",";
  const separar = (texto: string) => texto.split(separador).map((campo) => campo.trim());

  const primera = separar(lineas[0].texto);
  const conocidas = primera.map(columnaDe);
  const esEncabezado =
    conocidas.some((columna) => columna !== null) ||
    // Sin ningún nombre conocido: si la 3.ª celda no es un número tampoco es
    // una fila de datos, así que se trata como encabezado y se explican las
    // columnas desconocidas en vez de marcar la línea 1 como un apto inválido.
    !/^\d*[.,]?\d+$/.test(normalizarNumero(primera[2] ?? ""));

  let orden: (Columna | null)[];
  let filas = lineas;

  if (esEncabezado) {
    orden = conocidas;
    filas = lineas.slice(1);

    const desconocidas = primera.filter((_, i) => conocidas[i] === null);
    const repetidas = [
      ...new Set(
        conocidas.filter((columna, i): columna is Columna => columna !== null && conocidas.indexOf(columna) !== i)
      ),
    ];
    const faltantes = OBLIGATORIAS.filter((columna) => !conocidas.includes(columna));

    const problemas: string[] = [];
    if (desconocidas.length === 1) {
      problemas.push(`Columna desconocida: ${desconocidas[0] || "(sin nombre)"}`);
    } else if (desconocidas.length > 1) {
      problemas.push(`Columnas desconocidas: ${desconocidas.map((d) => d || "(sin nombre)").join(", ")}`);
    }
    if (repetidas.length > 0) {
      problemas.push(`Columna repetida: ${repetidas.map((c) => NOMBRE_COLUMNA[c]).join(", ")}`);
    }
    if (faltantes.length === 1) {
      problemas.push(`Falta la columna ${NOMBRE_COLUMNA[faltantes[0]]}`);
    } else if (faltantes.length > 1) {
      problemas.push(`Faltan las columnas ${faltantes.map((c) => NOMBRE_COLUMNA[c]).join(", ")}`);
    }
    if (problemas.length > 0) {
      return {
        error: `${problemas.join(" · ")}. Columnas válidas: identificador, torre, coeficiente, area_m2, estado.`,
      };
    }
  } else {
    // Formato histórico sin encabezado: identificador,torre,coeficiente,area_m2.
    orden = ["identificador", "torre", "coeficiente", "area"];
  }

  if (filas.length === 0) return { error: "El archivo no tiene filas de datos." };
  if (filas.length > 500) {
    return { error: "Máximo 500 filas por importación (divide el archivo)." };
  }

  const celdas = filas.map((fila) => {
    const campos = separar(fila.texto);
    const valores: Partial<Record<Columna, string>> = {};
    orden.forEach((columna, i) => {
      if (columna) valores[columna] = campos[i] ?? "";
    });
    return { linea: fila.linea, valores };
  });

  const detectado = detectarFormato(celdas.map((c) => c.valores.coeficiente ?? ""));
  const formato = formatoForzado ?? detectado.formato;
  const suma = detectado.suma;
  const tieneEstado = orden.includes("estado");

  const erroresFila: { linea: number; mensaje: string }[] = [];
  const filasValidas: FilaProcesada[] = [];
  const vistas = new Set<string>();

  for (const { linea, valores } of celdas) {
    const resultado = filaUnidadSchema.safeParse({
      identificador: valores.identificador ?? "",
      torre: valores.torre ?? "",
      coeficiente: valores.coeficiente ?? "",
      areaM2: valores.area ?? "",
    });

    if (!resultado.success) {
      erroresFila.push({
        linea,
        mensaje: resultado.error.issues.map((issue) => issue.message).join(" · "),
      });
      continue;
    }

    const convertido = convertirCoeficiente(resultado.data.coeficiente, formato);
    if (!convertido.ok) {
      erroresFila.push({ linea, mensaje: convertido.error });
      continue;
    }

    const estado = normalizarEstado(valores.estado ?? "");
    if (!estado) {
      erroresFila.push({ linea, mensaje: "Estado inválido (usa OCUPADO o DESOCUPADO)" });
      continue;
    }

    if (vistas.has(resultado.data.identificador)) {
      erroresFila.push({
        linea,
        mensaje: `"${resultado.data.identificador}" está repetido en el archivo`,
      });
      continue;
    }
    vistas.add(resultado.data.identificador);

    filasValidas.push({
      identificador: resultado.data.identificador,
      torre: resultado.data.torre,
      coeficiente: convertido.fraccion,
      coeficientePorcentaje: convertido.porcentaje,
      areaM2: resultado.data.areaM2 ? resultado.data.areaM2 : null,
      estado,
    });
  }

  const sumaPorcentaje = (formato === "porcentaje" ? suma : suma.mul(100)).toFixed(3);
  return {
    filasValidas,
    erroresFila,
    formato,
    formatoDetectado: detectado.formato,
    sumaPorcentaje,
    tieneEstado,
  };
}

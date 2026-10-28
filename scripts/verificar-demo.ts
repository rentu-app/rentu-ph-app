/**
 * Verifica la demo a nivel de datos: imprime los agregados de cartera tal
 * como los calcula la aplicación y comprueba las reglas de negocio que no se
 * pueden ver en una captura de pantalla (bloqueo por paz y salvo, cruce de
 * horarios, validación del CSV de unidades).
 *
 * Uso:  pnpm verify:demo
 *
 * Es de solo lectura: no escribe nada en la base.
 */
import { Prisma } from "@prisma/client";
import { prisma } from "../src/lib/prisma";
import { resolverCopropiedadActiva } from "../src/lib/data/copropiedad";
import {
  getCarteraPorTorre,
  getDetalleUnidad,
  getResumenCartera,
  getUnidadesFiltradas,
  getUnidadesPrioritarias,
} from "../src/lib/data/cartera";
import { existeCruceDeHorario, inmuebleNoEstaAPazYSalvo } from "../src/lib/data/reservas";
import { filaUnidadSchema } from "../src/lib/validations/cartera";
import { existsSync, readFileSync } from "node:fs";
import { normalizarContenidoCsv } from "../src/lib/csv-normalizar";
import { superaLimiteTotal } from "../src/lib/coeficientes";
import { procesarCsvUnidades } from "../src/lib/csv-unidades";

const pesos = (valor: number) =>
  `$${valor.toLocaleString("es-CO", { maximumFractionDigits: 0 })}`;

async function main() {
  const admin = await prisma.usuario.findFirstOrThrow({
    where: { rol: "ADMINISTRADOR", deletedAt: null, email: "admin.demo@example.com" },
    select: { id: true },
  });

  // La demo puede tener más de una copropiedad vinculada: se verifica la del seed.
  const { copropiedades } = await resolverCopropiedadActiva(admin.id, undefined);
  const copropiedad =
    copropiedades.find((item) => item.nombre.includes("Altos de Salitre")) ?? copropiedades[0];
  if (!copropiedad) throw new Error("El administrador demo no tiene copropiedad activa.");

  console.log(`\n=== ${copropiedad.nombre} ===`);
  console.log(`${copropiedad.direccion}, ${copropiedad.ciudad}`);
  console.log(
    `${copropiedad.totalUnidades} unidades · ${copropiedad.torres
      .map((torre) => `${torre.nombre} (${torre.unidades})`)
      .join(" · ")}`
  );

  const resumen = await getResumenCartera(copropiedad.id);
  console.log(`\n--- Indicadores del periodo ${resumen.periodoVigente} ---`);
  console.log(`Facturado:           ${pesos(resumen.facturadoPeriodo)}`);
  console.log(`Recaudo del mes:     ${pesos(resumen.recaudoDelMes)}`);
  console.log(`Recaudo del periodo: ${pesos(resumen.recaudoDelPeriodo)}`);
  console.log(`Recuperación previa: ${pesos(resumen.recuperacionPeriodosAnteriores)}`);
  console.log(`% de recaudo:        ${resumen.porcentajeRecaudo.toFixed(1)}%`);
  console.log(`Cartera total:       ${pesos(resumen.carteraTotal)}`);
  console.log(`Cartera vencida:     ${pesos(resumen.carteraVencida)}`);
  console.log(
    `Unidades: ${resumen.unidadesConSaldo} con saldo · ${resumen.unidadesEnMora} en mora · ${resumen.unidadesAlDia} al día`
  );

  console.log(`\n--- Cartera por antigüedad ---`);
  for (const tramo of resumen.antiguedad) {
    console.log(
      `${tramo.etiqueta.padEnd(16)} ${pesos(tramo.monto).padStart(13)}  ${String(tramo.unidades).padStart(2)} und  ${tramo.porcentaje.toFixed(1).padStart(5)}%`
    );
  }

  console.log(`\n--- Cartera por torre ---`);
  for (const torre of await getCarteraPorTorre(copropiedad.id)) {
    console.log(
      `${torre.torre.padEnd(10)} ${pesos(torre.saldoTotal).padStart(13)}  vencido ${pesos(torre.saldoVencido).padStart(13)}  ${torre.unidadesConSaldo}/${torre.unidades} und  ${torre.porcentajeDeCartera.toFixed(1).padStart(5)}%`
    );
  }

  console.log(`\n--- Unidades a gestionar ---`);
  for (const unidad of await getUnidadesPrioritarias(copropiedad.id, 8)) {
    console.log(
      `${unidad.identificador.padEnd(11)} ${unidad.torre.padEnd(8)} vencido ${pesos(unidad.saldoVencido).padStart(12)}  ${String(unidad.diasMora).padStart(3)} días  ${unidad.etapaCobro.padEnd(17)} puede reservar: ${unidad.aPazYSalvo}`
    );
  }

  console.log(`\n--- Filtros de la tabla de cartera ---`);
  for (const situacion of ["con-saldo", "en-mora", "al-dia"]) {
    const unidades = await getUnidadesFiltradas(copropiedad.id, { situacion });
    console.log(`situacion=${situacion.padEnd(10)} → ${unidades.length} unidades`);
  }
  for (const torre of copropiedad.torres) {
    const unidades = await getUnidadesFiltradas(copropiedad.id, { torre: torre.nombre });
    console.log(`torre=${torre.nombre.padEnd(14)} → ${unidades.length} unidades`);
  }

  console.log(`\n--- Detalle de la unidad con más mora ---`);
  const [peor] = await getUnidadesPrioritarias(copropiedad.id, 1);
  const detalle = await getDetalleUnidad(copropiedad.id, peor.id);
  if (!detalle) throw new Error("No se pudo cargar el detalle de la unidad.");
  console.log(
    `${detalle.identificador}: saldo ${pesos(detalle.saldoTotal)} · ${detalle.cuentas.length} cuotas · ${detalle.gestiones.length} gestiones · ${detalle.notificaciones.length} avisos · ${detalle.residentes.length} residente(s)`
  );
  console.log(
    `Avisos marcados como simulación: ${
      detalle.notificaciones.every((aviso) => aviso.simulada)
        ? "todos (correcto)"
        : "⚠ hay avisos sin marcar"
    }`
  );

  console.log(`\n--- Regla de paz y salvo (la misma que bloquea reservas) ---`);
  const unidades = await getUnidadesFiltradas(copropiedad.id);
  for (const unidad of unidades.slice(0, 8)) {
    const bloqueada = await inmuebleNoEstaAPazYSalvo(unidad.id);
    const coherente = bloqueada === !unidad.aPazYSalvo;
    console.log(
      `${unidad.identificador.padEnd(11)} bloqueada=${String(bloqueada).padEnd(5)} coherente con la vista: ${coherente ? "sí" : "NO ⚠"}`
    );
  }

  console.log(`\n--- Cruce de horarios ---`);
  const reserva = await prisma.reserva.findFirst({
    where: { estado: { in: ["PENDIENTE", "CONFIRMADA"] }, deletedAt: null },
    select: { id: true, zonaComunId: true, fechaInicio: true, fechaFin: true },
  });
  if (reserva) {
    const mismo = await existeCruceDeHorario({
      zonaComunId: reserva.zonaComunId,
      fechaInicio: reserva.fechaInicio,
      fechaFin: reserva.fechaFin,
    });
    const excluyendo = await existeCruceDeHorario({
      zonaComunId: reserva.zonaComunId,
      fechaInicio: reserva.fechaInicio,
      fechaFin: reserva.fechaFin,
      excluirReservaId: reserva.id,
    });
    const libre = await existeCruceDeHorario({
      zonaComunId: reserva.zonaComunId,
      fechaInicio: new Date(reserva.fechaFin.getTime() + 3_600_000),
      fechaFin: new Date(reserva.fechaFin.getTime() + 7_200_000),
    });
    console.log(`mismo horario        → ${mismo} (esperado true)`);
    console.log(`excluyendo la propia → ${excluyendo} (esperado false)`);
    console.log(`franja libre después → ${libre} (esperado false)`);
  }

  console.log(`\n--- Validación de filas del CSV de unidades ---`);
  // `filaUnidadSchema` valida identificador, torre y área; el coeficiente
  // (porcentaje o fracción) se valida aparte, en `convertirCoeficiente`.
  // Cada caso declara su resultado esperado y el script marca ✓ / ✗.
  const casos: [string, Record<string, string>, "acepta" | "rechaza"][] = [
    ["válida", { identificador: "Apto D101", torre: "Torre D", coeficiente: "4.167", areaM2: "70.00" }, "acepta"],
    ["sin área", { identificador: "Apto D102", torre: "Torre D", coeficiente: "4.167", areaM2: "" }, "acepta"],
    // El esquema ya NO rechaza un coeficiente en %: cualquier valor no vacío
    // pasa y la conversión decide (ver sección siguiente).
    ["coeficiente en %", { identificador: "Apto D103", torre: "Torre D", coeficiente: "4.167", areaM2: "70" }, "acepta"],
    // La torre es opcional: sin torre se guarda "" y la UI la muestra como "Sin torre".
    ["sin torre (esquema)", { identificador: "Apto D104", torre: "", coeficiente: "4.167", areaM2: "70" }, "acepta"],
    ["área con letras", { identificador: "Apto D105", torre: "Torre D", coeficiente: "4.167", areaM2: "70m2" }, "rechaza"],
  ];
  for (const [nombre, fila, esperado] of casos) {
    const resultado = filaUnidadSchema.safeParse(fila);
    const obtenido = resultado.success ? "acepta" : "rechaza";
    console.log(
      `${obtenido === esperado ? "✓" : "✗"} ${nombre.padEnd(22)} → ${obtenido} (esperado ${esperado})${
        resultado.success
          ? ""
          : ` [${resultado.error.issues.map((issue) => issue.message).join(" | ")}]`
      }`
    );
  }

  console.log(`\n--- Formato de coeficientes del CSV (porcentaje vs fracción) ---`);
  const comprobar = (nombre: string, ok: boolean, detalle: string) =>
    console.log(`${ok ? "✓" : "✗"} ${nombre.padEnd(38)} → ${detalle}`);

  const enPorcentaje = procesarCsvUnidades("identificador,coeficiente\nApto D1,4.167\nApto D2,95.833");
  if ("error" in enPorcentaje) throw new Error(enPorcentaje.error);
  comprobar(
    "coeficiente en % (suma 100)",
    enPorcentaje.formato === "porcentaje" && enPorcentaje.filasValidas[0].coeficiente === "0.04167",
    `${enPorcentaje.formato}, 4.167 → ${enPorcentaje.filasValidas[0].coeficiente} (esperado porcentaje, 0.04167)`
  );

  // Archivo parcial de una copropiedad grande: 20 unidades de 0.658 % cada una.
  // Ningún valor > 1 y la suma (13.16) no es ni ≈1 ni ≈100, así que la
  // autodetección lo lee como FRACCIÓN y cada unidad quedaría en 65.8 %. Es la
  // limitación conocida; por eso la UI permite elegir el formato a mano y
  // bloquea si la copropiedad quedaría por encima de 100.001 %.
  const parcial = "identificador,coeficiente\n" +
    Array.from({ length: 20 }, (_, i) => `Apto P${i + 1},0.658`).join("\n");
  const auto = procesarCsvUnidades(parcial);
  const forzado = procesarCsvUnidades(parcial, "porcentaje");
  if ("error" in auto || "error" in forzado) throw new Error("El CSV parcial no debería fallar");
  comprobar(
    "parcial 20×0.658 · autodetección",
    auto.formato === "fraccion" && auto.filasValidas[0].coeficiente === "0.65800",
    `${auto.formato}, cada unidad → ${auto.filasValidas[0].coeficientePorcentaje} % (esperado fraccion, 65.800 %)`
  );
  const sumaAuto = auto.filasValidas.reduce((acc, f) => acc.plus(f.coeficiente), new Prisma.Decimal(0));
  comprobar(
    "parcial 20×0.658 · bloqueo por suma",
    superaLimiteTotal(sumaAuto),
    `suma ${sumaAuto.mul(100).toFixed(3)} % > 100.001 % → importación bloqueada (esperado: bloqueada)`
  );
  comprobar(
    "parcial 20×0.658 · formato elegido %",
    forzado.formato === "porcentaje" && forzado.filasValidas[0].coeficiente === "0.00658",
    `${forzado.formato}, cada unidad → ${forzado.filasValidas[0].coeficientePorcentaje} % (esperado porcentaje, 0.658 %)`
  );

  console.log(`\n--- Confirmación del CSV: texto en pantalla vs texto validado ---`);
  // Simula el ciclo de la UI: el servidor normaliza, valida y devuelve el texto
  // normalizado (`contenidoValidado`); el cliente compara contra la MISMA
  // normalización de lo que hay en pantalla. Confirmable = coinciden y no hay bloqueo.
  const simular = (nombre: string, enPantalla: string, esperadasValidas: number) => {
    const ecoServidor = normalizarContenidoCsv(enPantalla);
    const resultado = procesarCsvUnidades(ecoServidor);
    if ("error" in resultado) {
      comprobar(nombre, false, resultado.error);
      return;
    }
    const sumaFracciones = resultado.filasValidas.reduce(
      (acc, fila) => acc.plus(fila.coeficiente),
      new Prisma.Decimal(0)
    );
    const confirmable =
      normalizarContenidoCsv(enPantalla) === ecoServidor &&
      !superaLimiteTotal(sumaFracciones) &&
      resultado.filasValidas.length === esperadasValidas;
    comprobar(
      nombre,
      confirmable,
      `${resultado.filasValidas.length} válidas, ${resultado.formato}, suma ${sumaFracciones
        .mul(100)
        .toFixed(3)} % → ${confirmable ? "confirmable" : "NO confirmable"}`
    );
  };

  const base = "identificador,coeficiente\nApto C1,50\nApto C2,50";
  simular("CRLF + salto final", base.replace(/\n/g, "\r\n") + "\r\n", 2);
  simular("BOM + CRLF + salto final", "\uFEFF" + base.replace(/\n/g, "\r\n") + "\r\n", 2);
  simular("solo \\r (Mac antiguo)", base.replace(/\n/g, "\r") + "\r", 2);
  simular("LF sin salto final", base, 2);
  simular("espacios/saltos al final", base + "  \n\n  ", 2);

  // Archivo real de prueba (si está junto al repo): subido con el input de
  // archivo (File.text(): con salto final) y pegado en el textarea (el
  // navegador normaliza \r\n a \n y el usuario suele pegar sin el salto final).
  const rutaArchivo = new URL("../../unidades_prueba_formato_actual.csv", import.meta.url);
  if (existsSync(rutaArchivo)) {
    const archivo = readFileSync(rutaArchivo, "utf8").replace(/^\uFEFF/, "");
    simular("archivo real subido (20 filas)", archivo, 20);
    simular("archivo real pegado (20 filas)", archivo.trimEnd(), 20);

    // Cambiar el selector recalcula con el formato elegido; el texto no cambia.
    for (const formato of ["porcentaje", "fraccion"] as const) {
      const r = procesarCsvUnidades(normalizarContenidoCsv(archivo), formato);
      if ("error" in r) throw new Error(r.error);
      const total = r.filasValidas.reduce((acc, f) => acc.plus(f.coeficiente), new Prisma.Decimal(0));
      console.log(
        `  selector → ${formato.padEnd(10)} ${r.filasValidas.length} válidas, errores ${r.erroresFila.length}, suma ${total
          .mul(100)
          .toFixed(3)} %${superaLimiteTotal(total) ? " (BLOQUEADA)" : ""}`
      );
    }
  } else {
    console.log("  (archivo unidades_prueba_formato_actual.csv no encontrado: se omite)");
  }

  const suma = await prisma.inmueble.aggregate({
    where: { copropiedadId: copropiedad.id, deletedAt: null },
    _sum: { coeficiente: true },
  });
  console.log(`\nSuma de coeficientes (debe ser 1): ${suma._sum.coeficiente?.toString()}`);

  await prisma.$disconnect();
}

main().catch(async (error) => {
  console.error(error);
  await prisma.$disconnect();
  process.exit(1);
});

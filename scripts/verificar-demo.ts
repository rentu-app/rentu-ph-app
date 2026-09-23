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
import { prisma } from "../src/lib/prisma";
import { getCopropiedadActiva } from "../src/lib/data/copropiedad";
import {
  getCarteraPorTorre,
  getDetalleUnidad,
  getResumenCartera,
  getUnidadesFiltradas,
  getUnidadesPrioritarias,
} from "../src/lib/data/cartera";
import { existeCruceDeHorario, inmuebleNoEstaAPazYSalvo } from "../src/lib/data/reservas";
import { filaUnidadSchema } from "../src/lib/validations/cartera";

const pesos = (valor: number) =>
  `$${valor.toLocaleString("es-CO", { maximumFractionDigits: 0 })}`;

async function main() {
  const admin = await prisma.usuario.findFirstOrThrow({
    where: { rol: "ADMINISTRADOR", deletedAt: null, email: "admin.demo@example.com" },
    select: { id: true },
  });

  const copropiedad = await getCopropiedadActiva(admin.id);
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
  const casos: [string, Record<string, string>][] = [
    ["válida", { identificador: "Apto D101", torre: "Torre D", coeficiente: "0.04167", areaM2: "70.00" }],
    ["sin área", { identificador: "Apto D102", torre: "Torre D", coeficiente: "0.04167", areaM2: "" }],
    ["coeficiente en %", { identificador: "Apto D103", torre: "Torre D", coeficiente: "4.167", areaM2: "70" }],
    ["sin torre", { identificador: "Apto D104", torre: "", coeficiente: "0.04167", areaM2: "70" }],
    ["área con letras", { identificador: "Apto D105", torre: "Torre D", coeficiente: "0.04167", areaM2: "70m2" }],
  ];
  for (const [nombre, fila] of casos) {
    const resultado = filaUnidadSchema.safeParse(fila);
    console.log(
      `${nombre.padEnd(18)} → ${
        resultado.success
          ? "acepta"
          : `rechaza (${resultado.error.issues.map((issue) => issue.message).join(" | ")})`
      }`
    );
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

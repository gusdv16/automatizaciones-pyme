// Conciliador de caja y banco.
// Cruza las ventas del sistema con los abonos de la cartola bancaria aplicando una regla de negocio:
// mismo monto (con tolerancia) y una fecha dentro de una ventana de días (el banco acredita con demora).
// Devuelve qué quedó conciliado y, sobre todo, qué falta y qué sobra.
import { normalizarMonto, normalizarTexto, esFechaValida } from './formato.js';

const DIA = 86400000;

function preparar(filas, tipo) {
  return filas.map((f, i) => {
    const monto = normalizarMonto(f.monto);
    const fecha = new Date(f.fecha);
    const detalle = normalizarTexto(f.detalle);
    const problemas = [];
    if (!esFechaValida(fecha)) problemas.push('fecha inválida');
    if (!Number.isFinite(monto)) problemas.push('monto inválido');
    else if (monto <= 0) problemas.push('monto en cero o negativo');
    return { tipo, fila: i + 2, fecha, monto, detalle, problemas, raw: f, usada: false };
  });
}

function detectarDuplicados(registros, tipo, avisos) {
  const vistos = new Map();
  for (const r of registros) {
    const k = `${r.monto}|${r.fecha.getTime()}|${r.detalle.toLowerCase()}`;
    if (vistos.has(k)) {
      avisos.push({
        tipo: 'duplicado',
        mensaje: `Posible ${tipo} duplicado: la fila ${r.fila} repite monto, fecha y detalle de la fila ${vistos.get(k)}. Revisalo a mano.`,
      });
    } else {
      vistos.set(k, r.fila);
    }
  }
}

export function conciliar(ventasFilas, cartolaFilas, { ventanaDias = 3, tolerancia = 0.05 } = {}) {
  const ventas = preparar(ventasFilas, 'venta');
  const abonos = preparar(cartolaFilas, 'abono');
  const avisos = [];

  for (const r of [...ventas, ...abonos]) {
    for (const p of r.problemas) {
      avisos.push({
        tipo: 'dato',
        mensaje: `Fila ${r.fila} (${r.tipo}): ${p}. Se ignora para la conciliación.`,
      });
    }
  }

  const validasV = ventas.filter((r) => !r.problemas.length);
  const validasA = abonos.filter((r) => !r.problemas.length);

  detectarDuplicados(validasV, 'venta', avisos);
  detectarDuplicados(validasA, 'abono', avisos);

  // Emparejamiento voraz: para cada venta se elige el abono de igual monto con la fecha más cercana.
  const conciliados = [];
  for (const v of [...validasV].sort((a, b) => a.fecha - b.fecha)) {
    let mejor = null;
    for (const a of validasA) {
      if (a.usada) continue;
      const difMonto = Math.abs(a.monto - v.monto);
      if (difMonto > tolerancia) continue;
      const difDias = Math.abs(Math.round((a.fecha - v.fecha) / DIA));
      if (difDias > ventanaDias) continue;
      if (!mejor || difDias < mejor.difDias || (difDias === mejor.difDias && difMonto < mejor.difMonto)) {
        mejor = { abono: a, difDias, difMonto };
      }
    }
    if (mejor) {
      v.usada = true;
      mejor.abono.usada = true;
      conciliados.push({
        venta: v,
        abono: mejor.abono,
        diferenciaDias: mejor.difDias,
        diferenciaMonto: +mejor.difMonto.toFixed(2),
      });
    }
  }

  const ventasSinAbono = validasV.filter((v) => !v.usada);
  const abonosSinVenta = validasA.filter((a) => !a.usada);
  const suma = (arr) => +arr.reduce((s, x) => s + x.monto, 0).toFixed(2);

  const resumen = {
    cantidadVentas: validasV.length,
    cantidadAbonos: validasA.length,
    cantidadConciliados: conciliados.length,
    totalVentas: suma(validasV),
    totalAbonos: suma(validasA),
    montoConciliado: +conciliados.reduce((s, c) => s + c.venta.monto, 0).toFixed(2),
    montoVentasSinAbono: suma(ventasSinAbono),
    montoAbonosSinVenta: suma(abonosSinVenta),
    // La diferencia de caja: lo que el banco muestra de más respecto de las ventas registradas.
    diferenciaCaja: +(suma(validasA) - suma(validasV)).toFixed(2),
  };

  return { conciliados, ventasSinAbono, abonosSinVenta, avisos, resumen };
}

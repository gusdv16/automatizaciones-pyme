// Conciliador de caja y banco.
// Cruza las ventas del sistema con los abonos de la cartola bancaria aplicando una regla de negocio:
// mismo monto (con tolerancia) y una fecha dentro de una ventana de días (el banco acredita con demora).
// Devuelve qué quedó conciliado y, sobre todo, qué falta y qué sobra.
import { normalizarMonto, normalizarTexto, esFechaValida } from './formato.js';

const DIA = 86400000;

function preparar(filas, tipo, { pasarela, comisionPct, ivaPct } = {}) {
  return filas.map((f, i) => {
    const monto = normalizarMonto(f.monto);
    const fecha = new Date(f.fecha);
    const detalle = normalizarTexto(f.detalle);
    const problemas = [];
    if (!esFechaValida(fecha)) problemas.push('fecha inválida');
    if (!Number.isFinite(monto)) problemas.push('monto inválido');
    else if (monto <= 0) problemas.push('monto en cero o negativo');
    const reg = { tipo, fila: i + 2, fecha, monto, detalle, problemas, raw: f, usada: false };
    if (pasarela && tipo === 'venta' && Number.isFinite(monto)) {
      const comision = +(monto * (comisionPct / 100)).toFixed(2);
      const iva = +(comision * (ivaPct / 100)).toFixed(2);
      reg.netoEsperado = +(monto - comision - iva).toFixed(2);
      reg.comision = comision;
      reg.iva = iva;
      reg.bruto = monto;
    } else {
      reg.netoEsperado = monto;
      reg.comision = 0;
      reg.iva = 0;
      reg.bruto = monto;
    }
    return reg;
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

export function conciliar(ventasFilas, cartolaFilas, { ventanaDias = 3, tolerancia = 0.05, pasarela = null } = {}) {
  const modo = pasarela ? 'pasarela' : 'banco';
  const comisionPct = pasarela ? Number(pasarela.comisionPct) || 0 : 0;
  const ivaPct = pasarela ? Number(pasarela.ivaPct) || 0 : 0;
  const ventas = preparar(ventasFilas, 'venta', { pasarela: !!pasarela, comisionPct, ivaPct });
  const abonos = preparar(cartolaFilas, 'abono', { pasarela: !!pasarela, comisionPct, ivaPct });
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
      const objetivo = pasarela ? v.netoEsperado : v.monto;
      const difMonto = Math.abs(a.monto - objetivo);
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
        netoEsperado: v.netoEsperado,
        netoRecibido: mejor.abono.monto,
        diferenciaNeto: +mejor.difMonto.toFixed(2),
        bruto: v.bruto,
        comision: v.comision,
        iva: v.iva,
      });
    }
  }

  const ventasSinAbono = validasV.filter((v) => !v.usada);
  const abonosSinVenta = validasA.filter((a) => !a.usada);
  const suma = (arr) => +arr.reduce((s, x) => s + x.monto, 0).toFixed(2);

  const resumen = {
    modo,
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

  if (pasarela) {
    resumen.comisionPct = comisionPct;
    resumen.ivaPct = ivaPct;
    resumen.totalBruto = suma(validasV);
    resumen.totalComision = +validasV.reduce((s, v) => s + (v.comision || 0), 0).toFixed(2);
    resumen.totalIva = +validasV.reduce((s, v) => s + (v.iva || 0), 0).toFixed(2);
    resumen.totalNetoEsperado = +validasV.reduce((s, v) => s + (v.netoEsperado || 0), 0).toFixed(2);
    resumen.totalNetoRecibido = suma(validasA);
  }

  return { conciliados, ventasSinAbono, abonosSinVenta, avisos, resumen };
}

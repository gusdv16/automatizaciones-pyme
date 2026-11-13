#!/usr/bin/env node
// Conciliador de caja y banco (y modo pasarela de pagos).
// Uso: node conciliador/cli.js [ventas] [abonos] [salida] [--pasarela] [--comision 4.5] [--iva 22]
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { leerTabla, escribirCSV } from '../core/io.node.js';
import { conciliar } from '../core/conciliar.js';
import { formatearMonto, fechaISO } from '../core/formato.js';

const raiz = path.join(path.dirname(fileURLToPath(import.meta.url)), '..');

// Parseo simple de flags.
const args = process.argv.slice(2);
const flags = { pasarela: false, comision: 4.5, iva: 22 };
const pos = [];
for (let i = 0; i < args.length; i++) {
  const a = args[i];
  if (a === '--pasarela') flags.pasarela = true;
  else if (a === '--comision') { flags.comision = Number(args[++i]); }
  else if (a === '--iva') { flags.iva = Number(args[++i]); }
  else pos.push(a);
}

const pasarela = flags.pasarela ? { comisionPct: flags.comision, ivaPct: flags.iva } : null;

const defaultVentas = pasarela ? 'datos-sucios/ventas-pasarela.csv' : 'datos-sucios/ventas-sistema.csv';
const defaultAbonos = pasarela ? 'datos-sucios/liquidaciones-pasarela.csv' : 'datos-sucios/cartola-banco.csv';

const rutaVentas = pos[0] || path.join(raiz, defaultVentas);
const rutaCartola = pos[1] || path.join(raiz, defaultAbonos);
const dirSalida = pos[2] || path.join(raiz, 'salidas');

const ventas = leerTabla(rutaVentas);
const cartola = leerTabla(rutaCartola);
const r = conciliar(ventas, cartola, { ventanaDias: 3, pasarela });

const sufijo = pasarela ? '-pasarela' : '';
escribirCSV(
  path.join(dirSalida, `conciliados${sufijo}.csv`),
  r.conciliados.map((c) => pasarela
    ? {
        fecha_venta: fechaISO(c.venta.fecha),
        bruto: c.bruto,
        comision: c.comision,
        iva: c.iva,
        neto_esperado: c.netoEsperado,
        neto_recibido: c.netoRecibido,
        diferencia: c.diferenciaNeto,
        fecha_liquidacion: fechaISO(c.abono.fecha),
        dias: c.diferenciaDias,
      }
    : {
        fecha_venta: fechaISO(c.venta.fecha),
        monto: c.venta.monto,
        fecha_abono: fechaISO(c.abono.fecha),
        dias_de_demora: c.diferenciaDias,
        detalle_abono: c.abono.detalle,
      }),
  pasarela
    ? ['fecha_venta', 'bruto', 'comision', 'iva', 'neto_esperado', 'neto_recibido', 'diferencia', 'fecha_liquidacion', 'dias']
    : ['fecha_venta', 'monto', 'fecha_abono', 'dias_de_demora', 'detalle_abono'],
);

escribirCSV(
  path.join(dirSalida, `ventas-sin-abono${sufijo}.csv`),
  r.ventasSinAbono.map((v) => ({ fecha: fechaISO(v.fecha), monto: v.monto, detalle: v.detalle })),
  ['fecha', 'monto', 'detalle'],
);

escribirCSV(
  path.join(dirSalida, `abonos-sin-venta${sufijo}.csv`),
  r.abonosSinVenta.map((a) => ({ fecha: fechaISO(a.fecha), monto: a.monto, detalle: a.detalle })),
  ['fecha', 'monto', 'detalle'],
);

const linea = (t) => console.log(t);
linea('');
linea(pasarela ? 'CONCILIACIÓN PASARELA DE PAGOS' : 'CONCILIACIÓN CAJA vs BANCO');
linea('='.repeat(48));
if (pasarela) {
  linea(`Comisión: ${flags.comision}%  |  IVA sobre comisión: ${flags.iva}%`);
  linea('');
}
linea(`Ventas del sistema : ${r.resumen.cantidadVentas}  (${formatearMonto(r.resumen.totalVentas)})`);
linea(`Liquidaciones      : ${r.resumen.cantidadAbonos}  (${formatearMonto(r.resumen.totalAbonos)})`);
linea(`Conciliados        : ${r.resumen.cantidadConciliados}  (${formatearMonto(r.resumen.montoConciliado)})`);
if (pasarela) {
  linea(`  Bruto total      : ${formatearMonto(r.resumen.totalBruto)}`);
  linea(`  Comisiones       : ${formatearMonto(r.resumen.totalComision)}`);
  linea(`  IVA comisiones   : ${formatearMonto(r.resumen.totalIva)}`);
  linea(`  Neto esperado    : ${formatearMonto(r.resumen.totalNetoEsperado)}`);
  linea(`  Neto recibido    : ${formatearMonto(r.resumen.totalNetoRecibido)}`);
}
linea('');
linea(`Ventas SIN liquidación : ${r.ventasSinAbono.length}  (${formatearMonto(r.resumen.montoVentasSinAbono)})`);
linea(`Liquidaciones SIN venta: ${r.abonosSinVenta.length}  (${formatearMonto(r.resumen.montoAbonosSinVenta)})`);
linea(`Diferencia de caja     : ${formatearMonto(r.resumen.diferenciaCaja)}`);
linea('');
if (r.avisos.length) {
  linea('AVISOS SOBRE LOS DATOS');
  for (const a of r.avisos) linea(`  - ${a.mensaje}`);
  linea('');
}
linea(`Archivos escritos en ${path.relative(process.cwd(), dirSalida) || '.'}:`);
linea(`  conciliados${sufijo}.csv, ventas-sin-abono${sufijo}.csv, abonos-sin-venta${sufijo}.csv`);

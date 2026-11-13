#!/usr/bin/env node
// Conciliador de caja y banco.
// Uso: node conciliador/cli.js [ventas.csv] [cartola.csv] [carpeta-salida]
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { leerTabla, escribirCSV } from '../core/io.node.js';
import { conciliar } from '../core/conciliar.js';
import { formatearMonto, fechaISO } from '../core/formato.js';

const raiz = path.join(path.dirname(fileURLToPath(import.meta.url)), '..');
const [, , argVentas, argCartola, argSalida] = process.argv;

const rutaVentas = argVentas || path.join(raiz, 'datos-sucios/ventas-sistema.csv');
const rutaCartola = argCartola || path.join(raiz, 'datos-sucios/cartola-banco.csv');
const dirSalida = argSalida || path.join(raiz, 'salidas');

const ventas = leerTabla(rutaVentas);
const cartola = leerTabla(rutaCartola);
const r = conciliar(ventas, cartola, { ventanaDias: 3 });

escribirCSV(
  path.join(dirSalida, 'conciliados.csv'),
  r.conciliados.map((c) => ({
    fecha_venta: fechaISO(c.venta.fecha),
    monto: c.venta.monto,
    fecha_abono: fechaISO(c.abono.fecha),
    dias_de_demora: c.diferenciaDias,
    detalle_abono: c.abono.detalle,
  })),
  ['fecha_venta', 'monto', 'fecha_abono', 'dias_de_demora', 'detalle_abono'],
);

escribirCSV(
  path.join(dirSalida, 'ventas-sin-abono.csv'),
  r.ventasSinAbono.map((v) => ({ fecha: fechaISO(v.fecha), monto: v.monto, detalle: v.detalle })),
  ['fecha', 'monto', 'detalle'],
);

escribirCSV(
  path.join(dirSalida, 'abonos-sin-venta.csv'),
  r.abonosSinVenta.map((a) => ({ fecha: fechaISO(a.fecha), monto: a.monto, detalle: a.detalle })),
  ['fecha', 'monto', 'detalle'],
);

const linea = (t) => console.log(t);
linea('');
linea('CONCILIACIÓN CAJA vs BANCO');
linea('='.repeat(48));
linea(`Ventas del sistema : ${r.resumen.cantidadVentas}  (${formatearMonto(r.resumen.totalVentas)})`);
linea(`Abonos del banco   : ${r.resumen.cantidadAbonos}  (${formatearMonto(r.resumen.totalAbonos)})`);
linea(`Conciliados        : ${r.resumen.cantidadConciliados}  (${formatearMonto(r.resumen.montoConciliado)})`);
linea('');
linea(`Ventas SIN abono   : ${r.ventasSinAbono.length}  (${formatearMonto(r.resumen.montoVentasSinAbono)})`);
linea(`Abonos SIN venta   : ${r.abonosSinVenta.length}  (${formatearMonto(r.resumen.montoAbonosSinVenta)})`);
linea(`Diferencia de caja : ${formatearMonto(r.resumen.diferenciaCaja)}`);
linea('');
if (r.avisos.length) {
  linea('AVISOS SOBRE LOS DATOS');
  for (const a of r.avisos) linea(`  - ${a.mensaje}`);
  linea('');
}
linea(`Archivos escritos en ${path.relative(process.cwd(), dirSalida) || '.'}:`);
linea('  conciliados.csv, ventas-sin-abono.csv, abonos-sin-venta.csv');

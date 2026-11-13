#!/usr/bin/env node
// Gestor de recordatorios de cobro y cuentas corrientes.
// Uso: node cobranzas/cli.js [cuentas.csv] [carpeta-salida]
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { leerTabla, escribirCSV } from '../core/io.node.js';
import { analizarCobranzas } from '../core/cobranzas.js';
import { fechaISO, formatearMonto } from '../core/formato.js';

const raiz = path.join(path.dirname(fileURLToPath(import.meta.url)), '..');
const [, , argEntrada, argSalida] = process.argv;

const rutaEntrada = argEntrada || path.join(raiz, 'datos-sucios/cuentas-corrientes.csv');
const dirSalida = argSalida || path.join(raiz, 'salidas');

const filas = leerTabla(rutaEntrada);
const r = analizarCobranzas(filas, { diasAviso: 7 });

// CSV enriquecido con el mensaje listo para enviar por cliente
const salida = [];
for (const c of r.clientes) {
  for (const f of c.facturas) {
    salida.push({
      cliente: c.cliente,
      telefono: c.telefono || '',
      factura: f.factura,
      monto: f.monto,
      fecha_vencimiento: fechaISO(f.vencimiento),
      estado: c.estado,
      dias: c.dias,
      total_cliente: c.total,
      mensaje: c.mensaje,
    });
  }
}
escribirCSV(
  path.join(dirSalida, 'cobranzas.csv'),
  salida,
  ['cliente', 'telefono', 'factura', 'monto', 'fecha_vencimiento', 'estado', 'dias', 'total_cliente', 'mensaje'],
);

console.log('');
console.log('GESTOR DE COBRANZAS');
console.log('='.repeat(48));
console.log(`Facturas leídas : ${r.resumen.total}`);
console.log(`Clientes        : ${r.resumen.clientes}`);
console.log(`Total adeudado  : ${formatearMonto(r.resumen.totalAdeudado)}`);
console.log(`Vencidas        : ${r.resumen.vencidas}`);
console.log(`Por vencer (7d) : ${r.resumen.porVencer}`);
console.log(`Al día          : ${r.resumen.alDia}`);
if (r.avisos.length) {
  console.log('');
  console.log('AVISOS');
  for (const a of r.avisos) console.log(`  - ${a.mensaje}`);
}
console.log('');
console.log(`Archivo: ${path.relative(process.cwd(), dirSalida) || '.'}/cobranzas.csv (con mensaje listo para enviar)`);
console.log('');
for (const c of r.clientes.filter((x) => x.estado !== 'al_dia').slice(0, 3)) {
  console.log(`--- ${c.cliente} (${c.etiqueta}) ---`);
  console.log(c.mensaje.split('\n').slice(0, 6).join('\n'));
  console.log('...');
}

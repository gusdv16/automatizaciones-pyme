#!/usr/bin/env node
// Generador de órdenes de compra por stock mínimo.
// Uso: node stock/cli.js [inventario.csv] [carpeta-salida]
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { leerTabla, escribirCSV, escribirXLSX } from '../core/io.node.js';
import { analizarStock } from '../core/stock.js';
import { generarPDFStock } from '../core/pdf-stock.js';

const raiz = path.join(path.dirname(fileURLToPath(import.meta.url)), '..');
const [, , argEntrada, argSalida] = process.argv;

const rutaEntrada = argEntrada || path.join(raiz, 'datos-sucios/inventario-stock.csv');
const dirSalida = argSalida || path.join(raiz, 'salidas');

const filas = leerTabla(rutaEntrada);
const r = analizarStock(filas);

// CSV plano con todos los faltantes
escribirCSV(
  path.join(dirSalida, 'ordenes-compra.csv'),
  r.faltantes.map((f) => ({
    proveedor: f.proveedor,
    codigo: f.codigo,
    nombre: f.nombre,
    stock_actual: f.stockActual,
    stock_minimo: f.stockMinimo,
    cantidad_a_pedir: f.aPedir,
    costo_unitario: f.costo,
    subtotal: +(f.aPedir * f.costo).toFixed(2),
  })),
  ['proveedor', 'codigo', 'nombre', 'stock_actual', 'stock_minimo', 'cantidad_a_pedir', 'costo_unitario', 'subtotal'],
);

// PDF agrupado por proveedor
const doc = await generarPDFStock(r.grupos);
const bytes = await doc.save();
fs.mkdirSync(dirSalida, { recursive: true });
fs.writeFileSync(path.join(dirSalida, 'ordenes-compra.pdf'), bytes);

console.log('');
console.log('ÓRDENES DE COMPRA POR STOCK MÍNIMO');
console.log('='.repeat(48));
console.log(`Productos leídos     : ${r.resumen.total}`);
console.log(`Productos a reponer  : ${r.resumen.faltantes}`);
console.log(`Proveedores          : ${r.resumen.grupos}`);
console.log(`Unidades a pedir     : ${r.resumen.unidadesAPedir}`);
console.log(`Costo estimado       : $ ${r.resumen.costoEstimado.toLocaleString('es-UY')}`);
if (r.avisos.length) {
  console.log('');
  console.log('AVISOS');
  for (const a of r.avisos) console.log(`  - ${a.mensaje}`);
}
console.log('');
console.log(`Archivos: ${path.relative(process.cwd(), dirSalida) || '.'}/ordenes-compra.csv, ordenes-compra.pdf`);

#!/usr/bin/env node
// Generador de etiquetas con código de barras.
// Uso: node etiquetas/cli.js [inventario.csv] [salida/etiquetas.pdf]
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { leerTabla } from '../core/io.node.js';
import { prepararEtiquetas } from '../core/etiquetas.js';
import { generarPDFEtiquetas } from '../core/pdf-etiquetas.js';
import { renderBarcode } from './barcode.node.js';

const raiz = path.join(path.dirname(fileURLToPath(import.meta.url)), '..');
const [, , argEntrada, argSalida] = process.argv;

const rutaEntrada = argEntrada || path.join(raiz, 'datos-sucios/inventario.csv');
const rutaSalida = argSalida || path.join(raiz, 'salidas/etiquetas.pdf');

const items = leerTabla(rutaEntrada);
const etiquetas = prepararEtiquetas(items, { columnas: 3, filas: 8 });
const doc = await generarPDFEtiquetas(etiquetas, renderBarcode);
const bytes = await doc.save();

fs.mkdirSync(path.dirname(rutaSalida), { recursive: true });
fs.writeFileSync(rutaSalida, bytes);

console.log('');
console.log('ETIQUETAS GENERADAS');
console.log('='.repeat(48));
console.log(`Productos en el inventario : ${items.length}`);
console.log(`Etiquetas generadas        : ${etiquetas.total}`);
console.log(`Páginas (${etiquetas.columnas} x ${etiquetas.filas} por hoja)     : ${etiquetas.paginas.length}`);
if (etiquetas.avisos.length) {
  console.log('');
  console.log('AVISOS (productos salteados)');
  for (const a of etiquetas.avisos) console.log(`  - ${a.mensaje}`);
}
console.log('');
console.log(`PDF: ${path.relative(process.cwd(), rutaSalida) || rutaSalida}`);

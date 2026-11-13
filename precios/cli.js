#!/usr/bin/env node
// Validador de listas de precios de proveedores.
// Uso: node precios/cli.js [lista-proveedor.xlsx] [carpeta-salida]
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { leerTabla, escribirXLSX } from '../core/io.node.js';
import { validarPrecios } from '../core/precios.js';

const raiz = path.join(path.dirname(fileURLToPath(import.meta.url)), '..');
const [, , argEntrada, argSalida] = process.argv;

const rutaEntrada = argEntrada || path.join(raiz, 'datos-sucios/lista-proveedor.xlsx');
const dirSalida = argSalida || path.join(raiz, 'salidas');

const filas = leerTabla(rutaEntrada);
const { limpias, errores, resumen } = validarPrecios(filas);

const rutaLimpia = path.join(dirSalida, 'precios-limpios.xlsx');
escribirXLSX(rutaLimpia, [
  {
    nombre: 'Limpia',
    filas: limpias.map((p) => ({ Codigo: p.codigo, Nombre: p.nombre, Categoria: p.categoria, Precio: p.precio })),
    encabezado: ['Codigo', 'Nombre', 'Categoria', 'Precio'],
  },
  {
    nombre: 'Errores',
    filas: errores.map((e) => ({
      Fila: e.fila,
      Codigo: e.codigo,
      Nombre: e.nombre,
      Categoria: e.categoria,
      Precio: e.precio,
      Motivo: e.motivos.join(' | '),
    })),
    encabezado: ['Fila', 'Codigo', 'Nombre', 'Categoria', 'Precio', 'Motivo'],
  },
]);

console.log('');
console.log('VALIDACIÓN DE LISTA DE PRECIOS');
console.log('='.repeat(48));
console.log(`Filas leídas        : ${resumen.total}`);
console.log(`Filas limpias       : ${resumen.limpias}`);
console.log(`Filas con errores   : ${resumen.conErrores}`);
if (errores.length) {
  console.log('');
  console.log('ERRORES ENCONTRADOS');
  for (const e of errores) {
    console.log(`  Fila ${e.fila}: ${e.nombre || '(sin nombre)'} [${e.codigo || 'sin código'}]`);
    for (const m of e.motivos) console.log(`      - ${m}`);
  }
}
console.log('');
console.log(`Planilla limpia     : ${path.relative(process.cwd(), rutaLimpia) || rutaLimpia} (hoja "Limpia" + hoja "Errores")`);

#!/usr/bin/env node
// Lector y validador de Comprobantes Fiscales Electrónicos (CFE - DGI Uruguay).
// Uso: node comprobantes/cli.js [carpeta-o-xmls...] [--rut 214844360018] [--tc 42] [--salida carpeta]
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { escribirXLSX } from '../core/io.node.js';
import { validarComprobantes, formatearRutUY } from '../core/comprobantes.js';
import { formatearMonto } from '../core/formato.js';

const raiz = path.join(path.dirname(fileURLToPath(import.meta.url)), '..');
const args = process.argv.slice(2);
let miRut = '214844360018';
let tcUsd = 42;
let dirSalida = path.join(raiz, 'salidas');
const entradas = [];

for (let i = 0; i < args.length; i++) {
  const a = args[i];
  if (a === '--rut') miRut = args[++i] || '';
  else if (a === '--tc') tcUsd = Number(args[++i]) || 42;
  else if (a === '--salida') dirSalida = args[++i] || dirSalida;
  else entradas.push(a);
}

if (!entradas.length) {
  entradas.push(path.join(raiz, 'datos-sucios', 'cfe-uruguay'));
}

const archivosXml = [];
for (const e of entradas) {
  const stat = fs.statSync(e);
  if (stat.isDirectory()) {
    for (const f of fs.readdirSync(e).sort()) {
      if (f.toLowerCase().endsWith('.xml')) {
        archivosXml.push({ nombre: f, contenido: fs.readFileSync(path.join(e, f), 'utf8') });
      }
    }
  } else {
    archivosXml.push({ nombre: path.basename(e), contenido: fs.readFileSync(e, 'utf8') });
  }
}

const r = validarComprobantes(archivosXml, { miRut, tipoCambioUsd: tcUsd });

const rutaXlsx = path.join(dirSalida, 'libro-compras.xlsx');
escribirXLSX(rutaXlsx, [
  {
    nombre: 'Compras',
    filas: r.compras.map((c) => ({
      Fecha: c.fecha,
      Tipo: c.tipoNombre,
      Comprobante: c.comprobante,
      RUT_Emisor: formatearRutUY(c.rucEmisor),
      Proveedor: c.razonSocial,
      Moneda: c.moneda,
      TC: c.tipoCambio,
      Neto_22: c.neto22,
      IVA_22: c.iva22,
      Neto_10: c.neto10,
      IVA_10: c.iva10,
      Exento: c.exento,
      Total: c.total,
      Total_UYU: c.totalUYU,
    })),
    encabezado: ['Fecha', 'Tipo', 'Comprobante', 'RUT_Emisor', 'Proveedor', 'Moneda', 'TC', 'Neto_22', 'IVA_22', 'Neto_10', 'IVA_10', 'Exento', 'Total', 'Total_UYU'],
  },
  {
    nombre: 'Observaciones',
    filas: r.observaciones.map((o) => ({
      Archivo: o.archivo,
      Fecha: o.fecha,
      Tipo: o.tipoNombre,
      Comprobante: o.comprobante,
      RUT_Emisor: formatearRutUY(o.rucEmisor),
      Proveedor: o.razonSocial,
      Total: o.total,
      Motivo: o.motivos.join(' | '),
    })),
    encabezado: ['Archivo', 'Fecha', 'Tipo', 'Comprobante', 'RUT_Emisor', 'Proveedor', 'Total', 'Motivo'],
  },
]);

console.log('');
console.log('COMPROBANTES FISCALES ELECTRÓNICOS (CFE - URUGUAY)');
console.log('='.repeat(54));
console.log(`RUT receptor esperado : ${miRut ? formatearRutUY(miRut) : '(sin filtrar)'}`);
console.log(`Archivos XML leídos   : ${r.resumen.archivosLeidos}`);
console.log(`Válidos (Compras)     : ${r.resumen.comprobantesValidos} (incluye ${r.resumen.notasCredito} NC)`);
console.log(`Con observaciones     : ${r.resumen.conObservaciones}`);
console.log('');
console.log(`Neto 22% (UYU)        : ${formatearMonto(r.resumen.neto22UYU)}`);
console.log(`IVA 22%  (UYU)        : ${formatearMonto(r.resumen.iva22UYU)}`);
console.log(`Neto 10% (UYU)        : ${formatearMonto(r.resumen.neto10UYU)}`);
console.log(`IVA 10%  (UYU)        : ${formatearMonto(r.resumen.iva10UYU)}`);
console.log(`Exento   (UYU)        : ${formatearMonto(r.resumen.exentoUYU)}`);
console.log(`Total    (UYU)        : ${formatearMonto(r.resumen.totalUYU)}`);
if (r.observaciones.length) {
  console.log('');
  console.log('OBSERVACIONES (NO CARGAR SIN REVISAR)');
  for (const o of r.observaciones) {
    console.log(`  - ${o.archivo} (${o.tipoNombre} ${o.comprobante}):`);
    for (const m of o.motivos) console.log(`      * ${m}`);
  }
}
console.log('');
console.log(`Excel generado: ${path.relative(process.cwd(), rutaXlsx) || rutaXlsx} (hojas "Compras" + "Observaciones")`);

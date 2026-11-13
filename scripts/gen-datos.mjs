// Convierte las muestras "sucias" en CSV al Excel (.xlsx) que en la vida real manda un proveedor.
// Uso: node scripts/gen-datos.mjs
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import * as XLSX from 'xlsx';

const dir = path.join(path.dirname(fileURLToPath(import.meta.url)), '..', 'datos-sucios');

function csvAXlsx(nombreCsv, nombreXlsx, hoja) {
  const texto = fs.readFileSync(path.join(dir, nombreCsv), 'utf8');
  const libro = XLSX.read(texto, { type: 'string', raw: true });
  const datos = XLSX.utils.sheet_to_json(libro.Sheets[libro.SheetNames[0]], { header: 1, raw: true, defval: '' });
  const salida = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(salida, XLSX.utils.aoa_to_sheet(datos), hoja);
  const buf = XLSX.write(salida, { type: 'buffer', bookType: 'xlsx' });
  fs.writeFileSync(path.join(dir, nombreXlsx), buf);
  console.log(`Generado ${nombreXlsx} (${datos.length - 1} filas de datos)`);
}

csvAXlsx('lista-proveedor.csv', 'lista-proveedor.xlsx', 'Lista de precios');

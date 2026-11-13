// Entrada/salida de archivos para los CLI (solo Node).
// El navegador tiene su propia versión de esta capa; la lógica de negocio es la misma (core/).
import fs from 'node:fs';
import path from 'node:path';
import Papa from 'papaparse';
import * as XLSX from 'xlsx';

export function leerTabla(ruta) {
  const ext = path.extname(ruta).toLowerCase();
  const buf = fs.readFileSync(ruta);
  if (ext === '.xlsx' || ext === '.xls') {
    const libro = XLSX.read(buf, { type: 'buffer' });
    const hoja = libro.Sheets[libro.SheetNames[0]];
    return XLSX.utils.sheet_to_json(hoja, { defval: '', raw: true });
  }
  const texto = buf.toString('utf8').replace(/^\uFEFF/, '');
  const { data } = Papa.parse(texto.trim(), { header: true, skipEmptyLines: true });
  return data;
}

export function escribirCSV(ruta, filas, columnas) {
  const csv = Papa.unparse(filas, columnas ? { columns: columnas } : undefined);
  fs.mkdirSync(path.dirname(ruta), { recursive: true });
  fs.writeFileSync(ruta, csv + '\n', 'utf8');
}

export function escribirXLSX(ruta, hojas) {
  const libro = XLSX.utils.book_new();
  for (const { nombre, filas, encabezado } of hojas) {
    const hoja = XLSX.utils.json_to_sheet(filas, encabezado ? { header: encabezado } : undefined);
    XLSX.utils.book_append_sheet(libro, hoja, nombre.slice(0, 31));
  }
  fs.mkdirSync(path.dirname(ruta), { recursive: true });
  const buf = XLSX.write(libro, { type: 'buffer', bookType: 'xlsx' });
  fs.writeFileSync(ruta, buf);
}

import Papa from 'papaparse';
import * as XLSX from 'xlsx';

// Lee un archivo subido por el usuario (CSV o Excel) y devuelve filas como objetos.
export async function leerArchivo(file) {
  const nombre = file.name.toLowerCase();
  if (nombre.endsWith('.xlsx') || nombre.endsWith('.xls')) {
    const buf = await file.arrayBuffer();
    const libro = XLSX.read(buf, { type: 'array' });
    const hoja = libro.Sheets[libro.SheetNames[0]];
    return XLSX.utils.sheet_to_json(hoja, { defval: '', raw: true });
  }
  const texto = await file.text();
  const { data } = Papa.parse(texto.replace(/^\uFEFF/, '').trim(), { header: true, skipEmptyLines: true });
  return data;
}

// Carga una muestra de ejemplo desde /datos/.
export async function leerEjemplo(url) {
  const res = await fetch(url);
  const blob = await res.blob();
  return leerArchivo(new File([blob], url.split('/').pop()));
}

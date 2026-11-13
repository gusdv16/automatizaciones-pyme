import Papa from 'papaparse';
import * as XLSX from 'xlsx';

export function descargar(nombre, datos, tipo = 'application/octet-stream') {
  const blob = datos instanceof Blob ? datos : new Blob([datos], { type: tipo });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = nombre;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}

export function descargarCSV(nombre, filas, columnas) {
  const csv = Papa.unparse(filas, columnas ? { columns: columnas } : undefined);
  descargar(nombre, csv, 'text/csv;charset=utf-8');
}

export function descargarXLSX(nombre, hojas) {
  const libro = XLSX.utils.book_new();
  for (const { nombre: n, filas, encabezado } of hojas) {
    const hoja = XLSX.utils.json_to_sheet(filas, encabezado ? { header: encabezado } : undefined);
    XLSX.utils.book_append_sheet(libro, hoja, n.slice(0, 31));
  }
  const buf = XLSX.write(libro, { type: 'array', bookType: 'xlsx' });
  descargar(nombre, buf, 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
}

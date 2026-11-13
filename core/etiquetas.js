// Generador de etiquetas de góndola.
// Toma el inventario y arma la grilla de etiquetas (nombre, precio y código de barras Code 128)
// lista para imprimir. Acá va solo la preparación y validación; el PDF se arma aparte porque
// la generación del código de barras cambia entre Node y el navegador.
import { normalizarMonto, normalizarTexto } from './formato.js';

export function prepararEtiquetas(items, { columnas = 3, filas = 8 } = {}) {
  const avisos = [];
  const validas = [];

  items.forEach((it, i) => {
    const fila = i + 2;
    const codigo = normalizarTexto(it.codigo);
    const nombre = normalizarTexto(it.nombre);
    const precio = normalizarMonto(it.precio);
    const problemas = [];
    if (!codigo) problemas.push('sin código de barras');
    if (!nombre) problemas.push('sin nombre');
    if (!Number.isFinite(precio) || precio <= 0) problemas.push('precio inválido o en cero');

    if (problemas.length) {
      avisos.push({
        fila,
        codigo,
        nombre,
        mensaje: `Fila ${fila}: ${problemas.join(', ')}. No se genera etiqueta.`,
      });
    } else {
      validas.push({ codigo, nombre, precio });
    }
  });

  const porPagina = columnas * filas;
  const paginas = [];
  for (let i = 0; i < validas.length; i += porPagina) {
    paginas.push(validas.slice(i, i + porPagina));
  }

  return { paginas, avisos, total: validas.length, porPagina, columnas, filas };
}

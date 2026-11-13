// Generador de órdenes de compra por stock mínimo.
// Lee el inventario (stock actual, stock mínimo, proveedor, costo) y arma las órdenes de reposición
// agrupadas por proveedor, con la cantidad a pedir y el costo estimado.
import { normalizarMonto, normalizarTexto } from './formato.js';

export function analizarStock(filas, { stockMinimoDefault = null } = {}) {
  const avisos = [];
  const faltantes = [];
  const vistos = new Set();

  filas.forEach((f, i) => {
    const fila = i + 2;
    const codigo = normalizarTexto(f.codigo);
    const nombre = normalizarTexto(f.nombre);
    const stockActual = normalizarMonto(f.stock_actual ?? f.stock);
    const stockMinimoRaw = normalizarMonto(f.stock_minimo ?? f.minimo);
    const proveedor = normalizarTexto(f.proveedor) || 'Sin proveedor asignado';
    const costo = normalizarMonto(f.precio_costo ?? f.costo);

    const problemas = [];
    if (!codigo) problemas.push('sin código');
    if (!nombre) problemas.push('sin nombre');
    if (!Number.isFinite(stockActual)) problemas.push('stock actual inválido');
    let stockMinimo = stockMinimoRaw;
    if (!Number.isFinite(stockMinimo)) {
      if (stockMinimoDefault != null && Number.isFinite(stockMinimoDefault)) {
        stockMinimo = stockMinimoDefault;
      } else {
        problemas.push('stock mínimo inválido');
      }
    }

    if (codigo && vistos.has(codigo)) {
      avisos.push({ tipo: 'duplicado', mensaje: `Fila ${fila}: código repetido (${codigo}). Se ignora la segunda aparición.` });
    } else if (codigo) {
      vistos.add(codigo);
    }

    if (problemas.length) {
      avisos.push({ tipo: 'dato', mensaje: `Fila ${fila}: ${problemas.join(', ')}. No se incluye en la orden.` });
      return;
    }

    if (stockActual < stockMinimo) {
      faltantes.push({
        codigo,
        nombre,
        stockActual,
        stockMinimo,
        aPedir: stockMinimo - stockActual,
        proveedor,
        costo: Number.isFinite(costo) ? costo : 0,
      });
    }
  });

  const gruposMap = new Map();
  for (const it of faltantes) {
    if (!gruposMap.has(it.proveedor)) gruposMap.set(it.proveedor, []);
    gruposMap.get(it.proveedor).push(it);
  }

  const grupos = [...gruposMap.entries()]
    .map(([proveedor, items]) => ({
      proveedor,
      items,
      totalItems: items.length,
      totalUnidades: items.reduce((s, x) => s + x.aPedir, 0),
      totalCosto: +items.reduce((s, x) => s + x.aPedir * x.costo, 0).toFixed(2),
    }))
    .sort((a, b) => a.proveedor.localeCompare(b.proveedor, 'es'));

  const resumen = {
    total: filas.length,
    faltantes: faltantes.length,
    ok: filas.length - faltantes.length - avisos.filter((a) => a.tipo === 'dato').length,
    grupos: grupos.length,
    unidadesAPedir: faltantes.reduce((s, x) => s + x.aPedir, 0),
    costoEstimado: +faltantes.reduce((s, x) => s + x.aPedir * x.costo, 0).toFixed(2),
  };

  return { grupos, faltantes, avisos, resumen };
}

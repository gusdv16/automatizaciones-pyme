// Validador de listas de precios de proveedores.
// Los proveedores mandan Excel "sucios": filas repetidas, precios en cero, categorías mal escritas.
// Si eso entra al sistema, rompe las ventas. Acá se separa lo limpio de lo que hay que corregir,
// explicando el motivo en lenguaje humano.
import { normalizarMonto, normalizarTexto, clave, distancia } from './formato.js';

export const CATEGORIAS = ['Bebidas', 'Almacén', 'Limpieza', 'Perfumería', 'Congelados', 'Lácteos'];

function categoriaMasCercana(texto, categorias) {
  let mejor = null;
  for (const c of categorias) {
    const d = distancia(texto, c);
    const umbral = Math.max(2, Math.ceil(c.length * 0.34));
    if (d <= umbral && (!mejor || d < mejor.d)) mejor = { nombre: c, d };
  }
  return mejor;
}

export function validarPrecios(filas, { categorias = CATEGORIAS, precioMin = 0.01 } = {}) {
  const limpias = [];
  const errores = [];
  const vistos = new Map();

  filas.forEach((f, i) => {
    const fila = i + 2; // +2: una por el encabezado, una porque las filas humanas arrancan en 1
    const codigo = normalizarTexto(f.codigo);
    const nombre = normalizarTexto(f.nombre);
    const categoria = normalizarTexto(f.categoria);
    const precio = normalizarMonto(f.precio);
    const motivos = [];

    if (!codigo) motivos.push('Falta el código del producto');
    else if (vistos.has(codigo)) motivos.push(`Código repetido (ya aparece en la fila ${vistos.get(codigo)})`);
    else vistos.set(codigo, fila);

    if (!nombre) motivos.push('Falta el nombre del producto');

    if (!Number.isFinite(precio)) motivos.push(`Precio no numérico ("${normalizarTexto(f.precio)}")`);
    else if (precio <= 0) motivos.push(`Precio en cero o negativo (${precio})`);
    else if (precio < precioMin) motivos.push(`Precio sospechosamente bajo (${precio})`);

    let categoriaOk = null;
    if (!categoria) {
      motivos.push('Falta la categoría');
    } else {
      categoriaOk = categorias.find((c) => clave(c) === clave(categoria)) || null;
      if (!categoriaOk) {
        const cerca = categoriaMasCercana(categoria, categorias);
        motivos.push(
          cerca
            ? `Categoría desconocida ("${categoria}"). ¿Quisiste decir "${cerca.nombre}"?`
            : `Categoría desconocida ("${categoria}")`,
        );
      }
    }

    if (motivos.length) {
      errores.push({
        fila,
        codigo,
        nombre,
        categoria,
        precio: Number.isFinite(precio) ? precio : '',
        motivos,
      });
    } else {
      limpias.push({ codigo, nombre, categoria: categoriaOk, precio });
    }
  });

  const resumen = {
    total: filas.length,
    limpias: limpias.length,
    conErrores: errores.length,
    descartadas: errores.length,
  };

  return { limpias, errores, resumen };
}

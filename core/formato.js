// Helpers compartidos por las tres herramientas. Funcionan igual en Node y en el navegador.
// La idea central del repo: los datos que llegan de afuera vienen "sucios" y hay que normalizarlos
// antes de confiar en ellos.

// Convierte a número montos escritos de mil formas: 1234.56, "1.234,56", "$ 1.234,56", "1 234,56".
export function normalizarMonto(valor) {
  if (typeof valor === 'number') return Number.isFinite(valor) ? valor : NaN;
  if (valor == null) return NaN;
  let s = String(valor).trim();
  if (!s) return NaN;
  s = s.replace(/[^\d.,-]/g, ''); // fuera símbolos de moneda, espacios, letras
  if (!s || !/\d/.test(s)) return NaN;

  const tieneComa = s.includes(',');
  const tienePunto = s.includes('.');

  if (tieneComa && tienePunto) {
    // El separador decimal es el que aparece más a la derecha.
    if (s.lastIndexOf(',') > s.lastIndexOf('.')) {
      s = s.replace(/\./g, '').replace(',', '.'); // 1.234,56 -> 1234.56
    } else {
      s = s.replace(/,/g, ''); // 1,234.56 -> 1234.56
    }
  } else if (tieneComa) {
    const partes = s.split(',');
    if (partes.length === 2 && partes[1].length <= 2) s = s.replace(',', '.');
    else s = s.replace(/,/g, ''); // 1,234 -> 1234
  } else if (tienePunto) {
    // "1.234" es mil doscientos treinta y cuatro; "1.5" es uno y medio.
    if (/^-?\d{1,3}(\.\d{3})+$/.test(s)) s = s.replace(/\./g, '');
  }

  const n = Number(s);
  return Number.isFinite(n) ? n : NaN;
}

export function normalizarTexto(valor) {
  if (valor == null) return '';
  return String(valor).replace(/\s+/g, ' ').trim();
}

// Clave para comparar textos: sin mayúsculas ni acentos.
export function clave(valor) {
  return normalizarTexto(valor)
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '');
}

export function esFechaValida(fecha) {
  return fecha instanceof Date && !Number.isNaN(fecha.getTime());
}

export function fechaISO(fecha) {
  if (!esFechaValida(fecha)) return '';
  const y = fecha.getFullYear();
  const m = String(fecha.getMonth() + 1).padStart(2, '0');
  const d = String(fecha.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

// Formato de moneda uruguayo para mostrar en pantalla / PDF.
export function formatearMonto(n) {
  if (!Number.isFinite(n)) return '';
  const [entera, decimales] = Math.abs(n).toFixed(2).split('.');
  const conMiles = entera.replace(/\B(?=(\d{3})+(?!\d))/g, '.');
  return `${n < 0 ? '-' : ''}$ ${conMiles},${decimales}`;
}

// Distancia de Levenshtein: sirve para sugerir la categoría correcta ante un error de tipeo.
export function distancia(a, b) {
  a = clave(a);
  b = clave(b);
  const m = a.length;
  const n = b.length;
  if (!m) return n;
  if (!n) return m;
  let prev = Array.from({ length: n + 1 }, (_, i) => i);
  for (let i = 1; i <= m; i++) {
    const actual = [i];
    for (let j = 1; j <= n; j++) {
      const costo = a[i - 1] === b[j - 1] ? 0 : 1;
      actual[j] = Math.min(prev[j] + 1, actual[j - 1] + 1, prev[j - 1] + costo);
    }
    prev = actual;
  }
  return prev[n];
}

// Armado del PDF de etiquetas con pdf-lib (funciona igual en Node y en el navegador).
// El código de barras se inyecta como función `renderBarcode(texto) -> Uint8Array (PNG)`
// para poder usar bwip-js en Node y en el navegador sin duplicar esta lógica.
import { PDFDocument, StandardFonts, rgb } from 'pdf-lib';
import { formatearMonto } from './formato.js';

const A4 = [595.28, 841.89];
const MARGEN = 28;
const GAP = 8;

function envolver(texto, font, size, anchoMax) {
  const palabras = texto.split(' ');
  const lineas = [];
  let actual = '';
  for (const p of palabras) {
    const prueba = actual ? `${actual} ${p}` : p;
    if (font.widthOfTextAtSize(prueba, size) > anchoMax && actual) {
      lineas.push(actual);
      actual = p;
    } else {
      actual = prueba;
    }
  }
  if (actual) lineas.push(actual);
  return lineas;
}

export async function generarPDFEtiquetas({ paginas, columnas, filas }, renderBarcode, { titulo = 'Etiquetas de góndola' } = {}) {
  const doc = await PDFDocument.create();
  doc.setTitle(titulo);
  doc.setCreator('automatizaciones-pyme');
  const font = await doc.embedFont(StandardFonts.Helvetica);
  const fontBold = await doc.embedFont(StandardFonts.HelveticaBold);
  const [ancho, alto] = A4;
  const utilAncho = ancho - MARGEN * 2;
  const utilAlto = alto - MARGEN * 2;
  const celdaAncho = (utilAncho - GAP * (columnas - 1)) / columnas;
  const celdaAlto = (utilAlto - GAP * (filas - 1)) / filas;

  for (const pagina of paginas) {
    const page = doc.addPage(A4);
    for (let idx = 0; idx < pagina.length; idx++) {
      const col = idx % columnas;
      const fila = Math.floor(idx / columnas);
      const x = MARGEN + col * (celdaAncho + GAP);
      const yTop = alto - MARGEN - fila * (celdaAlto + GAP);
      const celda = pagina[idx];

      page.drawRectangle({
        x,
        y: yTop - celdaAlto,
        width: celdaAncho,
        height: celdaAlto,
        borderColor: rgb(0.78, 0.78, 0.78),
        borderWidth: 0.6,
      });

      const lineas = envolver(celda.nombre, fontBold, 8.5, celdaAncho - 10).slice(0, 2);
      let ty = yTop - 13;
      for (const l of lineas) {
        page.drawText(l, { x: x + 5, y: ty, size: 8.5, font: fontBold, color: rgb(0.1, 0.1, 0.12) });
        ty -= 9.5;
      }

      page.drawText(formatearMonto(celda.precio), { x: x + 5, y: ty - 2, size: 12, font: fontBold, color: rgb(0, 0, 0) });

      const png = await renderBarcode(celda.codigo);
      const img = await doc.embedPng(png);
      const bw = celdaAncho - 12;
      const bh = 32;
      page.drawImage(img, { x: x + 6, y: yTop - celdaAlto + 9, width: bw, height: bh });

      page.drawText(celda.codigo, { x: x + 6, y: yTop - celdaAlto + 3, size: 6.5, font, color: rgb(0.35, 0.35, 0.38) });
    }
  }

  return doc;
}

// PDF de órdenes de compra agrupadas por proveedor (pdf-lib, funciona en Node y navegador).
import { PDFDocument, StandardFonts, rgb } from 'pdf-lib';
import { formatearMonto } from './formato.js';

const A4 = [595.28, 841.89];
const MARGEN = 40;

export async function generarPDFStock(grupos, { titulo = 'Órdenes de compra' } = {}) {
  const doc = await PDFDocument.create();
  doc.setTitle(titulo);
  doc.setCreator('automatizaciones-pyme');
  const font = await doc.embedFont(StandardFonts.Helvetica);
  const fontBold = await doc.embedFont(StandardFonts.HelveticaBold);
  const [ancho, alto] = A4;

  let page = doc.addPage(A4);
  let y = alto - MARGEN;

  const texto = (t, x, size = 10, f = font, color = rgb(0.1, 0.1, 0.12)) => {
    page.drawText(String(t), { x, y, size, font: f, color });
  };
  const nuevaPagina = () => {
    page = doc.addPage(A4);
    y = alto - MARGEN;
  };

  texto(titulo, MARGEN, 16, fontBold);
  y -= 20;
  texto(`Generado: ${new Date().toLocaleDateString('es-UY')}`, MARGEN, 9, font, rgb(0.4, 0.4, 0.45));
  y -= 14;

  const totalItems = grupos.reduce((s, g) => s + g.totalItems, 0);
  const totalUnid = grupos.reduce((s, g) => s + g.totalUnidades, 0);
  const totalCosto = grupos.reduce((s, g) => s + g.totalCosto, 0);
  texto(
    `Proveedores: ${grupos.length}  |  Productos a reponer: ${totalItems}  |  Unidades: ${totalUnid}  |  Costo estimado: ${formatearMonto(totalCosto)}`,
    MARGEN,
    9,
    fontBold,
  );
  y -= 18;

  const cols = [MARGEN, MARGEN + 70, MARGEN + 210, MARGEN + 290, MARGEN + 340, MARGEN + 395, MARGEN + 460];

  for (const g of grupos) {
    if (y < 140) nuevaPagina();
    texto(g.proveedor, MARGEN, 12, fontBold, rgb(0.15, 0.35, 0.75));
    y -= 16;
    ['Código', 'Producto', 'Stock', 'Mínimo', 'Pedir', 'Costo', 'Subtotal'].forEach((h, i) => {
      texto(h, cols[i], 8, fontBold, rgb(0.4, 0.4, 0.45));
    });
    y -= 10;
    page.drawLine({ start: { x: MARGEN, y }, end: { x: ancho - MARGEN, y }, thickness: 0.5, color: rgb(0.75, 0.75, 0.78) });
    y -= 6;

    for (const it of g.items) {
      if (y < 50) nuevaPagina();
      texto(String(it.codigo).slice(0, 12), cols[0], 8);
      texto(it.nombre.slice(0, 24), cols[1], 8);
      texto(String(it.stockActual), cols[2], 8);
      texto(String(it.stockMinimo), cols[3], 8);
      texto(String(it.aPedir), cols[4], 8, fontBold);
      texto(formatearMonto(it.costo), cols[5], 8);
      texto(formatearMonto(it.aPedir * it.costo), cols[6], 8);
      y -= 12;
    }
    texto(`Subtotal ${g.proveedor}: ${g.totalUnidades} u. — ${formatearMonto(g.totalCosto)}`, MARGEN, 9, fontBold);
    y -= 16;
  }

  return doc;
}

// Genera un código de barras Code 128 en el navegador (bwip-js -> PNG en memoria).
// Misma firma que la versión de Node (etiquetas/barcode.node.js).
export async function renderBarcode(texto) {
  const mod = await import('bwip-js/browser');
  const bwipjs = mod.default ?? mod;
  const canvas = document.createElement('canvas');
  bwipjs.toCanvas(canvas, {
    bcid: 'code128',
    text: String(texto),
    scale: 3,
    height: 12,
    includetext: false,
    paddingwidth: 2,
    paddingheight: 2,
    backgroundcolor: 'FFFFFF',
  });
  const blob = await new Promise((r) => canvas.toBlob(r, 'image/png'));
  return new Uint8Array(await blob.arrayBuffer());
}

// Versión para previsualizar en el DOM (devuelve un canvas listo para insertar).
export async function barcodeCanvas(texto) {
  const mod = await import('bwip-js/browser');
  const bwipjs = mod.default ?? mod;
  const canvas = document.createElement('canvas');
  bwipjs.toCanvas(canvas, {
    bcid: 'code128',
    text: String(texto),
    scale: 2,
    height: 10,
    includetext: false,
    paddingwidth: 2,
    paddingheight: 2,
    backgroundcolor: 'FFFFFF',
  });
  canvas.className = 'barcode';
  return canvas;
}

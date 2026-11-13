// Generación de códigos de barras Code 128 en Node (bwip-js -> PNG en memoria).
export async function renderBarcode(texto) {
  const mod = await import('bwip-js/node');
  const bwipjs = mod.default ?? mod;
  const png = await bwipjs.toBuffer({
    bcid: 'code128',
    text: String(texto),
    scale: 3,
    height: 12,
    includetext: false,
    paddingwidth: 2,
    paddingheight: 2,
    backgroundcolor: 'FFFFFF',
  });
  return new Uint8Array(png);
}

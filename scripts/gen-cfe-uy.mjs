// Genera el lote de ejemplo de 10 XML CFE (DGI Uruguay) con casos reales y errores típicos.
// Uso: node scripts/gen-cfe-uy.mjs
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const dir = path.join(path.dirname(fileURLToPath(import.meta.url)), '..', 'datos-sucios', 'cfe-uruguay');
fs.mkdirSync(dir, { recursive: true });

const MI_RUT = '214844360018';
const MI_RAZON = 'COMERCIAL DEL PLATA S.A.';

function armarXml({
  envuelto = true,
  tipoCFE,
  serie,
  nro,
  fecha,
  fmaPago = 1,
  rucEmisor,
  razonEmisor,
  receptor = { tipo: 2, doc: MI_RUT, razon: MI_RAZON },
  moneda = 'UYU',
  tipoCambio,
  mntNoGrv = 0,
  mntNetoMin = 0,
  ivaMin = 0,
  mntNetoBasica = 0,
  ivaBasica = 0,
  mntTotal,
}) {
  const rama = [101, 102, 103].includes(tipoCFE) ? 'eTck' : 'eFact';
  const recXml = receptor
    ? `
      <DGICFE:Receptor>
        <DGICFE:TipoDocRecep>${receptor.tipo}</DGICFE:TipoDocRecep>
        <DGICFE:CodPaisRecep>UY</DGICFE:CodPaisRecep>
        <DGICFE:DocRecep>${receptor.doc}</DGICFE:DocRecep>
        <DGICFE:RznSocRecep>${receptor.razon}</DGICFE:RznSocRecep>
      </DGICFE:Receptor>`
    : '';

  const totTags = [
    `<DGICFE:TpoMoneda>${moneda}</DGICFE:TpoMoneda>`,
    tipoCambio ? `<DGICFE:TpoCambio>${tipoCambio.toFixed(3)}</DGICFE:TpoCambio>` : '',
    mntNoGrv ? `<DGICFE:MntNoGrv>${mntNoGrv.toFixed(2)}</DGICFE:MntNoGrv>` : '',
    mntNetoMin ? `<DGICFE:MntNetoIvaTasaMin>${mntNetoMin.toFixed(2)}</DGICFE:MntNetoIvaTasaMin>` : '',
    mntNetoBasica ? `<DGICFE:MntNetoIVATasaBasica>${mntNetoBasica.toFixed(2)}</DGICFE:MntNetoIVATasaBasica>` : '',
    mntNetoMin ? `<DGICFE:IVATasaMin>10</DGICFE:IVATasaMin>` : '',
    mntNetoBasica ? `<DGICFE:IVATasaBasica>22</DGICFE:IVATasaBasica>` : '',
    ivaMin ? `<DGICFE:MntIVATasaMin>${ivaMin.toFixed(2)}</DGICFE:MntIVATasaMin>` : '',
    ivaBasica ? `<DGICFE:MntIVATasaBasica>${ivaBasica.toFixed(2)}</DGICFE:MntIVATasaBasica>` : '',
    `<DGICFE:MntTotal>${mntTotal.toFixed(2)}</DGICFE:MntTotal>`,
    `<DGICFE:CantLinDet>1</DGICFE:CantLinDet>`,
    `<DGICFE:MntPagar>${mntTotal.toFixed(2)}</DGICFE:MntPagar>`,
  ]
    .filter(Boolean)
    .join('\n        ');

  const cfe = `<DGICFE:CFE version="1.0" xmlns:DGICFE="http://cfe.dgi.gub.uy">
  <DGICFE:${rama}>
    <DGICFE:TmstFirma>${fecha}T10:30:00-03:00</DGICFE:TmstFirma>
    <DGICFE:Encabezado>
      <DGICFE:IdDoc>
        <DGICFE:TipoCFE>${tipoCFE}</DGICFE:TipoCFE>
        <DGICFE:Serie>${serie}</DGICFE:Serie>
        <DGICFE:Nro>${nro}</DGICFE:Nro>
        <DGICFE:FchEmis>${fecha}</DGICFE:FchEmis>
        <DGICFE:FmaPago>${fmaPago}</DGICFE:FmaPago>
      </DGICFE:IdDoc>
      <DGICFE:Emisor>
        <DGICFE:RUCEmisor>${rucEmisor}</DGICFE:RUCEmisor>
        <DGICFE:RznSoc>${razonEmisor}</DGICFE:RznSoc>
        <DGICFE:CdgDGISucur>1</DGICFE:CdgDGISucur>
        <DGICFE:DomFiscal>18 de Julio 1234</DGICFE:DomFiscal>
        <DGICFE:Ciudad>MONTEVIDEO</DGICFE:Ciudad>
        <DGICFE:Departamento>MONTEVIDEO</DGICFE:Departamento>
      </DGICFE:Emisor>${recXml}
      <DGICFE:Totales>
        ${totTags}
      </DGICFE:Totales>
    </DGICFE:Encabezado>
  </DGICFE:${rama}>
</DGICFE:CFE>`;

  if (!envuelto) return `<?xml version="1.0" encoding="UTF-8"?>\n${cfe}\n`;
  return `<?xml version="1.0" encoding="UTF-8"?>
<DGICFE:EnvioCFE version="1.0" xmlns:DGICFE="http://cfe.dgi.gub.uy">
  <DGICFE:Caratula version="1.0">
    <DGICFE:RutReceptor>${MI_RUT}</DGICFE:RutReceptor>
    <DGICFE:RUCEmisor>${rucEmisor}</DGICFE:RUCEmisor>
    <DGICFE:CantCFE>1</DGICFE:CantCFE>
  </DGICFE:Caratula>
  ${cfe}
</DGICFE:EnvioCFE>\n`;
}

const lote = [
  {
    archivo: '01-efactura-telecom.xml',
    xml: armarXml({
      tipoCFE: 111, serie: 'A', nro: 45120, fecha: '2026-11-02',
      rucEmisor: '211003420017', razonEmisor: 'TELECOMUNICACIONES DEL URUGUAY S.A.',
      mntNetoBasica: 2400, ivaBasica: 528, mntTotal: 2928,
    }),
  },
  {
    archivo: '02-efactura-mayorista-mixta.xml',
    xml: armarXml({
      tipoCFE: 111, serie: 'B', nro: 1842, fecha: '2026-11-04', fmaPago: 2,
      rucEmisor: '210303670010', razonEmisor: 'DISTRIBUIDORA ORIENTAL LTDA.',
      mntNoGrv: 1500, mntNetoMin: 8000, ivaMin: 800, mntNetoBasica: 12000, ivaBasica: 2640, mntTotal: 24940,
    }),
  },
  {
    archivo: '03-efactura-software-usd.xml',
    xml: armarXml({
      tipoCFE: 111, serie: 'A', nro: 903, fecha: '2026-11-05',
      rucEmisor: '215551110016', razonEmisor: 'NUBE SUR SOFTWARE S.R.L.',
      moneda: 'USD', tipoCambio: 41.85,
      mntNetoBasica: 150, ivaBasica: 33, mntTotal: 183,
    }),
  },
  {
    archivo: '04-nc-devolucion-mayorista.xml',
    xml: armarXml({
      tipoCFE: 112, serie: 'B', nro: 215, fecha: '2026-11-06',
      rucEmisor: '210303670010', razonEmisor: 'DISTRIBUIDORA ORIENTAL LTDA.',
      mntNetoBasica: 2000, ivaBasica: 440, mntTotal: 2440,
    }),
  },
  {
    archivo: '05-eticket-con-rut-papeleria.xml',
    xml: armarXml({
      envuelto: false,
      tipoCFE: 101, serie: 'A', nro: 77812, fecha: '2026-11-07',
      rucEmisor: '217772220015', razonEmisor: 'PAPELERIA CENTRO S.A.',
      mntNetoBasica: 1200, ivaBasica: 264, mntTotal: 1464,
    }),
  },
  {
    archivo: '06-eticket-consumidor-final.xml',
    xml: armarXml({
      envuelto: false,
      tipoCFE: 101, serie: 'C', nro: 3319, fecha: '2026-11-08',
      rucEmisor: '218883330011', razonEmisor: 'ESTACION DE SERVICIO RUTA 1',
      receptor: null,
      mntNetoBasica: 3000, ivaBasica: 660, mntTotal: 3660,
    }),
  },
  {
    archivo: '07-efactura-duplicada.xml',
    xml: armarXml({
      tipoCFE: 111, serie: 'A', nro: 45120, fecha: '2026-11-02',
      rucEmisor: '211003420017', razonEmisor: 'TELECOMUNICACIONES DEL URUGUAY S.A.',
      mntNetoBasica: 2400, ivaBasica: 528, mntTotal: 2928,
    }),
  },
  {
    archivo: '08-efactura-iva-mal-calculado.xml',
    xml: armarXml({
      tipoCFE: 111, serie: 'A', nro: 512, fecha: '2026-11-09',
      rucEmisor: '219994440018', razonEmisor: 'FLETE RAPIDO URUGUAY S.A.',
      mntNetoBasica: 5000, ivaBasica: 950, mntTotal: 5950,
    }),
  },
  {
    archivo: '09-efactura-rut-invalido.xml',
    xml: armarXml({
      tipoCFE: 111, serie: 'A', nro: 88, fecha: '2026-11-10',
      rucEmisor: '213335550019', razonEmisor: 'PROVEEDOR CON RUT ERRONEO',
      mntNetoBasica: 1000, ivaBasica: 220, mntTotal: 1220,
    }),
  },
  {
    archivo: '10-efactura-otro-rut.xml',
    xml: armarXml({
      tipoCFE: 111, serie: 'A', nro: 641, fecha: '2026-11-11',
      rucEmisor: '213335550015', razonEmisor: 'INSUMOS INDUSTRIALES S.A.',
      receptor: { tipo: 2, doc: '217772220015', razon: 'OTRA EMPRESA S.A.' },
      mntNetoBasica: 4500, ivaBasica: 990, mntTotal: 5490,
    }),
  },
];

for (const item of lote) {
  fs.writeFileSync(path.join(dir, item.archivo), item.xml, 'utf8');
}
fs.writeFileSync(
  path.join(dir, 'index.json'),
  JSON.stringify({ miRut: MI_RUT, razonSocial: MI_RAZON, archivos: lote.map((l) => l.archivo) }, null, 2) + '\n',
  'utf8',
);
console.log(`Generados ${lote.length} XML CFE en datos-sucios/cfe-uruguay/`);

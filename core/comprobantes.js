// Lector y validador de Comprobantes Fiscales Electrónicos (CFE) de DGI Uruguay.
// Funciona igual en Node y en el navegador, sin dependencias externas.
// Soporta XML oficiales de DGI (e-Factura, e-Ticket, Notas de Crédito/Débito, e-Resguardo),
// incluyendo sobres <EnvioCFE> con uno o varios <CFE> adentro.
import { normalizarTexto } from './formato.js';

const PESOS_RUT = [4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2];

export const TIPOS_CFE = {
  101: 'e-Ticket',
  102: 'NC e-Ticket',
  103: 'ND e-Ticket',
  111: 'e-Factura',
  112: 'NC e-Factura',
  113: 'ND e-Factura',
  121: 'e-Factura Exp.',
  122: 'NC e-Factura Exp.',
  123: 'ND e-Factura Exp.',
  131: 'e-Ticket Cta. Ajena',
  132: 'NC e-Ticket Cta. Ajena',
  133: 'ND e-Ticket Cta. Ajena',
  141: 'e-Factura Cta. Ajena',
  142: 'NC e-Factura Cta. Ajena',
  143: 'ND e-Factura Cta. Ajena',
  181: 'e-Remito',
  182: 'e-Resguardo',
};

const NOTAS_CREDITO = new Set([102, 112, 122, 132, 142, 152]);
const NOTAS_DEBITO = new Set([103, 113, 123, 133, 143, 153]);

export function limpiarRutUY(rut) {
  if (rut == null) return '';
  return String(rut).replace(/[.\-\s]/g, '').trim();
}

export function formatearRutUY(rut) {
  const s = limpiarRutUY(rut);
  if (!/^\d{12}$/.test(s)) return s || String(rut || '');
  return `${s.slice(0, 2)}-${s.slice(2, 8)}-${s.slice(8, 11)}-${s.slice(11)}`;
}

// Valida la estructura de 12 dígitos y el dígito verificador Módulo 11 de DGI Uruguay.
export function validarRutUY(rut) {
  const s = limpiarRutUY(rut);
  if (!s) return { valido: false, limpio: s, motivo: 'Falta el RUT' };
  if (!/^\d{12}$/.test(s)) {
    return { valido: false, limpio: s, motivo: `RUT debe tener 12 dígitos (tiene ${s.length})` };
  }
  const depto = Number(s.slice(0, 2));
  if (depto < 1 || depto > 21) {
    return { valido: false, limpio: s, motivo: `Prefijo de departamento inválido (${s.slice(0, 2)})` };
  }
  if (s.slice(2, 8) === '000000') {
    return { valido: false, limpio: s, motivo: 'Secuencia de RUT en ceros' };
  }
  let suma = 0;
  for (let i = 0; i < 11; i++) suma += Number(s[i]) * PESOS_RUT[i];
  const resto = 11 - (suma % 11);
  const dv = resto === 11 ? 0 : resto === 10 ? null : resto;
  if (dv === null || dv !== Number(s[11])) {
    return { valido: false, limpio: s, motivo: `Dígito verificador de RUT inválido (${formatearRutUY(s)})` };
  }
  return { valido: true, limpio: s };
}

function decodificarXml(texto) {
  return texto
    .replace(/<!\[CDATA\[([\s\S]*?)\]\]>/g, '$1')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&apos;/g, "'");
}

function extraerBloques(xml, nombreTag) {
  const re = new RegExp(`<(?:[\\w-]+:)?${nombreTag}(?:\\s[^>]*)?>([\\s\\S]*?)<\\/(?:[\\w-]+:)?${nombreTag}>`, 'g');
  const out = [];
  let m;
  while ((m = re.exec(xml)) !== null) out.push(m[1]);
  return out;
}

function primerBloque(xml, nombreTag) {
  const m = new RegExp(`<(?:[\\w-]+:)?${nombreTag}(?:\\s[^>]*)?>([\\s\\S]*?)<\\/(?:[\\w-]+:)?${nombreTag}>`).exec(xml);
  return m ? m[1] : '';
}

function valorTag(bloque, nombreTag) {
  if (!bloque) return '';
  const m = new RegExp(`<(?:[\\w-]+:)?${nombreTag}(?:\\s[^>]*)?>([\\s\\S]*?)<\\/(?:[\\w-]+:)?${nombreTag}>`).exec(bloque);
  return m ? normalizarTexto(decodificarXml(m[1])) : '';
}

function numTag(bloque, nombreTag) {
  const v = valorTag(bloque, nombreTag);
  if (!v) return 0;
  const n = Number(v.replace(',', '.'));
  return Number.isFinite(n) ? n : NaN;
}

export function parsearXmlCFE(contenido, nombreArchivo = 'comprobante.xml') {
  const limpio = String(contenido || '').replace(/<!--[\s\S]*?-->/g, '');
  let bloques = extraerBloques(limpio, 'CFE');
  if (!bloques.length) {
    // Puede venir directamente la rama <eFact>, <eTck>, <eResg>, etc.
    for (const rama of ['eFact', 'eTck', 'eFact_Exp', 'eResg', 'eRem', 'eBoleta']) {
      const encontrados = extraerBloques(limpio, rama);
      if (encontrados.length) {
        bloques = encontrados;
        break;
      }
    }
  }

  if (!bloques.length) {
    return [{
      archivo: nombreArchivo,
      invalidoXml: true,
      motivos: ['El archivo no tiene la estructura de un CFE de DGI (<CFE>, <eFact> o <eTck>).'],
    }];
  }

  return bloques.map((bloque, idx) => {
    const enc = primerBloque(bloque, 'Encabezado') || bloque;
    const idDoc = primerBloque(enc, 'IdDoc');
    const emisor = primerBloque(enc, 'Emisor');
    const receptor = primerBloque(enc, 'Receptor');
    const totales = primerBloque(enc, 'Totales');

    const tipoCFE = Number(valorTag(idDoc, 'TipoCFE'));
    const serie = valorTag(idDoc, 'Serie');
    const numero = valorTag(idDoc, 'Nro');
    const fecha = valorTag(idDoc, 'FchEmis');
    const fmaPago = valorTag(idDoc, 'FmaPago');

    const rucEmisor = limpiarRutUY(valorTag(emisor, 'RUCEmisor'));
    const razonSocial = valorTag(emisor, 'RznSoc') || valorTag(emisor, 'NomComercial');

    const tipoDocReceptor = Number(valorTag(receptor, 'TipoDocRecep')) || 0;
    const docReceptor = limpiarRutUY(valorTag(receptor, 'DocRecep'));
    const razonReceptor = valorTag(receptor, 'RznSocRecep');

    const moneda = (valorTag(totales, 'TpoMoneda') || 'UYU').toUpperCase();
    const tipoCambioRaw = numTag(totales, 'TpoCambio');
    const tipoCambio = Number.isFinite(tipoCambioRaw) && tipoCambioRaw > 0 ? tipoCambioRaw : null;

    const mntNoGrv = numTag(totales, 'MntNoGrv');
    const mntExpoyAsim = numTag(totales, 'MntExpoyAsim');
    const mntNetoMin = numTag(totales, 'MntNetoIvaTasaMin');
    const mntNetoBasica = numTag(totales, 'MntNetoIVATasaBasica');
    const mntNetoOtra = numTag(totales, 'MntNetoIVAOtra');
    const tasaMinPct = numTag(totales, 'IVATasaMin') || 10;
    const tasaBasicaPct = numTag(totales, 'IVATasaBasica') || 22;
    const ivaMin = numTag(totales, 'MntIVATasaMin');
    const ivaBasica = numTag(totales, 'MntIVATasaBasica');
    const ivaOtra = numTag(totales, 'MntIVAOtra');
    const mntTotal = numTag(totales, 'MntTotal');
    const mntPagar = numTag(totales, 'MntPagar') || mntTotal;

    return {
      archivo: bloques.length > 1 ? `${nombreArchivo} (#${idx + 1})` : nombreArchivo,
      invalidoXml: false,
      tipoCFE,
      tipoNombre: TIPOS_CFE[tipoCFE] || `CFE ${tipoCFE || '?'}`,
      esNotaCredito: NOTAS_CREDITO.has(tipoCFE),
      esNotaDebito: NOTAS_DEBITO.has(tipoCFE),
      serie,
      numero,
      fecha,
      formaPago: fmaPago === '2' ? 'Crédito' : fmaPago === '1' ? 'Contado' : '',
      rucEmisor,
      razonSocial,
      tipoDocReceptor,
      docReceptor,
      razonReceptor,
      moneda,
      tipoCambio,
      mntNoGrv,
      mntExpoyAsim,
      mntNetoMin,
      mntNetoBasica,
      mntNetoOtra,
      tasaMinPct,
      tasaBasicaPct,
      ivaMin,
      ivaBasica,
      ivaOtra,
      mntTotal,
      mntPagar,
    };
  });
}

export function validarComprobantes(archivosXml, { miRut = '', tipoCambioUsd = 42, tolerancia = 1 } = {}) {
  const miRutLimpio = limpiarRutUY(miRut);
  const compras = [];
  const observaciones = [];
  const avisos = [];
  const vistos = new Map();

  if (miRutLimpio) {
    const chk = validarRutUY(miRutLimpio);
    if (!chk.valido) {
      avisos.push(`Tu RUT ingresado no pasa la validación de DGI: ${chk.motivo}.`);
    }
  }

  for (const arch of archivosXml) {
    const cfes = parsearXmlCFE(arch.contenido, arch.nombre);
    for (const c of cfes) {
      if (c.invalidoXml) {
        observaciones.push({
          archivo: c.archivo,
          fecha: '',
          tipoNombre: 'XML inválido',
          comprobante: '',
          rucEmisor: '',
          razonSocial: '',
          moneda: '',
          total: 0,
          motivos: c.motivos,
        });
        continue;
      }

      const motivos = [];
      const comprobante = [c.serie, c.numero].filter(Boolean).join('-') || 'sin número';

      if (!Number.isFinite(c.tipoCFE) || !c.tipoCFE) {
        motivos.push('Falta el tipo de CFE (<TipoCFE>)');
      }
      if (c.tipoCFE === 181) {
        motivos.push('Es un e-Remito (traslado de mercadería): no corresponde cargarlo al libro de compras');
      }
      if (!c.fecha || !/^\d{4}-\d{2}-\d{2}$/.test(c.fecha)) {
        motivos.push(`Fecha de emisión inválida ("${c.fecha || 'vacía'}")`);
      }

      const rutCheck = validarRutUY(c.rucEmisor);
      if (!rutCheck.valido) {
        motivos.push(`RUT emisor inválido: ${rutCheck.motivo}`);
      }

      // Control de duplicados por RUT emisor + TipoCFE + Serie + Nro
      if (c.rucEmisor && c.tipoCFE && c.numero) {
        const key = `${c.rucEmisor}|${c.tipoCFE}|${c.serie}|${c.numero}`;
        if (vistos.has(key)) {
          motivos.push(`Comprobante duplicado (ya apareció en "${vistos.get(key)}")`);
        } else {
          vistos.set(key, c.archivo);
        }
      }

      // Control de receptor (clave para poder descontar IVA en Uruguay)
      if (!c.docReceptor) {
        motivos.push('Emitido a consumidor final (sin RUT receptor): no sirve para descontar IVA');
      } else if (c.tipoDocReceptor && c.tipoDocReceptor !== 2) {
        motivos.push(`Receptor no es RUT (documento tipo ${c.tipoDocReceptor}: ${c.docReceptor}): revisar si descuenta IVA`);
      } else if (miRutLimpio && c.docReceptor !== miRutLimpio) {
        motivos.push(`Emitido a otro RUT (${formatearRutUY(c.docReceptor)}), distinto al tuyo (${formatearRutUY(miRutLimpio)})`);
      }

      // Validación matemática de tasas de IVA (22% y 10%) y total
      const montos = [c.mntNoGrv, c.mntExpoyAsim, c.mntNetoMin, c.ivaMin, c.mntNetoBasica, c.ivaBasica, c.mntNetoOtra, c.ivaOtra, c.mntTotal];
      if (montos.some((m) => Number.isNaN(m))) {
        motivos.push('Hay importes no numéricos en <Totales>');
      } else if (c.tipoCFE !== 181 && c.tipoCFE !== 182) {
        if (c.mntNetoBasica > 0 || c.ivaBasica > 0) {
          const esp22 = +(c.mntNetoBasica * (c.tasaBasicaPct / 100)).toFixed(2);
          if (Math.abs(esp22 - c.ivaBasica) > tolerancia) {
            motivos.push(`IVA ${c.tasaBasicaPct}% no cuadra: esperado ${esp22.toFixed(2)}, figura ${c.ivaBasica.toFixed(2)}`);
          }
        }
        if (c.mntNetoMin > 0 || c.ivaMin > 0) {
          const esp10 = +(c.mntNetoMin * (c.tasaMinPct / 100)).toFixed(2);
          if (Math.abs(esp10 - c.ivaMin) > tolerancia) {
            motivos.push(`IVA ${c.tasaMinPct}% no cuadra: esperado ${esp10.toFixed(2)}, figura ${c.ivaMin.toFixed(2)}`);
          }
        }
        const sumaTotal = +(
          c.mntNoGrv +
          c.mntExpoyAsim +
          c.mntNetoMin +
          c.ivaMin +
          c.mntNetoBasica +
          c.ivaBasica +
          c.mntNetoOtra +
          c.ivaOtra
        ).toFixed(2);
        if (Math.abs(sumaTotal - c.mntTotal) > tolerancia) {
          motivos.push(`El total (${c.mntTotal.toFixed(2)}) no coincide con la suma de subtotales + IVA (${sumaTotal.toFixed(2)})`);
        }
      }

      // Conversión a UYU
      let tc = 1;
      let tcEstimado = false;
      if (c.moneda !== 'UYU') {
        if (c.tipoCambio) {
          tc = c.tipoCambio;
        } else {
          tc = Number(tipoCambioUsd) || 42;
          tcEstimado = true;
          avisos.push(`${c.archivo}: comprobante en ${c.moneda} sin <TpoCambio>; se usó ${tc} para convertir a UYU.`);
        }
      }

      const signo = c.esNotaCredito ? -1 : 1;
      const exento = +((c.mntNoGrv + c.mntExpoyAsim) * signo).toFixed(2);
      const neto22 = +(c.mntNetoBasica * signo).toFixed(2);
      const iva22 = +(c.ivaBasica * signo).toFixed(2);
      const neto10 = +(c.mntNetoMin * signo).toFixed(2);
      const iva10 = +(c.ivaMin * signo).toFixed(2);
      const total = +(c.mntTotal * signo).toFixed(2);
      const totalUYU = +(total * tc).toFixed(2);

      const registro = {
        archivo: c.archivo,
        fecha: c.fecha,
        tipoCFE: c.tipoCFE,
        tipoNombre: c.tipoNombre,
        esNotaCredito: c.esNotaCredito,
        serie: c.serie,
        numero: c.numero,
        comprobante,
        rucEmisor: c.rucEmisor,
        razonSocial: c.razonSocial || '(sin razón social)',
        docReceptor: c.docReceptor,
        moneda: c.moneda,
        tipoCambio: tc,
        tcEstimado,
        exento,
        neto22,
        iva22,
        neto10,
        iva10,
        total,
        totalUYU,
        neto22UYU: +(neto22 * tc).toFixed(2),
        iva22UYU: +(iva22 * tc).toFixed(2),
        neto10UYU: +(neto10 * tc).toFixed(2),
        iva10UYU: +(iva10 * tc).toFixed(2),
        exentoUYU: +(exento * tc).toFixed(2),
        motivos,
      };

      if (motivos.length) {
        observaciones.push(registro);
      } else {
        compras.push(registro);
      }
    }
  }

  compras.sort((a, b) => a.fecha.localeCompare(b.fecha));

  const sum = (arr, k) => +arr.reduce((s, x) => s + x[k], 0).toFixed(2);

  const resumen = {
    archivosLeidos: archivosXml.length,
    comprobantesValidos: compras.length,
    conObservaciones: observaciones.length,
    notasCredito: compras.filter((c) => c.esNotaCredito).length,
    neto22UYU: sum(compras, 'neto22UYU'),
    iva22UYU: sum(compras, 'iva22UYU'),
    neto10UYU: sum(compras, 'neto10UYU'),
    iva10UYU: sum(compras, 'iva10UYU'),
    exentoUYU: sum(compras, 'exentoUYU'),
    totalUYU: sum(compras, 'totalUYU'),
  };

  return { compras, observaciones, avisos, resumen };
}

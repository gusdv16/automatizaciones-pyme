// Gestor de recordatorios de cobro y cuentas corrientes.
// Lee una planilla de deudas pendientes y las clasifica por estado (al día, por vencer, vencida),
// calcula lo adeudado por cliente y genera un mensaje personalizado listo para enviar.
import { normalizarMonto, normalizarTexto, fechaISO, formatearMonto } from './formato.js';

const DIA = 86400000;

function generarMensaje(cliente, facturas, total, estado, dias) {
  const detalle = facturas
    .map((f) => `  • ${f.factura || 'Factura'}: ${formatearMonto(f.monto)} (vence ${fechaISO(f.vencimiento)})`)
    .join('\n');
  const saludo = `Hola ${cliente},`;
  const cuerpo =
    estado === 'vencida'
      ? `Te escribimos para recordarte que tenés facturas vencidas por un total de ${formatearMonto(total)}.`
      : estado === 'por_vencer'
      ? `Te recordamos que tenés facturas próximas a vencer por un total de ${formatearMonto(total)}.`
      : `Te enviamos el detalle de tus facturas pendientes por un total de ${formatearMonto(total)}.`;
  const cierre = 'Podés responder este mensaje para coordinar el pago. ¡Gracias!';
  return `${saludo}\n\n${cuerpo}\n\nDetalle:\n${detalle}\n\nTotal adeudado: ${formatearMonto(total)}\n\n${cierre}`;
}

export function analizarCobranzas(filas, { fechaHoy = new Date(), diasAviso = 7 } = {}) {
  const avisos = [];
  const porCliente = new Map();
  const hoy = fechaHoy instanceof Date ? fechaHoy : new Date(fechaHoy);

  filas.forEach((f, i) => {
    const fila = i + 2;
    const cliente = normalizarTexto(f.cliente);
    const factura = normalizarTexto(f.factura ?? f.comprobante);
    const monto = normalizarMonto(f.monto ?? f.importe);
    const vencimiento = new Date(f.fecha_vencimiento ?? f.vencimiento ?? f.fecha);
    const ultimoRaw = f.ultimo_contacto ?? f.ultimoContacto;
    const ultimo = ultimoRaw ? new Date(ultimoRaw) : null;
    const telefono = normalizarTexto(f.telefono);
    const email = normalizarTexto(f.email);

    const problemas = [];
    if (!cliente) problemas.push('sin cliente');
    if (!Number.isFinite(monto) || monto <= 0) problemas.push('monto inválido');
    if (!(vencimiento instanceof Date) || Number.isNaN(vencimiento.getTime())) problemas.push('fecha de vencimiento inválida');

    if (problemas.length) {
      avisos.push({ tipo: 'dato', mensaje: `Fila ${fila}: ${problemas.join(', ')}. No se incluye.` });
      return;
    }

    if (!porCliente.has(cliente)) {
      porCliente.set(cliente, { cliente, telefono, email, facturas: [], ultimoContacto: null });
    }
    const c = porCliente.get(cliente);
    if (telefono) c.telefono = telefono;
    if (email) c.email = email;
    if (ultimo && !Number.isNaN(ultimo.getTime()) && (!c.ultimoContacto || ultimo > c.ultimoContacto)) {
      c.ultimoContacto = ultimo;
    }
    c.facturas.push({ factura, monto, vencimiento, fila });
  });

  const clientes = [...porCliente.values()]
    .map((c) => {
      const total = +c.facturas.reduce((s, x) => s + x.monto, 0).toFixed(2);
      let minDias = Infinity;
      for (const f of c.facturas) {
        const dias = Math.round((f.vencimiento - hoy) / DIA);
        if (dias < minDias) minDias = dias;
      }
      let estado;
      if (minDias < 0) estado = 'vencida';
      else if (minDias <= diasAviso) estado = 'por_vencer';
      else estado = 'al_dia';

      const etiqueta =
        minDias < 0 ? `Vencida hace ${-minDias} día(s)` : `Vence en ${minDias} día(s)`;

      const mensaje = generarMensaje(c.cliente, c.facturas, total, estado, minDias);

      return {
        cliente: c.cliente,
        telefono: c.telefono,
        email: c.email,
        facturas: c.facturas,
        total,
        estado,
        dias: minDias,
        etiqueta,
        ultimoContacto: c.ultimoContacto,
        mensaje,
      };
    })
    .sort((a, b) => a.dias - b.dias);

  const resumen = {
    total: filas.length,
    clientes: clientes.length,
    totalAdeudado: +clientes.reduce((s, c) => s + c.total, 0).toFixed(2),
    vencidas: clientes.filter((c) => c.estado === 'vencida').length,
    porVencer: clientes.filter((c) => c.estado === 'por_vencer').length,
    alDia: clientes.filter((c) => c.estado === 'al_dia').length,
  };

  return { clientes, avisos, resumen };
}

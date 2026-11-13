# Gestor de cobranzas y cuentas corrientes

Lee las deudas pendientes, las clasifica por estado (al día, por vencer, vencida), calcula lo adeudado por
cliente y genera un mensaje de cobro personalizado listo para enviar por WhatsApp o correo.

## El problema

En negocios que venden a crédito, el seguimiento de las facturas vencidas se hace de forma informal y se
olvida, afectando el flujo de caja. Cobrar a tiempo sin perseguir a nadie a mano mejora la liquidez.

## Cómo lo hace

1. Lee la planilla y agrupa las facturas por cliente.
2. Clasifica a cada cliente: **vencida**, **por vencer** o **al día**.
3. Calcula el total adeudado por cliente y mantiene el último contacto de cobro.
4. Genera un mensaje personalizado listo para copiar y enviar.

## Uso

```bash
npm run cobranzas
# o con tu propia planilla:
node cobranzas/cli.js cuentas.csv salida/
```

Genera `salidas/cobranzas.csv` (con el mensaje listo para enviar en cada fila).

## Demo web

https://gusdv16.github.io/automatizaciones-pyme/cobranzas/ — subís la planilla (o usás el ejemplo), ves los
clientes ordenados por urgencia y descargás el CSV con los mensajes.

# Automatizaciones para PYMEs

Tres soluciones para el día a día de un negocio: cuadrar la caja con el banco, imprimir etiquetas de góndola
y revisar la planilla que manda el proveedor. Sin interfaces complicadas, sin servidores, sin datos que salgan
de tu computadora.

Probá las tres en el navegador con datos de ejemplo:

> **Demo online:** https://gusdv16.github.io/automatizaciones-pyme/

## Las cinco soluciones

### 1. Cuadrá tu caja con el banco

Cruzar a mano las ventas del sistema con los abonos del banco es lento y fácil de errar: los formatos no
coinciden y el banco acredita con uno o dos días de demora. Esta solución cruza los movimientos por vos y te
dice al instante:

- qué está conciliado,
- qué plata no entró (ventas sin abono),
- qué plata entró sin venta registrada (abonos sin venta),
- y la diferencia de caja.

También avisa de datos sospechosos: montos vacíos, fechas inválidas y posibles duplicados.

### 2. Etiquetas de góndola listas para imprimir

Cuando cambia un precio, nadie debería abrir un procesador de textos, escribir los cambios, imprimir, recortar
y pegar. Esta solución lee el inventario y te entrega un PDF con la grilla exacta: nombre, precio y código de
barras listo para la góndola. Los productos sin código o con precio en cero quedan afuera, avisados.

### 3. Limpiá la planilla del proveedor antes de cargarla

Los proveedores mandan planillas con errores: filas repetidas, precios en cero, categorías mal escritas. Si eso
entra directo al sistema, rompe las ventas. Esta solución revisa la planilla y te devuelve dos cosas:

- una **planilla limpia** lista para cargar,
- y una **hoja de errores** con el motivo de cada fila, para mandarle de vuelta al proveedor.

### 4. Órdenes de compra por stock mínimo

El encargado de compras revisa el inventario a ojo y a veces se entera tarde de que falta mercadería. Esta
solución lee el stock actual y el mínimo de cada producto, detecta los faltantes y arma las órdenes de compra
agrupadas por proveedor, con la cantidad a pedir y el costo estimado, en PDF y CSV.

### 5. Gestor de cobranzas y cuentas corrientes

En negocios que venden a crédito, el seguimiento de las facturas vencidas se hace de forma informal y se
olvida, afectando el flujo de caja. Esta solución lee las deudas pendientes, las clasifica por estado (al día,
por vencer, vencida), calcula lo adeudado por cliente y genera un mensaje de cobro personalizado listo para
enviar por WhatsApp o correo.

## Cómo se usan

Hay dos formas, y las dos comparten exactamente la misma lógica:

**En el navegador** (sin instalar nada): abrís la demo, subís tu archivo y descargás el resultado.

**Como programa** (para dejarlo corriendo a fin de mes):

```bash
npm install

npm run conciliar   # ventas vs. cartola del banco -> salidas/*.csv
npm run conciliar-pasarela  # ventas vs. liquidaciones de pasarela (comisión + IVA)
npm run etiquetas    # inventario -> salidas/etiquetas.pdf
npm run precios      # lista del proveedor -> salidas/precios-limpios.xlsx
npm run stock        # inventario -> salidas/ordenes-compra.pdf + .csv
npm run cobranzas    # cuentas corrientes -> salidas/cobranzas.csv (con mensajes)
```

Cada uno acepta tus propios archivos:

```bash
node conciliador/cli.js mis-ventas.csv mi-cartola.csv salida/
node etiquetas/cli.js mi-inventario.csv salida/etiquetas.pdf
node precios/cli.js lista-proveedor.xlsx salida/
```

## Los datos de ejemplo son feos a propósito

La carpeta `datos-sucios/` no es un dataset de juguete. Tiene los errores que aparecen en la vida real:

- **Ventas / cartola:** un depósito sin identificar, un abono duplicado, una fila con el monto vacío.
- **Inventario:** productos sin código de barras y precios en cero.
- **Lista del proveedor:** códigos repetidos, precios negativos, un precio que en realidad es texto,
  categorías mal escritas y una fila sin categoría.

Eso es lo que hace creíble la solución: no funciona solo en un entorno de prueba perfecto.

## Estructura del repo

```
automatizaciones-pyme/
├─ core/              # Lógica compartida (funciona igual en Node y en el navegador)
├─ conciliador/       # Programa del conciliador (banco y pasarela)
├─ etiquetas/         # Programa de etiquetas + códigos de barras
├─ precios/           # Programa del validador de listas
├─ stock/             # Programa de órdenes de compra por stock mínimo
├─ cobranzas/         # Programa de cobranzas y cuentas corrientes
├─ datos-sucios/      # Muestras con errores reales
├─ scripts/           # Generación y sincronización de datos de ejemplo
└─ web/               # Demo web (Astro) que reusa core/
```

La decisión de diseño importante: **una sola lógica, dos entradas**. La lógica de negocio vive en `core/`
y no depende ni de Node ni del navegador, así que el programa y la web ejecutan el mismo código y no pueden
divergir. Lo único que cambia es cómo se dibuja el código de barras.

## Detalles técnicos

- **Node 20+**, JavaScript (ESM), sin build para los programas.
- **Astro** para la web estática, deploy a **GitHub Pages**.
- **pdf-lib** para el PDF, **bwip-js** para el código de barras, **SheetJS** para leer/escribir Excel, **PapaParse** para CSV.
- La salida de los programas va a `salidas/` (ignorada por git: se regenera al correrlos).

## Licencia

MIT.

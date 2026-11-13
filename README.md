# Automatizaciones para PYMEs

Tres herramientas que resuelven tres dolores concretos de una PyME, no tres tutoriales de framework.

Una PyME no pierde plata por no tener una interfaz linda. La pierde porque **los datos no cuadran**, porque
alguien hace a mano una tarea repetitiva a fin de mes, o porque un archivo sucio entró al sistema y rompió las ventas.
Estas herramientas atacan exactamente eso:

| Herramienta | El dolor | Qué te devuelve |
|---|---|---|
| **Conciliador de caja y banco** | Cruzar a mano las ventas del sistema con la cartola del banco | Qué está conciliado, qué plata no entró y qué entró sin venta registrada |
| **Generador de etiquetas** | Cambió un precio y alguien edita etiquetas a mano en Word | Un PDF A4 con nombre, precio y código de barras Code 128 listo para la góndola |
| **Validador de listas de precios** | El proveedor manda un Excel sucio que rompe el sistema | Una planilla limpia para cargar + una hoja con los errores explicados |

La habilidad que las une es una sola: **desconfiar de los datos con método**. Todo lo que llega de afuera
(el banco, el proveedor, un inventario cargado a mano) viene con filas repetidas, precios en cero, fechas
que no coinciden y errores de tipeo. El código tiene que aguantarlo y decirte con claridad qué está bien y qué hay que arreglar.

## Probalo sin instalar nada

Cada herramienta corre **entera en el navegador**, con datos de ejemplo sucios incluidos. Los archivos que
subís no se envían a ningún servidor: todo el procesamiento es local.

> Demo online: `https://gusdv16.github.io/automatizaciones-pyme/`

También podés correrla localmente:

```bash
npm install
npm run dev      # servidor de desarrollo en http://localhost:4321/automatizaciones-pyme/
```

## Usarlo como script (a fin de mes, sin abrir el navegador)

Los mismos tres proyectos existen como **scripts de línea de comandos** (Node 20+). La lógica de negocio es
exactamente la misma que la de la web: vive en `core/` y la comparten los dos.

```bash
npm install

# 1) Conciliador: ventas del sistema vs. cartola del banco
npm run conciliar
#   -> salidas/conciliados.csv, ventas-sin-abono.csv, abonos-sin-venta.csv

# 2) Etiquetas: inventario -> PDF con códigos de barras
npm run etiquetas
#   -> salidas/etiquetas.pdf

# 3) Precios: lista del proveedor -> planilla limpia + errores
npm run precios
#   -> salidas/precios-limpios.xlsx (hoja "Limpia" + hoja "Errores")
```

Cada CLI acepta rutas propias:

```bash
node conciliador/cli.js mis-ventas.csv mi-cartola.csv salida/
node etiquetas/cli.js mi-inventario.csv salida/etiquetas.pdf
node precios/cli.js lista-proveedor.xlsx salida/
```

## Los datos de ejemplo son feos a propósito

`datos-sucios/` no es un dataset de juguete. Tiene los errores que aparecen en la vida real:

- **Ventas / cartola**: un depósito sin identificar, un abono duplicado, una fila con el monto vacío.
- **Inventario**: productos sin código de barras y precios en cero.
- **Lista del proveedor**: códigos repetidos, precios negativos, un precio `"abc"`, categorías mal
  escritas (`"Limpiesa"`, `"Bebida"`) y una fila sin categoría.

Eso es lo que hace creíble la herramienta: no funciona solo en un entorno de prueba perfecto.

## Estructura del repo

```
automatizaciones-pyme/
├─ core/              # Lógica compartida (funciona igual en Node y en el navegador)
│  ├─ conciliar.js    # Regla de negocio de la conciliación
│  ├─ etiquetas.js    # Validación y paginado de etiquetas
│  ├─ pdf-etiquetas.js# Armado del PDF (pdf-lib)
│  ├─ precios.js      # Reglas de validación de la lista del proveedor
│  └─ formato.js      # Normalización de montos, textos y fechas
├─ conciliador/       # CLI del conciliador
├─ etiquetas/         # CLI de etiquetas + generación de código de barras (Node)
├─ precios/           # CLI del validador
├─ datos-sucios/      # Muestras con errores reales
├─ scripts/           # Generación y sincronización de datos de ejemplo
└─ web/               # Demo web (Astro) que reusa core/
```

La decisión de diseño importante: **una sola lógica, dos entradas**. `core/` es JavaScript puro sin
dependencias de Node ni del DOM, así que el CLI y el navegador ejecutan el mismo código y no pueden divergir.
Lo único que cambia es el adaptador que dibuja el código de barras (`bwip-js` en Node vs. en el navegador).

## Detalles técnicos

- **Node 20+ / JavaScript (ESM)**, sin build para los scripts.
- **Astro** para la web estática, deploy a **GitHub Pages**.
- **pdf-lib** para el PDF, **bwip-js** para el Code 128, **SheetJS** para leer/escribir Excel, **PapaParse** para CSV.
- Los tres scripts escriben su salida en `salidas/` (ignorada por git: se regenera al correrlos).

## Licencia

MIT.

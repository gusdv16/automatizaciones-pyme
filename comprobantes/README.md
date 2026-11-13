# Lector y validador de CFE (DGI Uruguay)

Procesa un lote de archivos **XML de Comprobantes Fiscales Electrónicos (CFE)** de Uruguay (e-Factura,
e-Ticket, Notas de Crédito/Débito, en `UYU` o `USD`), valida los datos según las reglas de DGI y genera
un Excel listo para el contador con el **Libro de Compras** y las **Observaciones**.

## El problema

A fin de mes llegan decenas de mails de proveedores con comprobantes en pesos y en dólares. Pasarlos a mano
al libro de compras consume horas y deja pasar errores caros:

- Cargar un **e-Ticket a consumidor final** (sin tu RUT) o emitido a otro RUT: **ese IVA no se puede descontar**.
- Cargar una **Nota de Crédito** sumando en vez de restando.
- Cargar dos veces el mismo comprobante.
- Diferencias en el cálculo de **IVA 22%**, **IVA 10%** o totales.
- Un **RUT emisor** con dígito verificador inválido.

## Qué valida

- **Dígito verificador del RUT** (12 dígitos, Módulo 11 de DGI).
- **RUT receptor**: detecta comprobantes a consumidor final o a otro RUT distinto al de tu empresa.
- **Cuadre de tasas**: verifica IVA 22% (tasa básica), IVA 10% (tasa mínima), exento y total.
- **Notas de Crédito**: restan automáticamente en el libro de compras.
- **Duplicados**: por `RUT Emisor + Tipo CFE + Serie + Número`.
- **Moneda USD / UYU**: convierte a pesos usando el tipo de cambio del propio comprobante (`<TpoCambio>`).

## Uso

```bash
npm run comprobantes
# o con tu carpeta de XMLs y tu RUT:
node comprobantes/cli.js mi-carpeta-xmls/ --rut 214844360018
```

Genera `salidas/libro-compras.xlsx` con dos hojas:

- **Compras** — los comprobantes válidos con neto 22%, IVA 22%, neto 10%, IVA 10%, exento y total en UYU.
- **Observaciones** — los comprobantes rechazados o a revisar con el motivo explicado en español claro.

## Demo web

https://gusdv16.github.io/automatizaciones-pyme/comprobantes/ — subís tus XMLs juntos (o probás con el
lote de ejemplo de 10 CFE uruguayos), ves el resumen de IVA y descargás el Excel sin que los archivos
salgan de tu navegador.

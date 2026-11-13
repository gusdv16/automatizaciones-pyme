# Órdenes de compra por stock mínimo

Detecta los productos que están por debajo del stock mínimo y arma las órdenes de compra agrupadas por
proveedor, con la cantidad a pedir y el costo estimado, en PDF y CSV.

## El problema

El encargado de compras revisa el inventario a ojo. Cuando se percata de que falta mercadería, a veces ya
es tarde o se olvida de pedirle a ciertos proveedores, lo que genera quiebres de stock.

## Cómo lo hace

1. Lee el inventario y valida cada producto: necesita código, nombre y stock actual.
2. Detecta los que están por debajo del stock mínimo (o del mínimo por defecto si no viene en el archivo).
3. Agrupa los faltantes por proveedor y calcula la cantidad a pedir y el costo estimado.
4. Genera un PDF (una sección por proveedor, listo para imprimir/enviar) y un CSV.

## Uso

```bash
npm run stock
# o con tu propio inventario:
node stock/cli.js inventario.csv salida/
```

Genera `salidas/ordenes-compra.csv` y `salidas/ordenes-compra.pdf`.

## Demo web

https://gusdv16.github.io/automatizaciones-pyme/stock/ — cargás el inventario (o usás el ejemplo), ves las
órdenes agrupadas por proveedor y descargás el PDF o el CSV.

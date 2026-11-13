# Etiquetas de góndola listas para imprimir

Toma el inventario y arma un **PDF para imprimir** con la grilla exacta: nombre, precio y código de barras
listo para colocar en la góndola.

## El problema

Cambia un precio y alguien abre un procesador de textos, escribe los cambios, imprime, recorta y pega.
Es lento y arriesga que el código de barras viejo quede en la góndola y ya no sirva.

## Cómo lo hace

1. Lee el inventario y valida cada producto: necesita código, nombre y precio mayor a cero.
2. Los que no pasan la validación **no se imprimen**, y quedan listados como avisos (así no perdés tiempo
   imprimiendo una etiqueta que no sirve).
3. Arma la grilla según columnas y filas (por defecto 3 × 8) y calcula cuántas hojas hacen falta.
4. Genera el PDF con el código de barras y su número debajo, listo para imprimir y recortar.

## Uso

```bash
npm run etiquetas
# o con tu propio inventario:
node etiquetas/cli.js inventario.csv salida/etiquetas.pdf
```

Genera `salidas/etiquetas.pdf`.

```
Productos en el inventario : 25
Etiquetas generadas        : 22
Hojas (3 x 8 por hoja)     : 1

AVISOS (productos salteados)
  - Fila 12: sin código de barras. No se genera etiqueta.
  - Fila 13: precio inválido o en cero. No se genera etiqueta.
  - Fila 15: precio inválido o en cero. No se genera etiqueta.
```

## Demo web

https://gusdv16.github.io/automatizaciones-pyme/etiquetas/ — cargás el inventario (o usás el ejemplo),
ves la vista previa de las etiquetas y descargás el mismo PDF, todo en el navegador.

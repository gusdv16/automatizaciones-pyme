# Validador de listas de precios de proveedores

Valida el Excel que manda el proveedor **antes** de cargarlo al sistema y devuelve dos cosas: una planilla
limpia lista para cargar y otra con los errores marcados y explicados para que los entienda cualquiera,
sin saber programar.

## El dolor

Los proveedores mandan archivos "sucios": filas repetidas, precios en cero o negativos, categorías mal
escritas, un precio que en realidad es texto. Si eso entra directo al sistema, rompe las ventas.

## Las reglas

- **Código**: obligatorio y sin repetir (detecta filas duplicadas).
- **Nombre**: obligatorio.
- **Precio**: numérico y mayor que cero.
- **Categoría**: tiene que existir. Si está mal escrita, **sugiere la correcta** ("¿quisiste decir…?").

## Uso

```bash
npm run precios
# o con tu propia lista:
node precios/cli.js lista-proveedor.xlsx salida/
```

Genera `salidas/precios-limpios.xlsx` con dos hojas:

- **Limpia** — las filas que pasan todas las reglas, listas para cargar.
- **Errores** — cada fila rechazada con el **motivo** explicado en una columna, para mandársela de vuelta
  al proveedor tal cual.

```
Filas leídas        : 29
Filas limpias       : 22
Filas con errores   : 7

ERRORES ENCONTRADOS
  Fila 10: Yerba 1kg [1009]
      - Precio en cero o negativo (0)
  Fila 12: Fideos 500g [1010]
      - Código repetido (ya aparece en la fila 11)
  Fila 28: Toallitas humedas [1026]
      - Categoría desconocida ("Limpiesa"). ¿Quisiste decir "Limpieza"?
```

## Demo web

`https://gusdv16.github.io/automatizaciones-pyme/precios/` — subís la lista (o usás el ejemplo), ves las
filas con error resaltadas con su motivo y descargás la planilla con las dos hojas.

# Conciliador de caja y banco

Cruza las **ventas del sistema** con los **abonos de la cartola bancaria** y te dice, en segundos, qué plata
no entró y qué plata entró sin venta registrada.

## El dolor

A fin de mes alguien abre las dos planillas y compara fila por fila. Los formatos no coinciden y el banco
acredita con uno o dos días de demora, así que las fechas tampoco son iguales. Es lento y, sobre todo, es
fácil que se escape una diferencia.

## La regla de negocio

- **Mismo monto** (con una tolerancia de centavos por redondeo).
- **Fecha dentro de una ventana de días** (por defecto, 3): el banco acredita con demora.
- Si hay varias coincidencias posibles, gana el abono con la **fecha más cercana**.
- Cada movimiento se usa **una sola vez**: nada se cuenta doble.

Además, avisa de datos sospechosos en lugar de fallar en silencio: montos vacíos o no numéricos, fechas
inválidas y **posibles duplicados** (mismo monto, fecha y detalle).

## Uso

```bash
npm run conciliar
# o con tus propios archivos:
node conciliador/cli.js ventas.csv cartola.csv salida/
```

Genera en `salidas/`:

- `conciliados.csv` — los pares venta/abono que cierran, con la demora en días.
- `ventas-sin-abono.csv` — lo que se vendió y el banco nunca acreditó.
- `abonos-sin-venta.csv` — lo que entró a la cuenta sin una venta que lo explique.

## Qué mirar en el resultado

```
Conciliados        : 11  ($ 12.675,75)
Ventas SIN abono   : 1   ($ 3.100,00)
Abonos SIN venta   : 2   ($ 2.890,50)
Diferencia de caja : -$ 209,50
```

La **diferencia de caja** es el número que le importa al dueño: cuánto muestra el banco de más (o de menos)
respecto de lo que el sistema dice que se vendió.

## Demo web

`https://gusdv16.github.io/automatizaciones-pyme/conciliador/` — subís los dos CSV (o usás el ejemplo)
y ves el resultado en el navegador, sin instalar nada.

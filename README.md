# JP Morgan

App web personal para controlar dos cuentas, Enterprise account y Liquid account, y tus inversiones. Estilo cristal líquido en blanco y negro con detalles dorados. No tiene relación con JPMorgan Chase & Co.

Enlace: https://tienrop2soc.github.io/Entorno-financiero/

## Cómo funciona

| Parte | Qué hace |
|---|---|
| Inicio | Saludo según la hora (Good morning, Good afternoon o Good evening), saldo total, las dos cuentas, resumen del mes y últimos movimientos. |
| Enterprise account y Liquid account | Toca una cuenta para ver su saldo y sus movimientos. Puedes apuntar gastos e ingresos, mover dinero entre las dos o ajustar el saldo a mano. |
| Botón + | Menú para apuntar un gasto, un ingreso, mover dinero o añadir una inversión. |
| Inversiones | Cada inversión con lo que pusiste y lo que vale hoy. Calcula la ganancia y la rentabilidad. |

El saldo de cada cuenta se actualiza solo al apuntar, editar o borrar un movimiento. Un ajuste de saldo no cuenta como gasto ni ingreso.

Atajos de teclado: N para un gasto, I para un ingreso, Esc para cerrar.

## Tus datos

Se guardan solo en el navegador del dispositivo que uses. Exporta una copia de seguridad desde Ajustes de vez en cuando. Las cuentas que creaste en versiones anteriores siguen guardadas en el navegador, pero ya no se muestran.

## Archivos

```
index.html            Página
css/styles.css        Estilo cristal líquido
js/app.js             Toda la lógica
sw.js                 Funcionamiento sin conexión
```

La versión completa anterior, con gastos, nómina, presupuestos e informes, sigue en el historial de git.

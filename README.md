# Entorno Financiero

App web sencilla para saber cuánto dinero tienes. Estilo cristal líquido en blanco y negro, con modo claro y oscuro.

Enlace: https://tienrop2soc.github.io/Entorno-financiero/

## Cómo funciona

| Parte | Qué hace |
|---|---|
| Cuentas | Total de bancos y efectivo, resumen del mes con ingresos, gastos y en qué se va el dinero, tus cuentas y lugares con efectivo, y los últimos movimientos. |
| Página de cada cuenta | Toca una cuenta o un lugar para ver su saldo, lo que ha entrado y salido este mes y todos sus movimientos. Tiene botones para apuntar un gasto, un ingreso o mover dinero. |
| Botón + | Menú para apuntar un gasto, un ingreso, mover dinero entre cuentas o añadir una inversión. |
| Inversiones | Cada inversión con lo que pusiste y lo que vale hoy. Calcula la ganancia y la rentabilidad. |

Cada gasto o ingreso se asigna a una cuenta del banco o a un lugar con efectivo, y su saldo se actualiza solo. Al editar o borrar un movimiento, el saldo se corrige. Si cambias el saldo a mano, la diferencia se guarda como «Ajuste de saldo» y no cuenta como gasto ni ingreso.

Atajos de teclado: N para un gasto, I para un ingreso, Esc para cerrar.

El botón de los tres puntos abre los ajustes: tema blanco o negro, moneda, copia de seguridad e importación.

## Tus datos

Se guardan solo en el navegador del dispositivo que uses. Exporta una copia de seguridad desde Ajustes de vez en cuando. Si usabas la versión anterior de la app en el mismo navegador, los saldos de tus cuentas y tus inversiones se traspasan solos la primera vez.

## Archivos

```
index.html            Página
css/styles.css        Estilo cristal líquido
js/app.js             Toda la lógica
sw.js                 Funcionamiento sin conexión
```

La versión completa anterior, con gastos, nómina, presupuestos e informes, sigue en el historial de git.

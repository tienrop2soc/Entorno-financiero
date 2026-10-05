# Entorno Financiero

App web personal para controlar gastos, ingresos, nómina, presupuestos, ahorro, deudas e inversiones. Estilo cristal líquido en blanco y negro, con modo claro (blanco) y oscuro (negro).

No necesita servidor ni instalación: es HTML, CSS y JavaScript sin dependencias. Los datos se guardan solo en tu navegador.

## Cómo abrirla

- **Directamente:** abre `index.html` en el navegador.
- **Con servidor local** (recomendado, activa el modo sin conexión):
  ```bash
  python3 -m http.server 8000
  # y abre http://localhost:8000
  ```
- **En el móvil como app:** publícala con GitHub Pages (Settings → Pages → rama principal, carpeta raíz). Abre la URL en Safari o Chrome y usa «Añadir a pantalla de inicio».

## Secciones

| Sección | Qué hace |
|---|---|
| Resumen | Gastos de hoy, semana, mes y año de un vistazo. Selector Día / Semana / Mes / Año con comparativa frente al periodo anterior, gráfico, categorías, análisis (media diaria, proyección al cierre, mayor gasto), accesos rápidos, próximos cargos y cuentas. |
| Movimientos | Historial completo con buscador y filtros por tipo, categoría y cuenta. Exportación a CSV. |
| Calendario | Mapa de calor del gasto diario y detalle de cada día. |
| Informes | Año completo mes a mes, medias diaria/semanal/mensual/anual, totales por categoría, CSV e impresión. |
| Gastos / Ingresos | Totales, media diaria, evolución y desglose por categoría con filtro. |
| Nómina | Registro de bruto, IRPF, Seguridad Social y neto. Cada nómina crea su ingreso. Botón «Repetir última» y calculadora de neto. |
| Recurrentes | Alquiler, suscripciones, seguros o sueldo: se registran solos al vencer. Coste fijo mensual y anual. |
| Presupuestos | Límite mensual por categoría, lo que queda por día y proyección de cierre. |
| Ahorro | Metas con progreso, aportaciones y cuánto apartar al mes para llegar a tiempo. |
| Deudas | Lo que debes y lo que te deben, con pagos que pueden registrarse como gasto o ingreso. |
| Inversiones | Capital invertido, valor actual y rentabilidad. |
| Cuentas y efectivo | Patrimonio neto desglosado. Apartado de cuentas bancarias y otro de efectivo por lugares (casa, cartera, caja fuerte…). Añadir, editar, archivar o eliminar cuentas, mover dinero entre ellas y «Ajustar saldo» para fijar la cantidad real, añadir o retirar dinero sin que cuente como gasto o ingreso. |
| Ajustes | Nombre, moneda, inicio de semana, tema, categorías, accesos rápidos, copia de seguridad e importación. |

## Añadir gastos rápido

- Botón **+** (barra inferior en móvil, lateral en escritorio) o tecla **N**. La tecla **I** abre un ingreso.
- Escribe el importe, toca la categoría y pulsa **Intro**. Las categorías que más usas aparecen primero.
- **Accesos rápidos** del Resumen: con importe fijo (p. ej. «Café 1,50 €») se guardan con un toque. Se configuran en Ajustes.
- Tras guardar o borrar aparece **Deshacer**.

## Tus datos

Se guardan en el `localStorage` del navegador y no salen del dispositivo. Exporta una copia de seguridad desde **Ajustes → Tus datos** de vez en cuando o para pasarlos a otro dispositivo. En Ajustes también puedes cargar datos de ejemplo para probar la app.

## Estructura

```
index.html            Página y estructura
css/styles.css        Estilo cristal líquido, temas y diseño adaptable
js/utils.js           Fechas, periodos y formato
js/store.js           Datos, persistencia y cálculos
js/ui.js              Modales, avisos y componentes
js/charts.js          Gráficos SVG
js/forms.js           Formularios de alta y edición
js/views-main.js      Resumen, Movimientos, Gastos, Ingresos, Calendario, Informes
js/views-plan.js      Nómina, Recurrentes, Presupuestos, Ahorro, Deudas, Inversiones, Cuentas, Ajustes
js/app.js             Navegación, exportación y datos de ejemplo
sw.js                 Funcionamiento sin conexión
```

# PROYECTA-IA — CAPÍTULO V: EVALUACIÓN ECONÓMICA-FINANCIERA

## Nombre recomendado del repositorio

`proyecta-ia-evaluacion-financiera`

URL esperada:

`https://luisctito-sketch.github.io/proyecta-ia-evaluacion-financiera/`

## Cuándo corresponde utilizar este módulo

Cuando el proyecto dispone de beneficios monetarios, ingresos, ahorros o flujos de caja verificables y se desea determinar factibilidad/prefactibilidad económico-financiera.

Es especialmente aplicable a:
- servicios de telecomunicaciones;
- servicios de Internet;
- telefonía móvil/celular;
- redes privadas con cobros o ahorros cuantificables;
- proyectos de inversión tecnológica;
- proyectos productivos o institucionales con flujos monetarios.

## Indicadores

Principales:
- VAN
- TIR
- TRC/PRI

Complementarios:
- TIRM
- TRC descontado
- B/C
- ROI
- PI
- VAE

## Secuencia metodológica

1. Inversión inicial.
2. Beneficios/ingresos.
3. Costos y gastos.
4. Vida económica.
5. TMAR/tasa de descuento.
6. Depreciación e impuestos cuando correspondan.
7. Valor residual y recuperación de capital de trabajo.
8. Flujo de fondos.
9. Flujo descontado.
10. Indicadores.
11. Sensibilidad.
12. Interpretación.

## Modelo TALAB ART incorporado

El archivo proporcionado se organiza en:
- `PARAMETROS`
- `INGRESOS-COSTOS`
- `FLUJO Y EVALUACIÓN`

PROYECTA-IA reproduce esta lógica de manera flexible.

## Excel

VAN:
`=VNA(tasa;flujos_1_a_n)+flujo_0`

TIR:
`=TIR(rango_flujos)`

TIRM:
`=TIRM(rango;tasa_financiamiento;tasa_reinversión)`

TRC:
se obtiene con flujo acumulado + interpolación.

B/C:
no tiene una función única; se calcula como VP(Beneficios)/VP(Costos).

ROI:
no tiene una función única.

## Advertencias

- `VNA` no incluye el flujo del año 0; debe sumarse aparte.
- `TIR` sí utiliza todo el rango, incluido el año 0.
- Si existen varios cambios de signo, la TIR puede ser múltiple o ambigua.
- No confundir utilidad contable con flujo de efectivo.
- No inventar beneficios para forzar factibilidad.
- Cada tabla debe acompañarse de interpretación.

## Acceso

Usa la base central:
`https://luisctito-sketch.github.io/proyecta-ia-acceso/access.js`

## Archivos

- `index.html`
- `styles.css`
- `app.js`
- `README.md`
- `GUIA_EXCEL.md`
- `TALAB_ART_MODELO.md`
- `plantilla_flujo_financiero.csv`

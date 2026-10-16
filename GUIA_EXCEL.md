# GUÍA EXCEL — EVALUACIÓN ECONÓMICA-FINANCIERA

## VAN
Excel español:
`=VNA(tasa;flujos_1_a_n)+flujo_0`

Excel inglés:
`=NPV(rate,flows_1_to_n)+flow_0`

### Regla crítica
VNA/NPV descuenta los periodos desde el año 1. El flujo del año 0 se suma aparte.

## TIR
`=TIR(rango_completo)`

El rango debe incluir el flujo negativo del año 0.

## TIRM
`=TIRM(rango;tasa_financiamiento;tasa_reinversion)`

## TRC
No existe una función única. Construir:
1. flujo neto;
2. flujo acumulado;
3. localizar el primer año no negativo;
4. interpolar:
`año anterior + saldo pendiente / flujo del año de recuperación`

## TRC descontado
Repetir el procedimiento usando el flujo descontado.

## B/C
No existe función única:
`VP(Beneficios) / VP(Costos)`

## ROI
Ejemplo:
`=(SUMA(flujos_futuros)-ABS(flujo_0))/ABS(flujo_0)`

## PI
`=VP_flujos_futuros/ABS(flujo_0)`

## VAE
`=VAN*(i*(1+i)^n)/((1+i)^n-1)`

## Proyección lineal
`=PRONOSTICO.LINEAL(x;y_conocidos;x_conocidos)`

## Tendencia
`=TENDENCIA(y;x;nuevos_x)`

## Crecimiento exponencial
`=CRECIMIENTO(y;x;nuevos_x)`

## Recomendación
El modelo de proyección debe seleccionarse por el comportamiento real de los datos, no por apariencia gráfica.

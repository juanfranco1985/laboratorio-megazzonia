# Fraude transaccional - reporte de modelo

Pipeline real ejecutable para la ficha `fraude-rnn`.

## Dataset

- Filas sinteticas: 5000
- Tasa de fraude simulada: 10.88%
- Separacion temporal: 70% entrenamiento, 15% validacion, 15% prueba.

## Resultado en prueba

- Umbral calibrado: 0.51
- Precision: 33.33%
- Recall: 64.20%
- F1: 43.88%
- ROC-AUC: 83.28%
- Tasa de alertas: 20.80%
- Matriz: TP=52, FP=104, TN=565, FN=29

## Variables mas influyentes

- `card_present`: proteccion (-0.541)
- `new_device`: riesgo (0.499)
- `is_night`: riesgo (0.490)
- `log_amount_to_avg`: riesgo (0.487)
- `is_foreign`: riesgo (0.341)
- `previous_declines`: riesgo (0.334)

## Lectura operativa

El modelo prioriza alertas con una logica interpretable: monto atipico, riesgo de comercio/pais, velocidad reciente, transacciones no presenciales y comportamiento nocturno.
No reemplaza un modelo productivo entrenado con datos reales; sirve como base reproducible para demostrar el flujo completo de analisis, entrenamiento, calibracion y reporte.

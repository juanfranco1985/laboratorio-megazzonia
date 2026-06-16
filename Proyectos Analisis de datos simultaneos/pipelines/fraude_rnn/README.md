# Pipeline real: fraude transaccional

Este modulo convierte la ficha `fraude-rnn` en un flujo ejecutable de analisis de datos.

## Que hace

- Genera transacciones sinteticas con variables de comportamiento, riesgo de comercio/pais, velocidad reciente y senales de dispositivo.
- Simula una etiqueta `is_fraud` con desbalance de clases.
- Divide el dataset con separacion temporal: entrenamiento, validacion y prueba.
- Entrena un clasificador interpretable de regresion logistica ponderada.
- Calibra el umbral de alerta en validacion.
- Evalua precision, recall, F1, ROC-AUC, tasa de alertas y matriz de confusion.
- Exporta dataset, predicciones, modelo serializado y reporte Markdown.

## Ejecutar

Desde la raiz del repositorio:

```powershell
python "Proyectos Analisis de datos simultaneos\pipelines\fraude_rnn\fraud_pipeline.py"
```

Parametros utiles:

```powershell
python "Proyectos Analisis de datos simultaneos\pipelines\fraude_rnn\fraud_pipeline.py" --rows 8000 --seed 7
```

## Artefactos

La ejecucion escribe en `pipelines/fraude_rnn/artifacts/`:

- `data/transactions.csv`: dataset sintetico completo.
- `models/fraud_model.json`: pesos, scaler y umbral calibrado.
- `reports/metrics.json`: metricas completas.
- `reports/model_report.md`: resumen ejecutivo del resultado.
- `reports/test_predictions.csv`: predicciones sobre el split de prueba.

## Resultado reproducible incluido

Con `--rows 5000 --seed 42`, el reporte generado deja esta linea base:

- Tasa de fraude simulada: 10.88%.
- Umbral calibrado: 0.51.
- Precision en prueba: 33.33%.
- Recall en prueba: 64.20%.
- F1 en prueba: 43.88%.
- ROC-AUC en prueba: 83.28%.

## Alcance

Este pipeline demuestra el flujo real de ciencia de datos sin datos sensibles ni dependencias externas. Para produccion, el siguiente paso es reemplazar el simulador por datos transaccionales reales, agregar validacion temporal estricta por cliente y entrenar modelos secuenciales como LSTM/GRU u otra arquitectura especializada.

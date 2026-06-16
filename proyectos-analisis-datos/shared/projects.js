(function () {
  const projects = [
    {
      id: "fraude-rnn",
      number: 1,
      title: "Deteccion de Fraude Financiero Transaccional en Tiempo Real con RNN",
      shortTitle: "Fraude transaccional",
      domain: "Finanzas",
      level: "Alta complejidad",
      horizon: "10 a 12 semanas",
      accent: "#0f766e",
      status: "validado",
      objective:
        "Construir una arquitectura analitica capaz de simular, procesar y puntuar transacciones en streaming para detectar fraude con baja latencia y alta precision operacional.",
      summary:
        "El proyecto combina simulacion de eventos, tratamiento de desbalance extremo, reduccion de dimensionalidad con autoencoders y modelos secuenciales RNN/LSTM para producir alertas accionables.",
      challenge: [
        "Desbalance de clases extremo, con fraude minoritario y coste alto por falso negativo.",
        "Ruido transaccional, patrones no estacionarios y cambios de comportamiento por cliente.",
        "Necesidad de puntuar eventos casi en tiempo real sin perder trazabilidad del modelo."
      ],
      folderTree: [
        "data/raw/transactions_stream.jsonl",
        "data/processed/customer_sequences.parquet",
        "data/reference/fraud_labels.csv",
        "src/streaming/simulator.py",
        "src/features/window_builder.py",
        "src/models/autoencoder.py",
        "src/models/lstm_detector.py",
        "src/evaluation/threshold_calibration.py",
        "dashboards/fraud_monitor/",
        "models/autoencoder.joblib",
        "models/lstm_fraud.onnx",
        "notebooks/01_explainability.ipynb"
      ],
      methodology: [
        "Simular un stream con event time, transacciones tardias, duplicados controlados y ventanas por cliente, comercio y dispositivo.",
        "Preparar variables de comportamiento: velocidad de gasto, distancia geografica, riesgo del comercio, desviacion contra historico y agregados temporales.",
        "Entrenar un autoencoder para representar transacciones normales y usar error de reconstruccion mas embeddings latentes como senales de anomalia.",
        "Entrenar una RNN/LSTM sobre secuencias por cliente para capturar cambios de patron y dependencias temporales.",
        "Calibrar umbrales con precision-recall, coste esperado, focal loss y validacion temporal."
      ],
      deliverables: [
        "Pipeline reproducible en `pipelines/fraude_rnn/` con datos sinteticos, entrenamiento, calibracion y reporte.",
        "Modelo serializado y versionado para inferencia batch y online.",
        "Dashboard con PR-AUC, recall en fraude, tasa de alertas, latencia y matriz de costes.",
        "Notebook explicativo con arquitectura, supuestos, interpretabilidad y analisis de errores.",
        "Script reproducible para simular el stream y generar un lote de evaluacion."
      ],
      metrics: ["PR-AUC", "Recall@alert_budget", "F1 fraud", "Latency p95"],
      stack: ["Python", "PyTorch", "Pandas", "ONNX", "Streamlit"],
      acceptance: [
        "Separacion temporal estricta entre entrenamiento y prueba.",
        "Reporte de impacto de falsos positivos por segmento.",
        "Explicacion por alerta con variables principales y contexto historico."
      ]
    },
    {
      id: "energia-jerarquica",
      number: 2,
      title: "Prediccion de Consumo Energetico Urbano a Gran Escala con Modelos Jerarquicos",
      shortTitle: "Consumo energetico",
      domain: "Series temporales",
      level: "Alta complejidad",
      horizon: "8 a 10 semanas",
      accent: "#2563eb",
      objective:
        "Predecir demanda energetica en hogares, distritos y ciudad integrando clima, precios, calendario y reconciliacion jerarquica.",
      summary:
        "El proyecto organiza multiples series temporales y fuentes externas para producir pronosticos coherentes entre niveles de agregacion y robustos frente a estacionalidades multiples.",
      challenge: [
        "Estacionalidad diaria, semanal y anual con eventos especiales y dias festivos.",
        "Correlacion cruzada entre clima, precio, ocupacion y consumo.",
        "Necesidad de que las predicciones por hogar, distrito y ciudad sean consistentes entre si."
      ],
      folderTree: [
        "data/raw/meters/",
        "data/raw/weather/",
        "data/raw/prices/",
        "data/processed/panel_timeseries.parquet",
        "src/ingestion/simulate_sources.py",
        "src/features/calendar_features.py",
        "src/models/sarimax.py",
        "src/models/prophet_baseline.py",
        "src/models/hierarchical_ml.py",
        "src/evaluation/backtesting.py",
        "reports/forecast_reconciliation.md"
      ],
      methodology: [
        "Crear un panel multivariado con granularidad horaria y claves hogar, distrito y ciudad.",
        "Generar variables exogenas: temperatura, humedad, precio, festivos, lags, medias moviles y Fourier terms.",
        "Comparar SARIMAX, Prophet y modelos de boosting con variables rezagadas.",
        "Aplicar reconciliacion jerarquica bottom-up, top-down o MinT para coherencia entre niveles.",
        "Evaluar con backtesting de ventanas rodantes y cortes por estacion."
      ],
      deliverables: [
        "Codigo de ingesta y simulacion de fuentes heterogeneas.",
        "Script de evaluacion de modelos con backtesting reproducible.",
        "Reporte de errores por nivel jerarquico y horizonte de prediccion.",
        "Dashboard de demanda prevista, intervalos y drivers principales."
      ],
      metrics: ["sMAPE", "MASE", "RMSE", "Coherencia jerarquica"],
      stack: ["Python", "Statsmodels", "Prophet", "LightGBM", "Plotly"],
      acceptance: [
        "Predicciones coherentes entre hogar, distrito y ciudad.",
        "Comparacion clara contra un baseline estacional ingenuo.",
        "Intervalos de confianza o cuantiles para planificacion operativa."
      ]
    },
    {
      id: "legal-nlp",
      number: 3,
      title: "Clasificacion y Sumarizacion Automatica de Documentos Legales",
      shortTitle: "Documentos legales",
      domain: "PLN",
      level: "Alta complejidad",
      horizon: "9 a 11 semanas",
      accent: "#7c3aed",
      objective:
        "Clasificar clausulas legales y generar resumenes abstractivos de documentos extensos como terminos y condiciones.",
      summary:
        "El proyecto estructura un pipeline de NLP para textos largos, combinando segmentacion por clausulas, transformers para clasificacion y modelos generativos para resumen controlado.",
      challenge: [
        "Longitud alta de documentos, jerga especializada y referencias cruzadas.",
        "Clases de clausulas desbalanceadas y con limites ambiguos.",
        "Necesidad de resumenes fieles, auditables y sin inventar obligaciones."
      ],
      folderTree: [
        "data/raw/contracts/",
        "data/annotations/clause_labels.csv",
        "data/processed/chunks.parquet",
        "src/preprocessing/segment_documents.py",
        "src/preprocessing/tokenize_split.py",
        "src/models/clause_classifier.py",
        "src/models/abstractive_summarizer.py",
        "src/evaluation/legal_rubric.py",
        "notebooks/error_analysis.ipynb",
        "reports/model_card.md"
      ],
      methodology: [
        "Segmentar documentos en clausulas y chunks compatibles con el limite de tokens.",
        "Entrenar BERT o RoBERTa para clasificacion multicategoria y multilabel cuando aplique.",
        "Usar BART o T5 para resumen abstractivo con controles de longitud y verificacion de fidelidad.",
        "Evaluar clasificacion con macro F1 y resumen con ROUGE mas revision humana por criterios legales.",
        "Registrar ejemplos dificiles, sesgos de corpus y limites de uso profesional."
      ],
      deliverables: [
        "Codigo base de tokenizacion, split estratificado y preparacion de datasets.",
        "Modelo de clasificacion de clausulas con reporte por clase.",
        "Servicio de resumen con trazabilidad al texto fuente.",
        "Notebook de analisis de errores y ficha tecnica del modelo."
      ],
      metrics: ["Macro F1", "Exact match por clausula", "ROUGE-L", "Fidelidad humana"],
      stack: ["Python", "Hugging Face", "PyTorch", "spaCy", "DVC"],
      acceptance: [
        "Separacion de entrenamiento por documento, no solo por chunk.",
        "Resumen con citas o referencias a segmentos fuente.",
        "Advertencia explicita de que la salida no reemplaza revision legal."
      ],
      starterCode: [
        "from datasets import Dataset",
        "from transformers import AutoTokenizer",
        "from sklearn.model_selection import train_test_split",
        "",
        "tokenizer = AutoTokenizer.from_pretrained('roberta-base')",
        "train_docs, test_docs = train_test_split(documents, test_size=0.2, stratify=labels)",
        "",
        "def tokenize(batch):",
        "    return tokenizer(batch['text'], truncation=True, padding='max_length', max_length=512)",
        "",
        "dataset = Dataset.from_dict({'text': train_docs, 'label': train_labels})",
        "tokenized = dataset.map(tokenize, batched=True)"
      ]
    },
    {
      id: "cartera-montecarlo",
      number: 4,
      title: "Optimizacion Estocastica de Cartera con Simulacion Montecarlo Avanzada",
      shortTitle: "Cartera Montecarlo",
      domain: "Finanzas",
      level: "Alta complejidad",
      horizon: "7 a 9 semanas",
      accent: "#b45309",
      objective:
        "Optimizar una cartera incorporando restricciones no lineales de riesgo, escenarios estocasticos y sensibilidad de supuestos.",
      summary:
        "El proyecto supera una frontera media-varianza basica al integrar simulaciones, Value at Risk, Conditional VaR, restricciones de concentracion y analisis de robustez.",
      challenge: [
        "Maximizar retorno ajustado por riesgo sin depender de supuestos gaussianos simplistas.",
        "Manejar restricciones de liquidez, concentracion, turnover y exposicion sectorial.",
        "Comunicar sensibilidades de la cartera ante cambios de volatilidad, correlacion y horizonte."
      ],
      folderTree: [
        "data/raw/prices/",
        "data/processed/returns.parquet",
        "src/data/market_loader.py",
        "src/risk/var_cvar.py",
        "src/optimization/constraints.py",
        "src/optimization/efficient_frontier.py",
        "src/simulation/montecarlo_paths.py",
        "notebooks/simulations/portfolio_stress.ipynb",
        "reports/technical_assumptions.md",
        "reports/sensitivity_analysis.md"
      ],
      methodology: [
        "Construir retornos limpios, volatilidades, correlaciones y escenarios por regimen de mercado.",
        "Comparar Markowitz, optimizacion cuadratica y enfoques con CVaR o penalizaciones no lineales.",
        "Ejecutar Montecarlo para distribuciones de retorno, VaR, CVaR, drawdown y probabilidad de perdida.",
        "Aplicar restricciones de maximo peso, exposicion por sector, liquidez minima y turnover.",
        "Reportar sensibilidad ante cambios en correlaciones, volatilidad y expectativas de retorno."
      ],
      deliverables: [
        "Motor de optimizacion reproducible con parametros configurables.",
        "Notebook de simulaciones y stress testing.",
        "Informe tecnico de supuestos, riesgos y sensibilidades.",
        "Dashboard de frontera eficiente, distribucion simulada y composicion final."
      ],
      metrics: ["Sharpe", "Sortino", "VaR", "CVaR", "Max drawdown"],
      stack: ["Python", "NumPy", "SciPy", "cvxpy", "Plotly"],
      acceptance: [
        "Backtest fuera de muestra y comparacion con cartera benchmark.",
        "Validacion de restricciones antes y despues de la optimizacion.",
        "Informe claro de limitaciones por datos y supuestos."
      ]
    },
    {
      id: "mri-unet",
      number: 5,
      title: "Segmentacion Semantica de Tumores en MRI con U-Net",
      shortTitle: "MRI U-Net",
      domain: "Vision computadora",
      level: "Alta complejidad",
      horizon: "10 a 14 semanas",
      accent: "#be123c",
      objective:
        "Desarrollar un pipeline de segmentacion semantica para tumores en imagenes MRI, con foco en precision, reproducibilidad y control de calidad.",
      summary:
        "El proyecto cubre lectura DICOM, normalizacion, aumento de datos, entrenamiento U-Net, metricas medicas y revision visual de mascaras predichas.",
      challenge: [
        "Datos limitados, clases pequenas y alta variabilidad de intensidad entre equipos.",
        "Necesidad de segmentar bordes con precision y reducir falsos positivos clinicamente costosos.",
        "Evaluacion rigurosa con Dice, Jaccard y analisis por caso, no solo promedio global."
      ],
      folderTree: [
        "data/raw/dicom/",
        "data/processed/nifti/",
        "data/masks/expert_annotations/",
        "src/preprocessing/dicom_to_nifti.py",
        "src/preprocessing/intensity_normalization.py",
        "src/augmentation/medical_transforms.py",
        "src/models/unet.py",
        "src/training/train_unet.py",
        "src/evaluation/segmentation_metrics.py",
        "src/inference/predict_mask.py",
        "reports/clinical_review_pack/"
      ],
      methodology: [
        "Convertir DICOM a formato de trabajo preservando metadatos relevantes y orientacion espacial.",
        "Normalizar intensidad, recortar regiones de interes y validar alineacion entre imagen y mascara.",
        "Aplicar aumentos realistas: rotacion leve, elastic deformation, cambios de contraste y ruido controlado.",
        "Entrenar U-Net 2D o 3D con Dice loss, focal loss y validacion cruzada por paciente.",
        "Evaluar Dice, Jaccard, sensibilidad, especificidad y revision visual de errores."
      ],
      deliverables: [
        "Scripts de preprocesamiento DICOM y aumento de datos.",
        "Modelo U-Net entrenado con pesos versionados.",
        "Reporte de metricas por paciente y visualizaciones de overlays.",
        "Guia de limitaciones y criterios para revision por especialista."
      ],
      metrics: ["Dice", "Jaccard", "Sensitivity", "Hausdorff distance"],
      stack: ["Python", "PyTorch", "MONAI", "pydicom", "SimpleITK"],
      acceptance: [
        "Split por paciente para evitar fuga de datos.",
        "Registro de parametros de preprocesamiento e inferencia.",
        "Salidas marcadas como apoyo tecnico, no diagnostico autonomo."
      ]
    },
    {
      id: "recomendador-xai",
      number: 6,
      title: "Motor de Recomendacion Hibrido y Explicable",
      shortTitle: "Recomendador XAI",
      domain: "Recomendadores",
      level: "Alta complejidad",
      horizon: "8 a 10 semanas",
      accent: "#0891b2",
      objective:
        "Crear un recomendador hibrido que combine senales colaborativas, contenido de items y explicaciones legibles para usuarios y negocio.",
      summary:
        "El proyecto resuelve arranque en frio con embeddings de contenido y mejora transparencia mediante explicaciones basadas en factores, atributos e importancia de senales.",
      challenge: [
        "Arranque en frio para usuarios o items con pocas interacciones.",
        "Balance entre precision, diversidad, novedad y explicabilidad.",
        "Necesidad de evaluar ranking, cobertura y razones de recomendacion."
      ],
      folderTree: [
        "data/ratings/interactions.csv",
        "data/items/catalog.csv",
        "data/features/item_embeddings.parquet",
        "src/recommenders/collaborative_als.py",
        "src/recommenders/content_based.py",
        "src/recommenders/hybrid_ranker.py",
        "src/explainability/reason_generator.py",
        "src/evaluation/ranking_metrics.py",
        "pipelines/train_evaluate.py",
        "reports/recommendation_audit.md"
      ],
      methodology: [
        "Crear matriz usuario-item con implicit feedback, pesos por recencia y filtros de calidad.",
        "Entrenar SVD o ALS para colaborativo y embeddings de texto o imagen para contenido.",
        "Combinar candidatos con un ranker hibrido que pondera afinidad, popularidad, diversidad y freshness.",
        "Generar explicaciones con atributos compartidos, factores latentes interpretados y SHAP o LIME cuando aplique.",
        "Evaluar NDCG, MAP, recall@k, cobertura, diversidad y desempeno en escenarios de arranque en frio."
      ],
      deliverables: [
        "Pipeline modular para entrenar y evaluar componentes colaborativos y de contenido.",
        "Servicio de recomendacion top-k con explicacion por item.",
        "Reporte de trade-offs entre precision, cobertura y transparencia.",
        "Dataset sintetico o anonimizado para demostracion end-to-end."
      ],
      metrics: ["NDCG@K", "MAP@K", "Recall@K", "Coverage", "Diversity"],
      stack: ["Python", "implicit", "scikit-learn", "LightGBM", "SHAP"],
      acceptance: [
        "Medicion separada para usuarios nuevos, items nuevos y usuarios recurrentes.",
        "Explicaciones no basadas en datos sensibles.",
        "Comparacion contra popularidad y recomendador de contenido puro."
      ],
      starterCode: [
        "def train_pipeline(interactions, item_features, config):",
        "    collaborative = train_als(interactions, config['als'])",
        "    content_index = build_content_index(item_features, config['embeddings'])",
        "    candidates = generate_candidates(collaborative, content_index, config['top_k'])",
        "    hybrid_model = train_ranker(candidates, interactions, item_features)",
        "    metrics = evaluate_ranker(hybrid_model, interactions, k=config['eval_k'])",
        "    return hybrid_model, metrics"
      ]
    },
    {
      id: "rul-industrial",
      number: 7,
      title: "Prediccion del Tiempo Restante de Vida Util de Activos Industriales Criticos",
      shortTitle: "RUL industrial",
      domain: "Industria",
      level: "Alta complejidad",
      horizon: "8 a 12 semanas",
      accent: "#4d7c0f",
      objective:
        "Predecir vida util restante de activos industriales usando sensores multivariados, deteccion de anomalias y modelos supervisados o de supervivencia.",
      summary:
        "El proyecto transforma telemetria de sensores en ventanas temporales, maneja ruido y faltantes, y produce predicciones de RUL con incertidumbre operacional.",
      challenge: [
        "Series multivariadas con valores perdidos, drift, ruido y fallas raras.",
        "Variable objetivo continua que depende del historial operativo y regimen de uso.",
        "Necesidad de explicar alertas para mantenimiento y priorizacion de activos."
      ],
      folderTree: [
        "data/raw/sensors/",
        "data/raw/failures/",
        "data/processed/rul_windows.parquet",
        "src/preprocessing/sensor_quality.py",
        "src/features/degradation_features.py",
        "src/models/gradient_boosting_rul.py",
        "src/models/survival_cox.py",
        "src/evaluation/rul_metrics.py",
        "src/monitoring/drift_report.py",
        "dashboards/maintenance_priorities/"
      ],
      methodology: [
        "Construir ventanas por activo con estadisticos, tendencias, energia de senal y eventos de mantenimiento.",
        "Imputar faltantes con metodos conscientes de tiempo y marcar gaps como features.",
        "Comparar regresion avanzada, Gradient Boosting, modelos de supervivencia Cox y enfoques secuenciales.",
        "Calibrar incertidumbre y priorizar activos por riesgo, criticidad y coste de parada.",
        "Validar con split por activo y por tiempo para medir generalizacion realista."
      ],
      deliverables: [
        "Modelo entrenado con pipeline de features versionado.",
        "Metricas RMSE, MAE y alpha-lambda accuracy.",
        "Dashboard de ranking de activos, intervalo de RUL y drivers principales.",
        "Reporte de calidad de sensores y drift."
      ],
      metrics: ["RMSE", "MAE", "alpha-lambda accuracy", "Concordance index"],
      stack: ["Python", "scikit-learn", "XGBoost", "lifelines", "Evidently"],
      acceptance: [
        "Split que impida mezclar ciclos del mismo activo entre train y test.",
        "Explicacion de variables de degradacion mas influyentes.",
        "Umbrales operativos alineados con criticidad y capacidad de mantenimiento."
      ]
    },
    {
      id: "absa-productos",
      number: 8,
      title: "Analisis de Sentimiento Basado en Aspectos para Resenas de Productos",
      shortTitle: "ABSA productos",
      domain: "PLN",
      level: "Alta complejidad",
      horizon: "7 a 9 semanas",
      accent: "#db2777",
      objective:
        "Identificar aspectos mencionados en resenas y asignar sentimiento especifico a cada aspecto dentro de la misma frase.",
      summary:
        "El proyecto combina extraccion de aspectos, clasificacion de polaridad y evaluacion a nivel span para capturar opiniones multiples y contradictorias.",
      challenge: [
        "Una misma resena puede contener sentimientos opuestos para bateria, camara, precio o soporte.",
        "La tokenizacion y el etiquetado deben preservar spans, negaciones y dependencias gramaticales.",
        "Se requiere salida estructurada para analisis de producto y no solo una polaridad global."
      ],
      folderTree: [
        "data/raw/reviews.csv",
        "data/annotations/aspect_spans.jsonl",
        "data/processed/absa_dataset.parquet",
        "src/preprocessing/text_normalization.py",
        "src/models/aspect_extractor.py",
        "src/models/sentiment_classifier.py",
        "src/models/joint_bert_absa.py",
        "src/evaluation/span_sentiment_metrics.py",
        "examples/predictions.json",
        "reports/product_insights.md"
      ],
      methodology: [
        "Etiquetar aspectos con BIO tagging y asociar cada span con polaridad positiva, negativa, neutral o mixta.",
        "Entrenar un BERT especifico de dominio o una arquitectura conjunta de extraccion y sentimiento.",
        "Incorporar atencion o features de dependencia para vincular aspecto y opinion cercana.",
        "Evaluar exactitud de span, F1 por aspecto y accuracy de sentimiento condicionado al aspecto correcto.",
        "Agregar resultados por producto para descubrir fortalezas, debilidades y cambios temporales."
      ],
      deliverables: [
        "Dataset etiquetado o sintetico con aspectos y polaridades.",
        "Modelo ABSA con inferencia en JSON estructurado.",
        "Reporte de metricas por aspecto y ejemplos de errores.",
        "Vista analitica de sentimientos por atributo de producto."
      ],
      metrics: ["Aspect F1", "Sentiment accuracy", "Exact span match", "Macro F1"],
      stack: ["Python", "Hugging Face", "spaCy", "PyTorch", "Plotly"],
      acceptance: [
        "Soporte para multiples aspectos dentro de una misma frase.",
        "Manejo explicito de negaciones y sentimientos mixtos.",
        "Salida JSON validable para integracion con producto."
      ],
      exampleOutput: {
        input: "La bateria dura todo el dia, pero la camara falla con poca luz.",
        output: [
          { aspect: "bateria", sentiment: "positivo" },
          { aspect: "camara", sentiment: "negativo" }
        ]
      }
    },
    {
      id: "genomica-clustering",
      number: 9,
      title: "Identificacion de Subtipos de Enfermedades con Clustering de Alta Dimensionalidad",
      shortTitle: "Clustering genomico",
      domain: "Bioinformatica",
      level: "Alta complejidad",
      horizon: "9 a 12 semanas",
      accent: "#9333ea",
      objective:
        "Descubrir subtipos potenciales de enfermedad agrupando muestras por miles de caracteristicas geneticas y validando estabilidad biologica.",
      summary:
        "El proyecto aborda expresion genomica de alta dimensionalidad con control de calidad, reduccion de dimensionalidad, clustering robusto y visualizaciones interactivas.",
      challenge: [
        "Maldicion de la dimensionalidad, redundancia entre genes y ruido experimental.",
        "Riesgo de encontrar clusters artificiales por batch effects o normalizacion deficiente.",
        "Necesidad de interpretar grupos con marcadores biologicos y estabilidad estadistica."
      ],
      folderTree: [
        "data/expression/raw_counts.csv",
        "data/expression/normalized_counts.parquet",
        "data/metadata/sample_metadata.csv",
        "src/preprocessing/qc_normalization.py",
        "src/features/gene_filtering.py",
        "src/models/dimensionality_reduction.py",
        "src/models/hdbscan_clustering.py",
        "src/validation/cluster_stability.py",
        "src/visualization/interactive_umap.py",
        "reports/biological_interpretation.md"
      ],
      methodology: [
        "Aplicar control de calidad, normalizacion, filtrado de baja varianza y correccion de batch effects.",
        "Reducir dimensionalidad con PCA para limpieza inicial y UMAP o t-SNE para visualizacion.",
        "Comparar DBSCAN, HDBSCAN y clustering jerarquico sobre espacios reducidos y features seleccionadas.",
        "Validar estabilidad con bootstrap, silhouette adaptado, enrichment y consistencia con metadata clinica.",
        "Construir visualizaciones interactivas con clusters, genes marcadores y filtros por covariables."
      ],
      deliverables: [
        "Pipeline reproducible de QC, normalizacion y clustering.",
        "Visualizacion interactiva de clusters en espacio de baja dimensionalidad.",
        "Reporte de genes marcadores, enriquecimiento y sensibilidad de parametros.",
        "Archivo de asignacion de subtipo por muestra con nivel de confianza."
      ],
      metrics: ["Silhouette", "DBCV", "Cluster stability", "Enrichment score"],
      stack: ["Python", "Scanpy", "UMAP", "HDBSCAN", "Dash"],
      acceptance: [
        "Control documentado de batch effects y covariables tecnicas.",
        "Resultados reproducibles con semillas y parametros versionados.",
        "Interpretacion biologica separada de conclusiones clinicas definitivas."
      ]
    },
    {
      id: "kaggle-feature-engineering",
      number: 10,
      title: "Pipeline de Feature Engineering Competitivo y Automatizado",
      shortTitle: "Feature engineering",
      domain: "MLOps",
      level: "Alta complejidad",
      horizon: "6 a 8 semanas",
      accent: "#c2410c",
      objective:
        "Disenar un pipeline tabular reutilizable para competencias Kaggle con generacion automatizada de features, validacion robusta y tuning bayesiano.",
      summary:
        "El proyecto prioriza rendimiento competitivo sin sacrificar reproducibilidad: features temporales, categoricas, interacciones, target encoding controlado y busqueda con Optuna.",
      challenge: [
        "Crear mas de 30 features utiles sin introducir fuga de datos.",
        "Adaptar el pipeline a datasets tabulares diversos con minimo cambio de configuracion.",
        "Optimizar modelos potentes manteniendo trazabilidad de experimentos y validacion fiable."
      ],
      folderTree: [
        "data/raw/train.csv",
        "data/raw/test.csv",
        "data/processed/features.parquet",
        "configs/competition.yaml",
        "src/features/base_features.py",
        "src/features/temporal_features.py",
        "src/features/categorical_encoding.py",
        "src/features/interactions.py",
        "src/tuning/optuna_search.py",
        "src/models/lightgbm_model.py",
        "src/pipelines/preprocess_train.py",
        "submissions/submission.csv"
      ],
      methodology: [
        "Definir un esquema configurable de columnas numericas, categoricas, temporales, texto corto y objetivo.",
        "Generar features temporales, one-hot, target encoding con out-of-fold, ratios, agregados e interacciones.",
        "Entrenar LightGBM o CatBoost con validacion K-fold, GroupKFold o TimeSeriesSplit segun el caso.",
        "Optimizar hiperparametros con Optuna y registrar experimentos, semillas, metricas y artefactos.",
        "Producir submission reproducible y reporte de importancia, leakage checks y ablation de features."
      ],
      deliverables: [
        "Script modular de preprocesamiento reutilizable.",
        "Catalogo de mas de 30 features con activacion por configuracion.",
        "Pipeline de entrenamiento, tuning y generacion de submission.",
        "Reporte de CV, leaderboard local, importancia y ablation."
      ],
      metrics: ["CV score", "Leaderboard proxy", "Feature gain", "Training time"],
      stack: ["Python", "Pandas", "LightGBM", "CatBoost", "Optuna"],
      acceptance: [
        "Target encoding siempre out-of-fold.",
        "Configuracion externa para adaptar columnas y metrica.",
        "Reproduccion de resultados con semilla, folds persistidos y artefactos versionados."
      ]
    }
  ];

  if (typeof window !== "undefined") {
    window.DATA_PROJECTS = projects;
  }

  if (typeof module !== "undefined") {
    module.exports = projects;
  }
})();

#!/usr/bin/env python3
"""Pipeline reproducible de deteccion de fraude transaccional.

Este modulo usa solo la libreria estandar de Python para que el proyecto pueda
ejecutarse sin instalar dependencias externas. Genera un dataset sintetico,
entrena una regresion logistica con ponderacion de clase, calibra el umbral en
validacion y produce artefactos de evaluacion.
"""

from __future__ import annotations

import argparse
import csv
import json
import math
import random
from dataclasses import dataclass
from pathlib import Path
from statistics import mean
from typing import Iterable


FEATURES = [
    "amount",
    "hour",
    "merchant_risk",
    "country_risk",
    "device_age_days",
    "distance_km",
    "previous_declines",
    "account_age_days",
    "velocity_1h",
    "is_foreign",
    "card_present",
    "amount_to_avg",
    "log_amount_to_avg",
    "log_distance_km",
    "is_night",
    "new_device",
]

CSV_FIELDS = [
    "transaction_id",
    "event_minute",
    "customer_id",
    *FEATURES,
    "is_fraud",
]


@dataclass
class Split:
    rows: list[dict[str, float]]
    labels: list[int]


def sigmoid(value: float) -> float:
    if value < -35:
        return 0.0
    if value > 35:
        return 1.0
    return 1.0 / (1.0 + math.exp(-value))


def poisson_like(rng: random.Random, expected: float) -> int:
    limit = math.exp(-expected)
    product = 1.0
    count = 0
    while product > limit:
        count += 1
        product *= rng.random()
    return max(0, count - 1)


def build_customer_profiles(rng: random.Random, count: int) -> dict[int, dict[str, float]]:
    profiles: dict[int, dict[str, float]] = {}
    for customer_id in range(1, count + 1):
        avg_amount = rng.lognormvariate(math.log(55), 0.65)
        profiles[customer_id] = {
            "avg_amount": max(8.0, min(avg_amount, 850.0)),
            "account_age_days": rng.randint(3, 2200),
            "foreign_rate": rng.uniform(0.01, 0.18),
            "device_age_days": rng.randint(1, 900),
        }
    return profiles


def generate_transactions(rows: int, seed: int) -> list[dict[str, float]]:
    rng = random.Random(seed)
    customer_count = max(180, min(1200, rows // 12))
    profiles = build_customer_profiles(rng, customer_count)
    transactions: list[dict[str, float]] = []

    for index in range(rows):
        customer_id = rng.randint(1, customer_count)
        profile = profiles[customer_id]
        avg_amount = profile["avg_amount"]
        hour = int(rng.triangular(0, 23, 15))
        merchant_risk = min(1.0, max(0.01, rng.betavariate(1.8, 5.2)))
        country_risk = min(1.0, max(0.01, rng.betavariate(1.3, 7.0)))
        is_foreign = 1 if rng.random() < profile["foreign_rate"] + country_risk * 0.12 else 0
        card_present = 1 if rng.random() < 0.68 - merchant_risk * 0.22 else 0
        amount = rng.lognormvariate(math.log(avg_amount), 0.72)

        if rng.random() < 0.08:
            amount *= rng.uniform(2.2, 8.5)

        velocity_1h = poisson_like(rng, 1.4 + merchant_risk * 2.2 + (0.8 if is_foreign else 0.0))
        previous_declines = poisson_like(rng, 0.18 + merchant_risk * 0.9 + velocity_1h * 0.06)
        device_age_days = max(0.2, profile["device_age_days"] * rng.uniform(0.2, 1.15))
        if rng.random() < 0.07 + merchant_risk * 0.04:
            device_age_days = rng.uniform(0.2, 7.0)

        distance_km = rng.lognormvariate(math.log(12 + 120 * is_foreign), 1.0)
        account_age_days = profile["account_age_days"]
        amount_to_avg = amount / max(avg_amount, 1.0)
        log_amount_to_avg = math.log1p(amount_to_avg)
        log_distance_km = math.log1p(distance_km)
        is_night = 1 if hour <= 5 else 0
        new_device = 1 if device_age_days <= 7 else 0

        logit = (
            -4.65
            + 1.05 * log_amount_to_avg
            + 2.35 * merchant_risk
            + 1.95 * country_risk
            + 0.90 * is_foreign
            + 1.00 * (1 - card_present)
            + 0.42 * previous_declines
            + 0.23 * velocity_1h
            + 0.31 * math.log1p(distance_km / 20.0)
            + 0.95 * is_night
            + 0.85 * new_device
            - 0.00045 * account_age_days
            - 0.014 * min(device_age_days, 90.0)
            + rng.gauss(0.0, 0.22)
        )
        fraud_probability = sigmoid(logit)
        is_fraud = 1 if rng.random() < fraud_probability else 0

        transactions.append(
            {
                "transaction_id": float(index + 1),
                "event_minute": float(index),
                "customer_id": float(customer_id),
                "amount": round(amount, 2),
                "hour": float(hour),
                "merchant_risk": round(merchant_risk, 5),
                "country_risk": round(country_risk, 5),
                "device_age_days": round(device_age_days, 2),
                "distance_km": round(distance_km, 2),
                "previous_declines": float(previous_declines),
                "account_age_days": float(account_age_days),
                "velocity_1h": float(velocity_1h),
                "is_foreign": float(is_foreign),
                "card_present": float(card_present),
                "amount_to_avg": round(amount_to_avg, 5),
                "log_amount_to_avg": round(log_amount_to_avg, 5),
                "log_distance_km": round(log_distance_km, 5),
                "is_night": float(is_night),
                "new_device": float(new_device),
                "is_fraud": is_fraud,
            }
        )

    return transactions


def split_transactions(transactions: list[dict[str, float]]) -> tuple[Split, Split, Split]:
    train_end = int(len(transactions) * 0.70)
    validation_end = int(len(transactions) * 0.85)

    def build(rows: list[dict[str, float]]) -> Split:
        return Split(rows=rows, labels=[int(row["is_fraud"]) for row in rows])

    return (
        build(transactions[:train_end]),
        build(transactions[train_end:validation_end]),
        build(transactions[validation_end:]),
    )


def build_scaler(rows: list[dict[str, float]]) -> dict[str, dict[str, float]]:
    scaler: dict[str, dict[str, float]] = {}
    for feature in FEATURES:
        values = [float(row[feature]) for row in rows]
        mu = mean(values)
        variance = mean([(value - mu) ** 2 for value in values])
        sigma = math.sqrt(variance) or 1.0
        scaler[feature] = {"mean": mu, "std": sigma}
    return scaler


def transform_row(row: dict[str, float], scaler: dict[str, dict[str, float]]) -> list[float]:
    return [(float(row[feature]) - scaler[feature]["mean"]) / scaler[feature]["std"] for feature in FEATURES]


def train_logistic_regression(
    train: Split,
    scaler: dict[str, dict[str, float]],
    epochs: int,
    learning_rate: float,
    l2: float,
) -> dict[str, float]:
    weights = {feature: 0.0 for feature in FEATURES}
    bias = 0.0
    positives = sum(train.labels)
    negatives = len(train.labels) - positives
    positive_weight = (negatives / max(positives, 1)) * 0.75

    matrix = [transform_row(row, scaler) for row in train.rows]
    labels = train.labels
    size = float(len(matrix))

    for _ in range(epochs):
        gradients = {feature: 0.0 for feature in FEATURES}
        bias_gradient = 0.0

        for values, label in zip(matrix, labels):
            score = bias + sum(weights[feature] * value for feature, value in zip(FEATURES, values))
            probability = sigmoid(score)
            sample_weight = positive_weight if label else 1.0
            error = (probability - label) * sample_weight
            bias_gradient += error / size
            for feature, value in zip(FEATURES, values):
                gradients[feature] += error * value / size

        bias -= learning_rate * bias_gradient
        for feature in FEATURES:
            gradients[feature] += l2 * weights[feature]
            weights[feature] -= learning_rate * gradients[feature]

    weights["bias"] = bias
    return weights


def predict_probability(row: dict[str, float], scaler: dict[str, dict[str, float]], weights: dict[str, float]) -> float:
    values = transform_row(row, scaler)
    score = weights["bias"] + sum(weights[feature] * value for feature, value in zip(FEATURES, values))
    return sigmoid(score)


def score_split(split: Split, scaler: dict[str, dict[str, float]], weights: dict[str, float]) -> list[float]:
    return [predict_probability(row, scaler, weights) for row in split.rows]


def confusion(labels: list[int], probabilities: list[float], threshold: float) -> dict[str, int]:
    matrix = {"tp": 0, "fp": 0, "tn": 0, "fn": 0}
    for label, probability in zip(labels, probabilities):
        predicted = 1 if probability >= threshold else 0
        if predicted and label:
            matrix["tp"] += 1
        elif predicted and not label:
            matrix["fp"] += 1
        elif not predicted and label:
            matrix["fn"] += 1
        else:
            matrix["tn"] += 1
    return matrix


def metrics_from_confusion(matrix: dict[str, int]) -> dict[str, float]:
    tp = matrix["tp"]
    fp = matrix["fp"]
    tn = matrix["tn"]
    fn = matrix["fn"]
    precision = tp / max(tp + fp, 1)
    recall = tp / max(tp + fn, 1)
    f1 = 2 * precision * recall / max(precision + recall, 1e-12)
    accuracy = (tp + tn) / max(tp + tn + fp + fn, 1)
    alert_rate = (tp + fp) / max(tp + tn + fp + fn, 1)
    return {
        "precision": precision,
        "recall": recall,
        "f1": f1,
        "accuracy": accuracy,
        "alert_rate": alert_rate,
    }


def roc_auc(labels: list[int], probabilities: list[float]) -> float:
    positives = sum(labels)
    negatives = len(labels) - positives
    if positives == 0 or negatives == 0:
        return 0.0

    ranked = sorted(zip(probabilities, labels), key=lambda item: item[0])
    rank_sum = 0.0
    index = 0
    while index < len(ranked):
        end = index
        while end + 1 < len(ranked) and ranked[end + 1][0] == ranked[index][0]:
            end += 1
        average_rank = (index + 1 + end + 1) / 2.0
        for tied_index in range(index, end + 1):
            if ranked[tied_index][1] == 1:
                rank_sum += average_rank
        index = end + 1

    return (rank_sum - positives * (positives + 1) / 2.0) / (positives * negatives)


def calibrate_threshold(labels: list[int], probabilities: list[float]) -> tuple[float, dict[str, float]]:
    best_threshold = 0.5
    best_metrics: dict[str, float] = {}
    best_score = -1.0

    for step in range(5, 96):
        threshold = step / 100.0
        matrix = confusion(labels, probabilities, threshold)
        current_metrics = metrics_from_confusion(matrix)
        alert_rate = current_metrics["alert_rate"]
        operational_penalty = 0.0 if 0.03 <= alert_rate <= 0.22 else 0.04
        score = current_metrics["f1"] - operational_penalty
        if score > best_score:
            best_score = score
            best_threshold = threshold
            best_metrics = current_metrics

    return best_threshold, best_metrics


def evaluate_split(labels: list[int], probabilities: list[float], threshold: float) -> dict[str, object]:
    matrix = confusion(labels, probabilities, threshold)
    result = metrics_from_confusion(matrix)
    result["roc_auc"] = roc_auc(labels, probabilities)
    result["fraud_rate"] = sum(labels) / max(len(labels), 1)
    result["rows"] = len(labels)
    result["confusion_matrix"] = matrix
    return result


def round_nested(value: object, digits: int = 4) -> object:
    if isinstance(value, float):
        return round(value, digits)
    if isinstance(value, dict):
        return {key: round_nested(item, digits) for key, item in value.items()}
    if isinstance(value, list):
        return [round_nested(item, digits) for item in value]
    return value


def write_transactions(path: Path, rows: Iterable[dict[str, float]]) -> None:
    with path.open("w", newline="", encoding="utf-8") as handle:
        writer = csv.DictWriter(handle, fieldnames=CSV_FIELDS)
        writer.writeheader()
        for row in rows:
            writer.writerow({field: row[field] for field in CSV_FIELDS})


def write_predictions(
    path: Path,
    rows: list[dict[str, float]],
    probabilities: list[float],
    threshold: float,
) -> None:
    fields = ["transaction_id", "customer_id", "is_fraud", "fraud_probability", "predicted_fraud", "amount", "hour"]
    with path.open("w", newline="", encoding="utf-8") as handle:
        writer = csv.DictWriter(handle, fieldnames=fields)
        writer.writeheader()
        for row, probability in zip(rows, probabilities):
            writer.writerow(
                {
                    "transaction_id": int(row["transaction_id"]),
                    "customer_id": int(row["customer_id"]),
                    "is_fraud": int(row["is_fraud"]),
                    "fraud_probability": round(probability, 6),
                    "predicted_fraud": 1 if probability >= threshold else 0,
                    "amount": row["amount"],
                    "hour": int(row["hour"]),
                }
            )


def write_json(path: Path, payload: object) -> None:
    path.write_text(json.dumps(round_nested(payload), indent=2, ensure_ascii=False) + "\n", encoding="utf-8")


def top_features(weights: dict[str, float], limit: int = 6) -> list[dict[str, float | str]]:
    ranked = sorted(FEATURES, key=lambda feature: abs(weights[feature]), reverse=True)[:limit]
    return [{"feature": feature, "weight": weights[feature], "direction": "riesgo" if weights[feature] > 0 else "proteccion"} for feature in ranked]


def build_report(metrics: dict[str, object], threshold: float, feature_importance: list[dict[str, object]]) -> str:
    test = metrics["test"]
    confusion_matrix = test["confusion_matrix"]
    rows = metrics["dataset"]["rows"]
    fraud_rate = metrics["dataset"]["fraud_rate"]
    lines = [
        "# Fraude transaccional - reporte de modelo",
        "",
        "Pipeline real ejecutable para la ficha `fraude-rnn`.",
        "",
        "## Dataset",
        "",
        f"- Filas sinteticas: {rows}",
        f"- Tasa de fraude simulada: {fraud_rate:.2%}",
        "- Separacion temporal: 70% entrenamiento, 15% validacion, 15% prueba.",
        "",
        "## Resultado en prueba",
        "",
        f"- Umbral calibrado: {threshold:.2f}",
        f"- Precision: {test['precision']:.2%}",
        f"- Recall: {test['recall']:.2%}",
        f"- F1: {test['f1']:.2%}",
        f"- ROC-AUC: {test['roc_auc']:.2%}",
        f"- Tasa de alertas: {test['alert_rate']:.2%}",
        f"- Matriz: TP={confusion_matrix['tp']}, FP={confusion_matrix['fp']}, TN={confusion_matrix['tn']}, FN={confusion_matrix['fn']}",
        "",
        "## Variables mas influyentes",
        "",
    ]

    for item in feature_importance:
        lines.append(f"- `{item['feature']}`: {item['direction']} ({item['weight']:.3f})")

    lines.extend(
        [
            "",
            "## Lectura operativa",
            "",
            "El modelo prioriza alertas con una logica interpretable: monto atipico, riesgo de comercio/pais, velocidad reciente, transacciones no presenciales y comportamiento nocturno.",
            "No reemplaza un modelo productivo entrenado con datos reales; sirve como base reproducible para demostrar el flujo completo de analisis, entrenamiento, calibracion y reporte.",
            "",
        ]
    )
    return "\n".join(lines)


def run_pipeline(args: argparse.Namespace) -> dict[str, object]:
    output_dir = Path(args.output_dir)
    data_dir = output_dir / "data"
    model_dir = output_dir / "models"
    report_dir = output_dir / "reports"
    for directory in (data_dir, model_dir, report_dir):
        directory.mkdir(parents=True, exist_ok=True)

    transactions = generate_transactions(args.rows, args.seed)
    train, validation, test = split_transactions(transactions)
    scaler = build_scaler(train.rows)
    weights = train_logistic_regression(train, scaler, args.epochs, args.learning_rate, args.l2)

    validation_probabilities = score_split(validation, scaler, weights)
    threshold, validation_metrics = calibrate_threshold(validation.labels, validation_probabilities)
    train_probabilities = score_split(train, scaler, weights)
    test_probabilities = score_split(test, scaler, weights)
    feature_importance = top_features(weights)

    metrics = {
        "dataset": {
            "rows": len(transactions),
            "seed": args.seed,
            "fraud_rate": sum(int(row["is_fraud"]) for row in transactions) / max(len(transactions), 1),
            "train_rows": len(train.rows),
            "validation_rows": len(validation.rows),
            "test_rows": len(test.rows),
        },
        "training": {
            "epochs": args.epochs,
            "learning_rate": args.learning_rate,
            "l2": args.l2,
            "features": FEATURES,
        },
        "threshold": threshold,
        "validation_threshold_selection": validation_metrics,
        "train": evaluate_split(train.labels, train_probabilities, threshold),
        "validation": evaluate_split(validation.labels, validation_probabilities, threshold),
        "test": evaluate_split(test.labels, test_probabilities, threshold),
        "top_features": feature_importance,
    }

    model = {
        "model_type": "weighted_logistic_regression",
        "project_id": "fraude-rnn",
        "threshold": threshold,
        "features": FEATURES,
        "scaler": scaler,
        "weights": weights,
    }

    write_transactions(data_dir / "transactions.csv", transactions)
    write_predictions(report_dir / "test_predictions.csv", test.rows, test_probabilities, threshold)
    write_json(model_dir / "fraud_model.json", model)
    write_json(report_dir / "metrics.json", metrics)
    (report_dir / "model_report.md").write_text(build_report(metrics, threshold, feature_importance), encoding="utf-8")

    return metrics


def parse_args() -> argparse.Namespace:
    default_output = Path(__file__).resolve().parent / "artifacts"
    parser = argparse.ArgumentParser(description="Entrena y evalua un detector sintetico de fraude transaccional.")
    parser.add_argument("--rows", type=int, default=5000, help="Cantidad de transacciones sinteticas.")
    parser.add_argument("--seed", type=int, default=42, help="Semilla reproducible.")
    parser.add_argument("--epochs", type=int, default=650, help="Iteraciones de entrenamiento.")
    parser.add_argument("--learning-rate", type=float, default=0.08, help="Tasa de aprendizaje.")
    parser.add_argument("--l2", type=float, default=0.002, help="Regularizacion L2.")
    parser.add_argument("--output-dir", default=str(default_output), help="Directorio de artefactos.")
    return parser.parse_args()


def main() -> None:
    args = parse_args()
    if args.rows < 1000:
        raise SystemExit("--rows debe ser al menos 1000 para mantener splits utiles.")
    metrics = run_pipeline(args)
    test = metrics["test"]
    print("Pipeline fraude-rnn completado")
    print(f"Filas: {metrics['dataset']['rows']} | Fraude: {metrics['dataset']['fraud_rate']:.2%}")
    print(f"F1 test: {test['f1']:.2%} | Recall test: {test['recall']:.2%} | ROC-AUC: {test['roc_auc']:.2%}")


if __name__ == "__main__":
    main()

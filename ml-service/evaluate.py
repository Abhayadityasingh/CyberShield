
from pathlib import Path

import joblib
import numpy as np
from sklearn.metrics import classification_report, confusion_matrix

# Load the previously trained model. Do not retrain during evaluation.
MODEL_PATH = Path(__file__).resolve().parent / "model.joblib"
bundle = joblib.load(MODEL_PATH)

model = bundle["model"]
scaler = bundle["scaler"]

# Different random seed from training (42).
rng = np.random.default_rng(2026)

# Independent synthetic normal login examples.
normal = np.column_stack([
    rng.choice([0, 1, 2, 3], 500, p=[0.75, 0.17, 0.06, 0.02]),
    rng.choice([0, 1, 2, 3, 4], 500, p=[0.20, 0.60, 0.13, 0.05, 0.02]),
    rng.choice([1, 2, 3], 500, p=[0.90, 0.08, 0.02]),
    rng.choice([0, 1, 2, 3, 4], 500, p=[0.55, 0.25, 0.12, 0.06, 0.02]),
    rng.choice([0, 1], 500, p=[0.99, 0.01]),
])

# Synthetic unusual patterns for evaluation only.
# These are constructed test cases, NOT confirmed real-world attacks.
unusual = np.column_stack([
    rng.integers(5, 16, size=100),
    rng.integers(1, 11, size=100),
    rng.integers(4, 13, size=100),
    rng.integers(3, 13, size=100),
    rng.integers(0, 2, size=100),
])

X = np.vstack([normal, unusual])

# 0 = synthetic normal, 1 = synthetic unusual.
y_true = np.array([0] * len(normal) + [1] * len(unusual))

scaled = scaler.transform(X)
predictions = model.predict(scaled)

# Isolation Forest: 1 = normal, -1 = anomaly.
y_pred = (predictions == -1).astype(int)

print("CyberShield ML — Synthetic Evaluation")
print("Model:", bundle["version"])
print("Normal test samples:", len(normal))
print("Unusual test samples:", len(unusual))

print("\nConfusion Matrix:")
print(confusion_matrix(y_true, y_pred))

print("\nClassification Report:")
print(classification_report(
    y_true,
    y_pred,
    target_names=["Normal", "Unusual"],
    zero_division=0,
))

print("LIMITATION: Results apply only to these synthetic test distributions.")

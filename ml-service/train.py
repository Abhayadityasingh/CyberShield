
from pathlib import Path

import joblib
import numpy as np
from sklearn.ensemble import IsolationForest
from sklearn.preprocessing import StandardScaler

# Synthetic NORMAL login behaviour for our prototype.
# These are numerical features, not real user records.
FEATURES = [
    "failed_logins_10m",
    "successful_logins_5m",
    "distinct_accounts_per_ip_10m",
    "hour_deviation",
    "country_changed",
]

RANDOM_SEED = 42
rng = np.random.default_rng(RANDOM_SEED)

# Generate 2,000 examples of plausible normal login behaviour.
normal_data = np.column_stack([
    rng.choice([0, 1, 2, 3], size=2000, p=[0.75, 0.17, 0.06, 0.02]),
    rng.choice([0, 1, 2, 3, 4], size=2000, p=[0.20, 0.60, 0.13, 0.05, 0.02]),
    rng.choice([1, 2, 3], size=2000, p=[0.90, 0.08, 0.02]),
    rng.choice([0, 1, 2, 3, 4], size=2000, p=[0.55, 0.25, 0.12, 0.06, 0.02]),
    rng.choice([0, 1], size=2000, p=[0.99, 0.01]),
])

scaler = StandardScaler()
scaled_data = scaler.fit_transform(normal_data)

model = IsolationForest(
    n_estimators=200,
    contamination=0.03,
    random_state=RANDOM_SEED,
    n_jobs=-1,
)
model.fit(scaled_data)

output = Path(__file__).resolve().parent / "model.joblib"

joblib.dump({
    "model": model,
    "scaler": scaler,
    "features": FEATURES,
    "version": "synthetic-prototype-v2",
}, output)

print(f"Training examples: {len(normal_data)}")
print(f"Features: {FEATURES}")
print(f"Model saved: {output}")

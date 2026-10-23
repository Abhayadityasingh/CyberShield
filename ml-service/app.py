
from pathlib import Path

import joblib
import numpy as np
from fastapi import FastAPI
from pydantic import BaseModel, Field

app = FastAPI(title="CyberShield ML Service")

MODEL_PATH = Path(__file__).resolve().parent / "model.joblib"
bundle = joblib.load(MODEL_PATH)

model = bundle["model"]
scaler = bundle["scaler"]
features = bundle["features"]


class LoginFeatures(BaseModel):
    failed_logins_10m: int = Field(ge=0)
    successful_logins_5m: int = Field(ge=0)
    distinct_accounts_per_ip_10m: int = Field(ge=0)
    hour_deviation: int = Field(ge=0, le=12)
    country_changed: int = Field(ge=0, le=1)


@app.get("/health")
def health():
    return {
        "status": "operational",
        "model_version": bundle["version"],
        "training_data": "synthetic",
    }


@app.post("/predict")
def predict(data: LoginFeatures):
    values = data.model_dump()
    row = np.array([[values[name] for name in features]], dtype=float)
    scaled = scaler.transform(row)

    prediction = int(model.predict(scaled)[0])
    decision_score = float(model.decision_function(scaled)[0])

    return {
        "is_anomaly": prediction == -1,
        "anomaly_score": round(-decision_score, 6),
        "model_version": bundle["version"],
        "training_data": "synthetic",
        "features": values,
    }

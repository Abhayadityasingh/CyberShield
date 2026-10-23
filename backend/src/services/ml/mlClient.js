
const ML_SERVICE_URL = process.env.ML_SERVICE_URL || 'http://127.0.0.1:8000';
const ML_TIMEOUT_MS = 2000;

// Request a prediction from the separate Python ML service.
// Returns null if ML is unavailable, without interrupting normal detection.
export async function predictLoginAnomaly(features) {
  try {
    const response = await fetch(`${ML_SERVICE_URL}/predict`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(features),
      signal: AbortSignal.timeout(ML_TIMEOUT_MS),
    });

    if (!response.ok) {
      console.warn(`ML prediction unavailable: HTTP ${response.status}`);
      return null;
    }

    const result = await response.json();

    // Validate the response before trusting it.
    if (
      typeof result.is_anomaly !== 'boolean' ||
      typeof result.anomaly_score !== 'number' ||
      !Number.isFinite(result.anomaly_score) ||
      typeof result.model_version !== 'string'
    ) {
      console.warn('ML prediction returned an invalid response');
      return null;
    }

    return result;
  } catch (error) {
    console.warn(`ML service unavailable: ${error.message}`);
    return null;
  }
}

// Lightweight service health check for future dashboard monitoring.
export async function checkMLHealth() {
  try {
    const response = await fetch(`${ML_SERVICE_URL}/health`, {
      signal: AbortSignal.timeout(ML_TIMEOUT_MS),
    });

    if (!response.ok) return { status: 'degraded' };

    const data = await response.json();

    return {
      status: data.status === 'operational' ? 'operational' : 'degraded',
      modelVersion: data.model_version,
      trainingData: data.training_data,
    };
  } catch {
    return { status: 'unavailable' };
  }
}

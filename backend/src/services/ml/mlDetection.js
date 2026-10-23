
import { Threat } from '../../models/Threat.js';
import { logger } from '../../utils/logger.js';
import { extractLoginFeatures } from './featureExtractor.js';
import { predictLoginAnomaly } from './mlClient.js';

const COOLDOWN_MS = 15 * 60 * 1000;

// ML anomaly detection is independent of the six existing rules.
export async function runMLDetection(event) {
  try {
    const features = await extractLoginFeatures(event);
    const prediction = await predictLoginAnomaly(features);

    // ML service unavailable or event not classified as anomalous.
    if (!prediction || !prediction.is_anomaly) return null;

    const timestamp = new Date(event.timestamp);
    const dedupKey = `ml_anomaly:${event.source}:${event.ip}`;

    // Avoid repeatedly reporting the same unresolved ML anomaly.
    const existing = await Threat.findOne({
      dedupKey,
      detectionMethod: 'ml',
      status: { $in: ['open', 'investigating'] },
      detectedAt: {
        $gte: new Date(timestamp.getTime() - COOLDOWN_MS),
        $lte: timestamp,
      },
    }).lean();

    if (existing) return null;

    const threat = await Threat.create({
      category: 'ml_anomaly',
      detectionMethod: 'ml',
      severity: 'medium',
      title: 'ML-detected unusual login activity',
      explanation:
        'The Isolation Forest model identified an unusual login pattern. ' +
        'This is an anomaly indicator, not confirmation of an attack.',
      riskScore: 50,
      email: event.email,
      user: event.user ?? null,
      ip: event.ip,
      source: event.source,
      relatedEvents: [event._id],
      dedupKey,
      detectedAt: timestamp,
      evidence: {
        features,
        anomalyScore: prediction.anomaly_score,
        modelVersion: prediction.model_version,
        trainingData: prediction.training_data,
        scoreMeaning:
          'Isolation Forest anomaly score, not attack probability',
      },
    });

    logger.warn(
      `ML anomaly detected for ${event.email} (${event.source})`
    );

    return threat;
  } catch (error) {
    // ML errors must not interrupt existing rule-based detection.
    logger.error(`ML detection failed: ${error.message}`);
    return null;
  }
}

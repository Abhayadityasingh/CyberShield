import mongoose from 'mongoose';
import { connectDB } from '../config/db.js';
import { LoginEvent } from '../models/LoginEvent.js';
import { extractLoginFeatures } from '../services/ml/featureExtractor.js';
import { checkMLHealth, predictLoginAnomaly } from '../services/ml/mlClient.js';

async function main() {
  try {
    await connectDB();

    const health = await checkMLHealth();
    console.log('ML service health:', health);

    if (health.status !== 'operational') {
      throw new Error('ML service is not operational');
    }

    const event = await LoginEvent.findOne({ source: 'simulated' })
      .sort({ timestamp: -1 })
      .lean();

    if (!event) {
      console.log('No existing simulated login event found.');
      return;
    }

    const features = await extractLoginFeatures(event);
    const prediction = await predictLoginAnomaly(features);

    console.log('Event source:', event.source);
    console.log('Extracted features:', features);
    console.log('ML prediction:', prediction);

    if (!prediction) {
      throw new Error('ML prediction unavailable');
    }

    console.log('TEST PASSED: MongoDB -> Features -> Python ML prediction.');
    console.log('READ-ONLY TEST: No threats or login events created.');
  } catch (error) {
    console.error('TEST FAILED:', error.message);
    process.exitCode = 1;
  } finally {
    await mongoose.disconnect();
  }
}

await main();

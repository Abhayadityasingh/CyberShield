
import mongoose from 'mongoose';
import { connectDB } from '../config/db.js';
import { LoginEvent } from '../models/LoginEvent.js';
import { extractLoginFeatures } from '../services/ml/featureExtractor.js';

async function main() {
  try {
    await connectDB();

    // Read an existing simulated login. Do not create test records.
    const event = await LoginEvent.findOne({
      source: 'simulated',
    })
      .sort({ timestamp: -1 })
      .lean();

    if (!event) {
      console.log('No simulated login records found.');
      return;
    }

    const features = await extractLoginFeatures(event);

    console.log('\nCyberShield ML Feature Extraction Test');
    console.log('Source:', event.source);
    console.log('Event timestamp:', event.timestamp);
    console.log('Extracted features:', features);

    const expectedKeys = [
      'failed_logins_10m',
      'successful_logins_5m',
      'distinct_accounts_per_ip_10m',
      'hour_deviation',
      'country_changed',
    ];

    const valid = expectedKeys.every(
      (key) =>
        typeof features[key] === 'number' &&
        Number.isFinite(features[key]) &&
        features[key] >= 0
    );

    if (!valid) {
      throw new Error('Invalid ML features returned');
    }

    console.log('TEST PASSED: Five valid numerical ML features extracted.');
  } catch (error) {
    console.error('TEST FAILED:', error.message);
    process.exitCode = 1;
  } finally {
    await mongoose.disconnect();
  }
}

await main();

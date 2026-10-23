
import {
  checkMLHealth,
  predictLoginAnomaly,
} from '../services/ml/mlClient.js';

// 1. Check whether the Python ML service is available.
const health = await checkMLHealth();

console.log('\nCyberShield ML Connection Test');
console.log('ML Health:', health);

if (health.status !== 'operational') {
  console.error('TEST FAILED: ML service is not operational.');
  process.exitCode = 1;
} else {
  // 2. Test an unusual synthetic login pattern.
  const features = {
    failed_logins_10m: 12,
    successful_logins_5m: 1,
    distinct_accounts_per_ip_10m: 8,
    hour_deviation: 10,
    country_changed: 1,
  };

  const result = await predictLoginAnomaly(features);

  console.log('ML Prediction:', result);

  if (result?.is_anomaly === true) {
    console.log('TEST PASSED: Node.js successfully received an ML anomaly prediction.');
  } else {
    console.error('TEST FAILED: Expected an anomaly prediction.');
    process.exitCode = 1;
  }
}


import { LoginEvent } from '../../models/LoginEvent.js';

const MINUTE = 60 * 1000;

function circularHourDistance(a, b) {
  const difference = Math.abs(a - b);
  return Math.min(difference, 24 - difference);
}

// Extract numerical ML features from saved login history.
// Windows are relative to the event timestamp, not the current clock.
export async function extractLoginFeatures(event) {
  const timestamp = new Date(event.timestamp);

  const tenMinutesAgo = new Date(timestamp.getTime() - 10 * MINUTE);
  const fiveMinutesAgo = new Date(timestamp.getTime() - 5 * MINUTE);

// Include the current event, which has already been saved.
// Keep simulated and application login histories separate.
const source = event.source;

const currentWindow = {
  $gte: tenMinutesAgo,
  $lte: timestamp,
};

  const [
    failedLogins,
    successfulLogins,
    distinctAccounts,
    previousSuccesses,
  ] = 
await Promise.all([
  LoginEvent.countDocuments({
    source,
    email: event.email,
    success: false,
    timestamp: currentWindow,
  }),

  LoginEvent.countDocuments({
    source,
    email: event.email,
    success: true,
    timestamp: { $gte: fiveMinutesAgo, $lte: timestamp },
  }),

  LoginEvent.distinct('email', {
    source,
    ip: event.ip,
    timestamp: currentWindow,
  }),

  LoginEvent.find({
    source,
    email: event.email,
    success: true,
    timestamp: { $lt: timestamp },
  })
    .sort({ timestamp: -1 })
    .limit(200)
    .select('timestamp location.country')
    .lean(),
]);


  // No historical login-hour baseline: use neutral deviation.
  const currentHour = timestamp.getUTCHours();

  const hourDeviation = previousSuccesses.length >= 10
    ? Math.min(
        ...previousSuccesses.map((previous) =>
          circularHourDistance(
            currentHour,
            new Date(previous.timestamp).getUTCHours()
          )
        )
      )
    : 0;

  // Compare against the most recent previous successful login
  // that has a known country.
  const previousCountry = previousSuccesses.find(
    (previous) => previous.location?.country
  )?.location.country;

  const currentCountry = event.location?.country;

  const countryChanged = (
    currentCountry &&
    previousCountry &&
    currentCountry !== previousCountry
  ) ? 1 : 0;

  return {
    failed_logins_10m: failedLogins,
    successful_logins_5m: successfulLogins,
    distinct_accounts_per_ip_10m: distinctAccounts.length,
    hour_deviation: hourDeviation,
    country_changed: countryChanged,
  };
}

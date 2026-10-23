import mongoose from 'mongoose';
const { Schema } = mongoose;

// The "feed" collection: one row per thing that happened, shown in the live feed.
const securityEventSchema = new Schema({
  type: { type: String, enum: ['login_success', 'login_failed', 'threat_detected'], required: true },
  severity: { type: String, enum: ['info', 'low', 'medium', 'high', 'critical'], required: true },
  message: { type: String, required: true },
  email: { type: String },
  ip: { type: String },
  source: { type: String, enum: ['application', 'simulated'], default: 'application' },
  loginEvent: { type: Schema.Types.ObjectId, ref: 'LoginEvent' },
  threat: { type: Schema.Types.ObjectId, ref: 'Threat' },
  timestamp: { type: Date, default: Date.now },
});

securityEventSchema.index({ timestamp: -1 });
securityEventSchema.index({ severity: 1, timestamp: -1 });

export const SecurityEvent = mongoose.model('SecurityEvent', securityEventSchema);
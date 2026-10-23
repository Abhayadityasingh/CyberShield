import mongoose from 'mongoose';
const { Schema } = mongoose;

const threatSchema = new Schema(
  {
    category: {
      type: String, required: true,
      enum: ['brute_force', 'credential_stuffing', 'suspicious_frequency',
             'unusual_login_time', 'location_anomaly', 'account_compromise', 'ml_anomaly'],
    },
    severity: { type: String, enum: ['low', 'medium', 'high', 'critical'], required: true },
    title: { type: String, required: true },
    explanation: { type: String, required: true },
    detectionMethod: { type: String, enum: ['rule', 'ml'], default: 'rule' },
    ruleId: { type: String },
    riskScore: { type: Number, min: 0, max: 100, required: true },
    status: { type: String, enum: ['open', 'investigating', 'resolved', 'false_positive'], default: 'open' },
    email: { type: String },
    user: { type: Schema.Types.ObjectId, ref: 'User', default: null },
    ip: { type: String },
    source: { type: String, enum: ['application', 'simulated'], default: 'application' },
    evidence: { type: Schema.Types.Mixed, default: {} },
    relatedEvents: [{ type: Schema.Types.ObjectId, ref: 'LoginEvent' }],
    dedupKey: { type: String, index: true },
    detectedAt: { type: Date, default: Date.now },
  },
  { timestamps: true }
);

threatSchema.index({ detectedAt: -1 });
threatSchema.index({ severity: 1, status: 1 });

export const Threat = mongoose.model('Threat', threatSchema);
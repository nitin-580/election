import mongoose, { Schema } from 'mongoose';

const AuditLogSchema = new Schema({
  actor: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  action: { type: String, required: true },
  details: { type: Schema.Types.Mixed },
  timestamp: { type: Date, default: Date.now },
});

export const AuditLog = mongoose.model('AuditLog', AuditLogSchema);
export default AuditLog;

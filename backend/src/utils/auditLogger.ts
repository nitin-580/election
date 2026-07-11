import AuditLog from '../models/auditLog';

export const logAction = async (actorId: string, action: string, details?: any) => {
  try {
    await AuditLog.create({
      actor: actorId,
      action,
      details,
    });
  } catch (err) {
    console.error('Failed to log audit action:', err);
  }
};
export default logAction;

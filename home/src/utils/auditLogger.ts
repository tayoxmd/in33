import { supabase } from "@/integrations/supabase/client";

/**
 * Log an audit event to the audit_logs table
 */
export async function logAuditEvent(
  action: string,
  entityType: string,
  entityId?: string,
  details?: any
) {
  try {
    const { error } = await supabase.rpc('log_audit_event', {
      p_action: action,
      p_entity_type: entityType,
      p_entity_id: entityId || null,
      p_details: details || null
    });

    if (error) {
      // Silently log error without throwing - audit logging is non-critical
      console.warn('Audit logging failed (non-critical):', error.message);
    }
  } catch (error: any) {
    // Silently catch errors - audit logging should not break the application
    console.warn('Audit logging failed (non-critical):', error?.message || error);
  }
}

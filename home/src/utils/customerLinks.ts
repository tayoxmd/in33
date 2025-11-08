import { supabase } from "@/integrations/supabase/client";

/**
 * Generate a permanent link for customer's bookings page
 * The link includes the user ID as a parameter
 */
export function generateCustomerPageUrl(userId: string): string {
  const baseUrl = window.location.origin;
  return `${baseUrl}/customer-dashboard?uid=${userId}`;
}

/**
 * Validate if a user can access the customer dashboard
 * Returns true if the current user matches the requested user ID
 * Logs all staff access to customer dashboards for audit purposes
 */
export async function validateCustomerAccess(requestedUserId: string): Promise<boolean> {
  const { data: { user } } = await supabase.auth.getUser();
  
  if (!user) return false;
  
  // User can access their own dashboard
  if (user.id === requestedUserId) return true;
  
  // Check if current user is admin or employee
  const { data: roles } = await supabase
    .from('user_roles')
    .select('role')
    .eq('user_id', user.id);
  
  if (roles && roles.length > 0) {
    const userRole = roles[0].role;
    const isStaff = userRole === 'admin' || userRole === 'employee';
    
    if (isStaff) {
      // Log staff access to customer dashboard
      try {
        await supabase
          .from('customer_access_logs')
          .insert({
            staff_user_id: user.id,
            customer_user_id: requestedUserId,
            access_reason: 'Dashboard access',
            ip_address: null, // Would need backend to capture real IP
          });
      } catch (error) {
        console.error('Failed to log customer access:', error);
        // Don't block access if logging fails
      }
    }
    
    return isStaff;
  }
  
  return false;
}

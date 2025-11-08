import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface BookingEmailRequest {
  bookingId: string;
  action: 'status_change' | 'payment_update' | 'general_update';
  oldValue?: string;
  newValue?: string;
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL') ?? '';
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '';
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const { bookingId, action, oldValue, newValue }: BookingEmailRequest = await req.json();

    console.log('Processing email notification for booking:', bookingId, 'Action:', action);

    // Get booking details with hotel and user information
    const { data: booking, error: bookingError } = await supabase
      .from('bookings')
      .select(`
        *,
        hotels(name_ar, name_en, location, location_url),
        profiles(full_name, phone)
      `)
      .eq('id', bookingId)
      .single();

    if (bookingError) {
      console.error('Error fetching booking:', bookingError);
      throw bookingError;
    }

    if (!booking) {
      throw new Error('Booking not found');
    }

    // Get user email if user is registered
    let userEmail = null;
    if (booking.user_id) {
      const { data: userData } = await supabase.auth.admin.getUserById(booking.user_id);
      userEmail = userData?.user?.email;
    }

    // Create notification in database
    if (booking.user_id) {
      let notificationTitle = '';
      let notificationMessage = '';

      switch (action) {
        case 'status_change':
          notificationTitle = 'تحديث حالة الحجز / Booking Status Update';
          notificationMessage = `تم تحديث حالة حجزك رقم ${booking.booking_number} من "${oldValue}" إلى "${newValue}". / Your booking #${booking.booking_number} status has been updated from "${oldValue}" to "${newValue}".`;
          break;
        case 'payment_update':
          notificationTitle = 'تحديث حالة الدفع / Payment Status Update';
          notificationMessage = `تم تحديث حالة الدفع لحجزك رقم ${booking.booking_number}. / Payment status for your booking #${booking.booking_number} has been updated.`;
          break;
        default:
          notificationTitle = 'تحديث الحجز / Booking Update';
          notificationMessage = `تم تحديث تفاصيل حجزك رقم ${booking.booking_number}. / Your booking #${booking.booking_number} has been updated.`;
      }

      await supabase.from('notifications').insert({
        user_id: booking.user_id,
        title: notificationTitle,
        message: notificationMessage,
        type: 'booking_update',
        read: false,
      });

      console.log('Notification created successfully');
    }

    // TODO: Integrate with email service (Resend, SendGrid, etc.)
    // For now, we just log that email should be sent
    console.log('Email should be sent to:', userEmail || booking.guest_phone);
    console.log('Email content:', {
      bookingNumber: booking.booking_number,
      hotelName: booking.hotels?.name_ar || booking.hotels?.name_en,
      action,
      oldValue,
      newValue,
    });

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: 'Notification sent successfully',
        emailSent: false, // Will be true when email integration is added
      }),
      {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  } catch (error: any) {
    console.error('Error in send-booking-email function:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});
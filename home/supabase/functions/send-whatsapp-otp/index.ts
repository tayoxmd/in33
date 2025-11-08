import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.38.4";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { phone, countryCode = '+966' } = await req.json();
    
    if (!phone) {
      return new Response(
        JSON.stringify({ error: 'Phone number is required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    // Create hash of phone number for storage
    const encoder = new TextEncoder();
    const data = encoder.encode(phone);
    const hashBuffer = await crypto.subtle.digest('SHA-256', data);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    const phoneHash = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');

    // Check for recent OTP requests (rate limiting)
    const oneMinuteAgo = new Date();
    oneMinuteAgo.setMinutes(oneMinuteAgo.getMinutes() - 1);
    
    const { data: recentOTP, error: recentError } = await supabase
      .from('guest_verifications')
      .select('created_at')
      .eq('phone_hash', phoneHash)
      .gte('created_at', oneMinuteAgo.toISOString())
      .order('created_at', { ascending: false })
      .limit(1);

    if (recentOTP && recentOTP.length > 0) {
      return new Response(
        JSON.stringify({ error: 'Please wait before requesting a new OTP' }),
        { status: 429, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Check daily limit (max 5 OTPs per day)
    const oneDayAgo = new Date();
    oneDayAgo.setDate(oneDayAgo.getDate() - 1);
    
    const { count, error: countError } = await supabase
      .from('guest_verifications')
      .select('*', { count: 'exact', head: true })
      .eq('phone_hash', phoneHash)
      .gte('created_at', oneDayAgo.toISOString());

    if (count && count >= 5) {
      return new Response(
        JSON.stringify({ error: 'Daily OTP limit reached. Please try again tomorrow' }),
        { status: 429, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Clean up old unverified OTPs for this phone
    await supabase
      .from('guest_verifications')
      .delete()
      .eq('phone_hash', phoneHash)
      .eq('verified', false);

    // Generate 6-digit OTP
    const otpCode = Math.floor(100000 + Math.random() * 900000).toString();
    
    // Store OTP in database
    const expiresAt = new Date();
    expiresAt.setMinutes(expiresAt.getMinutes() + 10); // OTP valid for 10 minutes

    const { error: dbError } = await supabase
      .from('guest_verifications')
      .insert({
        phone_hash: phoneHash,
        otp_code: otpCode,
        expires_at: expiresAt.toISOString(),
        verified: false
      });

    if (dbError) {
      console.error('Database error - failed to store OTP');
      return new Response(
        JSON.stringify({ error: 'Failed to store OTP' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Send OTP via WhatsApp using asenderapi
    const apiKey = Deno.env.get('ASENDERAPI_KEY');
    const sessionId = Deno.env.get('WHATSAPP_SESSION_ID');
    
    if (!apiKey) {
      console.error('ASENDERAPI_KEY not configured');
      return new Response(
        JSON.stringify({ error: 'WhatsApp service not configured' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (!sessionId) {
      console.error('WHATSAPP_SESSION_ID not configured');
      return new Response(
        JSON.stringify({ error: 'WhatsApp service not configured' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const fullPhone = `${countryCode}${phone}`.replace(/\+/g, '');
    const message = `رمز التحقق الخاص بك هو: ${otpCode}\n\nصالح لمدة 10 دقائق.\n\nإثراء للحجز الفندقي`;

    const whatsappResponse = await fetch('https://api.asenderapi.com/api/v1/message/text', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`
      },
      body: JSON.stringify({
        sessionId: sessionId,
        to: fullPhone,
        text: message
      })
    });

    if (!whatsappResponse.ok) {
      console.error('WhatsApp API error - status:', whatsappResponse.status);
      return new Response(
        JSON.stringify({ error: 'Failed to send WhatsApp message' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const result = await whatsappResponse.json();
    console.log('OTP sent successfully at', new Date().toISOString());

    return new Response(
      JSON.stringify({ 
        success: true,
        message: 'OTP sent successfully via WhatsApp'
      }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error in send-whatsapp-otp:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});

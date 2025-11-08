import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.38.4";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  const url = new URL(req.url);
  
  // Webhook verification (GET request from WhatsApp)
  if (req.method === 'GET') {
    const mode = url.searchParams.get('hub.mode');
    const token = url.searchParams.get('hub.verify_token');
    const challenge = url.searchParams.get('hub.challenge');
    
    const verifyToken = Deno.env.get('WHATSAPP_VERIFY_TOKEN') || 'in33_verify_token_2024';
    
    if (mode === 'subscribe' && token === verifyToken) {
      console.log('Webhook verified successfully');
      return new Response(challenge, { status: 200 });
    } else {
      console.error('Webhook verification failed');
      return new Response('Forbidden', { status: 403 });
    }
  }

  // Handle webhook events (POST request from WhatsApp)
  if (req.method === 'POST') {
    try {
      const supabase = createClient(
        Deno.env.get('SUPABASE_URL') ?? '',
        Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
      );

      const body = await req.json();
      console.log('Webhook received:', JSON.stringify(body, null, 2));

      // Process WhatsApp webhook events
      if (body.entry) {
        for (const entry of body.entry) {
          if (entry.changes) {
            for (const change of entry.changes) {
              if (change.value) {
                const { messages, statuses } = change.value;

                // Handle incoming messages
                if (messages) {
                  for (const message of messages) {
                    console.log('Incoming message:', {
                      from: message.from,
                      type: message.type,
                      text: message.text?.body
                    });

                    // Store message in database if needed
                    // You can add logic here to handle user responses
                  }
                }

                // Handle message status updates (sent, delivered, read, failed)
                if (statuses) {
                  for (const status of statuses) {
                    console.log('Message status update:', {
                      id: status.id,
                      status: status.status,
                      timestamp: status.timestamp,
                      recipient_id: status.recipient_id
                    });

                    // Update message status in database if needed
                  }
                }
              }
            }
          }
        }
      }

      return new Response(JSON.stringify({ success: true }), {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    } catch (error) {
      console.error('Error processing webhook:', error);
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      return new Response(JSON.stringify({ error: errorMessage }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }
  }

  return new Response('Method not allowed', { status: 405 });
});
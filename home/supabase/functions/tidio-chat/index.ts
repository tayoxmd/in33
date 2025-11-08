import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface TidioConversation {
  id: string;
  visitor: {
    name: string;
    email?: string;
  };
  status: string;
  created_at: string;
  updated_at: string;
  unread_messages_count: number;
}

interface TidioMessage {
  id: string;
  message: string;
  delivered_at: string;
  author: {
    type: string;
    name: string;
  };
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('VITE_SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('VITE_SUPABASE_PUBLISHABLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Get Tidio credentials from site_settings
    const { data: settings, error: settingsError } = await supabase
      .from('site_settings')
      .select('tidio_public_key, tidio_private_key')
      .limit(1)
      .single();

    if (settingsError || !settings?.tidio_public_key || !settings?.tidio_private_key) {
      throw new Error('Tidio credentials not configured');
    }

    const { action, conversationId, message } = await req.json();

    // Tidio API base URL
    const tidioApiUrl = 'https://api.tidio.co/v1';
    const authHeader = `Bearer ${settings.tidio_private_key}`;

    switch (action) {
      case 'getConversations': {
        // Get all conversations
        const response = await fetch(`${tidioApiUrl}/conversations`, {
          headers: {
            'Authorization': authHeader,
            'Content-Type': 'application/json',
          },
        });

        if (!response.ok) {
          throw new Error('Failed to fetch conversations from Tidio');
        }

        const conversations: TidioConversation[] = await response.json();

        return new Response(
          JSON.stringify({ conversations }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      case 'getMessages': {
        // Get messages for a specific conversation
        const response = await fetch(`${tidioApiUrl}/conversations/${conversationId}/messages`, {
          headers: {
            'Authorization': authHeader,
            'Content-Type': 'application/json',
          },
        });

        if (!response.ok) {
          throw new Error('Failed to fetch messages from Tidio');
        }

        const messages: TidioMessage[] = await response.json();

        return new Response(
          JSON.stringify({ messages }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      case 'sendMessage': {
        // Send a message to a conversation
        const response = await fetch(`${tidioApiUrl}/conversations/${conversationId}/messages`, {
          method: 'POST',
          headers: {
            'Authorization': authHeader,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            message,
            type: 'operator',
          }),
        });

        if (!response.ok) {
          throw new Error('Failed to send message to Tidio');
        }

        const result = await response.json();

        return new Response(
          JSON.stringify({ success: true, result }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      case 'closeConversation': {
        // Close a conversation
        const response = await fetch(`${tidioApiUrl}/conversations/${conversationId}`, {
          method: 'PATCH',
          headers: {
            'Authorization': authHeader,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            status: 'closed',
          }),
        });

        if (!response.ok) {
          throw new Error('Failed to close conversation in Tidio');
        }

        return new Response(
          JSON.stringify({ success: true }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      default:
        throw new Error('Invalid action');
    }
  } catch (error) {
    console.error('Error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { 
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );
  }
});

import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false
        }
      }
    )

    // Get the authorization header
    const authHeader = req.headers.get('Authorization')
    if (!authHeader) {
      throw new Error('No authorization header')
    }

    // Extract user id from JWT (the function already verifies JWT at the edge)
    const token = authHeader.replace('Bearer ', '')
    let userId: string | null = null
    try {
      const payloadBase64 = token.split('.')[1]
      const normalized = payloadBase64.replace(/-/g, '+').replace(/_/g, '/');
      const payloadJson = atob(normalized)
      const payload = JSON.parse(payloadJson)
      userId = payload.sub as string
    } catch (e) {
      console.error('JWT decode error:', e)
      throw new Error('Unauthorized')
    }

    if (!userId) {
      throw new Error('Unauthorized')
    }

    // Check if user is admin
    const { data: roleData, error: roleError } = await supabaseAdmin
      .from('user_roles')
      .select('role')
      .eq('user_id', userId)
      .maybeSingle()

    if (roleError) {
      console.error('Role check error:', roleError)
      throw new Error('Error checking user role')
    }

    if (!roleData || roleData.role !== 'admin') {
      throw new Error('Unauthorized: Admin access required')
    }

    console.log('Authorized admin request by', userId)

    const { action, ...payload } = await req.json()

    switch (action) {
      case 'listUsers': {
        const { data: { users }, error } = await supabaseAdmin.auth.admin.listUsers()
        if (error) throw error
        return new Response(JSON.stringify({ users }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        })
      }

      case 'createUser': {
        const { email, password, metadata } = payload
        const { data, error } = await supabaseAdmin.auth.admin.createUser({
          email,
          password,
          email_confirm: true,
          user_metadata: metadata
        })
        if (error) throw error
        return new Response(JSON.stringify({ user: data.user }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        })
      }

      case 'updateUser': {
        const { userId, metadata, password } = payload
        const updateData: any = {}
        if (metadata) updateData.user_metadata = metadata
        if (password) updateData.password = password
        
        const { data, error } = await supabaseAdmin.auth.admin.updateUserById(userId, updateData)
        if (error) throw error
        return new Response(JSON.stringify({ user: data.user }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        })
      }

      case 'deleteUser': {
        const { userId } = payload
        const { error } = await supabaseAdmin.auth.admin.deleteUser(userId)
        if (error) throw error
        return new Response(JSON.stringify({ success: true }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        })
      }

      case 'getUserEmails': {
        const { user_ids } = payload
        if (!user_ids || !Array.isArray(user_ids)) {
          throw new Error('user_ids must be an array')
        }
        
        // جلب البريد الإلكتروني للمستخدمين المحددين
        const userEmails: Record<string, string> = {}
        
        for (const userId of user_ids) {
          try {
            const { data, error } = await supabaseAdmin.auth.admin.getUserById(userId)
            if (!error && data?.user?.email) {
              userEmails[userId] = data.user.email
            }
          } catch (e) {
            console.warn(`Could not fetch email for user ${userId}:`, e)
          }
        }
        
        return new Response(JSON.stringify({ userEmails }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        })
      }

      default:
        throw new Error('Invalid action')
    }
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
    return new Response(JSON.stringify({ error: errorMessage }), {
      status: 400,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }
})
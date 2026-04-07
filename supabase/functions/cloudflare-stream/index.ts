import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface CreateLiveInputResponse {
  uid: string;
  rtmps: {
    url: string;
    streamKey: string;
  };
  webRTC: {
    url: string;
  };
  webRTCPlayback: {
    url: string;
  };
  srt: {
    url: string;
    streamId: string;
    passphrase: string;
  };
}

interface UploadVideoResponse {
  uid: string;
  uploadURL: string;
  playback: {
    hls: string;
    dash: string;
  };
}

// Helper function to verify authentication and authorization
async function verifyAuth(req: Request, corsHeaders: Record<string, string>) {
  const authHeader = req.headers.get('Authorization');
  
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return {
      error: new Response(
        JSON.stringify({ error: 'No authorization header provided' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      ),
      user: null,
      supabaseClient: null,
    };
  }

  const token = authHeader.replace('Bearer ', '');
  const supabaseClient = createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_ANON_KEY')!,
    { global: { headers: { Authorization: authHeader } } }
  );

  const { data, error } = await supabaseClient.auth.getClaims(token);
  
  if (error || !data?.claims) {
    return {
      error: new Response(
        JSON.stringify({ error: 'Invalid or expired token' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      ),
      user: null,
      supabaseClient: null,
    };
  }

  return {
    error: null,
    user: { id: data.claims.sub as string },
    supabaseClient,
  };
}

// Helper function to check if user has trainer/moderator/admin role
async function hasPrivilegedRole(supabaseClient: ReturnType<typeof createClient>, userId: string): Promise<boolean> {
  const { data: roleData } = await supabaseClient
    .from('user_roles')
    .select('role')
    .eq('user_id', userId)
    .in('role', ['trainer', 'moderator', 'admin']);

  return roleData && roleData.length > 0;
}

// Helper function to check if user is workshop host
async function isWorkshopHost(supabaseClient: ReturnType<typeof createClient>, userId: string, workshopId: string): Promise<boolean> {
  const { data: workshop } = await supabaseClient
    .from('workshops')
    .select('host_id')
    .eq('id', workshopId)
    .single();

  return workshop?.host_id === userId;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  // Verify authentication
  const { error: authError, user, supabaseClient } = await verifyAuth(req, corsHeaders);
  if (authError) {
    return authError;
  }

  // Check if user has privileged role (trainer/moderator/admin)
  const hasRole = await hasPrivilegedRole(supabaseClient!, user!.id);
  if (!hasRole) {
    return new Response(
      JSON.stringify({ error: 'Insufficient permissions - trainer role or higher required' }),
      { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }

  const CLOUDFLARE_ACCOUNT_ID = Deno.env.get('CLOUDFLARE_ACCOUNT_ID');
  const CLOUDFLARE_API_TOKEN = Deno.env.get('CLOUDFLARE_API_TOKEN');

  if (!CLOUDFLARE_ACCOUNT_ID) {
    return new Response(
      JSON.stringify({ error: 'CLOUDFLARE_ACCOUNT_ID is not configured' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }

  if (!CLOUDFLARE_API_TOKEN) {
    return new Response(
      JSON.stringify({ error: 'CLOUDFLARE_API_TOKEN is not configured' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }

  try {
    const { action, workshopId, title, videoUid } = await req.json();
    const baseUrl = `https://api.cloudflare.com/client/v4/accounts/${CLOUDFLARE_ACCOUNT_ID}/stream`;

    // For workshop-specific operations, verify user is the workshop host
    if (workshopId && ['create-live-input', 'delete-live-input', 'create-direct-upload'].includes(action)) {
      const isHost = await isWorkshopHost(supabaseClient!, user!.id, workshopId);
      
      // Allow if user is host OR is admin/moderator
      if (!isHost) {
        const { data: adminRole } = await supabaseClient!
          .from('user_roles')
          .select('role')
          .eq('user_id', user!.id)
          .in('role', ['moderator', 'admin']);
        
        if (!adminRole || adminRole.length === 0) {
          return new Response(
            JSON.stringify({ error: 'You do not have permission for this workshop' }),
            { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }
      }
    }

    switch (action) {
      case 'create-live-input': {
        // Create a live input for streaming
        const response = await fetch(`${baseUrl}/live_inputs`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${CLOUDFLARE_API_TOKEN}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            meta: {
              name: title || `Workshop ${workshopId}`,
              workshopId: workshopId,
            },
            recording: {
              mode: 'automatic',
              timeoutSeconds: 0,
              requireSignedURLs: false,
            },
          }),
        });

        const data = await response.json();
        
        if (!response.ok) {
          throw new Error(`Cloudflare API error: ${JSON.stringify(data)}`);
        }

        const result: CreateLiveInputResponse = {
          uid: data.result.uid,
          rtmps: data.result.rtmps,
          webRTC: data.result.webRTC,
          webRTCPlayback: data.result.webRTCPlayback,
          srt: data.result.srt,
        };

        return new Response(
          JSON.stringify({ success: true, data: result }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      case 'get-live-input': {
        // Get live input details
        const response = await fetch(`${baseUrl}/live_inputs/${videoUid}`, {
          headers: {
            'Authorization': `Bearer ${CLOUDFLARE_API_TOKEN}`,
          },
        });

        const data = await response.json();
        
        if (!response.ok) {
          throw new Error(`Cloudflare API error: ${JSON.stringify(data)}`);
        }

        return new Response(
          JSON.stringify({ success: true, data: data.result }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      case 'list-recordings': {
        // List recordings for a live input
        const response = await fetch(`${baseUrl}/live_inputs/${videoUid}/videos`, {
          headers: {
            'Authorization': `Bearer ${CLOUDFLARE_API_TOKEN}`,
          },
        });

        const data = await response.json();
        
        if (!response.ok) {
          throw new Error(`Cloudflare API error: ${JSON.stringify(data)}`);
        }

        return new Response(
          JSON.stringify({ success: true, data: data.result }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      case 'get-video': {
        // Get video details
        const response = await fetch(`${baseUrl}/${videoUid}`, {
          headers: {
            'Authorization': `Bearer ${CLOUDFLARE_API_TOKEN}`,
          },
        });

        const data = await response.json();
        
        if (!response.ok) {
          throw new Error(`Cloudflare API error: ${JSON.stringify(data)}`);
        }

        return new Response(
          JSON.stringify({ success: true, data: data.result }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      case 'create-direct-upload': {
        // Create a direct upload URL for recording uploads
        const response = await fetch(`${baseUrl}/direct_upload`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${CLOUDFLARE_API_TOKEN}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            maxDurationSeconds: 21600, // 6 hours max
            meta: {
              name: title || `Workshop Recording ${workshopId}`,
              workshopId: workshopId,
            },
          }),
        });

        const data = await response.json();
        
        if (!response.ok) {
          throw new Error(`Cloudflare API error: ${JSON.stringify(data)}`);
        }

        const result: UploadVideoResponse = {
          uid: data.result.uid,
          uploadURL: data.result.uploadURL,
          playback: {
            hls: `https://customer-${CLOUDFLARE_ACCOUNT_ID}.cloudflarestream.com/${data.result.uid}/manifest/video.m3u8`,
            dash: `https://customer-${CLOUDFLARE_ACCOUNT_ID}.cloudflarestream.com/${data.result.uid}/manifest/video.mpd`,
          },
        };

        return new Response(
          JSON.stringify({ success: true, data: result }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      case 'delete-video': {
        // Delete a video
        const response = await fetch(`${baseUrl}/${videoUid}`, {
          method: 'DELETE',
          headers: {
            'Authorization': `Bearer ${CLOUDFLARE_API_TOKEN}`,
          },
        });

        if (!response.ok) {
          const data = await response.json();
          throw new Error(`Cloudflare API error: ${JSON.stringify(data)}`);
        }

        return new Response(
          JSON.stringify({ success: true }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      case 'delete-live-input': {
        // Delete a live input
        const response = await fetch(`${baseUrl}/live_inputs/${videoUid}`, {
          method: 'DELETE',
          headers: {
            'Authorization': `Bearer ${CLOUDFLARE_API_TOKEN}`,
          },
        });

        if (!response.ok) {
          const data = await response.json();
          throw new Error(`Cloudflare API error: ${JSON.stringify(data)}`);
        }

        return new Response(
          JSON.stringify({ success: true }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      default:
        return new Response(
          JSON.stringify({ error: 'Invalid action' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
    }
  } catch (error) {
    console.error('Cloudflare Stream error:', error);
    return new Response(
      JSON.stringify({ 
        error: error instanceof Error ? error.message : 'Unknown error occurred' 
      }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});

import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { SignJWT } from "https://deno.land/x/jose@v5.9.6/index.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_ANON_KEY")!,
      { global: { headers: { Authorization: authHeader } } }
    );

    const token = authHeader.replace("Bearer ", "");
    const { data: claimsData, error: claimsError } = await supabase.auth.getClaims(token);
    if (claimsError || !claimsData?.claims) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const userId = claimsData.claims.sub as string;

    const { room_id } = await req.json();
    if (!room_id) {
      return new Response(JSON.stringify({ error: "room_id is required" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Verify room exists
    const { data: room, error: roomError } = await supabase
      .from("rooms")
      .select("id, host_id, title, is_live, is_approved")
      .eq("id", room_id)
      .single();

    if (roomError || !room) {
      return new Response(JSON.stringify({ error: "Room not found" }), {
        status: 404,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Get user profile name
    const { data: profile } = await supabase
      .from("profiles")
      .select("full_name")
      .eq("id", userId)
      .single();

    const participantName = profile?.full_name || "مستخدم";
    const isHost = room.host_id === userId;

    // Check user role in room
    const { data: roleData } = await supabase
      .from("room_roles")
      .select("role")
      .eq("room_id", room_id)
      .eq("user_id", userId)
      .single();

    const role = roleData?.role || (isHost ? "host" : "listener");
    const canPublish = ["host", "co_host", "moderator", "speaker"].includes(role);

    // Generate LiveKit JWT token manually
    const apiKey = Deno.env.get("LIVEKIT_API_KEY")!;
    const apiSecret = Deno.env.get("LIVEKIT_API_SECRET")!;
    const livekitUrl = Deno.env.get("LIVEKIT_URL")!;

    const now = Math.floor(Date.now() / 1000);
    const exp = now + 3600; // 1 hour

    const grant: Record<string, unknown> = {
      roomJoin: true,
      room: room_id,
      canPublish: canPublish,
      canSubscribe: true,
      canPublishData: true,
      canUpdateOwnMetadata: true,
    };

    const payload = {
      iss: apiKey,
      sub: userId,
      name: participantName,
      nbf: now,
      exp: exp,
      iat: now,
      jti: userId,
      video: grant,
      metadata: JSON.stringify({ role, isHost }),
    };

    const secret = new TextEncoder().encode(apiSecret);
    const livekitToken = await new SignJWT(payload)
      .setProtectedHeader({ alg: "HS256", typ: "JWT" })
      .sign(secret);

    return new Response(
      JSON.stringify({
        token: livekitToken,
        url: livekitUrl,
        canPublish,
        role,
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  } catch (err) {
    console.error("LiveKit token error:", err);
    return new Response(JSON.stringify({ error: "Internal server error" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});

import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

type Action =
  | "promote_speaker"
  | "demote_listener"
  | "promote_co_host"
  | "promote_moderator"
  | "kick"
  | "mute_user"
  | "accept_hand"
  | "reject_hand"
  | "start_live"
  | "end_room";

interface RequestBody {
  action: Action;
  room_id: string;
  target_user_id?: string;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseAdmin = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    // Auth check
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return jsonResponse({ error: "Missing authorization" }, 401);
    }

    const token = authHeader.replace("Bearer ", "");
    const {
      data: { user },
      error: authError,
    } = await supabaseAdmin.auth.getUser(token);

    if (authError || !user) {
      return jsonResponse({ error: "Unauthorized" }, 401);
    }

    const { action, room_id, target_user_id }: RequestBody = await req.json();

    if (!action || !room_id) {
      return jsonResponse({ error: "Missing action or room_id" }, 400);
    }

    // Get room info
    const { data: room, error: roomError } = await supabaseAdmin
      .from("rooms")
      .select("host_id, is_live, title")
      .eq("id", room_id)
      .single();

    if (roomError || !room) {
      return jsonResponse({ error: "Room not found" }, 404);
    }

    const isHost = room.host_id === user.id;

    // Check caller's role in room
    const { data: callerRoleData } = await supabaseAdmin
      .from("room_roles")
      .select("role")
      .eq("room_id", room_id)
      .eq("user_id", user.id)
      .single();

    const callerRole = callerRoleData?.role || (isHost ? "host" : "listener");

    // Permission matrix
    const canManage = isHost || ["co_host", "moderator"].includes(callerRole);
    const canPromoteCoHost = isHost; // Only host
    const canKick = isHost || callerRole === "co_host";

    // Execute action
    switch (action) {
      case "promote_speaker": {
        if (!canManage)
          return jsonResponse({ error: "Insufficient permissions" }, 403);
        if (!target_user_id)
          return jsonResponse({ error: "Missing target_user_id" }, 400);

        // Upsert role to speaker
        await supabaseAdmin.from("room_roles").upsert(
          {
            room_id,
            user_id: target_user_id,
            role: "speaker",
            assigned_by: user.id,
          },
          { onConflict: "room_id,user_id" }
        );

        // Resolve any pending hand raise
        await supabaseAdmin
          .from("room_hand_raises")
          .update({
            status: "accepted",
            resolved_by: user.id,
            resolved_at: new Date().toISOString(),
          })
          .eq("room_id", room_id)
          .eq("user_id", target_user_id)
          .eq("status", "pending");

        return jsonResponse({
          success: true,
          message: "User promoted to speaker",
        });
      }

      case "demote_listener": {
        if (!canManage)
          return jsonResponse({ error: "Insufficient permissions" }, 403);
        if (!target_user_id)
          return jsonResponse({ error: "Missing target_user_id" }, 400);

        // Cannot demote host
        if (target_user_id === room.host_id) {
          return jsonResponse({ error: "Cannot demote room host" }, 400);
        }

        await supabaseAdmin
          .from("room_roles")
          .delete()
          .eq("room_id", room_id)
          .eq("user_id", target_user_id);

        return jsonResponse({
          success: true,
          message: "User demoted to listener",
        });
      }

      case "promote_co_host": {
        if (!canPromoteCoHost)
          return jsonResponse(
            { error: "Only host can promote co-hosts" },
            403
          );
        if (!target_user_id)
          return jsonResponse({ error: "Missing target_user_id" }, 400);

        await supabaseAdmin.from("room_roles").upsert(
          {
            room_id,
            user_id: target_user_id,
            role: "co_host",
            assigned_by: user.id,
          },
          { onConflict: "room_id,user_id" }
        );

        return jsonResponse({
          success: true,
          message: "User promoted to co-host",
        });
      }

      case "promote_moderator": {
        if (!canPromoteCoHost)
          return jsonResponse(
            { error: "Only host can assign moderators" },
            403
          );
        if (!target_user_id)
          return jsonResponse({ error: "Missing target_user_id" }, 400);

        await supabaseAdmin.from("room_roles").upsert(
          {
            room_id,
            user_id: target_user_id,
            role: "moderator",
            assigned_by: user.id,
          },
          { onConflict: "room_id,user_id" }
        );

        return jsonResponse({
          success: true,
          message: "User promoted to moderator",
        });
      }

      case "kick": {
        if (!canKick)
          return jsonResponse({ error: "Insufficient permissions" }, 403);
        if (!target_user_id)
          return jsonResponse({ error: "Missing target_user_id" }, 400);

        if (target_user_id === room.host_id) {
          return jsonResponse({ error: "Cannot kick room host" }, 400);
        }

        // Remove role
        await supabaseAdmin
          .from("room_roles")
          .delete()
          .eq("room_id", room_id)
          .eq("user_id", target_user_id);

        // Remove from participants
        await supabaseAdmin
          .from("room_participants")
          .delete()
          .eq("room_id", room_id)
          .eq("user_id", target_user_id);

        // Remove pending hand raises
        await supabaseAdmin
          .from("room_hand_raises")
          .delete()
          .eq("room_id", room_id)
          .eq("user_id", target_user_id)
          .eq("status", "pending");

        return jsonResponse({ success: true, message: "User kicked" });
      }

      case "accept_hand": {
        if (!canManage)
          return jsonResponse({ error: "Insufficient permissions" }, 403);
        if (!target_user_id)
          return jsonResponse({ error: "Missing target_user_id" }, 400);

        // Resolve hand raise
        await supabaseAdmin
          .from("room_hand_raises")
          .update({
            status: "accepted",
            resolved_by: user.id,
            resolved_at: new Date().toISOString(),
          })
          .eq("room_id", room_id)
          .eq("user_id", target_user_id)
          .eq("status", "pending");

        // Promote to speaker
        await supabaseAdmin.from("room_roles").upsert(
          {
            room_id,
            user_id: target_user_id,
            role: "speaker",
            assigned_by: user.id,
          },
          { onConflict: "room_id,user_id" }
        );

        return jsonResponse({
          success: true,
          message: "Hand raise accepted, user is now speaker",
        });
      }

      case "reject_hand": {
        if (!canManage)
          return jsonResponse({ error: "Insufficient permissions" }, 403);
        if (!target_user_id)
          return jsonResponse({ error: "Missing target_user_id" }, 400);

        await supabaseAdmin
          .from("room_hand_raises")
          .update({
            status: "rejected",
            resolved_by: user.id,
            resolved_at: new Date().toISOString(),
          })
          .eq("room_id", room_id)
          .eq("user_id", target_user_id)
          .eq("status", "pending");

        return jsonResponse({
          success: true,
          message: "Hand raise rejected",
        });
      }

      case "start_live": {
        if (!isHost)
          return jsonResponse({ error: "Only host can start live" }, 403);

        await supabaseAdmin
          .from("rooms")
          .update({
            is_live: true,
            actual_started_at: new Date().toISOString(),
          })
          .eq("id", room_id);

        return jsonResponse({ success: true, message: "Room is now live" });
      }

      case "end_room": {
        if (!isHost)
          return jsonResponse({ error: "Only host can end room" }, 403);

        await supabaseAdmin
          .from("rooms")
          .update({
            is_live: false,
            ended_at: new Date().toISOString(),
          })
          .eq("id", room_id);

        return jsonResponse({ success: true, message: "Room ended" });
      }

      default:
        return jsonResponse({ error: `Unknown action: ${action}` }, 400);
    }
  } catch (err) {
    console.error("room-manage error:", err);
    return jsonResponse({ error: "Internal server error" }, 500);
  }
});

function jsonResponse(data: Record<string, unknown>, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      ...corsHeaders,
      "Content-Type": "application/json",
    },
  });
}

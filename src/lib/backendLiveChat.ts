import { compatInsert, compatSelect } from "@/lib/backendCompat";

export interface BackendLiveChatMessage {
  id: string;
  user_id: string;
  message: string;
  created_at: string;
}

interface PublicProfile {
  id: string;
  full_name: string | null;
  avatar_url?: string | null;
}

const tableFor = (eventType: "workshop" | "room") =>
  eventType === "workshop" ? "workshop_messages" : "room_messages";

const foreignKeyFor = (eventType: "workshop" | "room") =>
  eventType === "workshop" ? "workshop_id" : "room_id";

export const listLiveChatMessages = async (
  eventType: "workshop" | "room",
  eventId: string,
) => {
  const response = await compatSelect<BackendLiveChatMessage[]>(tableFor(eventType), {
    filters: [{ column: foreignKeyFor(eventType), operator: "eq", value: eventId }],
    order: [{ column: "created_at", ascending: true }],
    limit: 100,
  });

  return Array.isArray(response.data) ? response.data : [];
};

export const listLiveChatProfiles = async (userIds: string[]) => {
  if (!userIds.length) return new Map<string, { name: string; avatar?: string }>();

  const response = await compatSelect<PublicProfile[]>("profiles_public", {
    filters: [{ column: "id", operator: "in", value: [...new Set(userIds)] }],
  });
  const profiles = Array.isArray(response.data) ? response.data : [];

  return new Map(
    profiles.map((profile) => [
      profile.id,
      {
        name: profile.full_name || "مستخدم",
        avatar: profile.avatar_url || undefined,
      },
    ]),
  );
};

export const sendLiveChatMessage = async (
  eventType: "workshop" | "room",
  eventId: string,
  userId: string,
  message: string,
) =>
  compatInsert(tableFor(eventType), {
    [foreignKeyFor(eventType)]: eventId,
    user_id: userId,
    message,
  });

import { backendRequest } from "@/lib/backendApi";

export type SessionStatus = "scheduled" | "live" | "ended";
export type SessionVisibility = "public" | "restricted";
export type SessionRoomRole = "guest" | "listener" | "speaker" | "moderator" | "co_host" | "host";

export interface SessionUserSummary {
  id: string;
  name: string;
  avatar_url?: string | null;
  room_role?: string;
}

export interface BackendSessionAccess {
  room_role: SessionRoomRole;
  is_registered: boolean;
  canJoin: boolean;
  canListen: boolean;
  canSpeak: boolean;
  canModerate: boolean;
  canPublish: boolean;
  canPublishData: boolean;
  canSubscribe: boolean;
  canStartSession: boolean;
  canEndSession: boolean;
  canPromoteSpeaker: boolean;
  canPromoteCoHost: boolean;
  canPromoteModerator: boolean;
  canKick: boolean;
  denialReason?: string | null;
}

export interface BackendSessionContract {
  id: string;
  title: string;
  description?: string | null;
  program_id?: string | null;
  track_id?: string | null;
  start_time: string;
  end_time?: string | null;
  actual_started_at?: string | null;
  scheduled_at: string;
  status: SessionStatus;
  visibility: SessionVisibility;
  category?: string | null;
  image_url?: string | null;
  price?: number;
  speaker_count?: number;
  moderator_count?: number;
  speakers?: SessionUserSummary[];
}

export interface BackendRoomContract {
  room_id: string;
  session_id: string;
  room_type: "stage" | "open" | "private" | string;
  host_id: string;
  host: SessionUserSummary;
  speakers: SessionUserSummary[];
  moderators: SessionUserSummary[];
  allow_listeners: boolean;
  max_participants?: number | null;
  participant_count?: number;
  access: BackendSessionAccess;
}

export interface BackendSessionParticipant {
  id: string;
  name: string;
  avatar_url?: string | null;
  bio?: string | null;
  room_role: string;
  is_host: boolean;
  is_present: boolean;
  has_raised_hand: boolean;
  joined_at?: string | null;
}

export interface BackendSessionHandRaise {
  id: string;
  user_id: string;
  name: string;
  avatar_url?: string | null;
  created_at: string;
}

export interface BackendSessionSummaryItem {
  session: BackendSessionContract;
  room: BackendRoomContract;
  access: BackendSessionAccess;
}

export interface BackendSessionDetails extends BackendSessionSummaryItem {
  participants: BackendSessionParticipant[];
  hand_raises: BackendSessionHandRaise[];
}

interface BackendSessionListResponse {
  items: BackendSessionSummaryItem[];
  total: number;
  limit: number;
  offset: number;
}

interface BackendSessionResponse extends BackendSessionDetails {
  token?: string | null;
}

export const listBackendSessions = async ({
  status,
  limit,
  offset,
}: {
  status?: SessionStatus;
  limit?: number;
  offset?: number;
} = {}) => {
  return backendRequest<BackendSessionListResponse>("/sessions", {
    query: {
      status,
      limit,
      offset,
    },
  });
};

export const getBackendSessionDetails = async (sessionId: string) => {
  return backendRequest<BackendSessionDetails>(`/sessions/${sessionId}`);
};

export const joinBackendSession = async (sessionId: string) => {
  return backendRequest<BackendSessionResponse>(`/sessions/${sessionId}/join`, {
    method: "POST",
    requireAuth: true,
  });
};

export const leaveBackendSession = async (sessionId: string) => {
  return backendRequest<BackendSessionResponse>(`/sessions/${sessionId}/leave`, {
    method: "POST",
    requireAuth: true,
  });
};

export const manageBackendSession = async ({
  sessionId,
  action,
  targetUserId,
}: {
  sessionId: string;
  action:
    | "promote_speaker"
    | "demote_listener"
    | "promote_co_host"
    | "promote_moderator"
    | "kick"
    | "raise_hand"
    | "lower_hand"
    | "accept_hand"
    | "reject_hand"
    | "start_live"
    | "end_session";
  targetUserId?: string;
}) => {
  return backendRequest<BackendSessionDetails>(`/sessions/${sessionId}/actions`, {
    method: "POST",
    requireAuth: true,
    body: {
      action,
      target_user_id: targetUserId,
    },
  });
};

export const createBackendSession = async (payload: {
  title: string;
  description?: string;
  category?: string;
  scheduled_at?: string;
  duration_minutes?: number;
  price?: number;
  max_participants?: number;
  access_type?: "public" | "subscribers_only";
  image_url?: string;
}) => {
  return backendRequest<BackendSessionResponse>("/sessions", {
    method: "POST",
    requireAuth: true,
    body: payload,
  });
};

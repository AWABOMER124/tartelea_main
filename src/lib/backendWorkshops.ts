import {
  compatDelete,
  compatInsert,
  compatSelect,
  compatUpdate,
} from "@/lib/backendCompat";

export interface BackendWorkshop {
  id: string;
  title: string;
  description: string | null;
  host_id: string;
  category: string;
  scheduled_at: string;
  duration_minutes: number;
  is_live: boolean;
  is_approved: boolean;
  price: number;
  max_participants: number;
  image_url?: string | null;
  cloudflare_live_input_uid?: string | null;
}

export interface BackendWorkshopRecording {
  id: string;
  workshop_id: string;
  recording_url: string | null;
  duration_seconds: number | null;
  recorded_at: string | null;
  cloudflare_uid: string | null;
  is_available?: boolean;
}

interface PublicProfile {
  id: string;
  full_name: string | null;
}

interface WorkshopParticipant {
  id?: string;
  workshop_id: string;
  user_id: string;
}

const rows = <T>(value: T[] | T | null | undefined): T[] =>
  Array.isArray(value) ? value : value ? [value] : [];

const profileMapFor = async (ids: string[]) => {
  if (!ids.length) return new Map<string, string | null>();
  const response = await compatSelect<PublicProfile[]>("profiles_public", {
    filters: [{ column: "id", operator: "in", value: [...new Set(ids)] }],
  });
  return new Map(rows(response.data).map((profile) => [profile.id, profile.full_name]));
};

export const listWorkshops = async () => {
  const workshopsResponse = await compatSelect<BackendWorkshop[]>("workshops", {
    filters: [
      { column: "is_approved", operator: "eq", value: true },
      { column: "scheduled_at", operator: "gte", value: new Date().toISOString() },
    ],
    order: [{ column: "scheduled_at", ascending: true }],
  });
  const workshops = rows(workshopsResponse.data);
  if (!workshops.length) return [];

  const hostMap = await profileMapFor(workshops.map((workshop) => workshop.host_id));
  const ids = workshops.map((workshop) => workshop.id);
  const participantsResponse = await compatSelect<WorkshopParticipant[]>("workshop_participants", {
    filters: [{ column: "workshop_id", operator: "in", value: ids }],
  });
  const counts = rows(participantsResponse.data).reduce<Record<string, number>>((acc, participant) => {
    acc[participant.workshop_id] = (acc[participant.workshop_id] || 0) + 1;
    return acc;
  }, {});

  return workshops.map((workshop) => ({
    ...workshop,
    host_name: hostMap.get(workshop.host_id) || "مدرب",
    participant_count: counts[workshop.id] || 0,
  }));
};

export const getWorkshop = async (workshopId: string) => {
  const workshopResponse = await compatSelect<BackendWorkshop | null>("workshops", {
    filters: [{ column: "id", operator: "eq", value: workshopId }],
    maybeSingle: true,
  });
  const workshop = workshopResponse.data;
  if (!workshop) return null;

  const [hostMap, participantsResponse] = await Promise.all([
    profileMapFor([workshop.host_id]),
    compatSelect<WorkshopParticipant[]>("workshop_participants", {
      filters: [{ column: "workshop_id", operator: "eq", value: workshopId }],
    }),
  ]);

  return {
    ...workshop,
    host_name: hostMap.get(workshop.host_id) || "مدرب",
    participant_count: rows(participantsResponse.data).length,
  };
};

export const listUserWorkshopParticipations = async (userId: string) => {
  const response = await compatSelect<WorkshopParticipant[]>("workshop_participants", {
    filters: [{ column: "user_id", operator: "eq", value: userId }],
  });
  return rows(response.data).map((participant) => participant.workshop_id);
};

export const joinWorkshop = async (workshopId: string, userId: string) =>
  compatInsert("workshop_participants", {
    workshop_id: workshopId,
    user_id: userId,
  });

export const leaveWorkshop = async (workshopId: string, userId: string) =>
  compatDelete("workshop_participants", [
    { column: "workshop_id", operator: "eq", value: workshopId },
    { column: "user_id", operator: "eq", value: userId },
  ]);

export const updateWorkshop = async (
  workshopId: string,
  payload: Partial<Pick<BackendWorkshop, "is_live" | "cloudflare_live_input_uid">>,
) =>
  compatUpdate("workshops", payload, [
    { column: "id", operator: "eq", value: workshopId },
  ], { single: true });

export const listWorkshopRecordings = async (workshopId?: string) => {
  const filters = [
    { column: "is_available", operator: "eq" as const, value: true },
  ];
  if (workshopId) {
    filters.push({ column: "workshop_id", operator: "eq" as const, value: workshopId });
  }

  const response = await compatSelect<BackendWorkshopRecording[]>("workshop_recordings", {
    filters,
    order: [{ column: "recorded_at", ascending: false }],
  });
  return rows(response.data);
};

export const createWorkshopRecording = async (payload: {
  workshop_id: string;
  recording_url: string;
  duration_seconds: number;
  is_available: boolean;
  cloudflare_uid?: string | null;
}) =>
  compatInsert("workshop_recordings", payload, { single: true });

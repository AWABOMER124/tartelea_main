import { compatDelete, compatSelect } from "@/lib/backendCompat";

export interface BackendArchivedRoom {
  id: string;
  title: string;
  description: string | null;
  category: string;
  scheduled_at: string;
  ended_at: string | null;
  actual_started_at: string | null;
  peak_participants: number | null;
  total_participants_count: number | null;
  duration_minutes: number | null;
  host_id: string;
  image_url?: string | null;
  is_approved?: boolean;
}

export interface BackendRoomRecording {
  id: string;
  room_id: string;
  recording_url: string;
  duration_seconds: number | null;
  file_size_bytes: number | null;
  recorded_at: string;
  is_available?: boolean;
}

interface PublicProfile {
  id: string;
  full_name: string | null;
}

export const listArchivedRoomsWithRecordingCounts = async () => {
  const roomsResponse = await compatSelect<BackendArchivedRoom[]>("rooms", {
    filters: [
      { column: "ended_at", operator: "not", value: null, notOperator: "is" },
      { column: "is_approved", operator: "eq", value: true },
    ],
    order: [{ column: "ended_at", ascending: false }],
    limit: 50,
  });

  const rooms = Array.isArray(roomsResponse.data) ? roomsResponse.data : [];
  if (!rooms.length) return [];

  const hostIds = [...new Set(rooms.map((room) => room.host_id))];
  const roomIds = rooms.map((room) => room.id);

  const [profilesResponse, recordingsResponse] = await Promise.all([
    compatSelect<PublicProfile[]>("profiles_public", {
      filters: [{ column: "id", operator: "in", value: hostIds }],
    }),
    compatSelect<Array<{ room_id: string }>>("room_recordings", {
      filters: [
        { column: "room_id", operator: "in", value: roomIds },
        { column: "is_available", operator: "eq", value: true },
      ],
    }),
  ]);

  const profiles = Array.isArray(profilesResponse.data) ? profilesResponse.data : [];
  const recordings = Array.isArray(recordingsResponse.data) ? recordingsResponse.data : [];
  const profileMap = new Map(profiles.map((profile) => [profile.id, profile.full_name]));
  const counts = recordings.reduce<Record<string, number>>((acc, recording) => {
    acc[recording.room_id] = (acc[recording.room_id] || 0) + 1;
    return acc;
  }, {});

  return rooms.map((room) => ({
    ...room,
    host_name: profileMap.get(room.host_id) || "مدرب",
    recording_count: counts[room.id] || 0,
  }));
};

export const listRoomRecordings = async () => {
  const recordingsResponse = await compatSelect<BackendRoomRecording[]>("room_recordings", {
    filters: [{ column: "is_available", operator: "eq", value: true }],
    order: [{ column: "recorded_at", ascending: false }],
  });

  const recordings = Array.isArray(recordingsResponse.data) ? recordingsResponse.data : [];
  if (!recordings.length) return [];

  const roomIds = [...new Set(recordings.map((recording) => recording.room_id))];
  const roomsResponse = await compatSelect<Array<{ id: string; title: string; host_id: string }>>("rooms", {
    filters: [{ column: "id", operator: "in", value: roomIds }],
  });
  const rooms = Array.isArray(roomsResponse.data) ? roomsResponse.data : [];
  const hostIds = [...new Set(rooms.map((room) => room.host_id))];
  const profilesResponse = await compatSelect<PublicProfile[]>("profiles_public", {
    filters: [{ column: "id", operator: "in", value: hostIds }],
  });
  const profiles = Array.isArray(profilesResponse.data) ? profilesResponse.data : [];

  const roomMap = new Map(rooms.map((room) => [room.id, room]));
  const profileMap = new Map(profiles.map((profile) => [profile.id, profile.full_name]));

  return recordings.map((recording) => {
    const room = roomMap.get(recording.room_id);
    return {
      ...recording,
      room_title: room?.title || "غرفة محذوفة",
      host_name: room ? profileMap.get(room.host_id) || "مدرب" : "غير معروف",
    };
  });
};

export const deleteRoomRecording = async (recordingId: string) =>
  compatDelete("room_recordings", [
    { column: "id", operator: "eq", value: recordingId },
  ]);

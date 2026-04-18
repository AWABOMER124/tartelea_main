/**
 * STEP 3 official LiveKit path:
 * Web joins voice sessions through backend `/sessions/:id/join`.
 * Frontend no longer decides the effective room role or publish permissions.
 */
import { useState, useEffect, useCallback, useRef } from "react";
import {
  Room,
  RoomEvent,
  Track,
  RemoteTrack,
  RemoteTrackPublication,
  RemoteParticipant,
  ConnectionState,
  ConnectionQuality,
  Participant,
} from "livekit-client";
import {
  joinBackendSession,
  type BackendSessionAccess,
  type BackendSessionContract,
  type BackendRoomContract,
} from "@/lib/backendSessions";

interface UseLiveKitRoomOptions {
  sessionId: string;
  enabled: boolean;
}

export interface ParticipantQuality {
  participantId: string;
  quality: ConnectionQuality;
}

const DEFAULT_LIVEKIT_URL =
  import.meta.env.VITE_LIVEKIT_URL?.trim() ||
  "https://tartelea-nodejs-ncyno3-ed08c5-72-62-41-242.traefik.me";

export const useLiveKitRoom = ({ sessionId, enabled }: UseLiveKitRoomOptions) => {
  const [room, setRoom] = useState<Room | null>(null);
  const [connectionState, setConnectionState] = useState<ConnectionState>(
    ConnectionState.Disconnected,
  );
  const [isAudioEnabled, setIsAudioEnabled] = useState(true);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [activeSpeakers, setActiveSpeakers] = useState<string[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [canPublish, setCanPublish] = useState(false);
  const [participantQualities, setParticipantQualities] = useState<
    Map<string, ConnectionQuality>
  >(new Map());
  const [session, setSession] = useState<BackendSessionContract | null>(null);
  const [roomInfo, setRoomInfo] = useState<BackendRoomContract | null>(null);
  const [access, setAccess] = useState<BackendSessionAccess | null>(null);
  const [lastJoinPayload, setLastJoinPayload] = useState<
    Awaited<ReturnType<typeof joinBackendSession>> | null
  >(null);
  const audioElementsRef = useRef<Map<string, HTMLAudioElement>>(new Map());
  const roomRef = useRef<Room | null>(null);

  const cleanupAudioElements = useCallback(() => {
    audioElementsRef.current.forEach((element) => element.remove());
    audioElementsRef.current.clear();
  }, []);

  const updateParticipantQualities = useCallback((livekitRoom: Room) => {
    const qualities = new Map<string, ConnectionQuality>();
    qualities.set(
      livekitRoom.localParticipant.identity,
      livekitRoom.localParticipant.connectionQuality,
    );
    livekitRoom.remoteParticipants.forEach((participant) => {
      qualities.set(participant.identity, participant.connectionQuality);
    });
    setParticipantQualities(new Map(qualities));
  }, []);

  const disconnect = useCallback(() => {
    if (roomRef.current) {
      roomRef.current.disconnect();
      roomRef.current = null;
      setRoom(null);
      setConnectionState(ConnectionState.Disconnected);
    }

    cleanupAudioElements();
    setParticipantQualities(new Map());
  }, [cleanupAudioElements]);

  const connect = useCallback(async () => {
    if (!sessionId || !enabled) {
      return;
    }

    try {
      setError(null);
      disconnect();

      const joinPayload = await joinBackendSession(sessionId);
      setLastJoinPayload(joinPayload);
      setSession(joinPayload.session);
      setRoomInfo(joinPayload.room);
      setAccess(joinPayload.access);
      setCanPublish(Boolean(joinPayload.access?.canPublish));

      if (!joinPayload.token) {
        if (joinPayload.session?.status === "live") {
          setError("تعذر إصدار توكن الانضمام للجلسة الصوتية.");
        }
        return;
      }

      const livekitRoom = new Room({
        adaptiveStream: true,
        dynacast: true,
        audioCaptureDefaults: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
        },
      });

      roomRef.current = livekitRoom;

      livekitRoom.on(RoomEvent.ConnectionStateChanged, (state: ConnectionState) => {
        setConnectionState(state);
      });

      livekitRoom.on(
        RoomEvent.TrackSubscribed,
        (
          track: RemoteTrack,
          _publication: RemoteTrackPublication,
          participant: RemoteParticipant,
        ) => {
          if (track.kind === Track.Kind.Audio) {
            const audioEl = track.attach();
            audioEl.id = `audio-${participant.identity}`;
            document.body.appendChild(audioEl);
            audioElementsRef.current.set(participant.identity, audioEl);
          }
        },
      );

      livekitRoom.on(
        RoomEvent.TrackUnsubscribed,
        (
          track: RemoteTrack,
          _publication: RemoteTrackPublication,
          participant: RemoteParticipant,
        ) => {
          track.detach().forEach((element) => element.remove());
          const audioEl = audioElementsRef.current.get(participant.identity);
          if (audioEl) {
            audioEl.remove();
            audioElementsRef.current.delete(participant.identity);
          }
        },
      );

      livekitRoom.on(RoomEvent.ActiveSpeakersChanged, (speakers) => {
        setActiveSpeakers(speakers.map((speaker) => speaker.identity));
      });

      livekitRoom.on(RoomEvent.LocalTrackPublished, () => {
        setIsSpeaking(true);
      });

      livekitRoom.on(RoomEvent.LocalTrackUnpublished, () => {
        setIsSpeaking(false);
      });

      livekitRoom.on(
        RoomEvent.ConnectionQualityChanged,
        (_quality: ConnectionQuality, participant: Participant) => {
          setParticipantQualities((prev) => {
            const next = new Map(prev);
            next.set(participant.identity, participant.connectionQuality);
            return next;
          });
        },
      );

      await livekitRoom.connect(DEFAULT_LIVEKIT_URL, joinPayload.token);
      setRoom(livekitRoom);
      updateParticipantQualities(livekitRoom);

      if (joinPayload.access?.canPublish) {
        await livekitRoom.localParticipant.setMicrophoneEnabled(true);
        setIsAudioEnabled(true);
      } else {
        setIsAudioEnabled(false);
      }
    } catch (err) {
      console.error("LiveKit connection error:", err);
      setError(err instanceof Error ? err.message : "فشل الاتصال بالغرفة الصوتية");
    }
  }, [disconnect, enabled, sessionId, updateParticipantQualities]);

  const toggleAudio = useCallback(async () => {
    if (!roomRef.current?.localParticipant || !access?.canPublish) {
      return;
    }

    const newState = !isAudioEnabled;
    await roomRef.current.localParticipant.setMicrophoneEnabled(newState);
    setIsAudioEnabled(newState);
  }, [access?.canPublish, isAudioEnabled]);

  useEffect(() => {
    if (enabled) {
      void connect();
    }

    return () => {
      disconnect();
    };
  }, [enabled, sessionId, connect, disconnect]);

  return {
    room,
    session,
    roomInfo,
    access,
    lastJoinPayload,
    connectionState,
    isAudioEnabled,
    isSpeaking,
    activeSpeakers,
    canPublish,
    error,
    participantQualities,
    connect,
    disconnect,
    toggleAudio,
  };
};

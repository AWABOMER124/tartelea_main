import { useState, useEffect, useCallback, useRef } from "react";
import {
  Room,
  RoomEvent,
  Track,
  RemoteTrack,
  RemoteTrackPublication,
  RemoteParticipant,
  LocalParticipant,
  ConnectionState,
  ConnectionQuality,
  Participant,
} from "livekit-client";
import { supabase } from "@/integrations/supabase/client";

interface UseLiveKitRoomOptions {
  roomId: string;
  enabled: boolean;
}

export interface ParticipantQuality {
  participantId: string;
  quality: ConnectionQuality;
}

export const useLiveKitRoom = ({ roomId, enabled }: UseLiveKitRoomOptions) => {
  const [room, setRoom] = useState<Room | null>(null);
  const [connectionState, setConnectionState] = useState<ConnectionState>(
    ConnectionState.Disconnected
  );
  const [isAudioEnabled, setIsAudioEnabled] = useState(true);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [activeSpeakers, setActiveSpeakers] = useState<string[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [canPublish, setCanPublish] = useState(false);
  const [participantQualities, setParticipantQualities] = useState<Map<string, ConnectionQuality>>(new Map());
  const audioElementsRef = useRef<Map<string, HTMLAudioElement>>(new Map());
  const roomRef = useRef<Room | null>(null);

  const updateParticipantQualities = useCallback((livekitRoom: Room) => {
    const qualities = new Map<string, ConnectionQuality>();
    // Local participant
    qualities.set(
      livekitRoom.localParticipant.identity,
      livekitRoom.localParticipant.connectionQuality
    );
    // Remote participants
    livekitRoom.remoteParticipants.forEach((p) => {
      qualities.set(p.identity, p.connectionQuality);
    });
    setParticipantQualities(new Map(qualities));
  }, []);

  const connect = useCallback(async () => {
    if (!roomId || !enabled) return;

    try {
      setError(null);

      const { data, error: fnError } = await supabase.functions.invoke(
        "livekit-token",
        {
          body: { room_id: roomId },
        }
      );

      if (fnError || !data?.token || !data?.url) {
        console.error("Failed to get LiveKit token:", fnError);
        setError("فشل الاتصال بخادم الصوت");
        return;
      }

      setCanPublish(data.canPublish);

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
          participant: RemoteParticipant
        ) => {
          if (track.kind === Track.Kind.Audio) {
            const audioEl = track.attach();
            audioEl.id = `audio-${participant.identity}`;
            document.body.appendChild(audioEl);
            audioElementsRef.current.set(participant.identity, audioEl);
          }
        }
      );

      livekitRoom.on(
        RoomEvent.TrackUnsubscribed,
        (
          track: RemoteTrack,
          _publication: RemoteTrackPublication,
          participant: RemoteParticipant
        ) => {
          track.detach().forEach((el) => el.remove());
          const audioEl = audioElementsRef.current.get(participant.identity);
          if (audioEl) {
            audioEl.remove();
            audioElementsRef.current.delete(participant.identity);
          }
        }
      );

      livekitRoom.on(RoomEvent.ActiveSpeakersChanged, (speakers) => {
        setActiveSpeakers(speakers.map((s) => s.identity));
      });

      livekitRoom.on(RoomEvent.LocalTrackPublished, () => {
        setIsSpeaking(true);
      });

      // Connection quality tracking
      livekitRoom.on(
        RoomEvent.ConnectionQualityChanged,
        (_quality: ConnectionQuality, participant: Participant) => {
          setParticipantQualities((prev) => {
            const next = new Map(prev);
            next.set(participant.identity, participant.connectionQuality);
            return next;
          });
        }
      );

      await livekitRoom.connect(data.url, data.token);
      setRoom(livekitRoom);

      // Initial quality snapshot
      updateParticipantQualities(livekitRoom);

      if (data.canPublish) {
        await livekitRoom.localParticipant.setMicrophoneEnabled(true);
        setIsAudioEnabled(true);
      }
    } catch (err) {
      console.error("LiveKit connection error:", err);
      setError("فشل الاتصال بالغرفة الصوتية");
    }
  }, [roomId, enabled, updateParticipantQualities]);

  const disconnect = useCallback(() => {
    if (roomRef.current) {
      roomRef.current.disconnect();
      roomRef.current = null;
      setRoom(null);
      setConnectionState(ConnectionState.Disconnected);
    }
    audioElementsRef.current.forEach((el) => el.remove());
    audioElementsRef.current.clear();
    setParticipantQualities(new Map());
  }, []);

  const toggleAudio = useCallback(async () => {
    if (!roomRef.current?.localParticipant) return;
    const newState = !isAudioEnabled;
    await roomRef.current.localParticipant.setMicrophoneEnabled(newState);
    setIsAudioEnabled(newState);
  }, [isAudioEnabled]);

  const enableMicrophone = useCallback(async () => {
    if (!roomRef.current?.localParticipant) return;
    await roomRef.current.localParticipant.setMicrophoneEnabled(true);
    setIsAudioEnabled(true);
    setCanPublish(true);
  }, []);

  useEffect(() => {
    if (enabled) {
      connect();
    }
    return () => {
      disconnect();
    };
  }, [enabled, roomId]);

  return {
    room,
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
    enableMicrophone,
  };
};

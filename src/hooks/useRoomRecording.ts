import { useState, useRef, useCallback } from "react";
import type { Room, TrackPublication } from "livekit-client";
import { useToast } from "@/hooks/use-toast";
import { uploadRoomRecording } from "@/lib/backendRoomRecordings";

interface UseRoomRecordingProps {
  roomId: string;
  room: Room | null;
}

const getPublicationAudioTrack = (publication: TrackPublication) => {
  const track = publication.track;
  if (!track || track.kind !== "audio") return null;
  return track.mediaStreamTrack ?? null;
};

export const useRoomRecording = ({ roomId, room }: UseRoomRecordingProps) => {
  const { toast } = useToast();
  const [isRecording, setIsRecording] = useState(false);
  const [recordingDuration, setRecordingDuration] = useState(0);
  const [isUploading, setIsUploading] = useState(false);

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const startTimeRef = useRef<number>(0);
  const audioContextRef = useRef<AudioContext | null>(null);
  const mixedStreamRef = useRef<MediaStream | null>(null);

  const cleanupMix = useCallback(() => {
    mixedStreamRef.current?.getTracks().forEach((track) => track.stop());
    mixedStreamRef.current = null;

    if (audioContextRef.current) {
      void audioContextRef.current.close().catch(() => undefined);
      audioContextRef.current = null;
    }
  }, []);

  const createMixedAudioStream = useCallback(() => {
    if (!room) return null;

    const tracks: MediaStreamTrack[] = [];

    room.localParticipant.audioTrackPublications.forEach((publication) => {
      const mediaTrack = getPublicationAudioTrack(publication);
      if (mediaTrack) tracks.push(mediaTrack);
    });

    room.remoteParticipants.forEach((participant) => {
      participant.audioTrackPublications.forEach((publication) => {
        const mediaTrack = getPublicationAudioTrack(publication);
        if (mediaTrack) tracks.push(mediaTrack);
      });
    });

    const uniqueTracks = [...new Map(tracks.map((track) => [track.id, track])).values()];
    if (!uniqueTracks.length) return null;

    const AudioContextCtor =
      window.AudioContext ||
      (window as typeof window & { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;

    if (!AudioContextCtor) return null;

    const audioContext = new AudioContextCtor();
    const destination = audioContext.createMediaStreamDestination();

    uniqueTracks.forEach((track) => {
      const source = audioContext.createMediaStreamSource(new MediaStream([track]));
      source.connect(destination);
    });

    audioContextRef.current = audioContext;
    mixedStreamRef.current = destination.stream;
    return destination.stream;
  }, [room]);

  const uploadRecording = useCallback(
    async (duration: number) => {
      if (chunksRef.current.length === 0) {
        cleanupMix();
        return;
      }

      setIsUploading(true);
      try {
        const blob = new Blob(chunksRef.current, { type: "audio/webm" });
        const file = new File([blob], `room-${roomId}-${Date.now()}.webm`, {
          type: "audio/webm",
        });

        await uploadRoomRecording({
          roomId,
          file,
          durationSeconds: duration,
        });

        toast({
          title: "✅ تم حفظ التسجيل",
          description: "تم حفظ صوت الجلسة في الأرشيف",
        });
      } catch (err) {
        console.error("Upload error:", err);
        toast({
          title: "خطأ",
          description: err instanceof Error ? err.message : "فشل رفع التسجيل",
          variant: "destructive",
        });
      } finally {
        setIsUploading(false);
        chunksRef.current = [];
        cleanupMix();
      }
    },
    [cleanupMix, roomId, toast],
  );

  const startRecording = useCallback(() => {
    if (!room) {
      toast({
        title: "خطأ",
        description: "الغرفة الصوتية غير متصلة بعد",
        variant: "destructive",
      });
      return;
    }

    if (mediaRecorderRef.current?.state === "recording") return;

    try {
      chunksRef.current = [];
      const mixedStream = createMixedAudioStream();

      if (!mixedStream || mixedStream.getAudioTracks().length === 0) {
        cleanupMix();
        toast({
          title: "تعذر بدء التسجيل",
          description: "لا توجد مسارات صوتية متاحة للتسجيل حالياً",
          variant: "destructive",
        });
        return;
      }

      const mimeType = MediaRecorder.isTypeSupported("audio/webm;codecs=opus")
        ? "audio/webm;codecs=opus"
        : "audio/webm";

      const mediaRecorder = new MediaRecorder(mixedStream, { mimeType });

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          chunksRef.current.push(event.data);
        }
      };

      mediaRecorder.onstop = async () => {
        const duration = Math.max(
          1,
          Math.floor((Date.now() - startTimeRef.current) / 1000),
        );
        await uploadRecording(duration);
      };

      mediaRecorder.onerror = () => {
        cleanupMix();
        setIsRecording(false);
        toast({
          title: "خطأ",
          description: "حدث خطأ أثناء تسجيل الجلسة",
          variant: "destructive",
        });
      };

      mediaRecorder.start(1000);
      mediaRecorderRef.current = mediaRecorder;
      startTimeRef.current = Date.now();
      setIsRecording(true);
      setRecordingDuration(0);

      timerRef.current = setInterval(() => {
        setRecordingDuration(
          Math.floor((Date.now() - startTimeRef.current) / 1000),
        );
      }, 1000);

      toast({
        title: "🔴 بدأ التسجيل",
        description: "يتم تسجيل الصوت المتاح من المتحدثين في الجلسة",
      });
    } catch (err) {
      cleanupMix();
      console.error("Recording error:", err);
      toast({
        title: "خطأ",
        description: "فشل بدء التسجيل",
        variant: "destructive",
      });
    }
  }, [cleanupMix, createMixedAudioStream, room, toast, uploadRecording]);

  const stopRecording = useCallback(() => {
    if (
      mediaRecorderRef.current &&
      mediaRecorderRef.current.state !== "inactive"
    ) {
      mediaRecorderRef.current.stop();
    }

    mediaRecorderRef.current = null;

    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }

    setIsRecording(false);
  }, []);

  const formatDuration = (seconds: number) => {
    const m = Math.floor(seconds / 60).toString().padStart(2, "0");
    const s = (seconds % 60).toString().padStart(2, "0");
    return `${m}:${s}`;
  };

  return {
    isRecording,
    isUploading,
    recordingDuration,
    formattedDuration: formatDuration(recordingDuration),
    startRecording,
    stopRecording,
  };
};

import { useState, useRef, useCallback } from "react";
import { useToast } from "@/hooks/use-toast";
import { uploadRoomRecording } from "@/lib/backendRoomRecordings";

interface UseRoomRecordingProps {
  roomId: string;
  localStream: MediaStream | null;
}

export const useRoomRecording = ({ roomId, localStream }: UseRoomRecordingProps) => {
  const { toast } = useToast();
  const [isRecording, setIsRecording] = useState(false);
  const [recordingDuration, setRecordingDuration] = useState(0);
  const [isUploading, setIsUploading] = useState(false);

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const startTimeRef = useRef<number>(0);

  const startRecording = useCallback(() => {
    if (!localStream) {
      toast({ title: "خطأ", description: "لا يوجد تدفق صوتي للتسجيل", variant: "destructive" });
      return;
    }

    try {
      chunksRef.current = [];
      const mediaRecorder = new MediaRecorder(localStream, {
        mimeType: MediaRecorder.isTypeSupported("audio/webm;codecs=opus")
          ? "audio/webm;codecs=opus"
          : "audio/webm",
      });

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          chunksRef.current.push(event.data);
        }
      };

      mediaRecorder.onstop = async () => {
        const duration = Math.floor((Date.now() - startTimeRef.current) / 1000);
        await uploadRecording(duration);
      };

      mediaRecorder.start(1000); // collect data every second
      mediaRecorderRef.current = mediaRecorder;
      startTimeRef.current = Date.now();
      setIsRecording(true);
      setRecordingDuration(0);

      // Timer for duration display
      timerRef.current = setInterval(() => {
        setRecordingDuration(Math.floor((Date.now() - startTimeRef.current) / 1000));
      }, 1000);

      toast({ title: "🔴 بدأ التسجيل", description: "جاري تسجيل الغرفة الصوتية" });
    } catch (err) {
      console.error("Recording error:", err);
      toast({ title: "خطأ", description: "فشل بدء التسجيل", variant: "destructive" });
    }
  }, [localStream, roomId]);

  const stopRecording = useCallback(() => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== "inactive") {
      mediaRecorderRef.current.stop();
    }
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
    setIsRecording(false);
  }, []);

  const uploadRecording = async (duration: number) => {
    if (chunksRef.current.length === 0) return;

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
        description: "التسجيل متاح الآن في الأرشيف",
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
    }
  };

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

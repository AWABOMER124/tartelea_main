import { useState, useCallback } from "react";
import { useToast } from "@/hooks/use-toast";
import { backendRequest } from "@/lib/backendApi";

interface LiveInputData {
  uid: string;
  rtmps: {
    url: string;
    streamKey: string;
  };
  webRTC: {
    url: string;
  };
  webRTCPlayback: {
    url: string;
  };
  srt: {
    url: string;
    streamId: string;
    passphrase: string;
  };
}

interface DirectUploadData {
  uid: string;
  uploadURL: string;
  playback: {
    hls: string;
    dash: string;
  };
}

interface VideoData {
  uid: string;
  status: {
    state: string;
    pctComplete?: number;
  };
  playback: {
    hls: string;
    dash: string;
  };
  duration?: number;
  thumbnail?: string;
}

export const useCloudflareStream = () => {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [liveInput, setLiveInput] = useState<LiveInputData | null>(null);

  const createLiveInput = useCallback(async (workshopId: string, title: string) => {
    setLoading(true);
    try {
      const response = await backendRequest<{ data: LiveInputData }>("/compat/functions/cloudflare-stream", {
        method: "POST",
        requireAuth: true,
        body: { action: "create-live-input", workshopId, title },
      });
      setLiveInput(response.data);
      return response.data;
    } catch (error) {
      console.error("Error creating live input:", error);
      toast({
        title: "خطأ",
        description: "فشل إنشاء البث المباشر",
        variant: "destructive",
      });
      return null;
    } finally {
      setLoading(false);
    }
  }, [toast]);

  const getLiveInput = useCallback(async (liveInputUid: string) => {
    setLoading(true);
    try {
      const response = await backendRequest<{ data: LiveInputData }>("/compat/functions/cloudflare-stream", {
        method: "POST",
        requireAuth: true,
        body: { action: "get-live-input", videoUid: liveInputUid },
      });
      return response.data;
    } catch (error) {
      console.error("Error getting live input:", error);
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  const listRecordings = useCallback(async (liveInputUid: string) => {
    setLoading(true);
    try {
      const response = await backendRequest<{ data: VideoData[] }>("/compat/functions/cloudflare-stream", {
        method: "POST",
        requireAuth: true,
        body: { action: "list-recordings", videoUid: liveInputUid },
      });
      return response.data;
    } catch (error) {
      console.error("Error listing recordings:", error);
      return [];
    } finally {
      setLoading(false);
    }
  }, []);

  const getVideo = useCallback(async (videoUid: string) => {
    try {
      const response = await backendRequest<{ data: VideoData }>("/compat/functions/cloudflare-stream", {
        method: "POST",
        requireAuth: true,
        body: { action: "get-video", videoUid },
      });
      return response.data;
    } catch (error) {
      console.error("Error getting video:", error);
      return null;
    }
  }, []);

  const createDirectUpload = useCallback(async (workshopId: string, title: string) => {
    setLoading(true);
    try {
      const response = await backendRequest<{ data: DirectUploadData }>("/compat/functions/cloudflare-stream", {
        method: "POST",
        requireAuth: true,
        body: { action: "create-direct-upload", workshopId, title },
      });
      return response.data;
    } catch (error) {
      console.error("Error creating direct upload:", error);
      toast({
        title: "خطأ",
        description: "فشل إنشاء رابط الرفع",
        variant: "destructive",
      });
      return null;
    } finally {
      setLoading(false);
    }
  }, [toast]);

  const uploadRecording = useCallback(async (uploadURL: string, blob: Blob) => {
    try {
      const formData = new FormData();
      formData.append("file", blob, "recording.webm");

      const response = await fetch(uploadURL, {
        method: "POST",
        body: formData,
      });

      if (!response.ok) {
        throw new Error("Upload failed");
      }

      toast({
        title: "تم الرفع",
        description: "تم رفع التسجيل بنجاح إلى Cloudflare",
      });

      return true;
    } catch (error) {
      console.error("Error uploading recording:", error);
      toast({
        title: "خطأ",
        description: "فشل رفع التسجيل",
        variant: "destructive",
      });
      return false;
    }
  }, [toast]);

  const deleteLiveInput = useCallback(async (liveInputUid: string) => {
    try {
      await backendRequest<{ data: unknown }>("/compat/functions/cloudflare-stream", {
        method: "POST",
        requireAuth: true,
        body: { action: "delete-live-input", videoUid: liveInputUid },
      });
      return true;
    } catch (error) {
      console.error("Error deleting live input:", error);
      return false;
    }
  }, []);

  const deleteVideo = useCallback(async (videoUid: string) => {
    try {
      await backendRequest<{ data: unknown }>("/compat/functions/cloudflare-stream", {
        method: "POST",
        requireAuth: true,
        body: { action: "delete-video", videoUid },
      });
      return true;
    } catch (error) {
      console.error("Error deleting video:", error);
      return false;
    }
  }, []);

  return {
    loading,
    liveInput,
    createLiveInput,
    getLiveInput,
    listRecordings,
    getVideo,
    createDirectUpload,
    uploadRecording,
    deleteLiveInput,
    deleteVideo,
  };
};

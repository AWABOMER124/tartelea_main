import { useState, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

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
      const { data, error } = await supabase.functions.invoke("cloudflare-stream", {
        body: {
          action: "create-live-input",
          workshopId,
          title,
        },
      });

      if (error) throw error;

      if (data.success) {
        setLiveInput(data.data);
        return data.data as LiveInputData;
      } else {
        throw new Error(data.error);
      }
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
      const { data, error } = await supabase.functions.invoke("cloudflare-stream", {
        body: {
          action: "get-live-input",
          videoUid: liveInputUid,
        },
      });

      if (error) throw error;

      if (data.success) {
        return data.data;
      } else {
        throw new Error(data.error);
      }
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
      const { data, error } = await supabase.functions.invoke("cloudflare-stream", {
        body: {
          action: "list-recordings",
          videoUid: liveInputUid,
        },
      });

      if (error) throw error;

      if (data.success) {
        return data.data as VideoData[];
      } else {
        throw new Error(data.error);
      }
    } catch (error) {
      console.error("Error listing recordings:", error);
      return [];
    } finally {
      setLoading(false);
    }
  }, []);

  const getVideo = useCallback(async (videoUid: string) => {
    try {
      const { data, error } = await supabase.functions.invoke("cloudflare-stream", {
        body: {
          action: "get-video",
          videoUid,
        },
      });

      if (error) throw error;

      if (data.success) {
        return data.data as VideoData;
      } else {
        throw new Error(data.error);
      }
    } catch (error) {
      console.error("Error getting video:", error);
      return null;
    }
  }, []);

  const createDirectUpload = useCallback(async (workshopId: string, title: string) => {
    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke("cloudflare-stream", {
        body: {
          action: "create-direct-upload",
          workshopId,
          title,
        },
      });

      if (error) throw error;

      if (data.success) {
        return data.data as DirectUploadData;
      } else {
        throw new Error(data.error);
      }
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
      const { data, error } = await supabase.functions.invoke("cloudflare-stream", {
        body: {
          action: "delete-live-input",
          videoUid: liveInputUid,
        },
      });

      if (error) throw error;
      return data.success;
    } catch (error) {
      console.error("Error deleting live input:", error);
      return false;
    }
  }, []);

  const deleteVideo = useCallback(async (videoUid: string) => {
    try {
      const { data, error } = await supabase.functions.invoke("cloudflare-stream", {
        body: {
          action: "delete-video",
          videoUid,
        },
      });

      if (error) throw error;
      return data.success;
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

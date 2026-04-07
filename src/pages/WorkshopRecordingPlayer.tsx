import { useParams, useNavigate, useLocation } from "react-router-dom";
import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import AppLayout from "@/components/layout/AppLayout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { ArrowRight, Calendar, Clock, User } from "lucide-react";
import { format, ar } from "@/lib/date-utils";

interface RecordingData {
  id: string;
  recording_url: string | null;
  duration_seconds: number | null;
  recorded_at: string | null;
  cloudflare_uid: string | null;
  workshop: {
    id: string;
    title: string;
    description: string | null;
    category: string;
    host_name: string | null;
  };
}

const WorkshopRecordingPlayer = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const location = useLocation();
  const [recording, setRecording] = useState<RecordingData | null>(
    (location.state as { recording?: RecordingData })?.recording || null
  );
  const [loading, setLoading] = useState(!recording);

  useEffect(() => {
    if (!recording && id) {
      fetchRecording();
    }
  }, [id, recording]);

  const fetchRecording = async () => {
    if (!id) return;

    try {
      const { data: recordingData, error } = await supabase
        .from("workshop_recordings")
        .select(`
          id,
          recording_url,
          duration_seconds,
          recorded_at,
          cloudflare_uid,
          workshop_id
        `)
        .eq("id", id)
        .eq("is_available", true)
        .single();

      if (error) throw error;

      if (recordingData) {
        const { data: workshopData } = await supabase
          .from("workshops")
          .select("id, title, description, category, host_id")
          .eq("id", recordingData.workshop_id)
          .single();

        let hostName = "مدرب";
        if (workshopData?.host_id) {
          const { data: profileData } = await supabase
            .from("profiles")
            .select("full_name")
            .eq("id", workshopData.host_id)
            .single();
          hostName = profileData?.full_name || "مدرب";
        }

        setRecording({
          id: recordingData.id,
          recording_url: recordingData.recording_url,
          duration_seconds: recordingData.duration_seconds,
          recorded_at: recordingData.recorded_at,
          cloudflare_uid: recordingData.cloudflare_uid,
          workshop: {
            id: workshopData?.id || recordingData.workshop_id,
            title: workshopData?.title || "ورشة عمل",
            description: workshopData?.description || null,
            category: workshopData?.category || "quran",
            host_name: hostName,
          },
        });
      }
    } catch (error) {
      console.error("Error fetching recording:", error);
    } finally {
      setLoading(false);
    }
  };

  const formatDuration = (seconds: number | null) => {
    if (!seconds) return "--:--";
    const hours = Math.floor(seconds / 3600);
    const mins = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    if (hours > 0) {
      return `${hours}:${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
    }
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

  const getCategoryLabel = (category: string) => {
    const labels: Record<string, string> = {
      quran: "القرآن الكريم",
      values: "القيم",
      community: "المجتمع",
      sudan_awareness: "الوعي السوداني",
      arab_awareness: "الوعي العربي",
      islamic_awareness: "الوعي الإسلامي",
    };
    return labels[category] || category;
  };

  // Generate embed URL for Cloudflare Stream
  const getVideoUrl = () => {
    if (!recording) return null;

    // If it's a Cloudflare HLS URL
    if (recording.recording_url?.includes("cloudflarestream.com")) {
      return recording.recording_url;
    }

    // If we have a cloudflare_uid, use iframe embed
    if (recording.cloudflare_uid) {
      return `https://customer-${import.meta.env.VITE_SUPABASE_PROJECT_ID}.cloudflarestream.com/${recording.cloudflare_uid}/iframe`;
    }

    return recording.recording_url;
  };

  if (loading) {
    return (
      <AppLayout>
        <div className="p-4 space-y-4" dir="rtl">
          <Skeleton className="h-10 w-40" />
          <Skeleton className="aspect-video w-full rounded-lg" />
          <Skeleton className="h-8 w-2/3" />
          <Skeleton className="h-4 w-1/2" />
        </div>
      </AppLayout>
    );
  }

  if (!recording) {
    return (
      <AppLayout>
        <div className="p-4 text-center" dir="rtl">
          <h2 className="text-xl font-bold text-foreground mb-4">
            التسجيل غير موجود
          </h2>
          <Button onClick={() => navigate("/workshop-recordings")}>
            العودة للتسجيلات
          </Button>
        </div>
      </AppLayout>
    );
  }

  const videoUrl = getVideoUrl();
  const isCloudflareEmbed = recording.cloudflare_uid || recording.recording_url?.includes("cloudflarestream.com");

  return (
    <AppLayout>
      <div className="p-4 pb-24 space-y-6 max-w-4xl mx-auto" dir="rtl">
        {/* Header */}
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="icon" onClick={() => navigate(-1)}>
            <ArrowRight className="h-5 w-5" />
          </Button>
          <h1 className="text-xl font-bold text-foreground line-clamp-1">
            {recording.workshop.title}
          </h1>
        </div>

        {/* Video Player */}
        <Card className="overflow-hidden">
          <CardContent className="p-0">
            <div className="aspect-video bg-black">
              {isCloudflareEmbed && recording.cloudflare_uid ? (
                <iframe
                  src={`https://customer-${import.meta.env.VITE_SUPABASE_PROJECT_ID || "stream"}.cloudflarestream.com/${recording.cloudflare_uid}/iframe`}
                  className="w-full h-full"
                  allow="accelerometer; gyroscope; autoplay; encrypted-media; picture-in-picture"
                  allowFullScreen
                />
              ) : videoUrl?.includes(".m3u8") ? (
                <video
                  src={videoUrl}
                  controls
                  className="w-full h-full"
                  poster=""
                >
                  <source src={videoUrl} type="application/x-mpegURL" />
                  متصفحك لا يدعم تشغيل الفيديو
                </video>
              ) : videoUrl ? (
                <video
                  src={videoUrl}
                  controls
                  className="w-full h-full"
                  poster=""
                >
                  متصفحك لا يدعم تشغيل الفيديو
                </video>
              ) : (
                <div className="w-full h-full flex items-center justify-center text-white">
                  لا يوجد رابط للتسجيل
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Recording Info */}
        <Card>
          <CardHeader>
            <div className="flex items-start justify-between">
              <CardTitle className="text-xl">{recording.workshop.title}</CardTitle>
              <Badge variant="secondary">
                {getCategoryLabel(recording.workshop.category)}
              </Badge>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            {recording.workshop.description && (
              <p className="text-muted-foreground">
                {recording.workshop.description}
              </p>
            )}

            <div className="flex flex-wrap gap-4 text-sm text-muted-foreground">
              <div className="flex items-center gap-2">
                <User className="h-4 w-4" />
                <span>{recording.workshop.host_name}</span>
              </div>

              {recording.duration_seconds && (
                <div className="flex items-center gap-2">
                  <Clock className="h-4 w-4" />
                  <span>{formatDuration(recording.duration_seconds)}</span>
                </div>
              )}

              {recording.recorded_at && (
                <div className="flex items-center gap-2">
                  <Calendar className="h-4 w-4" />
                  <span>
                    {format(new Date(recording.recorded_at), "dd MMMM yyyy", {
                      locale: ar,
                    })}
                  </span>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </AppLayout>
  );
};

export default WorkshopRecordingPlayer;

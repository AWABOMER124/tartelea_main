import { useState, useEffect, useRef, useCallback } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import { useCloudflareStream } from "@/hooks/useCloudflareStream";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import LiveChat from "@/components/live/LiveChat";
import LiveStreamSharing from "@/components/live/LiveStreamSharing";
import {
  Video,
  VideoOff,
  Mic,
  MicOff,
  PhoneOff,
  Users,
  Radio,
  Loader2,
  ArrowRight,
  MessageSquare,
  Circle,
  Cloud,
  Upload,
} from "lucide-react";

interface Participant {
  id: string;
  name: string;
  isHost: boolean;
  stream?: MediaStream;
}

const WorkshopLive = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { toast } = useToast();
  const { user, loading: authLoading } = useAuth();

  const [loading, setLoading] = useState(true);
  const [workshop, setWorkshop] = useState<any>(null);
  const [isHost, setIsHost] = useState(false);
  const [participants, setParticipants] = useState<Participant[]>([]);
  const [localStream, setLocalStream] = useState<MediaStream | null>(null);
  const [isVideoEnabled, setIsVideoEnabled] = useState(true);
  const [isAudioEnabled, setIsAudioEnabled] = useState(true);
  const [showChat, setShowChat] = useState(true);
  const [isRecording, setIsRecording] = useState(false);
  const [recordingDuration, setRecordingDuration] = useState(0);
  const [isUploading, setIsUploading] = useState(false);
  const [cloudflareUid, setCloudflareUid] = useState<string | null>(null);

  const localVideoRef = useRef<HTMLVideoElement>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const recordedChunksRef = useRef<Blob[]>([]);
  const recordingIntervalRef = useRef<NodeJS.Timeout | null>(null);

  const { 
    createDirectUpload, 
    uploadRecording, 
    createLiveInput,
    liveInput,
    loading: cloudflareLoading 
  } = useCloudflareStream();
  const userId = user?.id || null;

  useEffect(() => {
    if (authLoading) {
      return;
    }

    if (!userId) {
      navigate("/auth");
      return;
    }

    void fetchWorkshop(userId);
    return () => {
      stopLocalStream();
      stopRecording();
    };
  }, [authLoading, id, navigate, userId]);

  const fetchWorkshop = async (currentUserId: string) => {
    if (!id) return;

    const { data, error } = await supabase
      .from("workshops")
      .select("*")
      .eq("id", id)
      .single();

    if (error || !data) {
      toast({
        title: "خطأ",
        description: "الورشة غير موجودة",
        variant: "destructive",
      });
      navigate("/workshops");
      return;
    }

    setWorkshop(data);
    setIsHost(data.host_id === currentUserId);

    // Fetch host profile
    const { data: hostProfile } = await supabase
      .from("profiles")
      .select("full_name")
      .eq("id", data.host_id)
      .single();

    // Initialize participants with host
    setParticipants([
      {
        id: data.host_id,
        name: hostProfile?.full_name || "المضيف",
        isHost: true,
      },
    ]);

    setLoading(false);

    // Start local media
    startLocalStream();
  };

  const startLocalStream = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: true,
        audio: true,
      });
      setLocalStream(stream);
      if (localVideoRef.current) {
        localVideoRef.current.srcObject = stream;
      }
    } catch (error) {
      toast({
        title: "تنبيه",
        description: "لم نتمكن من الوصول للكاميرا أو الميكروفون",
        variant: "destructive",
      });
    }
  };

  const stopLocalStream = () => {
    if (localStream) {
      localStream.getTracks().forEach((track) => track.stop());
      setLocalStream(null);
    }
  };

  const toggleVideo = useCallback(() => {
    if (localStream) {
      const videoTrack = localStream.getVideoTracks()[0];
      if (videoTrack) {
        videoTrack.enabled = !videoTrack.enabled;
        setIsVideoEnabled(videoTrack.enabled);
      }
    }
  }, [localStream]);

  const toggleAudio = useCallback(() => {
    if (localStream) {
      const audioTrack = localStream.getAudioTracks()[0];
      if (audioTrack) {
        audioTrack.enabled = !audioTrack.enabled;
        setIsAudioEnabled(audioTrack.enabled);
      }
    }
  }, [localStream]);

  const handleLeave = () => {
    stopLocalStream();
    stopRecording();
    navigate("/workshops");
  };

  const handleStartLive = async () => {
    if (!isHost || !id) return;

    try {
      // Create Cloudflare live input for streaming
      const liveInput = await createLiveInput(id, workshop?.title || "ورشة عمل");
      
      if (liveInput) {
        // Save live input UID to workshop
        await supabase
          .from("workshops")
          .update({ 
            is_live: true,
            cloudflare_live_input_uid: liveInput.uid 
          })
          .eq("id", id);

        setWorkshop({ ...workshop, is_live: true, cloudflare_live_input_uid: liveInput.uid });
        
        toast({
          title: "تم بدء البث",
          description: "البث المباشر عبر Cloudflare جاهز",
        });
      } else {
        // Fallback to local streaming
        const { error } = await supabase
          .from("workshops")
          .update({ is_live: true })
          .eq("id", id);

        if (!error) {
          setWorkshop({ ...workshop, is_live: true });
          toast({
            title: "تم",
            description: "بدأ البث المباشر",
          });
        }
      }
    } catch (error) {
      console.error("Error starting live:", error);
      toast({
        title: "خطأ",
        description: "فشل بدء البث",
        variant: "destructive",
      });
    }
  };

  const handleEndLive = async () => {
    if (!isHost || !id) return;

    if (isRecording) {
      await stopRecording();
    }

    const { error } = await supabase
      .from("workshops")
      .update({ is_live: false })
      .eq("id", id);

    if (error) {
      toast({
        title: "خطأ",
        description: "فشل إيقاف البث",
        variant: "destructive",
      });
    } else {
      toast({
        title: "تم",
        description: "انتهى البث المباشر",
      });
      navigate("/workshops");
    }
  };

  const startRecording = async () => {
    if (!localStream || !id) return;

    try {
      recordedChunksRef.current = [];
      const mediaRecorder = new MediaRecorder(localStream, {
        mimeType: "video/webm;codecs=vp9",
      });

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          recordedChunksRef.current.push(event.data);
        }
      };

      mediaRecorder.onstop = async () => {
        const blob = new Blob(recordedChunksRef.current, { type: "video/webm" });
        setIsUploading(true);
        
        try {
          // Get direct upload URL from Cloudflare
          const uploadData = await createDirectUpload(id, workshop?.title || "Workshop Recording");
          
          if (uploadData) {
            setCloudflareUid(uploadData.uid);
            
            // Upload to Cloudflare Stream
            const uploaded = await uploadRecording(uploadData.uploadURL, blob);
            
            if (uploaded) {
              // Save recording info to database with Cloudflare URL
              await supabase.from("workshop_recordings").insert({
                workshop_id: id,
                recording_url: uploadData.playback.hls,
                duration_seconds: recordingDuration,
                is_available: true,
              });

              toast({
                title: "تم رفع التسجيل",
                description: "تم رفع التسجيل إلى Cloudflare Stream بنجاح",
              });
            }
          } else {
            // Fallback to local download if Cloudflare fails
            const url = URL.createObjectURL(blob);
            const a = document.createElement("a");
            a.href = url;
            a.download = `workshop-${id}-${Date.now()}.webm`;
            a.click();

            await supabase.from("workshop_recordings").insert({
              workshop_id: id,
              recording_url: url,
              duration_seconds: recordingDuration,
              is_available: true,
            });

            toast({
              title: "تم حفظ التسجيل",
              description: "تم تحميل التسجيل محلياً",
            });
          }
        } catch (error) {
          console.error("Error uploading recording:", error);
          // Fallback to local download
          const url = URL.createObjectURL(blob);
          const a = document.createElement("a");
          a.href = url;
          a.download = `workshop-${id}-${Date.now()}.webm`;
          a.click();
        } finally {
          setIsUploading(false);
        }
      };

      mediaRecorder.start(1000);
      mediaRecorderRef.current = mediaRecorder;
      setIsRecording(true);

      // Start duration counter
      recordingIntervalRef.current = setInterval(() => {
        setRecordingDuration((prev) => prev + 1);
      }, 1000);

      toast({
        title: "بدأ التسجيل",
        description: "جاري تسجيل الورشة",
      });
    } catch (error) {
      toast({
        title: "خطأ",
        description: "فشل بدء التسجيل",
        variant: "destructive",
      });
    }
  };

  const stopRecording = async () => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== "inactive") {
      mediaRecorderRef.current.stop();
      mediaRecorderRef.current = null;
    }

    if (recordingIntervalRef.current) {
      clearInterval(recordingIntervalRef.current);
      recordingIntervalRef.current = null;
    }

    setIsRecording(false);
    setRecordingDuration(0);
  };

  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background flex flex-col" dir="rtl">
      {/* Header */}
      <div className="bg-card border-b border-border p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="icon" onClick={handleLeave}>
              <ArrowRight className="h-5 w-5" />
            </Button>
            <div>
              <h1 className="font-semibold text-foreground line-clamp-1">
                {workshop?.title}
              </h1>
              <div className="flex items-center gap-2 mt-1">
                {workshop?.is_live && (
                  <Badge variant="destructive" className="text-xs gap-1">
                    <Radio className="h-3 w-3 animate-pulse" />
                    مباشر
                  </Badge>
                )}
                {isRecording && (
                  <Badge variant="secondary" className="text-xs gap-1 bg-destructive/10 text-destructive">
                    <Circle className="h-3 w-3 fill-destructive animate-pulse" />
                    {formatDuration(recordingDuration)}
                  </Badge>
                )}
                {isUploading && (
                  <Badge variant="secondary" className="text-xs gap-1 bg-blue-500/10 text-blue-500">
                    <Cloud className="h-3 w-3 animate-pulse" />
                    جاري الرفع...
                  </Badge>
                )}
                <span className="text-xs text-muted-foreground flex items-center gap-1">
                  <Users className="h-3 w-3" />
                  {participants.length} مشارك
                </span>
              </div>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {isHost && (
              <>
                {workshop?.is_live ? (
                  <>
                    {isRecording ? (
                      <Button variant="outline" size="sm" onClick={stopRecording} disabled={isUploading}>
                        إيقاف التسجيل
                      </Button>
                    ) : (
                      <Button variant="outline" size="sm" onClick={startRecording} disabled={isUploading || cloudflareLoading}>
                        <Cloud className="h-4 w-4 ml-1" />
                        تسجيل
                      </Button>
                    )}
                    <Button variant="destructive" size="sm" onClick={handleEndLive}>
                      إنهاء البث
                    </Button>
                  </>
                ) : (
                  <Button size="sm" onClick={handleStartLive}>
                    بدء البث
                  </Button>
                )}
              </>
            )}
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setShowChat(!showChat)}
            >
              <MessageSquare className="h-5 w-5" />
            </Button>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex">
        {/* Video Area */}
        <div className={`flex-1 p-4 ${showChat ? "lg:w-2/3" : "w-full"}`}>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-w-4xl mx-auto">
            {/* Local Video */}
            <Card className="overflow-hidden">
              <CardContent className="p-0 relative aspect-video bg-muted">
                {localStream && isVideoEnabled ? (
                  <video
                    ref={localVideoRef}
                    autoPlay
                    muted
                    playsInline
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center">
                    <Avatar className="h-20 w-20">
                      <AvatarFallback className="text-2xl bg-primary/10 text-primary">
                        أنت
                      </AvatarFallback>
                    </Avatar>
                  </div>
                )}
                <div className="absolute bottom-2 right-2">
                  <Badge variant="secondary" className="text-xs">
                    {isHost ? "المضيف (أنت)" : "أنت"}
                  </Badge>
                </div>
              </CardContent>
            </Card>

            {/* Other Participants */}
            {participants
              .filter((p) => !p.isHost || !isHost)
              .map((participant) => (
                <Card key={participant.id} className="overflow-hidden">
                  <CardContent className="p-0 relative aspect-video bg-muted">
                    <div className="w-full h-full flex items-center justify-center">
                      <Avatar className="h-20 w-20">
                        <AvatarFallback className="text-2xl bg-primary/10 text-primary">
                          {participant.name.charAt(0)}
                        </AvatarFallback>
                      </Avatar>
                    </div>
                    <div className="absolute bottom-2 right-2">
                      <Badge variant="secondary" className="text-xs">
                        {participant.name}
                        {participant.isHost && " (المضيف)"}
                      </Badge>
                    </div>
                  </CardContent>
                </Card>
              ))}
          </div>

          {/* Live Stream Sharing - only for host */}
          {isHost && (
            <div className="max-w-4xl mx-auto mt-4">
              <LiveStreamSharing
                rtmpUrl={liveInput?.rtmps?.url}
                streamKey={liveInput?.rtmps?.streamKey}
                webRtcUrl={liveInput?.webRTC?.url}
                isLive={workshop?.is_live}
                eventTitle={workshop?.title}
                eventId={id}
              />
            </div>
          )}
        </div>

        {/* Chat Sidebar */}
        {showChat && userId && (
          <div className="w-full lg:w-80 border-r border-border h-[calc(100vh-8rem)]">
            <LiveChat eventId={id!} eventType="workshop" userId={userId} />
          </div>
        )}
      </div>

      {/* Controls */}
      <div className="bg-card border-t border-border p-4">
        <div className="flex items-center justify-center gap-4">
          <Button
            variant={isVideoEnabled ? "secondary" : "destructive"}
            size="icon"
            className="h-12 w-12 rounded-full"
            onClick={toggleVideo}
          >
            {isVideoEnabled ? (
              <Video className="h-5 w-5" />
            ) : (
              <VideoOff className="h-5 w-5" />
            )}
          </Button>
          <Button
            variant={isAudioEnabled ? "secondary" : "destructive"}
            size="icon"
            className="h-12 w-12 rounded-full"
            onClick={toggleAudio}
          >
            {isAudioEnabled ? (
              <Mic className="h-5 w-5" />
            ) : (
              <MicOff className="h-5 w-5" />
            )}
          </Button>
          <Button
            variant="destructive"
            size="icon"
            className="h-12 w-12 rounded-full"
            onClick={handleLeave}
          >
            <PhoneOff className="h-5 w-5" />
          </Button>
        </div>
      </div>
    </div>
  );
};

export default WorkshopLive;

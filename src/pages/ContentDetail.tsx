import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import AppLayout from "@/components/layout/AppLayout";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { 
  ArrowRight, 
  FileText, 
  Headphones, 
  Video, 
  Calendar,
  BookOpen,
  ExternalLink,
  Play,
  Pause,
  Volume2,
  VolumeX,
  Maximize,
  SkipBack,
  SkipForward
} from "lucide-react";
import { cn } from "@/lib/utils";
import { getLibraryContent, type BackendContentItem as Content } from "@/lib/backendContent";

const typeIcons = {
  article: FileText,
  audio: Headphones,
  video: Video,
};

const categoryLabels: Record<string, string> = {
  quran: "القرآن",
  values: "القيم",
  community: "المجتمع",
  sudan_awareness: "الوعي السوداني",
};

const depthLabels: Record<string, string> = {
  beginner: "مبتدئ",
  intermediate: "متوسط",
  advanced: "متقدم",
};

const ContentDetail = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [content, setContent] = useState<Content | null>(null);
  const [loading, setLoading] = useState(true);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);

  useEffect(() => {
    if (id) {
      void fetchContent();
    }
  }, [id]);

  const fetchContent = async () => {
    setLoading(true);
    try {
      const data = await getLibraryContent(id!);
      setContent(data);
    } finally {
      setLoading(false);
    }
  };

  const handlePlayPause = () => {
    const mediaElement = document.querySelector<HTMLAudioElement | HTMLVideoElement>(
      content?.type === "audio" ? "audio" : "video"
    );
    if (mediaElement) {
      if (isPlaying) {
        mediaElement.pause();
      } else {
        mediaElement.play();
      }
      setIsPlaying(!isPlaying);
    }
  };

  const handleMuteToggle = () => {
    const mediaElement = document.querySelector<HTMLAudioElement | HTMLVideoElement>(
      content?.type === "audio" ? "audio" : "video"
    );
    if (mediaElement) {
      mediaElement.muted = !isMuted;
      setIsMuted(!isMuted);
    }
  };

  const handleSeek = (e: React.ChangeEvent<HTMLInputElement>) => {
    const mediaElement = document.querySelector<HTMLAudioElement | HTMLVideoElement>(
      content?.type === "audio" ? "audio" : "video"
    );
    if (mediaElement) {
      const newTime = parseFloat(e.target.value);
      mediaElement.currentTime = newTime;
      setCurrentTime(newTime);
    }
  };

  const handleSkip = (seconds: number) => {
    const mediaElement = document.querySelector<HTMLAudioElement | HTMLVideoElement>(
      content?.type === "audio" ? "audio" : "video"
    );
    if (mediaElement) {
      mediaElement.currentTime = Math.max(0, Math.min(duration, mediaElement.currentTime + seconds));
    }
  };

  const handleTimeUpdate = (e: React.SyntheticEvent<HTMLAudioElement | HTMLVideoElement>) => {
    setCurrentTime(e.currentTarget.currentTime);
    setDuration(e.currentTarget.duration);
  };

  const handleFullscreen = () => {
    const videoElement = document.querySelector("video");
    if (videoElement) {
      if (document.fullscreenElement) {
        document.exitFullscreen();
      } else {
        videoElement.requestFullscreen();
      }
    }
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

  if (loading) {
    return (
      <AppLayout>
        <div className="px-4 py-6 space-y-6">
          <Skeleton className="h-8 w-32" />
          <Skeleton className="h-64 w-full rounded-xl" />
          <Skeleton className="h-6 w-3/4" />
          <Skeleton className="h-4 w-1/2" />
          <Skeleton className="h-32 w-full" />
        </div>
      </AppLayout>
    );
  }

  if (!content) {
    return (
      <AppLayout>
        <div className="px-4 py-20 text-center">
          <BookOpen className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
          <h2 className="text-xl font-display font-bold text-foreground mb-2">
            المحتوى غير موجود
          </h2>
          <p className="text-muted-foreground mb-6">
            لم نتمكن من العثور على المحتوى المطلوب
          </p>
          <Button onClick={() => navigate("/library")} variant="outline">
            <ArrowRight className="h-4 w-4 ml-2" />
            العودة للمكتبة
          </Button>
        </div>
      </AppLayout>
    );
  }

  const Icon = typeIcons[content.type];
  const isSudanAwareness = content.is_sudan_awareness;

  return (
    <AppLayout>
      <div className="px-4 py-6 space-y-6">
        {/* Back Button */}
        <Button
          variant="ghost"
          size="sm"
          onClick={() => navigate("/library")}
          className="gap-2"
        >
          <ArrowRight className="h-4 w-4" />
          العودة للمكتبة
        </Button>

        {/* Content Header */}
        <div className="space-y-4">
          <div className="flex items-start gap-4">
            <div
              className={cn(
                "flex-shrink-0 w-16 h-16 rounded-xl flex items-center justify-center",
                isSudanAwareness ? "bg-sudan-red/10" : "bg-primary/10"
              )}
            >
              <Icon
                className={cn(
                  "h-8 w-8",
                  isSudanAwareness ? "text-sudan-red" : "text-primary"
                )}
              />
            </div>
            <div className="flex-1 min-w-0">
              <h1 className="text-xl font-display font-bold text-foreground leading-tight mb-2">
                {content.title}
              </h1>
              <div className="flex flex-wrap gap-2">
                <Badge
                  variant="secondary"
                  className={cn(
                    isSudanAwareness && "bg-sudan-red/10 text-sudan-red"
                  )}
                >
                  {categoryLabels[content.category] || content.category}
                </Badge>
                <Badge variant="outline">{depthLabels[content.depth_level]}</Badge>
                {content.created_at && (
                  <Badge variant="outline" className="gap-1">
                    <Calendar className="h-3 w-3" />
                    {new Date(content.created_at).toLocaleDateString("ar")}
                  </Badge>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Media Player */}
        {content.type === "video" && content.url && (
          <div className="rounded-xl overflow-hidden bg-black">
            <video
              src={content.url}
              className="w-full aspect-video"
              onTimeUpdate={handleTimeUpdate}
              onEnded={() => setIsPlaying(false)}
              onPlay={() => setIsPlaying(true)}
              onPause={() => setIsPlaying(false)}
            />
            {/* Video Controls */}
            <div className="bg-card/95 backdrop-blur-sm p-4 space-y-3">
              {/* Progress Bar */}
              <div className="flex items-center gap-3">
                <span className="text-xs text-muted-foreground w-10">
                  {formatTime(currentTime)}
                </span>
                <input
                  type="range"
                  min="0"
                  max={duration || 100}
                  value={currentTime}
                  onChange={handleSeek}
                  className="flex-1 h-1 rounded-full bg-muted appearance-none [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-3 [&::-webkit-slider-thumb]:h-3 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-primary"
                />
                <span className="text-xs text-muted-foreground w-10">
                  {formatTime(duration)}
                </span>
              </div>
              {/* Control Buttons */}
              <div className="flex items-center justify-center gap-4">
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => handleSkip(-10)}
                >
                  <SkipBack className="h-5 w-5" />
                </Button>
                <Button
                  variant="default"
                  size="icon"
                  className="h-12 w-12 rounded-full"
                  onClick={handlePlayPause}
                >
                  {isPlaying ? (
                    <Pause className="h-6 w-6" />
                  ) : (
                    <Play className="h-6 w-6 mr-[-2px]" />
                  )}
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => handleSkip(10)}
                >
                  <SkipForward className="h-5 w-5" />
                </Button>
                <Button variant="ghost" size="icon" onClick={handleMuteToggle}>
                  {isMuted ? (
                    <VolumeX className="h-5 w-5" />
                  ) : (
                    <Volume2 className="h-5 w-5" />
                  )}
                </Button>
                <Button variant="ghost" size="icon" onClick={handleFullscreen}>
                  <Maximize className="h-5 w-5" />
                </Button>
              </div>
            </div>
          </div>
        )}

        {content.type === "audio" && content.url && (
          <div className="rounded-xl bg-gradient-to-br from-primary/10 via-accent/5 to-primary/10 p-6 space-y-4">
            <audio
              src={content.url}
              onTimeUpdate={handleTimeUpdate}
              onEnded={() => setIsPlaying(false)}
              onPlay={() => setIsPlaying(true)}
              onPause={() => setIsPlaying(false)}
            />
            {/* Audio Visualization */}
            <div className="flex items-center justify-center py-8">
              <div className="relative">
                <div
                  className={cn(
                    "w-32 h-32 rounded-full flex items-center justify-center",
                    "bg-primary/20 border-4 border-primary/30",
                    isPlaying && "animate-pulse"
                  )}
                >
                  <Headphones className="h-12 w-12 text-primary" />
                </div>
                {isPlaying && (
                  <>
                    <div className="absolute inset-0 rounded-full border-4 border-primary/20 animate-ping" />
                    <div className="absolute inset-[-8px] rounded-full border-2 border-primary/10 animate-ping delay-75" />
                  </>
                )}
              </div>
            </div>
            {/* Progress Bar */}
            <div className="flex items-center gap-3">
              <span className="text-xs text-muted-foreground w-10">
                {formatTime(currentTime)}
              </span>
              <input
                type="range"
                min="0"
                max={duration || 100}
                value={currentTime}
                onChange={handleSeek}
                className="flex-1 h-2 rounded-full bg-primary/20 appearance-none [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-4 [&::-webkit-slider-thumb]:h-4 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-primary [&::-webkit-slider-thumb]:shadow-lg"
              />
              <span className="text-xs text-muted-foreground w-10">
                {formatTime(duration)}
              </span>
            </div>
            {/* Control Buttons */}
            <div className="flex items-center justify-center gap-6">
              <Button variant="ghost" size="icon" onClick={() => handleSkip(-10)}>
                <SkipBack className="h-6 w-6" />
              </Button>
              <Button
                variant="default"
                size="lg"
                className="h-16 w-16 rounded-full shadow-lg"
                onClick={handlePlayPause}
              >
                {isPlaying ? (
                  <Pause className="h-8 w-8" />
                ) : (
                  <Play className="h-8 w-8 mr-[-3px]" />
                )}
              </Button>
              <Button variant="ghost" size="icon" onClick={() => handleSkip(10)}>
                <SkipForward className="h-6 w-6" />
              </Button>
            </div>
          </div>
        )}

        {/* Article Content */}
        {content.type === "article" && (
          <div className="rounded-xl bg-card border border-border p-6">
            <div className="prose prose-sm max-w-none">
              {content.description ? (
                <p className="text-foreground leading-relaxed whitespace-pre-wrap">
                  {content.description}
                </p>
              ) : (
                <p className="text-muted-foreground text-center py-8">
                  لا يوجد محتوى نصي متاح
                </p>
              )}
            </div>
            {content.url && (
              <div className="mt-6 pt-6 border-t border-border">
                <Button
                  variant="outline"
                  className="gap-2"
                  onClick={() => window.open(content.url!, "_blank")}
                >
                  <ExternalLink className="h-4 w-4" />
                  قراءة المقال الكامل
                </Button>
              </div>
            )}
          </div>
        )}

        {/* Description Section */}
        {content.description && content.type !== "article" && (
          <div className="rounded-xl bg-card border border-border p-6">
            <h3 className="font-display font-semibold text-foreground mb-3">
              الوصف
            </h3>
            <p className="text-muted-foreground leading-relaxed">
              {content.description}
            </p>
          </div>
        )}

        {/* External Link */}
        {content.url && content.type !== "article" && (
          <Button
            variant="outline"
            className="w-full gap-2"
            onClick={() => window.open(content.url!, "_blank")}
          >
            <ExternalLink className="h-4 w-4" />
            فتح الرابط الخارجي
          </Button>
        )}
      </div>
    </AppLayout>
  );
};

export default ContentDetail;

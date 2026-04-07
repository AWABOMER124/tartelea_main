import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import {
  Share2,
  Copy,
  Check,
  ExternalLink,
  Radio,
  ChevronDown,
  ChevronUp,
  Send,
  Music2,
} from "lucide-react";

interface LiveStreamSharingProps {
  rtmpUrl?: string;
  streamKey?: string;
  webRtcUrl?: string;
  playbackUrl?: string;
  isLive?: boolean;
  eventTitle?: string;
  eventId?: string;
}

const LiveStreamSharing = ({
  rtmpUrl,
  streamKey,
  webRtcUrl,
  playbackUrl,
  isLive,
  eventTitle,
  eventId,
}: LiveStreamSharingProps) => {
  const { toast } = useToast();
  const [expanded, setExpanded] = useState(false);
  const [copiedField, setCopiedField] = useState<string | null>(null);

  const copyToClipboard = async (text: string, fieldName: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedField(fieldName);
      toast({ title: "تم النسخ", description: `تم نسخ ${fieldName}` });
      setTimeout(() => setCopiedField(null), 2000);
    } catch {
      toast({ title: "خطأ", description: "فشل النسخ", variant: "destructive" });
    }
  };

  const shareToTelegram = () => {
    const message = encodeURIComponent(
      `🔴 بث مباشر الآن!\n\n${eventTitle || "ورشة عمل"}\n\nانضم الآن عبر المنصة`
    );
    window.open(`https://t.me/share/url?url=${encodeURIComponent(window.location.href)}&text=${message}`, "_blank");
  };

  const shareToTikTok = () => {
    // TikTok doesn't have a direct share URL API, but we can guide the user
    toast({
      title: "البث إلى تيك توك",
      description: "استخدم عنوان RTMP ومفتاح البث في إعدادات البث المباشر في تيك توك",
    });
  };

  return (
    <Card className="border-accent/30 bg-card/80 backdrop-blur-sm">
      <CardHeader className="pb-2 cursor-pointer" onClick={() => setExpanded(!expanded)}>
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm font-semibold flex items-center gap-2">
            <Share2 className="h-4 w-4 text-accent" />
            مشاركة البث المباشر
          </CardTitle>
          <div className="flex items-center gap-2">
            {isLive && (
              <Badge variant="destructive" className="text-xs gap-1">
                <Radio className="h-3 w-3 animate-pulse" />
                مباشر
              </Badge>
            )}
            {expanded ? (
              <ChevronUp className="h-4 w-4 text-muted-foreground" />
            ) : (
              <ChevronDown className="h-4 w-4 text-muted-foreground" />
            )}
          </div>
        </div>
      </CardHeader>

      {expanded && (
        <CardContent className="space-y-4 pt-2">
          {/* Quick Share Buttons */}
          <div className="grid grid-cols-2 gap-2">
            <Button
              variant="outline"
              size="sm"
              className="gap-2 border-[#0088cc]/30 hover:bg-[#0088cc]/10 text-[#0088cc]"
              onClick={shareToTelegram}
            >
              <Send className="h-4 w-4" />
              تليجرام
            </Button>
            <Button
              variant="outline"
              size="sm"
              className="gap-2 border-foreground/30 hover:bg-foreground/10"
              onClick={shareToTikTok}
            >
              <Music2 className="h-4 w-4" />
              تيك توك
            </Button>
          </div>

          {/* RTMP Details for Multi-streaming */}
          {rtmpUrl && streamKey && (
            <div className="space-y-3 p-3 rounded-lg bg-muted/50 border border-border">
              <p className="text-xs font-semibold text-foreground flex items-center gap-1">
                <ExternalLink className="h-3 w-3" />
                إعدادات البث الاحترافي (OBS / تيك توك / أخرى)
              </p>

              {/* RTMP URL */}
              <div className="space-y-1">
                <label className="text-xs text-muted-foreground">عنوان RTMP</label>
                <div className="flex gap-1">
                  <Input
                    value={rtmpUrl}
                    readOnly
                    className="text-xs font-mono h-8 bg-background"
                    dir="ltr"
                  />
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 shrink-0"
                    onClick={() => copyToClipboard(rtmpUrl, "عنوان RTMP")}
                  >
                    {copiedField === "عنوان RTMP" ? (
                      <Check className="h-3 w-3 text-green-500" />
                    ) : (
                      <Copy className="h-3 w-3" />
                    )}
                  </Button>
                </div>
              </div>

              {/* Stream Key */}
              <div className="space-y-1">
                <label className="text-xs text-muted-foreground">مفتاح البث</label>
                <div className="flex gap-1">
                  <Input
                    value={streamKey}
                    readOnly
                    type="password"
                    className="text-xs font-mono h-8 bg-background"
                    dir="ltr"
                  />
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 shrink-0"
                    onClick={() => copyToClipboard(streamKey, "مفتاح البث")}
                  >
                    {copiedField === "مفتاح البث" ? (
                      <Check className="h-3 w-3 text-green-500" />
                    ) : (
                      <Copy className="h-3 w-3" />
                    )}
                  </Button>
                </div>
              </div>

              <p className="text-[10px] text-muted-foreground leading-relaxed">
                💡 انسخ العنوان والمفتاح وألصقهما في إعدادات البث في تيك توك أو OBS أو أي برنامج بث آخر للبث المتعدد على عدة منصات في نفس الوقت.
              </p>
            </div>
          )}

          {/* Playback URL */}
          {playbackUrl && (
            <div className="space-y-1">
              <label className="text-xs text-muted-foreground">رابط المشاهدة</label>
              <div className="flex gap-1">
                <Input
                  value={playbackUrl}
                  readOnly
                  className="text-xs font-mono h-8 bg-background"
                  dir="ltr"
                />
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 shrink-0"
                  onClick={() => copyToClipboard(playbackUrl, "رابط المشاهدة")}
                >
                  {copiedField === "رابط المشاهدة" ? (
                    <Check className="h-3 w-3 text-green-500" />
                  ) : (
                    <Copy className="h-3 w-3" />
                  )}
                </Button>
              </div>
            </div>
          )}

          {!rtmpUrl && !streamKey && (
            <p className="text-xs text-muted-foreground text-center py-2">
              ابدأ البث أولاً لعرض تفاصيل المشاركة
            </p>
          )}
        </CardContent>
      )}
    </Card>
  );
};

export default LiveStreamSharing;

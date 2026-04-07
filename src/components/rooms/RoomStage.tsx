import { useState } from "react";
import { ConnectionQuality } from "livekit-client";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { MicOff, Crown, Shield, Star, Sparkles } from "lucide-react";
import ConnectionQualityIndicator from "./ConnectionQualityIndicator";

export interface StageParticipant {
  id: string;
  name: string;
  isHost: boolean;
  isMuted: boolean;
  isSpeaking: boolean;
  role?: string;
  avatarUrl?: string;
  bio?: string;
  speakingDuration?: number;
  connectionQuality?: ConnectionQuality;
}

interface RoomStageProps {
  speakers: StageParticipant[];
  currentUserId: string;
}

const roleConfig: Record<string, { icon: typeof Crown; color: string; label: string }> = {
  host: { icon: Crown, color: "bg-amber-500", label: "مضيف" },
  co_host: { icon: Star, color: "bg-blue-500", label: "مضيف مشارك" },
  moderator: { icon: Shield, color: "bg-emerald-500", label: "مشرف" },
  speaker: { icon: Sparkles, color: "bg-primary", label: "متحدث" },
};

const formatSpeakingTime = (seconds: number) => {
  if (!seconds || seconds < 60) return "";
  const m = Math.floor(seconds / 60);
  return `${m} د`;
};

const RoomStage = ({ speakers, currentUserId }: RoomStageProps) => {
  const [selectedSpeaker, setSelectedSpeaker] = useState<StageParticipant | null>(null);

  const sortedSpeakers = [...speakers].sort((a, b) => {
    const order = ["host", "co_host", "moderator", "speaker"];
    const aIdx = order.indexOf(a.role || (a.isHost ? "host" : "speaker"));
    const bIdx = order.indexOf(b.role || (b.isHost ? "host" : "speaker"));
    return aIdx - bIdx;
  });

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2 px-1">
        <Sparkles className="h-4 w-4 text-primary" />
        <h3 className="text-sm font-semibold text-foreground">المنصة</h3>
        <Badge variant="secondary" className="text-xs">{speakers.length}</Badge>
      </div>

      <div className="grid grid-cols-3 sm:grid-cols-4 gap-5">
        {sortedSpeakers.map((speaker) => {
          const isMe = speaker.id === currentUserId;
          const role = speaker.role || (speaker.isHost ? "host" : "speaker");
          const config = roleConfig[role] || roleConfig.speaker;
          const RoleIcon = config.icon;
          const speakingTime = formatSpeakingTime(speaker.speakingDuration || 0);

          return (
            <div
              key={speaker.id}
              className="flex flex-col items-center gap-2 cursor-pointer group"
              onClick={() => setSelectedSpeaker(speaker)}
            >
              <div className="relative">
                {/* Speaking ring animation */}
                <div
                  className={`w-[76px] h-[76px] rounded-full p-[3px] transition-all duration-500 ${
                    speaker.isSpeaking
                      ? "ring-[3px] ring-primary/60 ring-offset-2 ring-offset-background shadow-lg shadow-primary/20 scale-105"
                      : ""
                  }`}
                >
                  {speaker.isSpeaking && (
                    <div className="absolute inset-0 rounded-full bg-primary/20 animate-ping" style={{ animationDuration: "1.5s" }} />
                  )}
                  <Avatar className="h-[70px] w-[70px] border-2 border-background shadow-md group-hover:shadow-lg transition-shadow">
                    {speaker.avatarUrl && <AvatarImage src={speaker.avatarUrl} alt={speaker.name} />}
                    <AvatarFallback className="bg-muted text-foreground text-lg font-bold">
                      {isMe ? "أنت" : speaker.name.charAt(0)}
                    </AvatarFallback>
                  </Avatar>
                </div>

                {/* Muted indicator */}
                {speaker.isMuted && (
                  <div className="absolute -bottom-1 -left-1 bg-destructive rounded-full p-1.5 shadow-md border-2 border-background">
                    <MicOff className="h-2.5 w-2.5 text-destructive-foreground" />
                  </div>
                )}

                {/* Role badge */}
                <div className={`absolute -top-1 -right-1 ${config.color} rounded-full p-1 shadow-md border-2 border-background`}>
                  <RoleIcon className="h-2.5 w-2.5 text-white" />
                </div>

                {/* Connection quality indicator */}
                <div className="absolute -bottom-1 -right-1 bg-background rounded-full p-0.5 shadow-sm border border-border">
                  <ConnectionQualityIndicator quality={speaker.connectionQuality} size="sm" />
                </div>
              </div>

              <div className="text-center">
                <p className="text-xs font-medium text-foreground line-clamp-1 max-w-[80px]">
                  {isMe ? "أنت" : speaker.name}
                </p>
                {speakingTime && (
                  <p className="text-[10px] text-muted-foreground">{speakingTime}</p>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Speaker Profile Dialog */}
      <Dialog open={!!selectedSpeaker} onOpenChange={() => setSelectedSpeaker(null)}>
        <DialogContent className="max-w-xs" dir="rtl">
          {selectedSpeaker && (
            <>
              <DialogHeader>
                <div className="flex flex-col items-center gap-3 pt-2">
                  <Avatar className="h-20 w-20 border-2 border-primary/20">
                    {selectedSpeaker.avatarUrl && <AvatarImage src={selectedSpeaker.avatarUrl} />}
                    <AvatarFallback className="text-2xl font-bold bg-muted text-foreground">
                      {selectedSpeaker.name.charAt(0)}
                    </AvatarFallback>
                  </Avatar>
                  <DialogTitle className="text-lg">{selectedSpeaker.name}</DialogTitle>
                </div>
              </DialogHeader>
              <div className="space-y-3 text-center">
                <div className="flex items-center justify-center gap-2">
                  <Badge variant="secondary" className="gap-1">
                    {(() => {
                      const r = selectedSpeaker.role || (selectedSpeaker.isHost ? "host" : "speaker");
                      const c = roleConfig[r] || roleConfig.speaker;
                      const Icon = c.icon;
                      return <><Icon className="h-3 w-3" />{c.label}</>;
                    })()}
                  </Badge>
                  <div className="flex items-center gap-1 text-xs text-muted-foreground">
                    <ConnectionQualityIndicator quality={selectedSpeaker.connectionQuality} size="md" />
                  </div>
                </div>
                {selectedSpeaker.bio && (
                  <p className="text-sm text-muted-foreground leading-relaxed">{selectedSpeaker.bio}</p>
                )}
                {selectedSpeaker.speakingDuration && selectedSpeaker.speakingDuration > 0 && (
                  <p className="text-xs text-muted-foreground">
                    مدة التحدث: {Math.floor(selectedSpeaker.speakingDuration / 60)} دقيقة
                  </p>
                )}
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default RoomStage;

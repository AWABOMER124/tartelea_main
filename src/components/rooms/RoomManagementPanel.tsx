import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import {
  Hand,
  Check,
  X,
  ChevronDown,
  Crown,
  Shield,
  UserMinus,
  UserPlus,
  Mic,
  Star,
  BarChart3,
  Clock,
  Users,
  TrendingUp,
} from "lucide-react";
import type { StageParticipant } from "@/components/rooms/RoomStage";
import type { AudienceMember } from "@/components/rooms/RoomAudience";

interface RoomStats {
  peakParticipants: number;
  totalJoined: number;
  elapsedTime: string;
  handRaisesTotal: number;
}

interface RoomManagementPanelProps {
  speakers: StageParticipant[];
  audience: AudienceMember[];
  handRaises: any[];
  currentUserId: string;
  isHost: boolean;
  onAcceptHand: (userId: string) => void;
  onRejectHand: (userId: string) => void;
  onDemote: (userId: string) => void;
  onPromoteCoHost: (userId: string) => void;
  onPromoteModerator: (userId: string) => void;
  onKick: (userId: string) => void;
  onPromoteSpeaker?: (userId: string) => void;
  stats?: RoomStats;
}

const roleLabels: Record<string, string> = {
  host: "مضيف",
  co_host: "مضيف مشارك",
  moderator: "مشرف",
  speaker: "متحدث",
};

const RoomManagementPanel = ({
  speakers,
  audience,
  handRaises,
  currentUserId,
  isHost,
  onAcceptHand,
  onRejectHand,
  onDemote,
  onPromoteCoHost,
  onPromoteModerator,
  onKick,
  onPromoteSpeaker,
  stats,
}: RoomManagementPanelProps) => {
  return (
    <ScrollArea className="h-full">
      <div className="p-4 space-y-3">
        <h2 className="font-bold text-foreground flex items-center gap-2 text-sm">
          <Shield className="h-4 w-4 text-primary" />
          لوحة الإدارة
        </h2>

        {/* Live Stats */}
        {stats && (
          <Card className="bg-primary/5 border-primary/20">
            <CardContent className="p-3">
              <div className="flex items-center gap-1.5 mb-2">
                <BarChart3 className="h-3.5 w-3.5 text-primary" />
                <span className="text-xs font-semibold text-primary">إحصائيات مباشرة</span>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                  <Users className="h-3 w-3" />
                  <span>الحضور: {speakers.length + audience.length}</span>
                </div>
                <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                  <TrendingUp className="h-3 w-3" />
                  <span>الذروة: {stats.peakParticipants}</span>
                </div>
                <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                  <Clock className="h-3 w-3" />
                  <span>المدة: {stats.elapsedTime}</span>
                </div>
                <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                  <Hand className="h-3 w-3" />
                  <span>الأيدي: {stats.handRaisesTotal}</span>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Hand Raises Queue */}
        {handRaises.length > 0 && (
          <Card className="border-amber-500/30">
            <CardHeader className="py-2 px-3">
              <CardTitle className="text-xs flex items-center gap-1.5">
                <Hand className="h-3.5 w-3.5 text-amber-500" />
                طلبات التحدث ({handRaises.length})
              </CardTitle>
            </CardHeader>
            <CardContent className="px-3 pb-2 space-y-1.5">
              {handRaises.map((raise, index) => {
                const member = audience.find((a) => a.id === raise.user_id);
                return (
                  <div key={raise.id} className="flex items-center justify-between gap-2 p-2 rounded-lg bg-amber-50/50 dark:bg-amber-950/20">
                    <div className="flex items-center gap-2 min-w-0">
                      <Badge variant="outline" className="text-[9px] h-4 w-4 flex items-center justify-center rounded-full p-0 flex-shrink-0 border-amber-500/50">
                        {index + 1}
                      </Badge>
                      <span className="text-xs font-medium truncate">
                        {member?.name || "مستخدم"}
                      </span>
                      <span className="text-[9px] text-muted-foreground flex-shrink-0">
                        {new Date(raise.created_at).toLocaleTimeString("ar", { hour: "2-digit", minute: "2-digit" })}
                      </span>
                    </div>
                    <div className="flex gap-0.5">
                      <Button size="icon" variant="ghost" className="h-7 w-7 text-primary hover:bg-primary/10" onClick={() => onAcceptHand(raise.user_id)}>
                        <Check className="h-3.5 w-3.5" />
                      </Button>
                      <Button size="icon" variant="ghost" className="h-7 w-7 text-destructive hover:bg-destructive/10" onClick={() => onRejectHand(raise.user_id)}>
                        <X className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                  </div>
                );
              })}
            </CardContent>
          </Card>
        )}

        {/* Speakers Management */}
        <Card>
          <CardHeader className="py-2 px-3">
            <CardTitle className="text-xs flex items-center gap-1.5">
              <Mic className="h-3.5 w-3.5 text-primary" />
              المتحدثون ({speakers.length})
            </CardTitle>
          </CardHeader>
          <CardContent className="px-3 pb-2 space-y-1.5">
            {speakers.map((speaker) => {
              const role = speaker.role || (speaker.isHost ? "host" : "speaker");
              return (
                <div key={speaker.id} className="flex items-center justify-between gap-2 p-2 rounded-lg bg-muted/50">
                  <div className="flex items-center gap-2 min-w-0">
                    <span className="text-xs font-medium truncate">{speaker.name}</span>
                    <Badge variant="secondary" className="text-[9px] gap-0.5 flex-shrink-0 h-4 px-1.5">
                      {role === "host" && <Crown className="h-2.5 w-2.5" />}
                      {role === "co_host" && <Star className="h-2.5 w-2.5" />}
                      {role === "moderator" && <Shield className="h-2.5 w-2.5" />}
                      {roleLabels[role] || "متحدث"}
                    </Badge>
                    {speaker.isSpeaking && (
                      <span className="h-2 w-2 rounded-full bg-green-500 animate-pulse flex-shrink-0" />
                    )}
                  </div>
                  {role !== "host" && speaker.id !== currentUserId && isHost && (
                    <div className="flex gap-0.5 flex-shrink-0">
                      {role === "speaker" && (
                        <Button size="icon" variant="ghost" className="h-6 w-6" title="ترقية لمضيف مشارك" onClick={() => onPromoteCoHost(speaker.id)}>
                          <Crown className="h-3 w-3 text-amber-500" />
                        </Button>
                      )}
                      <Button size="icon" variant="ghost" className="h-6 w-6" title="نقل للمستمعين" onClick={() => onDemote(speaker.id)}>
                        <ChevronDown className="h-3 w-3" />
                      </Button>
                      <Button size="icon" variant="ghost" className="h-6 w-6 text-destructive" title="طرد" onClick={() => onKick(speaker.id)}>
                        <UserMinus className="h-3 w-3" />
                      </Button>
                    </div>
                  )}
                </div>
              );
            })}
          </CardContent>
        </Card>

        {/* Audience Management */}
        {audience.length > 0 && (
          <Card>
            <CardHeader className="py-2 px-3">
              <CardTitle className="text-xs flex items-center gap-1.5">
                <UserPlus className="h-3.5 w-3.5 text-muted-foreground" />
                المستمعون ({audience.length})
              </CardTitle>
            </CardHeader>
            <CardContent className="px-3 pb-2 space-y-1.5">
              {audience.map((member) => (
                <div key={member.id} className="flex items-center justify-between gap-2 p-2 rounded-lg bg-muted/50">
                  <div className="flex items-center gap-2 min-w-0">
                    <span className="text-xs font-medium truncate">{member.name}</span>
                    {member.hasRaisedHand && (
                      <span className="text-amber-500 text-xs animate-bounce">✋</span>
                    )}
                  </div>
                  {member.id !== currentUserId && (
                    <div className="flex gap-0.5 flex-shrink-0">
                      <Button size="icon" variant="ghost" className="h-6 w-6" title="ترقية لمتحدث" onClick={() => (onPromoteSpeaker || onAcceptHand)(member.id)}>
                        <Mic className="h-3 w-3 text-primary" />
                      </Button>
                      {isHost && (
                        <>
                          <Button size="icon" variant="ghost" className="h-6 w-6" title="تعيين مشرف" onClick={() => onPromoteModerator(member.id)}>
                            <Shield className="h-3 w-3 text-blue-500" />
                          </Button>
                          <Button size="icon" variant="ghost" className="h-6 w-6 text-destructive" title="طرد" onClick={() => onKick(member.id)}>
                            <UserMinus className="h-3 w-3" />
                          </Button>
                        </>
                      )}
                    </div>
                  )}
                </div>
              ))}
            </CardContent>
          </Card>
        )}
      </div>
    </ScrollArea>
  );
};

export default RoomManagementPanel;

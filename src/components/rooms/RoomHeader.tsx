import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ArrowRight, Radio, Users, Shield, Wifi, WifiOff, Clock } from "lucide-react";

interface RoomHeaderProps {
  title: string;
  description?: string | null;
  category?: string;
  isLive: boolean;
  totalParticipants: number;
  handRaisesCount: number;
  canManage: boolean;
  isConnected: boolean;
  connectionError?: string | null;
  elapsedTime?: string;
  onLeave: () => void;
  onToggleManagement: () => void;
}

const categoryLabels: Record<string, string> = {
  quran: "القرآن",
  values: "القيم",
  community: "المجتمع",
  sudan_awareness: "الوعي السوداني",
  arab_awareness: "الوعي العربي",
  islamic_awareness: "الوعي الإسلامي",
};

const RoomHeader = ({
  title,
  description,
  category,
  isLive,
  totalParticipants,
  handRaisesCount,
  canManage,
  isConnected,
  connectionError,
  elapsedTime,
  onLeave,
  onToggleManagement,
}: RoomHeaderProps) => {
  return (
    <div className="bg-card/95 backdrop-blur-sm border-b border-border px-4 py-2.5">
      <div className="flex items-center justify-between">
        <Button variant="ghost" size="icon" className="h-8 w-8" onClick={onLeave}>
          <ArrowRight className="h-5 w-5" />
        </Button>

        <div className="flex-1 text-center px-2">
          {/* Category tag */}
          {category && (
            <Badge variant="outline" className="text-[9px] h-4 mb-0.5 px-1.5">
              {categoryLabels[category] || category}
            </Badge>
          )}
          <h1 className="font-bold text-foreground text-sm line-clamp-1">{title}</h1>
          <div className="flex items-center justify-center gap-2 mt-0.5 flex-wrap">
            {isLive && (
              <Badge variant="destructive" className="text-[9px] gap-0.5 h-4 px-1.5">
                <Radio className="h-2 w-2 animate-pulse" />
                مباشر
              </Badge>
            )}
            {isLive && elapsedTime && (
              <span className="text-[9px] text-muted-foreground flex items-center gap-0.5">
                <Clock className="h-2.5 w-2.5" />
                {elapsedTime}
              </span>
            )}
            <span className="text-[9px] text-muted-foreground flex items-center gap-0.5">
              <Users className="h-2.5 w-2.5" />
              {totalParticipants}
            </span>
            {handRaisesCount > 0 && canManage && (
              <Badge variant="secondary" className="text-[9px] h-4 gap-0.5 px-1.5">
                ✋ {handRaisesCount}
              </Badge>
            )}
            <span className={`text-[9px] flex items-center gap-0.5 ${isConnected ? "text-green-500" : "text-muted-foreground"}`}>
              {isConnected ? <Wifi className="h-2.5 w-2.5" /> : <WifiOff className="h-2.5 w-2.5" />}
            </span>
            {connectionError && (
              <span className="text-[9px] text-destructive">{connectionError}</span>
            )}
          </div>
        </div>

        {canManage ? (
          <Button variant="ghost" size="icon" className="h-8 w-8" onClick={onToggleManagement}>
            <Shield className="h-4 w-4" />
          </Button>
        ) : (
          <div className="w-8" />
        )}
      </div>
    </div>
  );
};

export default RoomHeader;

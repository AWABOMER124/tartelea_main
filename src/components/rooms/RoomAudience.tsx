import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Users, Hand } from "lucide-react";

export interface AudienceMember {
  id: string;
  name: string;
  hasRaisedHand: boolean;
  avatarUrl?: string;
}

interface RoomAudienceProps {
  audience: AudienceMember[];
  currentUserId: string;
  isHost: boolean;
  onInviteToStage?: (userId: string) => void;
}

const RoomAudience = ({ audience, currentUserId, isHost, onInviteToStage }: RoomAudienceProps) => {
  if (audience.length === 0) return null;

  // Show hand-raisers first
  const sorted = [...audience].sort((a, b) => {
    if (a.hasRaisedHand && !b.hasRaisedHand) return -1;
    if (!a.hasRaisedHand && b.hasRaisedHand) return 1;
    return 0;
  });

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2 px-1">
        <Users className="h-4 w-4 text-muted-foreground" />
        <h3 className="text-sm font-semibold text-muted-foreground">المستمعون</h3>
        <Badge variant="outline" className="text-xs">{audience.length}</Badge>
      </div>
      <div className="grid grid-cols-4 sm:grid-cols-5 md:grid-cols-6 gap-3">
        {sorted.map((member) => {
          const isMe = member.id === currentUserId;
          return (
            <div
              key={member.id}
              className={`flex flex-col items-center gap-1.5 transition-transform ${
                isHost && member.hasRaisedHand ? "cursor-pointer hover:scale-105" : ""
              }`}
              onClick={() => {
                if (isHost && member.hasRaisedHand && onInviteToStage) {
                  onInviteToStage(member.id);
                }
              }}
            >
              <div className="relative">
                <Avatar className={`h-12 w-12 ${member.hasRaisedHand ? "ring-2 ring-amber-400 ring-offset-1 ring-offset-background" : ""}`}>
                  {member.avatarUrl && <AvatarImage src={member.avatarUrl} alt={member.name} />}
                  <AvatarFallback className="bg-muted/60 text-muted-foreground text-sm">
                    {isMe ? "أنت" : member.name.charAt(0)}
                  </AvatarFallback>
                </Avatar>
                {member.hasRaisedHand && (
                  <div className="absolute -top-1 -right-1 bg-amber-400 rounded-full p-0.5 shadow-sm animate-bounce">
                    <Hand className="h-2.5 w-2.5 text-white" />
                  </div>
                )}
              </div>
              <p className="text-[10px] text-muted-foreground text-center line-clamp-1 max-w-[64px]">
                {isMe ? "أنت" : member.name}
              </p>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default RoomAudience;

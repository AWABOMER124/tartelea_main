import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Mic,
  MicOff,
  PhoneOff,
  Hand,
  MessageSquare,
  Radio,
  Square,
  Circle,
  Loader2,
  Volume2,
  VolumeX,
} from "lucide-react";

interface RoomControlsProps {
  isHost: boolean;
  isSpeaker: boolean;
  isLive: boolean;
  isAudioEnabled: boolean;
  hasRaisedHand: boolean;
  showChat: boolean;
  isRecording: boolean;
  isUploading: boolean;
  formattedDuration: string;
  elapsedTime?: string;
  onToggleAudio: () => void;
  onLeave: () => void;
  onRaiseHand: () => void;
  onToggleChat: () => void;
  onStartLive: () => void;
  onEndLive: () => void;
  onStartRecording: () => void;
  onStopRecording: () => void;
  onMuteAll?: () => void;
  isMutedAll?: boolean;
}

const RoomControls = ({
  isHost,
  isSpeaker,
  isLive,
  isAudioEnabled,
  hasRaisedHand,
  showChat,
  isRecording,
  isUploading,
  formattedDuration,
  elapsedTime,
  onToggleAudio,
  onLeave,
  onRaiseHand,
  onToggleChat,
  onStartLive,
  onEndLive,
  onStartRecording,
  onStopRecording,
  onMuteAll,
  isMutedAll,
}: RoomControlsProps) => {
  return (
    <div className="bg-card/95 backdrop-blur-sm border-t border-border px-4 py-3 pb-[calc(0.75rem+env(safe-area-inset-bottom))]">
      {/* Status indicators */}
      <div className="flex items-center justify-center gap-2 mb-2 min-h-[24px]">
        {isRecording && (
          <Badge variant="destructive" className="gap-1.5 animate-pulse text-[10px] h-5">
            <Circle className="h-2 w-2 fill-current" />
            تسجيل {formattedDuration}
          </Badge>
        )}
        {isUploading && (
          <Badge variant="secondary" className="gap-1.5 text-[10px] h-5">
            <Loader2 className="h-2.5 w-2.5 animate-spin" />
            جاري الرفع...
          </Badge>
        )}
        {isLive && elapsedTime && !isRecording && !isUploading && (
          <Badge variant="outline" className="text-[10px] h-5 gap-1 text-muted-foreground">
            ⏱ {elapsedTime}
          </Badge>
        )}
      </div>

      <div className="flex items-center justify-center gap-2.5 max-w-md mx-auto">
        {/* Chat Toggle */}
        <Button
          variant={showChat ? "secondary" : "ghost"}
          size="icon"
          className="h-11 w-11 rounded-full"
          onClick={onToggleChat}
        >
          <MessageSquare className="h-5 w-5" />
        </Button>

        {/* Raise Hand (for listeners only) */}
        {!isSpeaker && !isHost && (
          <Button
            variant={hasRaisedHand ? "default" : "outline"}
            size="icon"
            className={`h-11 w-11 rounded-full transition-all ${
              hasRaisedHand ? "bg-amber-500 hover:bg-amber-600 border-amber-500" : ""
            }`}
            onClick={onRaiseHand}
          >
            <Hand className={`h-5 w-5 ${hasRaisedHand ? "text-white animate-bounce" : ""}`} />
          </Button>
        )}

        {/* Mute/Unmute (for speakers) */}
        {(isSpeaker || isHost) && (
          <Button
            variant={isAudioEnabled ? "secondary" : "destructive"}
            size="icon"
            className="h-14 w-14 rounded-full shadow-md"
            onClick={onToggleAudio}
          >
            {isAudioEnabled ? <Mic className="h-6 w-6" /> : <MicOff className="h-6 w-6" />}
          </Button>
        )}

        {/* Mute All (host only) */}
        {isHost && onMuteAll && (
          <Button
            variant="ghost"
            size="icon"
            className="h-11 w-11 rounded-full"
            onClick={onMuteAll}
            title={isMutedAll ? "إلغاء كتم الكل" : "كتم الكل"}
          >
            {isMutedAll ? <VolumeX className="h-5 w-5 text-destructive" /> : <Volume2 className="h-5 w-5" />}
          </Button>
        )}

        {/* Record button (host only) */}
        {isHost && (
          <Button
            variant={isRecording ? "destructive" : "outline"}
            size="icon"
            className={`h-11 w-11 rounded-full ${isRecording ? "ring-2 ring-destructive ring-offset-1 ring-offset-card" : ""}`}
            onClick={isRecording ? onStopRecording : onStartRecording}
            disabled={isUploading}
          >
            {isRecording ? (
              <Square className="h-4 w-4 fill-current" />
            ) : (
              <Circle className="h-5 w-5 text-destructive fill-destructive" />
            )}
          </Button>
        )}

        {/* Start/End Live (host only) */}
        {isHost && (
          <Button
            variant={isLive ? "destructive" : "default"}
            size="icon"
            className="h-11 w-11 rounded-full"
            onClick={isLive ? onEndLive : onStartLive}
          >
            {isLive ? <Square className="h-5 w-5" /> : <Radio className="h-5 w-5" />}
          </Button>
        )}

        {/* Leave */}
        <Button
          variant="ghost"
          className="h-11 px-4 rounded-full bg-destructive/10 hover:bg-destructive/20 text-destructive"
          onClick={onLeave}
        >
          <PhoneOff className="h-4 w-4 ml-1.5" />
          <span className="text-xs font-medium">مغادرة</span>
        </Button>
      </div>
    </div>
  );
};

export default RoomControls;

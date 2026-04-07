import { ConnectionQuality } from "livekit-client";
import { Wifi, WifiOff, WifiLow } from "lucide-react";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

interface ConnectionQualityIndicatorProps {
  quality?: ConnectionQuality;
  size?: "sm" | "md";
}

const qualityConfig = {
  [ConnectionQuality.Excellent]: {
    icon: Wifi,
    color: "text-emerald-500",
    label: "ممتاز",
    bars: 3,
  },
  [ConnectionQuality.Good]: {
    icon: Wifi,
    color: "text-emerald-400",
    label: "جيد",
    bars: 3,
  },
  [ConnectionQuality.Poor]: {
    icon: WifiLow,
    color: "text-amber-500",
    label: "ضعيف",
    bars: 2,
  },
  [ConnectionQuality.Lost]: {
    icon: WifiOff,
    color: "text-destructive",
    label: "منقطع",
    bars: 0,
  },
  [ConnectionQuality.Unknown]: {
    icon: Wifi,
    color: "text-muted-foreground",
    label: "جارٍ الاتصال",
    bars: 1,
  },
};

const ConnectionQualityIndicator = ({ quality, size = "sm" }: ConnectionQualityIndicatorProps) => {
  const q = quality ?? ConnectionQuality.Unknown;
  const config = qualityConfig[q] || qualityConfig[ConnectionQuality.Unknown];
  const iconSize = size === "sm" ? "h-3 w-3" : "h-4 w-4";

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <div className={`flex items-center ${config.color}`}>
            {/* Signal bars */}
            <div className="flex items-end gap-[1px]">
              {[1, 2, 3].map((bar) => (
                <div
                  key={bar}
                  className={`rounded-sm transition-all ${
                    bar <= config.bars
                      ? bar === 1 ? "bg-current" : bar === 2 ? "bg-current" : "bg-current"
                      : "bg-muted"
                  }`}
                  style={{
                    width: size === "sm" ? 2 : 3,
                    height: size === "sm" ? bar * 3 + 2 : bar * 4 + 2,
                  }}
                />
              ))}
            </div>
          </div>
        </TooltipTrigger>
        <TooltipContent side="bottom" className="text-xs">
          <p>جودة الاتصال: {config.label}</p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
};

export default ConnectionQualityIndicator;

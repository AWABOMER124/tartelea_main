import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Sparkles, Lock, Unlock } from "lucide-react";

interface ConsciousnessMapProps {
  enrolledCourses: number;
  completedCourses: number;
  certificatesEarned: number;
  totalPoints: number;
}

const NODES = [
  { id: 1, label: "البذرة", angle: 0, level: "تخلية", unlockAt: 0 },
  { id: 2, label: "الجذر", angle: 45, level: "تخلية", unlockAt: 50 },
  { id: 3, label: "الساق", angle: 90, level: "تخلية", unlockAt: 150 },
  { id: 4, label: "الورقة", angle: 135, level: "تحلية", unlockAt: 300 },
  { id: 5, label: "الزهرة", angle: 180, level: "تحلية", unlockAt: 500 },
  { id: 6, label: "الثمرة", angle: 225, level: "تحلية", unlockAt: 800 },
  { id: 7, label: "النور", angle: 270, level: "تجلي", unlockAt: 1200 },
  { id: 8, label: "التاج", angle: 315, level: "تجلي", unlockAt: 1800 },
];

const STAGE_COLORS: Record<string, string> = {
  "تخلية": "text-spiritual-green",
  "تحلية": "text-accent",
  "تجلي": "text-primary",
};

const ConsciousnessMap = ({
  totalPoints,
  completedCourses,
  certificatesEarned,
}: ConsciousnessMapProps) => {
  const unlockedCount = NODES.filter((n) => totalPoints >= n.unlockAt).length;

  return (
    <Card className="sanctuary-card">
      <CardContent className="p-0 relative z-10">
        <div className="text-center mb-6">
          <h3 className="font-display text-lg text-foreground">خريطة الوعي الشخصية</h3>
          <p className="text-xs text-muted-foreground mt-1">
            العقود المغلقة: {unlockedCount} / {NODES.length}
          </p>
        </div>

        {/* Orbital Visualization */}
        <div className="relative w-64 h-64 mx-auto">
          {/* Center circle */}
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-16 h-16 rounded-full bg-gradient-to-br from-accent to-primary flex items-center justify-center shadow-lg z-10">
            <Sparkles className="h-7 w-7 text-primary-foreground" />
          </div>

          {/* Orbital rings */}
          <div className="absolute inset-8 rounded-full border border-border/40" />
          <div className="absolute inset-4 rounded-full border border-border/20" />
          <div className="absolute inset-0 rounded-full border border-border/10" />

          {/* Nodes */}
          {NODES.map((node) => {
            const isUnlocked = totalPoints >= node.unlockAt;
            const rad = (node.angle * Math.PI) / 180;
            const radius = 108;
            const x = 50 + Math.cos(rad) * (radius / 2.56);
            const y = 50 + Math.sin(rad) * (radius / 2.56);

            return (
              <div
                key={node.id}
                className="absolute flex flex-col items-center gap-0.5"
                style={{
                  left: `${x}%`,
                  top: `${y}%`,
                  transform: "translate(-50%, -50%)",
                }}
              >
                <div
                  className={`w-10 h-10 rounded-full flex items-center justify-center transition-all duration-500 ${
                    isUnlocked
                      ? "bg-accent/20 border-2 border-accent shadow-md shadow-accent/20"
                      : "bg-muted border border-border opacity-50"
                  }`}
                >
                  {isUnlocked ? (
                    <Unlock className="h-4 w-4 text-accent" />
                  ) : (
                    <Lock className="h-3 w-3 text-muted-foreground" />
                  )}
                </div>
                <span
                  className={`text-[9px] font-medium whitespace-nowrap ${
                    isUnlocked ? STAGE_COLORS[node.level] : "text-muted-foreground/50"
                  }`}
                >
                  {node.label}
                </span>
              </div>
            );
          })}
        </div>

        {/* Stage Legend */}
        <div className="flex justify-center gap-4 mt-6">
          {["تخلية", "تحلية", "تجلي"].map((stage) => (
            <Badge
              key={stage}
              variant="outline"
              className={`text-xs ${STAGE_COLORS[stage]} border-current/30`}
            >
              {stage}
            </Badge>
          ))}
        </div>

        {/* Stats Row */}
        <div className="grid grid-cols-3 gap-3 mt-4 text-center">
          <div>
            <p className="text-lg font-bold text-foreground">{completedCourses}</p>
            <p className="text-[10px] text-muted-foreground">مسارات مكتملة</p>
          </div>
          <div>
            <p className="text-lg font-bold text-accent">{certificatesEarned}</p>
            <p className="text-[10px] text-muted-foreground">عقود مختومة</p>
          </div>
          <div>
            <p className="text-lg font-bold text-primary">{totalPoints}</p>
            <p className="text-[10px] text-muted-foreground">نقاط الوعي</p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default ConsciousnessMap;

import { Card, CardContent } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Sprout, TreePine, Sun } from "lucide-react";

interface SeparationCornerProps {
  /** Date the user joined the platform */
  joinedAt: string | null;
}

const TWO_YEARS_MS = 2 * 365.25 * 24 * 60 * 60 * 1000;

const MILESTONES = [
  { month: 0, label: "البذرة", icon: Sprout },
  { month: 6, label: "الفطام الأول", icon: Sprout },
  { month: 12, label: "منتصف الرحلة", icon: TreePine },
  { month: 18, label: "الفطام الثاني", icon: TreePine },
  { month: 24, label: "الفصال التام", icon: Sun },
];

const SeparationCorner = ({ joinedAt }: SeparationCornerProps) => {
  if (!joinedAt) return null;

  const joined = new Date(joinedAt);
  const now = new Date();
  const elapsed = now.getTime() - joined.getTime();
  const progressPercent = Math.min((elapsed / TWO_YEARS_MS) * 100, 100);
  const monthsElapsed = Math.floor(elapsed / (30.44 * 24 * 60 * 60 * 1000));

  return (
    <Card className="sanctuary-card">
      <CardContent className="p-0 relative z-10">
        <div className="text-center mb-4">
          <h3 className="font-display text-lg text-foreground">
            ركن الفصال
          </h3>
          <p className="text-xs text-muted-foreground mt-1">
            ﴿ وَفِصَالُهُ فِي عَامَيْنِ ﴾ — رحلتك في عامين من التعلم
          </p>
        </div>

        {/* Progress Bar */}
        <div className="space-y-2 mb-6">
          <div className="flex justify-between text-xs text-muted-foreground">
            <span>بداية الرحلة</span>
            <span>{monthsElapsed} شهر من 24</span>
          </div>
          <Progress value={progressPercent} className="h-3" />
        </div>

        {/* Milestones */}
        <div className="flex justify-between items-center">
          {MILESTONES.map((milestone) => {
            const isReached = monthsElapsed >= milestone.month;
            const Icon = milestone.icon;
            return (
              <div key={milestone.month} className="flex flex-col items-center gap-1">
                <div
                  className={`w-8 h-8 rounded-full flex items-center justify-center transition-all ${
                    isReached
                      ? "bg-accent/20 text-accent"
                      : "bg-muted text-muted-foreground/40"
                  }`}
                >
                  <Icon className="h-4 w-4" />
                </div>
                <span
                  className={`text-[9px] text-center leading-tight ${
                    isReached ? "text-foreground font-medium" : "text-muted-foreground/50"
                  }`}
                >
                  {milestone.label}
                </span>
              </div>
            );
          })}
        </div>

        {progressPercent >= 100 && (
          <Badge className="w-full justify-center mt-4 bg-accent/10 text-accent border-accent/30">
            <Sun className="h-3 w-3 ml-1" />
            تم الفصال التام — مبارك!
          </Badge>
        )}
      </CardContent>
    </Card>
  );
};

export default SeparationCorner;

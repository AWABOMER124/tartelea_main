import { useState, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Skeleton } from "@/components/ui/skeleton";
import { BookOpen, Award, TrendingUp, Target, Star, Flame } from "lucide-react";
import { getLearningStatsSnapshot } from "@/lib/backendLearning";

interface LearningStatsProps {
  userId: string | null;
}

interface Stats {
  enrolledCourses: number;
  completedCourses: number;
  certificatesEarned: number;
  avgProgress: number;
  totalPoints: number;
  currentLevel: number;
  levelName: string;
  pointsToNextLevel: number;
  currentLevelPoints: number;
}

const LEVELS = [
  { name: "مبتدئ", minPoints: 0, maxPoints: 100 },
  { name: "متعلم", minPoints: 100, maxPoints: 300 },
  { name: "ناشط", minPoints: 300, maxPoints: 600 },
  { name: "متميز", minPoints: 600, maxPoints: 1000 },
  { name: "خبير", minPoints: 1000, maxPoints: 1500 },
  { name: "معلم", minPoints: 1500, maxPoints: 2500 },
  { name: "أستاذ", minPoints: 2500, maxPoints: Infinity },
];

const calculateLevel = (points: number) => {
  for (let i = LEVELS.length - 1; i >= 0; i--) {
    if (points >= LEVELS[i].minPoints) {
      const level = LEVELS[i];
      const nextLevel = LEVELS[i + 1];
      return {
        level: i + 1,
        name: level.name,
        pointsToNextLevel: nextLevel ? nextLevel.minPoints - points : 0,
        currentLevelPoints: points - level.minPoints,
        levelMaxPoints: nextLevel ? nextLevel.minPoints - level.minPoints : 0,
      };
    }
  }
  return { level: 1, name: "مبتدئ", pointsToNextLevel: 100 - points, currentLevelPoints: points, levelMaxPoints: 100 };
};

const LearningStats = ({ userId }: LearningStatsProps) => {
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (userId) {
      fetchStats();
    } else {
      setLoading(false);
    }
  }, [userId]);

  const fetchStats = async () => {
    if (!userId) {
      setLoading(false);
      return;
    }

    try {
      const snapshot = await getLearningStatsSnapshot(userId);
      const levelInfo = calculateLevel(snapshot.totalPoints);

      setStats({
        ...snapshot,
        currentLevel: levelInfo.level,
        levelName: levelInfo.name,
        pointsToNextLevel: levelInfo.pointsToNextLevel,
        currentLevelPoints: levelInfo.currentLevelPoints,
      });
    } finally {
      setLoading(false);
    }
  };

  if (!userId) {
    return null;
  }

  if (loading) {
    return (
      <div className="space-y-3">
        <Skeleton className="h-6 w-32" />
        <Skeleton className="h-32 w-full rounded-xl" />
        <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
          <Skeleton className="h-20 rounded-xl" />
          <Skeleton className="h-20 rounded-xl" />
        </div>
      </div>
    );
  }

  if (!stats) return null;

  const levelProgress = stats.pointsToNextLevel > 0 
    ? (stats.currentLevelPoints / (stats.currentLevelPoints + stats.pointsToNextLevel)) * 100 
    : 100;

  return (
    <div className="space-y-4">
      {/* Level Card */}
      <Card className="overflow-hidden rounded-xl border-border shadow-none">
        <CardContent className="p-4">
          <div className="flex items-center gap-4 mb-4">
            <div className="w-14 h-14 rounded-full bg-primary flex items-center justify-center">
              <span className="text-2xl font-bold text-primary-foreground">
                {stats.currentLevel}
              </span>
            </div>
            <div className="flex-1">
              <div className="flex items-center gap-2">
                <Flame className="h-4 w-4 text-accent" />
                <span className="font-semibold text-foreground">{stats.levelName}</span>
              </div>
              <p className="text-sm text-muted-foreground">
                {stats.totalPoints} نقطة
              </p>
            </div>
            <div className="text-left">
              <Star className="h-5 w-5 text-accent fill-accent" />
            </div>
          </div>
          
          <div className="space-y-2">
            <div className="flex justify-between text-xs text-muted-foreground">
              <span>التقدم للمستوى التالي</span>
              {stats.pointsToNextLevel > 0 ? (
                <span>{stats.pointsToNextLevel} نقطة متبقية</span>
              ) : (
                <span>أعلى مستوى!</span>
              )}
            </div>
            <Progress value={levelProgress} className="h-2" />
          </div>
        </CardContent>
      </Card>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 gap-3">
        <Card className="rounded-xl border-border shadow-none">
          <CardContent className="pt-4 flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
              <BookOpen className="h-5 w-5 text-primary" />
            </div>
            <div>
              <p className="text-2xl font-bold text-foreground">{stats.enrolledCourses}</p>
              <p className="text-xs text-muted-foreground">دورات مسجلة</p>
            </div>
          </CardContent>
        </Card>

        <Card className="rounded-xl border-border shadow-none">
          <CardContent className="pt-4 flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
              <Target className="h-5 w-5 text-primary" />
            </div>
            <div>
              <p className="text-2xl font-bold text-foreground">{stats.completedCourses}</p>
              <p className="text-xs text-muted-foreground">دورات مكتملة</p>
            </div>
          </CardContent>
        </Card>

        <Card className="rounded-xl border-border shadow-none">
          <CardContent className="pt-4 flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-accent/10 flex items-center justify-center">
              <Award className="h-5 w-5 text-accent" />
            </div>
            <div>
              <p className="text-2xl font-bold text-foreground">{stats.certificatesEarned}</p>
              <p className="text-xs text-muted-foreground">شهادات</p>
            </div>
          </CardContent>
        </Card>

        <Card className="rounded-xl border-border shadow-none">
          <CardContent className="pt-4 flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-accent/10 flex items-center justify-center">
              <TrendingUp className="h-5 w-5 text-accent" />
            </div>
            <div>
              <p className="text-2xl font-bold text-foreground">{stats.avgProgress}%</p>
              <p className="text-xs text-muted-foreground">متوسط التقدم</p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default LearningStats;

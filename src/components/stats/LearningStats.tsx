import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Skeleton } from "@/components/ui/skeleton";
import { BookOpen, Award, TrendingUp, Target, Star, Flame } from "lucide-react";

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
    // Get enrolled courses (subscriptions)
    const { data: subs } = await supabase
      .from("course_subscriptions")
      .select("course_id")
      .eq("user_id", userId);

    // Get progress data
    const { data: progress } = await supabase
      .from("course_progress")
      .select("progress_percent, completed_at")
      .eq("user_id", userId);

    // Get certificates
    const { data: certs } = await supabase
      .from("certificates")
      .select("id")
      .eq("user_id", userId);

    // Get ratings given
    const { data: ratings } = await supabase
      .from("course_ratings")
      .select("id")
      .eq("user_id", userId);

    // Get comments made
    const { data: comments } = await supabase
      .from("course_comments")
      .select("id")
      .eq("author_id", userId);

    // Get posts made
    const { data: posts } = await supabase
      .from("posts")
      .select("id")
      .eq("author_id", userId);

    const enrolledCourses = subs?.length || 0;
    const completedCourses = progress?.filter((p) => p.completed_at)?.length || 0;
    const certificatesEarned = certs?.length || 0;
    
    const totalProgress = progress?.reduce((sum, p) => sum + p.progress_percent, 0) || 0;
    const avgProgress = progress?.length ? Math.round(totalProgress / progress.length) : 0;

    // Calculate points
    // - Each subscription: 10 points
    // - Each 10% progress: 5 points
    // - Each completion: 50 points
    // - Each certificate: 100 points
    // - Each rating: 5 points
    // - Each comment: 10 points
    // - Each post: 15 points
    const totalPoints = 
      (enrolledCourses * 10) +
      (progress?.reduce((sum, p) => sum + Math.floor(p.progress_percent / 10) * 5, 0) || 0) +
      (completedCourses * 50) +
      (certificatesEarned * 100) +
      ((ratings?.length || 0) * 5) +
      ((comments?.length || 0) * 10) +
      ((posts?.length || 0) * 15);

    const levelInfo = calculateLevel(totalPoints);

    setStats({
      enrolledCourses,
      completedCourses,
      certificatesEarned,
      avgProgress,
      totalPoints,
      currentLevel: levelInfo.level,
      levelName: levelInfo.name,
      pointsToNextLevel: levelInfo.pointsToNextLevel,
      currentLevelPoints: levelInfo.currentLevelPoints,
    });

    setLoading(false);
  };

  if (!userId) {
    return null;
  }

  if (loading) {
    return (
      <div className="space-y-3">
        <Skeleton className="h-6 w-32" />
        <Skeleton className="h-32 w-full rounded-xl" />
        <div className="grid grid-cols-2 gap-3">
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
      <Card className="overflow-hidden">
        <CardContent className="p-4">
          <div className="flex items-center gap-4 mb-4">
            <div className="w-14 h-14 rounded-full bg-gradient-to-br from-primary to-accent flex items-center justify-center">
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
        <Card>
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

        <Card>
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

        <Card>
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

        <Card>
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

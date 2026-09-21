import { useState, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Users, Star, MessageSquare, TrendingUp, Award } from "lucide-react";
import { getTrainerStats } from "@/lib/backendTrainerDashboard";

interface TrainerStatsProps {
  trainerId: string | null;
}

interface Stats {
  totalSubscribers: number;
  totalComments: number;
  totalViews: number;
  avgRating: number;
  ratingCount: number;
  completedCourses: number;
}

const TrainerStats = ({ trainerId }: TrainerStatsProps) => {
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (trainerId) {
      fetchStats();
    }
  }, [trainerId]);

  const fetchStats = async () => {
    if (!trainerId) {
      setLoading(false);
      return;
    }

    try {
      setStats(await getTrainerStats(trainerId));
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="grid grid-cols-2 gap-3">
        {[1, 2, 3, 4].map((i) => (
          <Skeleton key={i} className="h-20 rounded-xl" />
        ))}
      </div>
    );
  }

  if (!stats) return null;

  return (
    <div className="space-y-3">
      <h2 className="font-semibold text-foreground flex items-center gap-2">
        <TrendingUp className="h-5 w-5 text-primary" />
        إحصائيات الأداء
      </h2>
      <div className="grid grid-cols-2 gap-3">
        <Card>
          <CardContent className="pt-4 flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
              <Users className="h-5 w-5 text-primary" />
            </div>
            <div>
              <p className="text-2xl font-bold text-foreground">{stats.totalSubscribers}</p>
              <p className="text-xs text-muted-foreground">مشترك</p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-4 flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-accent/10 flex items-center justify-center">
              <Star className="h-5 w-5 text-accent" />
            </div>
            <div>
              <p className="text-2xl font-bold text-foreground">{stats.avgRating}</p>
              <p className="text-xs text-muted-foreground">{stats.ratingCount} تقييم</p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-4 flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-accent/10 flex items-center justify-center">
              <MessageSquare className="h-5 w-5 text-accent" />
            </div>
            <div>
              <p className="text-2xl font-bold text-foreground">{stats.totalComments}</p>
              <p className="text-xs text-muted-foreground">تعليق</p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-4 flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
              <Award className="h-5 w-5 text-primary" />
            </div>
            <div>
              <p className="text-2xl font-bold text-foreground">{stats.completedCourses}</p>
              <p className="text-xs text-muted-foreground">إتمام</p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default TrainerStats;

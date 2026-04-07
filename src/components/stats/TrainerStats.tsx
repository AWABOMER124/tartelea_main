import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Users, Star, MessageSquare, TrendingUp, Eye, Award } from "lucide-react";

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
    // Get trainer's course IDs
    const { data: courses } = await supabase
      .from("trainer_courses")
      .select("id, views_count")
      .eq("trainer_id", trainerId)
      .eq("is_approved", true);

    if (!courses || courses.length === 0) {
      setStats({
        totalSubscribers: 0,
        totalComments: 0,
        totalViews: 0,
        avgRating: 0,
        ratingCount: 0,
        completedCourses: 0,
      });
      setLoading(false);
      return;
    }

    const courseIds = courses.map((c) => c.id);
    const totalViews = courses.reduce((sum, c) => sum + (c.views_count || 0), 0);

    // Get subscribers
    const { data: subs } = await supabase
      .from("course_subscriptions")
      .select("id")
      .in("course_id", courseIds);

    // Get comments
    const { data: comments } = await supabase
      .from("course_comments")
      .select("id")
      .in("course_id", courseIds);

    // Get ratings
    const { data: ratings } = await supabase
      .from("course_ratings")
      .select("rating")
      .in("course_id", courseIds);

    // Get completed courses
    const { data: completed } = await supabase
      .from("course_progress")
      .select("id")
      .in("course_id", courseIds)
      .eq("progress_percent", 100);

    const totalRating = ratings?.reduce((sum, r) => sum + r.rating, 0) || 0;
    const ratingCount = ratings?.length || 0;

    setStats({
      totalSubscribers: subs?.length || 0,
      totalComments: comments?.length || 0,
      totalViews,
      avgRating: ratingCount > 0 ? Math.round((totalRating / ratingCount) * 10) / 10 : 0,
      ratingCount,
      completedCourses: completed?.length || 0,
    });

    setLoading(false);
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

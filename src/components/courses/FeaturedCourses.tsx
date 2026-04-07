import { Link } from "react-router-dom";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Video,
  FileText,
  Headphones,
  Users,
  Star,
  TrendingUp,
  Sparkles,
} from "lucide-react";
import { useFeaturedCourses } from "@/hooks/useCourses";

const typeIcons = {
  article: FileText,
  audio: Headphones,
  video: Video,
};

const depthColors = {
  beginner: "bg-emerald-500/10 text-emerald-600",
  intermediate: "bg-amber-500/10 text-amber-600",
  advanced: "bg-rose-500/10 text-rose-600",
};

const depthLabels: Record<string, string> = {
  beginner: "مبتدئ",
  intermediate: "متوسط",
  advanced: "متقدم",
};

const FeaturedCourses = () => {
  const { courses, isLoading } = useFeaturedCourses();

  if (isLoading) {
    return (
      <div className="space-y-3 animate-fade-in">
        <div className="flex items-center gap-2">
          <Skeleton className="h-5 w-5 rounded-full" />
          <Skeleton className="h-6 w-32" />
        </div>
        <div className="grid grid-cols-2 gap-3">
          {[1, 2, 3, 4].map((i) => (
            <div 
              key={i} 
              className="h-32 rounded-xl border border-border/50 p-3 space-y-2 bg-card"
            >
              <div className="flex items-start justify-between">
                <Skeleton className="w-10 h-10 rounded-lg" />
                <Skeleton className="h-5 w-12 rounded-full" />
              </div>
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-3/4" />
              <div className="flex items-center justify-between pt-1">
                <Skeleton className="h-5 w-16 rounded-full" />
                <Skeleton className="h-4 w-10" />
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (courses.length === 0) {
    return null;
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2 animate-fade-in">
        <div className="relative">
          <TrendingUp className="h-5 w-5 text-primary" />
          <Sparkles className="h-3 w-3 text-accent absolute -top-1 -right-1 animate-pulse" />
        </div>
        <h2 className="font-display font-semibold text-lg text-foreground">
          الدورات الأكثر شعبية
        </h2>
      </div>

      <div className="grid grid-cols-2 gap-3">
        {courses.map((course, index) => {
          const TypeIcon = typeIcons[course.type];

          return (
            <Link 
              key={course.id} 
              to={`/courses/${course.id}`}
              className="animate-fade-in"
              style={{ animationDelay: `${index * 0.05}s` }}
            >
              <Card className="group h-full overflow-hidden border border-border/50 transition-all duration-200 hover:shadow-md hover:border-primary/20 active:scale-[0.98]">
                <CardContent className="relative p-3 space-y-2">
                  <div className="flex items-start justify-between">
                    <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-primary/10 to-primary/20 flex items-center justify-center shadow-sm">
                      <TypeIcon className="h-5 w-5 text-primary" />
                    </div>
                    {course.avg_rating > 0 && (
                      <div className="flex items-center gap-1 text-xs bg-amber-50 dark:bg-amber-950/30 px-2 py-0.5 rounded-full">
                        <Star className="h-3 w-3 fill-amber-400 text-amber-400" />
                        <span className="font-medium text-amber-600 dark:text-amber-400">{course.avg_rating}</span>
                      </div>
                    )}
                  </div>

                  <h3 className="font-semibold text-sm line-clamp-2 group-hover:text-primary transition-colors duration-200">
                    {course.title}
                  </h3>

                  <div className="flex items-center justify-between">
                    <Badge
                      variant="secondary"
                      className={`text-xs ${depthColors[course.depth_level as keyof typeof depthColors]}`}
                    >
                      {depthLabels[course.depth_level]}
                    </Badge>
                    <div className="flex items-center gap-1 text-xs text-muted-foreground">
                      <Users className="h-3 w-3" />
                      <span className="font-medium">{course.subscriber_count}</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </Link>
          );
        })}
      </div>

      <div className="flex justify-center pt-2 animate-fade-in">
        <Link 
          to="/courses" 
          className="group flex items-center gap-2 text-sm text-primary hover:text-primary/80 transition-colors"
        >
          <span>عرض جميع الدورات</span>
          <span className="transform group-hover:-translate-x-1 transition-transform duration-200">←</span>
        </Link>
      </div>
    </div>
  );
};

export default FeaturedCourses;

import { useState, useEffect } from "react";
import { useToast } from "@/hooks/use-toast";
import { useCourses, useUserCourseSubscriptions, useSubscribeToCourse, useUnsubscribeFromCourse } from "@/hooks/useCourses";
import { useAuth } from "@/hooks/useAuth";
import AppLayout from "@/components/layout/AppLayout";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import FilterChip from "@/components/ui/FilterChip";
import {
  Video,
  FileText,
  Headphones,
  Users,
  Loader2,
  CheckCircle,
  BookOpen,
} from "lucide-react";

const typeIcons = {
  article: FileText,
  audio: Headphones,
  video: Video,
};

const categoryLabels: Record<string, string> = {
  quran: "القرآن",
  values: "القيم",
  community: "المجتمع",
  sudan_awareness: "الوعي السوداني",
  arab_awareness: "الوعي العربي",
  islamic_awareness: "الوعي الإسلامي",
};

const depthLabels: Record<string, string> = {
  beginner: "تخلية",
  intermediate: "تحلية",
  advanced: "تجلّي",
};

const depthFilters = [
  { value: "all", label: "الكل" },
  { value: "beginner", label: "تخلية" },
  { value: "intermediate", label: "تحلية" },
  { value: "advanced", label: "تجلّي" },
];

const CourseCardSkeleton = () => (
  <Card className="overflow-hidden">
    <CardContent className="p-4">
      <div className="flex gap-4">
        <Skeleton className="w-16 h-16 rounded-xl flex-shrink-0" />
        <div className="flex-1 space-y-2">
          <Skeleton className="h-5 w-3/4" />
          <Skeleton className="h-4 w-full" />
          <div className="flex gap-2">
            <Skeleton className="h-5 w-16 rounded-full" />
            <Skeleton className="h-5 w-14 rounded-full" />
          </div>
          <Skeleton className="h-4 w-24" />
        </div>
      </div>
      <Skeleton className="h-10 w-full mt-4 rounded-md" />
    </CardContent>
  </Card>
);

const Courses = () => {
  const { toast } = useToast();
  const { user } = useAuth();
  const [selectedDepth, setSelectedDepth] = useState("all");
  const [userId, setUserId] = useState<string | null>(null);
  const [subscribingId, setSubscribingId] = useState<string | null>(null);

  const { data: courses, isLoading: coursesLoading } = useCourses();
  const { data: subscriptions = [] } = useUserCourseSubscriptions(userId);
  const subscribeMutation = useSubscribeToCourse();
  const unsubscribeMutation = useUnsubscribeFromCourse();

  useEffect(() => {
    setUserId(user?.id || null);
  }, [user?.id]);

  const handleSubscribe = async (courseId: string) => {
    if (!userId) {
      toast({
        title: "تنبيه",
        description: "يجب تسجيل الدخول للاشتراك",
        variant: "destructive",
      });
      return;
    }

    setSubscribingId(courseId);
    const isSubscribed = subscriptions.includes(courseId);

    try {
      if (isSubscribed) {
        await unsubscribeMutation.mutateAsync({ courseId, userId });
        toast({ title: "تم", description: "تم إلغاء الاشتراك" });
      } else {
        await subscribeMutation.mutateAsync({ courseId, userId });
        toast({ title: "تم بنجاح", description: "تم الاشتراك في الدورة" });
      }
    } catch (error) {
      toast({
        title: "خطأ",
        description: isSubscribed ? "فشل إلغاء الاشتراك" : "فشل الاشتراك",
        variant: "destructive",
      });
    } finally {
      setSubscribingId(null);
    }
  };

  const filteredCourses = courses?.filter((course) => {
    if (selectedDepth !== "all" && course.depth_level !== selectedDepth) {
      return false;
    }
    return true;
  }) || [];

  return (
    <AppLayout>
      <div className="px-4 py-6 space-y-6">
        {/* Header */}
        <div className="text-center space-y-2">
          <div className="w-14 h-14 mx-auto bg-accent/10 rounded-2xl flex items-center justify-center">
            <BookOpen className="h-7 w-7 text-accent" />
          </div>
          <h1 className="text-2xl font-display font-bold text-foreground">
            المسارات
          </h1>
          <p className="text-sm text-muted-foreground">
            اختر مسارك من تخلية إلى تحلية ثم تجلّي
          </p>
        </div>

        {/* Filters */}
        <div className="flex gap-2 overflow-x-auto pb-2">
          {depthFilters.map((filter) => (
            <FilterChip
              key={filter.value}
              label={filter.label}
              isActive={selectedDepth === filter.value}
              onClick={() => setSelectedDepth(filter.value)}
            />
          ))}
        </div>

        {/* Courses List */}
        {coursesLoading ? (
          <div className="space-y-4">
            {[1, 2, 3].map((i) => (
              <CourseCardSkeleton key={i} />
            ))}
          </div>
        ) : filteredCourses.length === 0 ? (
          <Card>
            <CardContent className="py-8 text-center">
              <BookOpen className="h-12 w-12 mx-auto text-muted-foreground/50 mb-4" />
              <p className="text-muted-foreground">لا توجد دورات متاحة</p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-4">
            {filteredCourses.map((course) => {
              const TypeIcon = typeIcons[course.type];
              const isSubscribed = subscriptions.includes(course.id);

              return (
                <Card key={course.id} className="overflow-hidden">
                  <CardContent className="p-4">
                    <div className="flex gap-4">
                      <div className="w-16 h-16 rounded-xl bg-primary/10 flex items-center justify-center flex-shrink-0">
                        <TypeIcon className="h-8 w-8 text-primary" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <h3 className="font-semibold text-foreground line-clamp-1">
                          {course.title}
                        </h3>
                        {course.description && (
                          <p className="text-sm text-muted-foreground line-clamp-2 mt-1">
                            {course.description}
                          </p>
                        )}
                        <div className="flex flex-wrap gap-2 mt-2">
                          <Badge variant="secondary" className="text-xs">
                            {categoryLabels[course.category]}
                          </Badge>
                          <Badge variant="outline" className="text-xs">
                            {depthLabels[course.depth_level]}
                          </Badge>
                        </div>
                        <div className="flex items-center gap-4 mt-3 text-sm text-muted-foreground">
                          <span className="flex items-center gap-1">
                            <Users className="h-4 w-4" />
                            {course.subscriber_count} مشترك
                          </span>
                          <span>{course.trainer_name}</span>
                        </div>
                      </div>
                    </div>
                    <Button
                      onClick={() => handleSubscribe(course.id)}
                      disabled={subscribingId === course.id}
                      variant={isSubscribed ? "outline" : "default"}
                      className="w-full mt-4 gap-2"
                    >
                      {subscribingId === course.id ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : isSubscribed ? (
                        <>
                          <CheckCircle className="h-4 w-4" />
                          مشترك
                        </>
                      ) : (
                        "اشترك الآن"
                      )}
                    </Button>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
      </div>
    </AppLayout>
  );
};

export default Courses;

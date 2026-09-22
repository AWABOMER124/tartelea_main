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
import PageMeta from "@/components/seo/PageMeta";
import { DiscoveryHeader, DiscoveryPage, EmptyState, FilterGroup, FilterPanel, ResultsHeading } from "@/components/layout/DiscoveryPage";
import { Link } from "react-router-dom";
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
  beginner: "خلع — تخلية",
  intermediate: "تدبّر — تحلية",
  advanced: "تحرّر — تجلّي",
};

const depthFilters = [
  { value: "all", label: "الكل" },
  { value: "beginner", label: "خلع — تخلية" },
  { value: "intermediate", label: "تدبّر — تحلية" },
  { value: "advanced", label: "تحرّر — تجلّي" },
];

const CourseCardSkeleton = () => (
  <Card className="overflow-hidden rounded-2xl border-border shadow-sm">
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
      <PageMeta title="المسارات" description="مسارات المدرسة الترتيلية ضمن مراحل خلع وتدبّر وتحرّر." path="/courses" />
      <DiscoveryPage>
        <DiscoveryHeader eyebrow="المنهج" title="المسارات" description="اختر المرحلة، ثم المسار الذي تريد دراسته." icon={BookOpen} />

        <FilterPanel><FilterGroup label="المرحلة">{depthFilters.map((filter) => <FilterChip key={filter.value} label={filter.label} isActive={selectedDepth === filter.value} onClick={() => setSelectedDepth(filter.value)} />)}</FilterGroup></FilterPanel>

        <ResultsHeading count={filteredCourses.length} label="المسارات المتاحة" />

        {coursesLoading ? (
          <div className="grid gap-3 sm:grid-cols-2">
            {[1, 2, 3, 4].map((i) => (
              <CourseCardSkeleton key={i} />
            ))}
          </div>
        ) : filteredCourses.length === 0 ? (
          <EmptyState icon={BookOpen} title="لا توجد مسارات في هذه المحطة" description="اختر محطة أخرى أو اعرض جميع المسارات المتاحة." />
        ) : (
          <div className="grid gap-3 sm:grid-cols-2">
            {filteredCourses.map((course) => {
              const TypeIcon = typeIcons[course.type];
              const isSubscribed = subscriptions.includes(course.id);

              return (
                <Card key={course.id} className="flex h-full flex-col overflow-hidden rounded-2xl border-border shadow-sm transition-colors hover:border-primary/25">
                  <CardContent className="flex h-full flex-col p-5">
                    <div className="flex gap-4">
                      <div className="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-xl bg-primary/10">
                        <TypeIcon className="h-6 w-6 text-primary" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <Link to={`/courses/${course.id}`} className="line-clamp-1 font-semibold text-foreground outline-none hover:text-primary focus-visible:underline">{course.title}</Link>
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
                        <div className="mt-3 flex flex-wrap items-center gap-3 text-xs text-muted-foreground">
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
                      className="mt-4 w-full gap-2"
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
      </DiscoveryPage>
    </AppLayout>
  );
};

export default Courses;

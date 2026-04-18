import { useState, useEffect } from "react";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  CheckCircle,
  XCircle,
  Clock,
  Video,
  FileText,
  Headphones,
  Loader2,
  User,
  ExternalLink,
} from "lucide-react";
import { listAdminCourses, updateAdminCourseApproval, type AdminCourse } from "@/lib/backendAdmin";

const typeIcons = {
  article: FileText,
  audio: Headphones,
  video: Video,
};

const typeLabels = {
  article: "مقالة",
  audio: "صوتي",
  video: "فيديو",
};

const categoryLabels: Record<string, string> = {
  quran: "القرآن",
  values: "القيم",
  community: "المجتمع",
  sudan_awareness: "الوعي السوداني",
  arab_awareness: "الوعي العربي",
  islamic_awareness: "الوعي الإسلامي",
};

const depthLabels = {
  beginner: "مبتدئ",
  intermediate: "متوسط",
  advanced: "متقدم",
};

const TrainerCoursesManagement = () => {
  const { toast } = useToast();
  const [courses, setCourses] = useState<AdminCourse[]>([]);
  const [loading, setLoading] = useState(true);
  const [processingId, setProcessingId] = useState<string | null>(null);

  useEffect(() => {
    void fetchCourses();
  }, []);

  const fetchCourses = async () => {
    setLoading(true);

    try {
      setCourses(await listAdminCourses());
    } catch (error) {
      toast({
        title: "خطأ",
        description: error instanceof Error ? error.message : "فشل تحميل الدورات",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleApproval = async (courseId: string, isApproved: boolean) => {
    setProcessingId(courseId);

    try {
      await updateAdminCourseApproval(courseId, isApproved);
      toast({
        title: "تم بنجاح",
        description: isApproved ? "تم اعتماد الدورة" : "تم إلغاء اعتماد الدورة",
      });
      await fetchCourses();
    } catch (error) {
      toast({
        title: "خطأ",
        description: error instanceof Error ? error.message : "فشل تحديث حالة الدورة",
        variant: "destructive",
      });
    } finally {
      setProcessingId(null);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-8">
        <Loader2 className="h-6 w-6 animate-spin text-primary" />
      </div>
    );
  }

  const pendingCourses = courses.filter((course) => !course.is_approved);
  const approvedCourses = courses.filter((course) => course.is_approved);

  const renderCourseCard = (course: AdminCourse, view: "pending" | "approved") => {
    const TypeIcon = typeIcons[course.type];

    return (
      <Card key={course.id}>
        <CardContent className="py-4">
          <div className="flex items-start gap-3">
            <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
              <TypeIcon className="h-6 w-6 text-primary" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-start justify-between gap-2">
                <div className="flex-1">
                  <h3 className="font-semibold text-foreground line-clamp-1">
                    {course.title}
                  </h3>
                  {course.description && (
                    <p className="text-sm text-muted-foreground line-clamp-2 mt-1">
                      {course.description}
                    </p>
                  )}
                  <div className="flex items-center gap-2 mt-2 text-sm text-muted-foreground">
                    <User className="h-3 w-3" />
                    <span>{course.trainer_name}</span>
                  </div>
                </div>
              </div>

              <div className="flex flex-wrap gap-2 mt-3">
                <Badge variant="secondary" className="text-xs">
                  {categoryLabels[course.category]}
                </Badge>
                <Badge variant="outline" className="text-xs">
                  {depthLabels[course.depth_level]}
                </Badge>
                <Badge variant="outline" className="text-xs">
                  {typeLabels[course.type]}
                </Badge>
              </div>

              {course.url && (
                <a
                  href={course.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1 text-sm text-primary mt-2 hover:underline"
                >
                  <ExternalLink className="h-3 w-3" />
                  معاينة المحتوى
                </a>
              )}

              <div className="flex gap-2 mt-4">
                {view === "pending" ? (
                  <>
                    <Button
                      size="sm"
                      onClick={() => void handleApproval(course.id, true)}
                      disabled={processingId === course.id}
                      className="gap-1"
                    >
                      {processingId === course.id ? (
                        <Loader2 className="h-3 w-3 animate-spin" />
                      ) : (
                        <CheckCircle className="h-3 w-3" />
                      )}
                      اعتماد
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => void handleApproval(course.id, false)}
                      disabled={processingId === course.id}
                      className="gap-1"
                    >
                      {processingId === course.id ? (
                        <Loader2 className="h-3 w-3 animate-spin" />
                      ) : (
                        <XCircle className="h-3 w-3" />
                      )}
                      إبقاء غير معتمد
                    </Button>
                  </>
                ) : (
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => void handleApproval(course.id, false)}
                    disabled={processingId === course.id}
                    className="gap-1"
                  >
                    {processingId === course.id ? (
                      <Loader2 className="h-3 w-3 animate-spin" />
                    ) : (
                      <XCircle className="h-3 w-3" />
                    )}
                    إلغاء الاعتماد
                  </Button>
                )}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h2 className="font-semibold text-foreground">
          إدارة دورات المدربين ({courses.length})
        </h2>
      </div>

      <Tabs defaultValue="pending" className="w-full">
        <TabsList className="w-full grid grid-cols-2">
          <TabsTrigger value="pending" className="gap-1">
            <Clock className="h-4 w-4" />
            قيد المراجعة ({pendingCourses.length})
          </TabsTrigger>
          <TabsTrigger value="approved" className="gap-1">
            <CheckCircle className="h-4 w-4" />
            المعتمدة ({approvedCourses.length})
          </TabsTrigger>
        </TabsList>

        <TabsContent value="pending" className="mt-4 space-y-3">
          {pendingCourses.length === 0 ? (
            <Card>
              <CardContent className="py-8 text-center">
                <Clock className="h-12 w-12 mx-auto text-muted-foreground/50 mb-4" />
                <p className="text-muted-foreground">لا توجد دورات قيد المراجعة</p>
              </CardContent>
            </Card>
          ) : (
            pendingCourses.map((course) => renderCourseCard(course, "pending"))
          )}
        </TabsContent>

        <TabsContent value="approved" className="mt-4 space-y-3">
          {approvedCourses.length === 0 ? (
            <Card>
              <CardContent className="py-8 text-center">
                <CheckCircle className="h-12 w-12 mx-auto text-muted-foreground/50 mb-4" />
                <p className="text-muted-foreground">لا توجد دورات معتمدة</p>
              </CardContent>
            </Card>
          ) : (
            approvedCourses.map((course) => renderCourseCard(course, "approved"))
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default TrainerCoursesManagement;

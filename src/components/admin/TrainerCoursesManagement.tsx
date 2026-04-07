import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
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
  GraduationCap,
  User,
  ExternalLink,
} from "lucide-react";
import type { Database } from "@/integrations/supabase/types";

type ContentType = Database["public"]["Enums"]["content_type"];
type ContentCategory = Database["public"]["Enums"]["content_category"];
type DepthLevel = Database["public"]["Enums"]["depth_level"];

interface TrainerCourse {
  id: string;
  trainer_id: string;
  title: string;
  description: string | null;
  type: ContentType;
  category: ContentCategory;
  depth_level: DepthLevel;
  url: string | null;
  is_approved: boolean | null;
  created_at: string | null;
  updated_at: string | null;
}

interface TrainerCourseWithProfile extends TrainerCourse {
  trainer_name?: string;
}

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
  const [courses, setCourses] = useState<TrainerCourseWithProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [processingId, setProcessingId] = useState<string | null>(null);

  useEffect(() => {
    fetchCourses();
  }, []);

  const fetchCourses = async () => {
    setLoading(true);

    // Fetch all trainer courses
    const { data: coursesData, error: coursesError } = await supabase
      .from("trainer_courses")
      .select("*")
      .order("created_at", { ascending: false });

    if (coursesError) {
      toast({
        title: "خطأ",
        description: "فشل تحميل الدورات",
        variant: "destructive",
      });
      setLoading(false);
      return;
    }

    // Fetch trainer profiles
    const trainerIds = [...new Set(coursesData?.map((c) => c.trainer_id) || [])];
    const { data: profilesData } = await supabase
      .from("profiles")
      .select("id, full_name")
      .in("id", trainerIds);

    const profilesMap = new Map(
      profilesData?.map((p) => [p.id, p.full_name]) || []
    );

    const coursesWithProfiles: TrainerCourseWithProfile[] = (coursesData || []).map(
      (course) => ({
        ...course,
        trainer_name: profilesMap.get(course.trainer_id) || "مدرب غير معروف",
      })
    );

    setCourses(coursesWithProfiles);
    setLoading(false);
  };

  const handleApprove = async (courseId: string) => {
    setProcessingId(courseId);

    const { error } = await supabase
      .from("trainer_courses")
      .update({ is_approved: true, updated_at: new Date().toISOString() })
      .eq("id", courseId);

    if (error) {
      toast({
        title: "خطأ",
        description: "فشل اعتماد الدورة",
        variant: "destructive",
      });
    } else {
      toast({
        title: "تم بنجاح",
        description: "تم اعتماد الدورة",
      });
      fetchCourses();
    }

    setProcessingId(null);
  };

  const handleReject = async (courseId: string) => {
    setProcessingId(courseId);

    const { error } = await supabase
      .from("trainer_courses")
      .delete()
      .eq("id", courseId);

    if (error) {
      toast({
        title: "خطأ",
        description: "فشل رفض الدورة",
        variant: "destructive",
      });
    } else {
      toast({
        title: "تم بنجاح",
        description: "تم رفض وحذف الدورة",
      });
      fetchCourses();
    }

    setProcessingId(null);
  };

  const handleRevoke = async (courseId: string) => {
    setProcessingId(courseId);

    const { error } = await supabase
      .from("trainer_courses")
      .update({ is_approved: false, updated_at: new Date().toISOString() })
      .eq("id", courseId);

    if (error) {
      toast({
        title: "خطأ",
        description: "فشل إلغاء اعتماد الدورة",
        variant: "destructive",
      });
    } else {
      toast({
        title: "تم بنجاح",
        description: "تم إلغاء اعتماد الدورة",
      });
      fetchCourses();
    }

    setProcessingId(null);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-8">
        <Loader2 className="h-6 w-6 animate-spin text-primary" />
      </div>
    );
  }

  const pendingCourses = courses.filter((c) => !c.is_approved);
  const approvedCourses = courses.filter((c) => c.is_approved);

  const renderCourseCard = (
    course: TrainerCourseWithProfile,
    showActions: "pending" | "approved"
  ) => {
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
                {showActions === "pending" ? (
                  <>
                    <Button
                      size="sm"
                      onClick={() => handleApprove(course.id)}
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
                      variant="destructive"
                      onClick={() => handleReject(course.id)}
                      disabled={processingId === course.id}
                      className="gap-1"
                    >
                      {processingId === course.id ? (
                        <Loader2 className="h-3 w-3 animate-spin" />
                      ) : (
                        <XCircle className="h-3 w-3" />
                      )}
                      رفض
                    </Button>
                  </>
                ) : (
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => handleRevoke(course.id)}
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

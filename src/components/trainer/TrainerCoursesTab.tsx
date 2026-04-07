import { useState } from "react";
import { Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Plus, Edit, Trash2, FileText, Headphones, Video, Clock, CheckCircle, GraduationCap } from "lucide-react";
import CourseFormDialog, { type TrainerCourse } from "./CourseFormDialog";

const typeIcons = { article: FileText, audio: Headphones, video: Video };
const typeLabels = { article: "مقالة", audio: "صوتي", video: "فيديو" };
const categoryLabels: Record<string, string> = {
  quran: "القرآن", values: "القيم", community: "المجتمع",
  sudan_awareness: "الوعي السوداني", arab_awareness: "الوعي العربي", islamic_awareness: "الوعي الإسلامي",
};
const depthLabels = { beginner: "مبتدئ", intermediate: "متوسط", advanced: "متقدم" };

interface Props {
  courses: TrainerCourse[];
  trainerId: string;
  onRefresh: () => void;
}

const TrainerCoursesTab = ({ courses, trainerId, onRefresh }: Props) => {
  const { toast } = useToast();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingCourse, setEditingCourse] = useState<TrainerCourse | null>(null);

  const handleDelete = async (courseId: string) => {
    const { error } = await supabase.from("trainer_courses").delete().eq("id", courseId);
    if (error) {
      toast({ title: "خطأ", description: "فشل حذف الدورة", variant: "destructive" });
    } else {
      toast({ title: "تم بنجاح", description: "تم حذف الدورة" });
      onRefresh();
    }
  };

  const openEdit = (course: TrainerCourse) => {
    setEditingCourse(course);
    setIsDialogOpen(true);
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="font-semibold text-foreground">دوراتي</h2>
        <Button className="gap-2" size="sm" onClick={() => { setEditingCourse(null); setIsDialogOpen(true); }}>
          <Plus className="h-4 w-4" />
          إضافة دورة
        </Button>
      </div>

      <CourseFormDialog
        open={isDialogOpen}
        onOpenChange={(o) => { setIsDialogOpen(o); if (!o) setEditingCourse(null); }}
        editingCourse={editingCourse}
        trainerId={trainerId}
        onSuccess={onRefresh}
      />

      {courses.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <GraduationCap className="h-12 w-12 mx-auto text-muted-foreground/50 mb-4" />
            <p className="text-muted-foreground">لم تضف أي دورات بعد</p>
            <Button variant="outline" className="mt-4" onClick={() => setIsDialogOpen(true)}>
              <Plus className="h-4 w-4 ml-2" />
              أضف دورتك الأولى
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {courses.map((course) => {
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
                        <div>
                          <Link to={`/courses/${course.id}`} className="font-semibold text-foreground line-clamp-1 hover:text-primary transition-colors">
                            {course.title}
                          </Link>
                          {course.description && (
                            <p className="text-sm text-muted-foreground line-clamp-2 mt-1">{course.description}</p>
                          )}
                        </div>
                        <div className="flex items-center gap-1 flex-shrink-0">
                          <Button variant="ghost" size="icon" onClick={() => openEdit(course)}>
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button variant="ghost" size="icon" onClick={() => handleDelete(course.id)}>
                            <Trash2 className="h-4 w-4 text-destructive" />
                          </Button>
                        </div>
                      </div>
                      <div className="flex flex-wrap gap-2 mt-2">
                        <Badge variant="secondary" className="text-xs">{categoryLabels[course.category]}</Badge>
                        <Badge variant="outline" className="text-xs">{depthLabels[course.depth_level]}</Badge>
                        <Badge variant="outline" className="text-xs">{typeLabels[course.type]}</Badge>
                        {course.is_approved ? (
                          <Badge className="bg-primary/10 text-primary text-xs gap-1">
                            <CheckCircle className="h-3 w-3" />
                            معتمدة
                          </Badge>
                        ) : (
                          <Badge variant="secondary" className="text-xs gap-1">
                            <Clock className="h-3 w-3" />
                            قيد المراجعة
                          </Badge>
                        )}
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default TrainerCoursesTab;

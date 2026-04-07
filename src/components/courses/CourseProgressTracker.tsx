import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { Loader2, CheckCircle } from "lucide-react";

interface CourseProgressTrackerProps {
  courseId: string;
  userId: string | null;
  onProgressUpdate?: (progress: number) => void;
}

const CourseProgressTracker = ({
  courseId,
  userId,
  onProgressUpdate,
}: CourseProgressTrackerProps) => {
  const { toast } = useToast();
  const [progress, setProgress] = useState(0);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [isCompleted, setIsCompleted] = useState(false);

  useEffect(() => {
    if (userId && courseId) {
      fetchProgress();
    } else {
      setLoading(false);
    }
  }, [userId, courseId]);

  const fetchProgress = async () => {
    const { data } = await supabase
      .from("course_progress")
      .select("progress_percent, completed_at")
      .eq("course_id", courseId)
      .eq("user_id", userId)
      .maybeSingle();

    if (data) {
      setProgress(data.progress_percent);
      setIsCompleted(!!data.completed_at);
    }
    setLoading(false);
  };

  const handleProgressChange = (value: number[]) => {
    setProgress(value[0]);
  };

  const saveProgress = async () => {
    if (!userId) {
      toast({
        title: "تنبيه",
        description: "يجب تسجيل الدخول لحفظ التقدم",
        variant: "destructive",
      });
      return;
    }

    setSaving(true);

    // Check if progress record exists
    const { data: existing } = await supabase
      .from("course_progress")
      .select("id")
      .eq("course_id", courseId)
      .eq("user_id", userId)
      .maybeSingle();

    if (existing) {
      // Update existing
      const { error } = await supabase
        .from("course_progress")
        .update({
          progress_percent: progress,
          last_accessed_at: new Date().toISOString(),
        })
        .eq("id", existing.id);

      if (error) {
        toast({
          title: "خطأ",
          description: "فشل حفظ التقدم",
          variant: "destructive",
        });
      } else {
        toast({ title: "تم حفظ التقدم" });
        if (progress === 100) {
          setIsCompleted(true);
          toast({
            title: "🎉 تهانينا!",
            description: "لقد أكملت الدورة بنجاح وحصلت على شهادة!",
          });
        }
      }
    } else {
      // Insert new
      const { error } = await supabase.from("course_progress").insert({
        course_id: courseId,
        user_id: userId,
        progress_percent: progress,
      });

      if (error) {
        toast({
          title: "خطأ",
          description: "فشل حفظ التقدم",
          variant: "destructive",
        });
      } else {
        toast({ title: "تم حفظ التقدم" });
        if (progress === 100) {
          setIsCompleted(true);
          toast({
            title: "🎉 تهانينا!",
            description: "لقد أكملت الدورة بنجاح وحصلت على شهادة!",
          });
        }
      }
    }

    onProgressUpdate?.(progress);
    setSaving(false);
  };

  if (!userId) {
    return (
      <div className="text-center text-sm text-muted-foreground py-4">
        سجل الدخول لتتبع تقدمك
      </div>
    );
  }

  if (loading) {
    return (
      <div className="flex justify-center py-4">
        <Loader2 className="h-5 w-5 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <span className="text-sm font-medium">تقدمك في الدورة</span>
        <span className="text-sm text-muted-foreground">{progress}%</span>
      </div>

      <Progress value={progress} className="h-2" />

      {isCompleted ? (
        <div className="flex items-center gap-2 text-sm text-primary">
          <CheckCircle className="h-4 w-4" />
          <span>أكملت هذه الدورة بنجاح!</span>
        </div>
      ) : (
        <div className="space-y-3">
          <Slider
            value={[progress]}
            onValueChange={handleProgressChange}
            max={100}
            step={5}
            className="w-full"
          />
          <Button
            onClick={saveProgress}
            disabled={saving}
            size="sm"
            className="w-full"
          >
            {saving ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              "حفظ التقدم"
            )}
          </Button>
        </div>
      )}
    </div>
  );
};

export default CourseProgressTracker;

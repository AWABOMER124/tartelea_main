import { useState, useEffect } from "react";
import { useToast } from "@/hooks/use-toast";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { Loader2, CheckCircle } from "lucide-react";
import { getCourseProgress, saveCourseProgress } from "@/lib/backendCourses";

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
      void fetchProgress();
    } else {
      setLoading(false);
    }
  }, [userId, courseId]);

  const fetchProgress = async () => {
    const data = await getCourseProgress(courseId, userId!);

    if (data) {
      setProgress(data.progress_percent);
      setIsCompleted(Boolean(data.completed_at));
    }

    setLoading(false);
  };

  const handleProgressChange = (value: number[]) => {
    setProgress(value[0]);
  };

  const handleSaveProgress = async () => {
    if (!userId) {
      toast({
        title: "طھظ†ط¨ظٹظ‡",
        description: "ظٹط¬ط¨ طھط³ط¬ظٹظ„ ط§ظ„ط¯ط®ظˆظ„ ظ„ط­ظپط¸ ط§ظ„طھظ‚ط¯ظ…",
        variant: "destructive",
      });
      return;
    }

    setSaving(true);

    try {
      await saveCourseProgress(courseId, userId, progress);
      toast({ title: "طھظ… ط­ظپط¸ ط§ظ„طھظ‚ط¯ظ…" });

      if (progress === 100) {
        setIsCompleted(true);
        toast({
          title: "تهانينا!",
          description: "لقد أكملت الدورة بنجاح وحصلت على شهادة!",
        });
      }
    } catch {
      toast({
        title: "ط®ط·ط£",
        description: "ظپط´ظ„ ط­ظپط¸ ط§ظ„طھظ‚ط¯ظ…",
        variant: "destructive",
      });
    } finally {
      onProgressUpdate?.(progress);
      setSaving(false);
    }
  };

  if (!userId) {
    return (
      <div className="text-center text-sm text-muted-foreground py-4">
        ط³ط¬ظ„ ط§ظ„ط¯ط®ظˆظ„ ظ„طھطھط¨ط¹ طھظ‚ط¯ظ…ظƒ
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
        <span className="text-sm font-medium">طھظ‚ط¯ظ…ظƒ ظپظٹ ط§ظ„ط¯ظˆط±ط©</span>
        <span className="text-sm text-muted-foreground">{progress}%</span>
      </div>

      <Progress value={progress} className="h-2" />

      {isCompleted ? (
        <div className="flex items-center gap-2 text-sm text-primary">
          <CheckCircle className="h-4 w-4" />
          <span>ط£ظƒظ…ظ„طھ ظ‡ط°ظ‡ ط§ظ„ط¯ظˆط±ط© ط¨ظ†ط¬ط§ط­!</span>
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
            onClick={handleSaveProgress}
            disabled={saving}
            size="sm"
            className="w-full"
          >
            {saving ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              "ط­ظپط¸ ط§ظ„طھظ‚ط¯ظ…"
            )}
          </Button>
        </div>
      )}
    </div>
  );
};

export default CourseProgressTracker;

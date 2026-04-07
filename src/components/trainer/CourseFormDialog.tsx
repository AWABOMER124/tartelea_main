import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Plus, Loader2 } from "lucide-react";
import type { Database } from "@/integrations/supabase/types";

type ContentType = Database["public"]["Enums"]["content_type"];
type ContentCategory = Database["public"]["Enums"]["content_category"];
type DepthLevel = Database["public"]["Enums"]["depth_level"];

export interface TrainerCourse {
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

interface CourseFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  editingCourse: TrainerCourse | null;
  trainerId: string;
  onSuccess: () => void;
}

const CourseFormDialog = ({ open, onOpenChange, editingCourse, trainerId, onSuccess }: CourseFormDialogProps) => {
  const { toast } = useToast();
  const [submitting, setSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    title: editingCourse?.title || "",
    description: editingCourse?.description || "",
    type: (editingCourse?.type || "video") as ContentType,
    category: (editingCourse?.category || "quran") as ContentCategory,
    depth_level: (editingCourse?.depth_level || "beginner") as DepthLevel,
    url: editingCourse?.url || "",
  });

  const resetForm = () => {
    setFormData({ title: "", description: "", type: "video", category: "quran", depth_level: "beginner", url: "" });
  };

  const handleSubmit = async () => {
    if (!formData.title.trim()) {
      toast({ title: "خطأ", description: "يرجى إدخال عنوان الدورة", variant: "destructive" });
      return;
    }

    setSubmitting(true);

    if (editingCourse) {
      const { error } = await supabase
        .from("trainer_courses")
        .update({
          title: formData.title,
          description: formData.description || null,
          type: formData.type,
          category: formData.category,
          depth_level: formData.depth_level,
          url: formData.url || null,
          updated_at: new Date().toISOString(),
        })
        .eq("id", editingCourse.id);

      if (error) {
        toast({ title: "خطأ", description: "فشل تحديث الدورة", variant: "destructive" });
      } else {
        toast({ title: "تم بنجاح", description: "تم تحديث الدورة" });
        onSuccess();
        onOpenChange(false);
        resetForm();
      }
    } else {
      const { error } = await supabase.from("trainer_courses").insert({
        trainer_id: trainerId,
        title: formData.title,
        description: formData.description || null,
        type: formData.type,
        category: formData.category,
        depth_level: formData.depth_level,
        url: formData.url || null,
      });

      if (error) {
        toast({ title: "خطأ", description: "فشل إضافة الدورة", variant: "destructive" });
      } else {
        toast({ title: "تم بنجاح", description: "تم إضافة الدورة وستتم مراجعتها قريباً" });
        onSuccess();
        onOpenChange(false);
        resetForm();
      }
    }

    setSubmitting(false);
  };

  return (
    <Dialog open={open} onOpenChange={(o) => { onOpenChange(o); if (!o) resetForm(); }}>
      <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{editingCourse ? "تعديل الدورة" : "إضافة دورة جديدة"}</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label>عنوان الدورة *</Label>
            <Input value={formData.title} onChange={(e) => setFormData({ ...formData, title: e.target.value })} placeholder="أدخل عنوان الدورة" />
          </div>
          <div className="space-y-2">
            <Label>الوصف</Label>
            <Textarea value={formData.description} onChange={(e) => setFormData({ ...formData, description: e.target.value })} placeholder="وصف مختصر للدورة" rows={3} />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>نوع المحتوى</Label>
              <Select value={formData.type} onValueChange={(v: ContentType) => setFormData({ ...formData, type: v })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="video">فيديو</SelectItem>
                  <SelectItem value="audio">صوتي</SelectItem>
                  <SelectItem value="article">مقالة</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>المستوى</Label>
              <Select value={formData.depth_level} onValueChange={(v: DepthLevel) => setFormData({ ...formData, depth_level: v })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="beginner">مبتدئ</SelectItem>
                  <SelectItem value="intermediate">متوسط</SelectItem>
                  <SelectItem value="advanced">متقدم</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="space-y-2">
            <Label>التصنيف</Label>
            <Select value={formData.category} onValueChange={(v: ContentCategory) => setFormData({ ...formData, category: v })}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="quran">القرآن</SelectItem>
                <SelectItem value="values">القيم</SelectItem>
                <SelectItem value="community">المجتمع</SelectItem>
                <SelectItem value="sudan_awareness">الوعي السوداني</SelectItem>
                <SelectItem value="arab_awareness">الوعي العربي</SelectItem>
                <SelectItem value="islamic_awareness">الوعي الإسلامي</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label>رابط المحتوى</Label>
            <Input value={formData.url} onChange={(e) => setFormData({ ...formData, url: e.target.value })} placeholder="https://..." dir="ltr" />
          </div>
          <Button onClick={handleSubmit} disabled={submitting} className="w-full">
            {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : editingCourse ? "تحديث الدورة" : "إضافة الدورة"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default CourseFormDialog;

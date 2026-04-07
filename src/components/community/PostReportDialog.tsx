import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { AlertTriangle, Loader2 } from "lucide-react";

interface PostReportDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  postId: string;
  postTitle: string;
}

const reportReasons = [
  { value: "spam", label: "محتوى مزعج (سبام)" },
  { value: "offensive", label: "محتوى مسيء أو غير لائق" },
  { value: "misinformation", label: "معلومات مضللة" },
  { value: "harassment", label: "تنمر أو مضايقة" },
  { value: "other", label: "سبب آخر" },
];

const PostReportDialog = ({ open, onOpenChange, postId, postTitle }: PostReportDialogProps) => {
  const { toast } = useToast();
  const [reason, setReason] = useState("");
  const [details, setDetails] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async () => {
    if (!reason) {
      toast({ title: "اختر سبب التبليغ", variant: "destructive" });
      return;
    }

    setSubmitting(true);
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      toast({ title: "يجب تسجيل الدخول", variant: "destructive" });
      setSubmitting(false);
      return;
    }

    const { error } = await supabase.from("post_reports").insert({
      post_id: postId,
      reporter_id: user.id,
      reason,
      details: details.trim() || null,
    });

    if (error) {
      if (error.code === "23505") {
        toast({ title: "تم التبليغ مسبقاً", description: "لقد قمت بالتبليغ عن هذا المنشور بالفعل" });
      } else {
        toast({ title: "خطأ", description: "حدث خطأ أثناء التبليغ", variant: "destructive" });
      }
    } else {
      toast({ title: "تم التبليغ", description: "شكراً لمساعدتك في الحفاظ على المجتمع" });
    }

    setReason("");
    setDetails("");
    setSubmitting(false);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-sm mx-4">
        <DialogHeader>
          <DialogTitle className="font-display flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-destructive" />
            تبليغ عن منشور
          </DialogTitle>
        </DialogHeader>
        <p className="text-sm text-muted-foreground line-clamp-1">"{postTitle}"</p>
        <RadioGroup value={reason} onValueChange={setReason} className="space-y-2">
          {reportReasons.map((r) => (
            <div key={r.value} className="flex items-center gap-3 p-2 rounded-lg hover:bg-muted/50">
              <RadioGroupItem value={r.value} id={r.value} />
              <Label htmlFor={r.value} className="text-sm cursor-pointer flex-1">{r.label}</Label>
            </div>
          ))}
        </RadioGroup>
        <Textarea
          placeholder="تفاصيل إضافية (اختياري)"
          value={details}
          onChange={(e) => setDetails(e.target.value)}
          rows={2}
        />
        <Button onClick={handleSubmit} disabled={submitting} className="w-full">
          {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : "إرسال التبليغ"}
        </Button>
      </DialogContent>
    </Dialog>
  );
};

export default PostReportDialog;

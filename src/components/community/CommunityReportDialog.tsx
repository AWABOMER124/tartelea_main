import { useState } from "react";
import { AlertTriangle, Loader2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import {
  type BackendCommunityReportReasonCode,
  reportBackendCommunityTarget,
} from "@/lib/backendCommunity";
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

interface CommunityReportDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  targetType: "post" | "comment" | "question";
  targetId: string;
  targetLabel: string;
  targetPreview?: string;
}

const reportReasons: Array<{
  value: BackendCommunityReportReasonCode;
  label: string;
}> = [
  { value: "spam", label: "محتوى مزعج أو مكرر" },
  { value: "abuse", label: "إساءة أو مضايقة" },
  { value: "off_topic", label: "خارج الموضوع" },
  { value: "misinformation", label: "معلومات مضللة" },
  { value: "copyright", label: "انتهاك حقوق" },
  { value: "other", label: "سبب آخر" },
];

const CommunityReportDialog = ({
  open,
  onOpenChange,
  targetType,
  targetId,
  targetLabel,
  targetPreview,
}: CommunityReportDialogProps) => {
  const { toast } = useToast();
  const [reason, setReason] = useState<BackendCommunityReportReasonCode | "">("");
  const [details, setDetails] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async () => {
    if (!reason) {
      toast({
        title: "اختر سبب التبليغ",
        variant: "destructive",
      });
      return;
    }

    try {
      setSubmitting(true);
      await reportBackendCommunityTarget({
        targetType,
        targetId,
        reasonCode: reason,
        note: details,
      });

      toast({
        title: "تم إرسال التبليغ",
        description: "شكرًا لمساعدتك في الحفاظ على جودة المجتمع.",
      });
      setReason("");
      setDetails("");
      onOpenChange(false);
    } catch (error) {
      toast({
        title: "تعذر إرسال التبليغ",
        description: error instanceof Error ? error.message : "حدث خطأ غير متوقع",
        variant: "destructive",
      });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-sm mx-4">
        <DialogHeader>
          <DialogTitle className="font-display flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-destructive" />
            تبليغ عن {targetLabel}
          </DialogTitle>
        </DialogHeader>
        {targetPreview && (
          <p className="text-sm text-muted-foreground line-clamp-2">{targetPreview}</p>
        )}
        <RadioGroup value={reason} onValueChange={(value) => setReason(value as BackendCommunityReportReasonCode)} className="space-y-2">
          {reportReasons.map((item) => (
            <div key={item.value} className="flex items-center gap-3 p-2 rounded-lg hover:bg-muted/50">
              <RadioGroupItem value={item.value} id={`${targetType}-${targetId}-${item.value}`} />
              <Label htmlFor={`${targetType}-${targetId}-${item.value}`} className="text-sm cursor-pointer flex-1">
                {item.label}
              </Label>
            </div>
          ))}
        </RadioGroup>
        <Textarea
          placeholder="تفاصيل إضافية (اختياري)"
          value={details}
          onChange={(event) => setDetails(event.target.value)}
          rows={2}
        />
        <Button onClick={handleSubmit} disabled={submitting} className="w-full">
          {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : "إرسال التبليغ"}
        </Button>
      </DialogContent>
    </Dialog>
  );
};

export default CommunityReportDialog;

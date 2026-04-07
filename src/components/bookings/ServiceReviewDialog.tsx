import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Star, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

interface ServiceReviewDialogProps {
  bookingId: string;
  serviceId: string;
  trainerId: string;
  serviceName: string;
  children: React.ReactNode;
  onReviewSubmitted?: () => void;
}

const ServiceReviewDialog = ({
  bookingId,
  serviceId,
  trainerId,
  serviceName,
  children,
  onReviewSubmitted,
}: ServiceReviewDialogProps) => {
  const { toast } = useToast();
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [rating, setRating] = useState(0);
  const [hoveredRating, setHoveredRating] = useState(0);
  const [review, setReview] = useState("");

  const handleSubmit = async () => {
    if (rating === 0) {
      toast({
        title: "خطأ",
        description: "يرجى اختيار تقييم",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      toast({
        title: "خطأ",
        description: "يجب تسجيل الدخول أولاً",
        variant: "destructive",
      });
      setLoading(false);
      return;
    }

    const { error } = await supabase
      .from("service_reviews")
      .insert({
        booking_id: bookingId,
        service_id: serviceId,
        student_id: user.id,
        trainer_id: trainerId,
        rating,
        review: review || null,
      });

    if (error) {
      if (error.code === "23505") {
        toast({
          title: "خطأ",
          description: "لقد قمت بتقييم هذه الخدمة مسبقاً",
          variant: "destructive",
        });
      } else {
        console.error("Review error:", error);
        toast({
          title: "خطأ",
          description: "فشل في إرسال التقييم",
          variant: "destructive",
        });
      }
    } else {
      toast({
        title: "شكراً لك!",
        description: "تم إرسال تقييمك بنجاح",
      });
      setOpen(false);
      setRating(0);
      setReview("");
      onReviewSubmitted?.();
    }

    setLoading(false);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {children}
      </DialogTrigger>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>تقييم الخدمة</DialogTitle>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <p className="text-sm text-muted-foreground text-center">
            كيف كانت تجربتك مع خدمة "{serviceName}"؟
          </p>

          {/* Star Rating */}
          <div className="flex justify-center gap-1">
            {[1, 2, 3, 4, 5].map((star) => (
              <button
                key={star}
                type="button"
                onClick={() => setRating(star)}
                onMouseEnter={() => setHoveredRating(star)}
                onMouseLeave={() => setHoveredRating(0)}
                className="p-1 transition-transform hover:scale-110"
              >
                <Star
                  className={cn(
                    "h-8 w-8 transition-colors",
                    (hoveredRating || rating) >= star
                      ? "fill-amber-400 text-amber-400"
                      : "text-muted-foreground"
                  )}
                />
              </button>
            ))}
          </div>

          <p className="text-center text-sm font-medium">
            {rating === 1 && "سيء"}
            {rating === 2 && "مقبول"}
            {rating === 3 && "جيد"}
            {rating === 4 && "جيد جداً"}
            {rating === 5 && "ممتاز"}
          </p>

          {/* Review Text */}
          <div className="space-y-2">
            <Label htmlFor="review">مراجعتك (اختياري)</Label>
            <Textarea
              id="review"
              value={review}
              onChange={(e) => setReview(e.target.value)}
              placeholder="شاركنا تجربتك..."
              rows={3}
            />
          </div>

          {/* Submit */}
          <Button
            onClick={handleSubmit}
            disabled={loading || rating === 0}
            className="w-full"
          >
            {loading ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              "إرسال التقييم"
            )}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default ServiceReviewDialog;

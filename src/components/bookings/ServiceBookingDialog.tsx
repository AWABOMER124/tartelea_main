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
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Calendar, Clock, DollarSign, Loader2 } from "lucide-react";
import PriceDisplay from "@/components/subscription/PriceDisplay";

interface Service {
  id: string;
  title: string;
  description: string | null;
  price: number;
  duration_minutes: number;
  service_type: string;
  trainer_id: string;
}

interface ServiceBookingDialogProps {
  service: Service;
  trainerName: string;
  children: React.ReactNode;
}

const ServiceBookingDialog = ({ service, trainerName, children }: ServiceBookingDialogProps) => {
  const { toast } = useToast();
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [scheduledDate, setScheduledDate] = useState("");
  const [scheduledTime, setScheduledTime] = useState("");
  const [notes, setNotes] = useState("");

  const handleBook = async () => {
    if (!scheduledDate || !scheduledTime) {
      toast({
        title: "خطأ",
        description: "يرجى اختيار التاريخ والوقت",
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

    const scheduledAt = new Date(`${scheduledDate}T${scheduledTime}`).toISOString();

    const { error } = await supabase
      .from("service_bookings")
      .insert({
        service_id: service.id,
        trainer_id: service.trainer_id,
        student_id: user.id,
        scheduled_at: scheduledAt,
        notes: notes || null,
        status: "pending",
      });

    if (error) {
      console.error("Booking error:", error);
      toast({
        title: "خطأ",
        description: "فشل في إنشاء الحجز",
        variant: "destructive",
      });
    } else {
      toast({
        title: "تم بنجاح!",
        description: "تم إرسال طلب الحجز وسيتم إشعارك عند التأكيد",
      });
      setOpen(false);
      setScheduledDate("");
      setScheduledTime("");
      setNotes("");
    }

    setLoading(false);
  };

  // Get minimum date (today)
  const today = new Date().toISOString().split("T")[0];

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {children}
      </DialogTrigger>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>حجز خدمة</DialogTitle>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* Service Info */}
          <div className="bg-muted/50 rounded-lg p-4 space-y-2">
            <h3 className="font-semibold text-foreground">{service.title}</h3>
            <p className="text-sm text-muted-foreground">المدرب: {trainerName}</p>
            {service.description && (
              <p className="text-sm text-muted-foreground">{service.description}</p>
            )}
            <div className="flex items-center gap-4 text-sm">
              <span className="flex items-center gap-1">
                <Clock className="h-4 w-4 text-muted-foreground" />
                {service.duration_minutes} دقيقة
              </span>
              <span className="flex items-center gap-1">
                <DollarSign className="h-4 w-4 text-muted-foreground" />
                <PriceDisplay price={service.price} showBadge={false} />
              </span>
            </div>
          </div>

          {/* Date & Time */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="date">التاريخ *</Label>
              <Input
                id="date"
                type="date"
                min={today}
                value={scheduledDate}
                onChange={(e) => setScheduledDate(e.target.value)}
                dir="ltr"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="time">الوقت *</Label>
              <Input
                id="time"
                type="time"
                value={scheduledTime}
                onChange={(e) => setScheduledTime(e.target.value)}
                dir="ltr"
              />
            </div>
          </div>

          {/* Notes */}
          <div className="space-y-2">
            <Label htmlFor="notes">ملاحظات (اختياري)</Label>
            <Textarea
              id="notes"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="أي تفاصيل أو طلبات خاصة..."
              rows={3}
            />
          </div>

          {/* Price Notice */}
          {service.price > 0 && (
            <p className="text-xs text-muted-foreground text-center">
              سيتم التواصل معك لترتيب طريقة الدفع بعد تأكيد الحجز
            </p>
          )}

          {/* Submit */}
          <Button
            onClick={handleBook}
            disabled={loading}
            className="w-full"
          >
            {loading ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <>
                <Calendar className="h-4 w-4 ml-2" />
                تأكيد الحجز
              </>
            )}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default ServiceBookingDialog;

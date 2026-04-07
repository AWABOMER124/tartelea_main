import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Calendar, Clock, Plus, Trash2, Loader2, CalendarOff } from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface Availability {
  id: string;
  day_of_week: number;
  start_time: string;
  end_time: string;
  is_active: boolean;
}

interface BlockedDate {
  id: string;
  blocked_date: string;
  reason: string | null;
}

const dayNames = [
  "الأحد",
  "الإثنين",
  "الثلاثاء",
  "الأربعاء",
  "الخميس",
  "الجمعة",
  "السبت",
];

interface TrainerAvailabilityManagerProps {
  trainerId: string;
}

const TrainerAvailabilityManager = ({ trainerId }: TrainerAvailabilityManagerProps) => {
  const { toast } = useToast();
  const [availability, setAvailability] = useState<Availability[]>([]);
  const [blockedDates, setBlockedDates] = useState<BlockedDate[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // New availability form
  const [newDay, setNewDay] = useState<string>("");
  const [newStartTime, setNewStartTime] = useState("09:00");
  const [newEndTime, setNewEndTime] = useState("17:00");

  // New blocked date form
  const [newBlockedDate, setNewBlockedDate] = useState("");
  const [newBlockedReason, setNewBlockedReason] = useState("");

  useEffect(() => {
    fetchData();
  }, [trainerId]);

  const fetchData = async () => {
    setLoading(true);

    const [availRes, blockedRes] = await Promise.all([
      supabase
        .from("trainer_availability")
        .select("*")
        .eq("trainer_id", trainerId)
        .order("day_of_week"),
      supabase
        .from("trainer_blocked_dates")
        .select("*")
        .eq("trainer_id", trainerId)
        .gte("blocked_date", new Date().toISOString().split("T")[0])
        .order("blocked_date"),
    ]);

    if (availRes.data) setAvailability(availRes.data);
    if (blockedRes.data) setBlockedDates(blockedRes.data);

    setLoading(false);
  };

  const addAvailability = async () => {
    if (!newDay || !newStartTime || !newEndTime) {
      toast({
        title: "خطأ",
        description: "يرجى ملء جميع الحقول",
        variant: "destructive",
      });
      return;
    }

    if (newStartTime >= newEndTime) {
      toast({
        title: "خطأ",
        description: "وقت البداية يجب أن يكون قبل وقت النهاية",
        variant: "destructive",
      });
      return;
    }

    setSaving(true);

    const { error } = await supabase.from("trainer_availability").insert({
      trainer_id: trainerId,
      day_of_week: parseInt(newDay),
      start_time: newStartTime,
      end_time: newEndTime,
      is_active: true,
    });

    if (error) {
      toast({
        title: "خطأ",
        description: "فشل في إضافة الموعد",
        variant: "destructive",
      });
    } else {
      toast({
        title: "تم بنجاح",
        description: "تم إضافة موعد التوفر",
      });
      setNewDay("");
      setNewStartTime("09:00");
      setNewEndTime("17:00");
      fetchData();
    }

    setSaving(false);
  };

  const toggleAvailability = async (id: string, isActive: boolean) => {
    const { error } = await supabase
      .from("trainer_availability")
      .update({ is_active: !isActive })
      .eq("id", id);

    if (!error) {
      setAvailability((prev) =>
        prev.map((a) => (a.id === id ? { ...a, is_active: !isActive } : a))
      );
    }
  };

  const deleteAvailability = async (id: string) => {
    const { error } = await supabase
      .from("trainer_availability")
      .delete()
      .eq("id", id);

    if (!error) {
      setAvailability((prev) => prev.filter((a) => a.id !== id));
      toast({ title: "تم الحذف", description: "تم حذف موعد التوفر" });
    }
  };

  const addBlockedDate = async () => {
    if (!newBlockedDate) {
      toast({
        title: "خطأ",
        description: "يرجى اختيار التاريخ",
        variant: "destructive",
      });
      return;
    }

    setSaving(true);

    const { error } = await supabase.from("trainer_blocked_dates").insert({
      trainer_id: trainerId,
      blocked_date: newBlockedDate,
      reason: newBlockedReason || null,
    });

    if (error) {
      if (error.code === "23505") {
        toast({
          title: "خطأ",
          description: "هذا التاريخ محجوب بالفعل",
          variant: "destructive",
        });
      } else {
        toast({
          title: "خطأ",
          description: "فشل في حجب التاريخ",
          variant: "destructive",
        });
      }
    } else {
      toast({
        title: "تم بنجاح",
        description: "تم حجب التاريخ",
      });
      setNewBlockedDate("");
      setNewBlockedReason("");
      fetchData();
    }

    setSaving(false);
  };

  const deleteBlockedDate = async (id: string) => {
    const { error } = await supabase
      .from("trainer_blocked_dates")
      .delete()
      .eq("id", id);

    if (!error) {
      setBlockedDates((prev) => prev.filter((b) => b.id !== id));
      toast({ title: "تم الحذف", description: "تم إلغاء حجب التاريخ" });
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  const today = new Date().toISOString().split("T")[0];

  return (
    <div className="space-y-6">
      {/* Weekly Availability */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <Clock className="h-5 w-5 text-primary" />
            مواعيد التوفر الأسبوعية
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Existing Availability */}
          {availability.length > 0 ? (
            <div className="space-y-2">
              {availability.map((slot) => (
                <div
                  key={slot.id}
                  className="flex items-center justify-between p-3 bg-muted/50 rounded-lg"
                >
                  <div className="flex items-center gap-3">
                    <Switch
                      checked={slot.is_active}
                      onCheckedChange={() =>
                        toggleAvailability(slot.id, slot.is_active)
                      }
                    />
                    <Badge variant={slot.is_active ? "default" : "secondary"}>
                      {dayNames[slot.day_of_week]}
                    </Badge>
                    <span className="text-sm" dir="ltr">
                      {slot.start_time.slice(0, 5)} - {slot.end_time.slice(0, 5)}
                    </span>
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => deleteAvailability(slot.id)}
                  >
                    <Trash2 className="h-4 w-4 text-destructive" />
                  </Button>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-muted-foreground text-center py-4">
              لم تحدد أي مواعيد توفر بعد
            </p>
          )}

          {/* Add New Availability */}
          <div className="border-t pt-4 mt-4">
            <h4 className="text-sm font-medium mb-3">إضافة موعد جديد</h4>
            <div className="grid grid-cols-3 gap-3">
              <div className="space-y-2">
                <Label>اليوم</Label>
                <Select value={newDay} onValueChange={setNewDay}>
                  <SelectTrigger>
                    <SelectValue placeholder="اختر" />
                  </SelectTrigger>
                  <SelectContent>
                    {dayNames.map((day, index) => (
                      <SelectItem key={index} value={index.toString()}>
                        {day}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>من</Label>
                <Input
                  type="time"
                  value={newStartTime}
                  onChange={(e) => setNewStartTime(e.target.value)}
                  dir="ltr"
                />
              </div>
              <div className="space-y-2">
                <Label>إلى</Label>
                <Input
                  type="time"
                  value={newEndTime}
                  onChange={(e) => setNewEndTime(e.target.value)}
                  dir="ltr"
                />
              </div>
            </div>
            <Button
              onClick={addAvailability}
              disabled={saving}
              className="w-full mt-3"
            >
              {saving ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <>
                  <Plus className="h-4 w-4 ml-1" />
                  إضافة موعد
                </>
              )}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Blocked Dates */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <CalendarOff className="h-5 w-5 text-destructive" />
            التواريخ المحجوبة
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Existing Blocked Dates */}
          {blockedDates.length > 0 ? (
            <div className="space-y-2">
              {blockedDates.map((blocked) => (
                <div
                  key={blocked.id}
                  className="flex items-center justify-between p-3 bg-destructive/5 rounded-lg"
                >
                  <div>
                    <span className="text-sm font-medium">
                      {new Date(blocked.blocked_date).toLocaleDateString("ar", {
                        weekday: "long",
                        year: "numeric",
                        month: "long",
                        day: "numeric",
                      })}
                    </span>
                    {blocked.reason && (
                      <p className="text-xs text-muted-foreground">
                        {blocked.reason}
                      </p>
                    )}
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => deleteBlockedDate(blocked.id)}
                  >
                    <Trash2 className="h-4 w-4 text-destructive" />
                  </Button>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-muted-foreground text-center py-4">
              لا توجد تواريخ محجوبة
            </p>
          )}

          {/* Add Blocked Date */}
          <div className="border-t pt-4 mt-4">
            <h4 className="text-sm font-medium mb-3">حجب تاريخ</h4>
            <div className="space-y-3">
              <div className="space-y-2">
                <Label>التاريخ</Label>
                <Input
                  type="date"
                  min={today}
                  value={newBlockedDate}
                  onChange={(e) => setNewBlockedDate(e.target.value)}
                  dir="ltr"
                />
              </div>
              <div className="space-y-2">
                <Label>السبب (اختياري)</Label>
                <Input
                  value={newBlockedReason}
                  onChange={(e) => setNewBlockedReason(e.target.value)}
                  placeholder="مثال: إجازة، سفر..."
                />
              </div>
              <Button
                onClick={addBlockedDate}
                disabled={saving}
                variant="outline"
                className="w-full"
              >
                {saving ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <>
                    <CalendarOff className="h-4 w-4 ml-1" />
                    حجب التاريخ
                  </>
                )}
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default TrainerAvailabilityManager;

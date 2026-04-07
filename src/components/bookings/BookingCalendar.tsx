import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ChevronRight, ChevronLeft, Calendar, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { Link } from "react-router-dom";

interface Booking {
  id: string;
  scheduled_at: string;
  status: string;
  service?: {
    title: string;
  };
  student?: {
    full_name: string;
  };
  trainer?: {
    full_name: string;
  };
}

interface BookingCalendarProps {
  userId: string;
  role: "trainer" | "student";
}

const statusColors: Record<string, string> = {
  pending: "bg-amber-500",
  confirmed: "bg-emerald-500",
  cancelled: "bg-destructive",
  completed: "bg-primary",
};

const BookingCalendar = ({ userId, role }: BookingCalendarProps) => {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);

  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();

  useEffect(() => {
    fetchBookings();
  }, [userId, role, month, year]);

  const fetchBookings = async () => {
    setLoading(true);

    const startOfMonth = new Date(year, month, 1).toISOString();
    const endOfMonth = new Date(year, month + 1, 0, 23, 59, 59).toISOString();

    const column = role === "trainer" ? "trainer_id" : "student_id";

    const { data: bookingsData } = await supabase
      .from("service_bookings")
      .select(`
        *,
        service:trainer_services(title)
      `)
      .eq(column, userId)
      .gte("scheduled_at", startOfMonth)
      .lte("scheduled_at", endOfMonth)
      .order("scheduled_at");

    if (bookingsData) {
      // Fetch profiles separately
      const userIds = new Set<string>();
      bookingsData.forEach((b) => {
        userIds.add(b.student_id);
        userIds.add(b.trainer_id);
      });

      const { data: profiles } = await supabase
        .from("profiles")
        .select("id, full_name")
        .in("id", Array.from(userIds));

      const profileMap = new Map(profiles?.map((p) => [p.id, p]) || []);

      const enriched = bookingsData.map((booking) => ({
        ...booking,
        student: profileMap.get(booking.student_id),
        trainer: profileMap.get(booking.trainer_id),
      }));

      setBookings(enriched);
    }

    setLoading(false);
  };

  const getDaysInMonth = (year: number, month: number) => {
    return new Date(year, month + 1, 0).getDate();
  };

  const getFirstDayOfMonth = (year: number, month: number) => {
    return new Date(year, month, 1).getDay();
  };

  const daysInMonth = getDaysInMonth(year, month);
  const firstDay = getFirstDayOfMonth(year, month);

  const monthNames = [
    "يناير", "فبراير", "مارس", "أبريل", "مايو", "يونيو",
    "يوليو", "أغسطس", "سبتمبر", "أكتوبر", "نوفمبر", "ديسمبر",
  ];

  const dayNames = ["أحد", "إثنين", "ثلاثاء", "أربعاء", "خميس", "جمعة", "سبت"];

  const getBookingsForDay = (day: number) => {
    return bookings.filter((b) => {
      const bookingDate = new Date(b.scheduled_at);
      return (
        bookingDate.getDate() === day &&
        bookingDate.getMonth() === month &&
        bookingDate.getFullYear() === year
      );
    });
  };

  const prevMonth = () => {
    setCurrentDate(new Date(year, month - 1, 1));
  };

  const nextMonth = () => {
    setCurrentDate(new Date(year, month + 1, 1));
  };

  const today = new Date();
  const isToday = (day: number) => {
    return (
      day === today.getDate() &&
      month === today.getMonth() &&
      year === today.getFullYear()
    );
  };

  const renderDays = () => {
    const days = [];

    // Empty cells for days before the first day of the month
    for (let i = 0; i < firstDay; i++) {
      days.push(<div key={`empty-${i}`} className="p-1 min-h-[80px]" />);
    }

    // Days of the month
    for (let day = 1; day <= daysInMonth; day++) {
      const dayBookings = getBookingsForDay(day);

      days.push(
        <div
          key={day}
          className={cn(
            "p-1 min-h-[80px] border border-border/50 rounded-md",
            isToday(day) && "bg-primary/5 border-primary"
          )}
        >
          <div
            className={cn(
              "text-xs font-medium mb-1",
              isToday(day) ? "text-primary" : "text-muted-foreground"
            )}
          >
            {day}
          </div>
          <div className="space-y-0.5">
            {dayBookings.slice(0, 2).map((booking) => (
              <Link
                key={booking.id}
                to="/bookings"
                className={cn(
                  "block text-xs px-1 py-0.5 rounded truncate text-white",
                  statusColors[booking.status]
                )}
              >
                {booking.service?.title || "حجز"}
              </Link>
            ))}
            {dayBookings.length > 2 && (
              <p className="text-xs text-muted-foreground text-center">
                +{dayBookings.length - 2}
              </p>
            )}
          </div>
        </div>
      );
    }

    return days;
  };

  return (
    <Card>
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2 text-lg">
            <Calendar className="h-5 w-5 text-primary" />
            تقويم الحجوزات
          </CardTitle>
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="icon" onClick={prevMonth}>
              <ChevronRight className="h-4 w-4" />
            </Button>
            <span className="text-sm font-medium min-w-[100px] text-center">
              {monthNames[month]} {year}
            </span>
            <Button variant="ghost" size="icon" onClick={nextMonth}>
              <ChevronLeft className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : (
          <>
            {/* Day Names Header */}
            <div className="grid grid-cols-7 gap-1 mb-1">
              {dayNames.map((day) => (
                <div
                  key={day}
                  className="text-center text-xs font-medium text-muted-foreground p-1"
                >
                  {day}
                </div>
              ))}
            </div>

            {/* Calendar Grid */}
            <div className="grid grid-cols-7 gap-1">{renderDays()}</div>

            {/* Legend */}
            <div className="flex flex-wrap gap-3 mt-4 pt-4 border-t justify-center">
              <div className="flex items-center gap-1">
                <div className="w-3 h-3 rounded bg-amber-500" />
                <span className="text-xs text-muted-foreground">قيد الانتظار</span>
              </div>
              <div className="flex items-center gap-1">
                <div className="w-3 h-3 rounded bg-emerald-500" />
                <span className="text-xs text-muted-foreground">مؤكد</span>
              </div>
              <div className="flex items-center gap-1">
                <div className="w-3 h-3 rounded bg-primary" />
                <span className="text-xs text-muted-foreground">مكتمل</span>
              </div>
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
};

export default BookingCalendar;

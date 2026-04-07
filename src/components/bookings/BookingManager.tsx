import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Calendar,
  Clock,
  User,
  CheckCircle,
  XCircle,
  Loader2,
  MessageCircle,
  DollarSign,
  Star,
} from "lucide-react";
import { Link } from "react-router-dom";
import ServiceReviewDialog from "./ServiceReviewDialog";

interface Booking {
  id: string;
  service_id: string;
  student_id: string;
  trainer_id: string;
  scheduled_at: string;
  status: string;
  notes: string | null;
  created_at: string;
  service?: {
    title: string;
    price: number;
    duration_minutes: number;
    service_type: string;
  };
  student?: {
    full_name: string;
    avatar_url: string | null;
  };
  trainer?: {
    full_name: string;
    avatar_url: string | null;
  };
}

interface BookingManagerProps {
  userId: string;
  role: "trainer" | "student";
}

const statusLabels: Record<string, string> = {
  pending: "قيد الانتظار",
  confirmed: "مؤكد",
  cancelled: "ملغي",
  completed: "مكتمل",
};

const statusColors: Record<string, string> = {
  pending: "bg-amber-500/10 text-amber-500",
  confirmed: "bg-emerald-500/10 text-emerald-500",
  cancelled: "bg-destructive/10 text-destructive",
  completed: "bg-primary/10 text-primary",
};

const BookingManager = ({ userId, role }: BookingManagerProps) => {
  const { toast } = useToast();
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState<string | null>(null);

  useEffect(() => {
    fetchBookings();
  }, [userId, role]);

  const fetchBookings = async () => {
    setLoading(true);
    
    const column = role === "trainer" ? "trainer_id" : "student_id";
    
    // First get bookings with service info
    const { data: bookingsData, error } = await supabase
      .from("service_bookings")
      .select(`
        *,
        service:trainer_services(title, price, duration_minutes, service_type)
      `)
      .eq(column, userId)
      .order("scheduled_at", { ascending: false });

    if (error) {
      console.error("Error fetching bookings:", error);
      toast({
        title: "خطأ",
        description: "فشل في جلب الحجوزات",
        variant: "destructive",
      });
      setLoading(false);
      return;
    }

    // Get all unique user IDs to fetch profiles
    const userIds = new Set<string>();
    bookingsData?.forEach(b => {
      userIds.add(b.student_id);
      userIds.add(b.trainer_id);
    });

    // Fetch profiles
    const { data: profiles } = await supabase
      .from("profiles")
      .select("id, full_name, avatar_url")
      .in("id", Array.from(userIds));

    const profileMap = new Map(profiles?.map(p => [p.id, p]) || []);

    // Combine data
    const enrichedBookings = bookingsData?.map(booking => ({
      ...booking,
      student: profileMap.get(booking.student_id) || { full_name: "غير معروف", avatar_url: null },
      trainer: profileMap.get(booking.trainer_id) || { full_name: "غير معروف", avatar_url: null },
    })) || [];

    setBookings(enrichedBookings as Booking[]);
    setLoading(false);
  };

  const updateStatus = async (bookingId: string, newStatus: string) => {
    setUpdating(bookingId);
    
    const { error } = await supabase
      .from("service_bookings")
      .update({ status: newStatus })
      .eq("id", bookingId);

    if (error) {
      toast({
        title: "خطأ",
        description: "فشل في تحديث الحالة",
        variant: "destructive",
      });
    } else {
      toast({
        title: "تم بنجاح",
        description: "تم تحديث حالة الحجز",
      });
      fetchBookings();
    }
    
    setUpdating(null);
  };

  const filterBookings = (status: string) => {
    if (status === "all") return bookings;
    if (status === "active") return bookings.filter(b => ["pending", "confirmed"].includes(b.status));
    return bookings.filter(b => b.status === status);
  };

  const pendingCount = bookings.filter(b => b.status === "pending").length;
  const confirmedCount = bookings.filter(b => b.status === "confirmed").length;

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  const renderBookingCard = (booking: Booking) => {
    const isPast = new Date(booking.scheduled_at) < new Date();
    const canModify = !isPast && ["pending", "confirmed"].includes(booking.status);
    const otherUser = role === "trainer" ? booking.student : booking.trainer;

    return (
      <Card key={booking.id} className="overflow-hidden">
        <CardContent className="p-4">
          <div className="flex gap-4">
            {/* Avatar */}
            <div className="w-12 h-12 rounded-full bg-muted flex items-center justify-center shrink-0 overflow-hidden">
              {otherUser?.avatar_url ? (
                <img 
                  src={otherUser.avatar_url} 
                  alt={otherUser?.full_name || ""}
                  className="w-full h-full object-cover"
                />
              ) : (
                <User className="h-6 w-6 text-muted-foreground" />
              )}
            </div>

            {/* Details */}
            <div className="flex-1 min-w-0">
              <div className="flex items-start justify-between gap-2">
                <div>
                  <h3 className="font-semibold text-foreground line-clamp-1">
                    {booking.service?.title || "خدمة"}
                  </h3>
                  <p className="text-sm text-muted-foreground">
                    {role === "trainer" ? "الطالب" : "المدرب"}: {otherUser?.full_name || "غير معروف"}
                  </p>
                </div>
                <Badge className={statusColors[booking.status]}>
                  {statusLabels[booking.status] || booking.status}
                </Badge>
              </div>

              <div className="flex flex-wrap items-center gap-3 mt-3 text-sm text-muted-foreground">
                <span className="flex items-center gap-1">
                  <Calendar className="h-3.5 w-3.5" />
                  {new Date(booking.scheduled_at).toLocaleDateString("ar", {
                    weekday: "short",
                    month: "short",
                    day: "numeric",
                  })}
                </span>
                <span className="flex items-center gap-1">
                  <Clock className="h-3.5 w-3.5" />
                  {new Date(booking.scheduled_at).toLocaleTimeString("ar", {
                    hour: "2-digit",
                    minute: "2-digit",
                  })}
                </span>
                {booking.service?.price && (
                  <span className="flex items-center gap-1">
                    <DollarSign className="h-3.5 w-3.5" />
                    ${booking.service.price}
                  </span>
                )}
              </div>

              {booking.notes && (
                <p className="text-sm text-muted-foreground mt-2 line-clamp-2">
                  {booking.notes}
                </p>
              )}

              {/* Actions */}
              {canModify && role === "trainer" && (
                <div className="flex gap-2 mt-3">
                  {booking.status === "pending" && (
                    <>
                      <Button
                        size="sm"
                        onClick={() => updateStatus(booking.id, "confirmed")}
                        disabled={updating === booking.id}
                        className="gap-1"
                      >
                        {updating === booking.id ? (
                          <Loader2 className="h-3 w-3 animate-spin" />
                        ) : (
                          <CheckCircle className="h-3 w-3" />
                        )}
                        تأكيد
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => updateStatus(booking.id, "cancelled")}
                        disabled={updating === booking.id}
                        className="gap-1"
                      >
                        <XCircle className="h-3 w-3" />
                        رفض
                      </Button>
                    </>
                  )}
                  {booking.status === "confirmed" && (
                    <Button
                      size="sm"
                      onClick={() => updateStatus(booking.id, "completed")}
                      disabled={updating === booking.id}
                      className="gap-1"
                    >
                      {updating === booking.id ? (
                        <Loader2 className="h-3 w-3 animate-spin" />
                      ) : (
                        <CheckCircle className="h-3 w-3" />
                      )}
                      إتمام الجلسة
                    </Button>
                  )}
                </div>
              )}

              {canModify && role === "student" && booking.status === "pending" && (
                <div className="flex gap-2 mt-3">
                  <Button
                    size="sm"
                    variant="destructive"
                    onClick={() => updateStatus(booking.id, "cancelled")}
                    disabled={updating === booking.id}
                    className="gap-1"
                  >
                    {updating === booking.id ? (
                      <Loader2 className="h-3 w-3 animate-spin" />
                    ) : (
                      <XCircle className="h-3 w-3" />
                    )}
                    إلغاء الحجز
                  </Button>
                </div>
              )}

              {/* Review button for completed bookings (students only) */}
              {role === "student" && booking.status === "completed" && (
                <div className="flex gap-2 mt-3">
                  <ServiceReviewDialog
                    bookingId={booking.id}
                    serviceId={booking.service_id}
                    trainerId={booking.trainer_id}
                    serviceName={booking.service?.title || "خدمة"}
                    onReviewSubmitted={fetchBookings}
                  >
                    <Button size="sm" variant="outline" className="gap-1">
                      <Star className="h-3 w-3" />
                      تقييم الخدمة
                    </Button>
                  </ServiceReviewDialog>
                </div>
              )}

              {/* Message Link */}
              <div className="mt-3">
                <Button variant="ghost" size="sm" asChild className="gap-1 text-muted-foreground">
                  <Link to={`/trainer/${role === "trainer" ? booking.student_id : booking.trainer_id}`}>
                    <MessageCircle className="h-3.5 w-3.5" />
                    مراسلة
                  </Link>
                </Button>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  };

  return (
    <div className="space-y-4">
      {/* Stats */}
      <div className="grid grid-cols-2 gap-3">
        <Card className="p-4 text-center">
          <p className="text-2xl font-bold text-accent">{pendingCount}</p>
          <p className="text-xs text-muted-foreground">قيد الانتظار</p>
        </Card>
        <Card className="p-4 text-center">
          <p className="text-2xl font-bold text-primary">{confirmedCount}</p>
          <p className="text-xs text-muted-foreground">مؤكدة</p>
        </Card>
      </div>

      {/* Tabs */}
      <Tabs defaultValue="active" className="w-full">
        <TabsList className="w-full grid grid-cols-4">
          <TabsTrigger value="active" className="text-xs">
            النشطة ({pendingCount + confirmedCount})
          </TabsTrigger>
          <TabsTrigger value="completed" className="text-xs">
            المكتملة
          </TabsTrigger>
          <TabsTrigger value="cancelled" className="text-xs">
            الملغية
          </TabsTrigger>
          <TabsTrigger value="all" className="text-xs">
            الكل
          </TabsTrigger>
        </TabsList>

        {["active", "completed", "cancelled", "all"].map((tab) => (
          <TabsContent key={tab} value={tab} className="mt-4 space-y-3">
            {filterBookings(tab).length === 0 ? (
              <Card className="p-8 text-center">
                <Calendar className="h-12 w-12 text-muted-foreground mx-auto mb-3" />
                <p className="text-muted-foreground">لا توجد حجوزات</p>
              </Card>
            ) : (
              filterBookings(tab).map(renderBookingCard)
            )}
          </TabsContent>
        ))}
      </Tabs>
    </div>
  );
};

export default BookingManager;

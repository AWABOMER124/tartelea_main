import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { useUserRole } from "@/hooks/useUserRole";
import AppLayout from "@/components/layout/AppLayout";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Calendar, GraduationCap, Loader2, CalendarDays, List } from "lucide-react";
import BookingManager from "@/components/bookings/BookingManager";
import BookingCalendar from "@/components/bookings/BookingCalendar";

const Bookings = () => {
  const navigate = useNavigate();
  const { user, loading: authLoading } = useAuth();
  const { isTrainer, userId, loading } = useUserRole();
  const [viewMode, setViewMode] = useState<"list" | "calendar">("list");

  useEffect(() => {
    if (!authLoading && !user) {
      navigate("/auth");
    }
  }, [authLoading, navigate, user]);

  if (loading || authLoading || !user || !userId) {
    return (
      <AppLayout>
        <div className="flex items-center justify-center py-20">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout>
      <div className="px-4 py-6 space-y-6 max-w-2xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center">
              <Calendar className="h-6 w-6 text-primary" />
            </div>
            <div>
              <h1 className="text-xl font-display font-bold text-foreground">
                إدارة الحجوزات
              </h1>
              <p className="text-sm text-muted-foreground">
                {isTrainer 
                  ? "إدارة حجوزات خدماتك وحجوزاتك كطالب" 
                  : "متابعة حجوزاتك للخدمات"}
              </p>
            </div>
          </div>
          
          {/* View Toggle */}
          <div className="flex gap-1 bg-muted rounded-lg p-1">
            <button
              onClick={() => setViewMode("list")}
              className={`p-2 rounded ${viewMode === "list" ? "bg-background shadow-sm" : ""}`}
            >
              <List className="h-4 w-4" />
            </button>
            <button
              onClick={() => setViewMode("calendar")}
              className={`p-2 rounded ${viewMode === "calendar" ? "bg-background shadow-sm" : ""}`}
            >
              <CalendarDays className="h-4 w-4" />
            </button>
          </div>
        </div>

        {/* Calendar View */}
        {viewMode === "calendar" && (
          <BookingCalendar userId={userId} role={isTrainer ? "trainer" : "student"} />
        )}

        {/* List View */}
        {viewMode === "list" && (
          <>
            {isTrainer ? (
              <Tabs defaultValue="trainer" className="w-full">
                <TabsList className="w-full grid grid-cols-2">
                  <TabsTrigger value="trainer" className="gap-1">
                    <GraduationCap className="h-4 w-4" />
                    كمدرب
                  </TabsTrigger>
                  <TabsTrigger value="student" className="gap-1">
                    <Calendar className="h-4 w-4" />
                    كطالب
                  </TabsTrigger>
                </TabsList>

                <TabsContent value="trainer" className="mt-4">
                  <BookingManager userId={userId} role="trainer" />
                </TabsContent>

                <TabsContent value="student" className="mt-4">
                  <BookingManager userId={userId} role="student" />
                </TabsContent>
              </Tabs>
            ) : (
              <BookingManager userId={userId} role="student" />
            )}
          </>
        )}
      </div>
    </AppLayout>
  );
};

export default Bookings;

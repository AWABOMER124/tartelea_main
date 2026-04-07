import { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useUserRole } from "@/hooks/useUserRole";
import { useToast } from "@/hooks/use-toast";
import AppLayout from "@/components/layout/AppLayout";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  GraduationCap, Video, Headphones, Clock, CheckCircle, Loader2,
  BookOpen, User, Calendar, Sparkles, Settings, BarChart3,
} from "lucide-react";
import TrainerStats from "@/components/stats/TrainerStats";
import TrainerAnalytics from "@/components/stats/TrainerAnalytics";
import TrainerServicesManager from "@/components/trainer/TrainerServicesManager";
import TrainerProfileEditor from "@/components/trainer/TrainerProfileEditor";
import TrainerAvailabilityManager from "@/components/trainer/TrainerAvailabilityManager";
import TrainerCoursesTab from "@/components/trainer/TrainerCoursesTab";
import TrainerWorkshopsTab from "@/components/trainer/TrainerWorkshopsTab";
import TrainerRoomsTab from "@/components/trainer/TrainerRoomsTab";
import type { TrainerCourse } from "@/components/trainer/CourseFormDialog";
import type { Database } from "@/integrations/supabase/types";

type ContentCategory = Database["public"]["Enums"]["content_category"];

interface Workshop {
  id: string;
  title: string;
  description: string | null;
  category: ContentCategory;
  scheduled_at: string;
  duration_minutes: number | null;
  is_approved: boolean | null;
  is_live: boolean | null;
  price: number | null;
  max_participants: number | null;
  image_url: string | null;
}

interface Room {
  id: string;
  title: string;
  description: string | null;
  category: ContentCategory;
  scheduled_at: string;
  duration_minutes: number | null;
  is_approved: boolean | null;
  is_live: boolean | null;
  price: number | null;
  max_participants: number | null;
  access_type: string;
}

interface TrainerProfile {
  full_name: string | null;
  bio: string | null;
  experience_years: number | null;
  specializations: string[] | null;
  avatar_url: string | null;
  country: string | null;
}

const TrainerDashboard = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { isTrainer, loading: roleLoading, userId } = useUserRole();

  const [courses, setCourses] = useState<TrainerCourse[]>([]);
  const [workshops, setWorkshops] = useState<Workshop[]>([]);
  const [rooms, setRooms] = useState<Room[]>([]);
  const [profile, setProfile] = useState<TrainerProfile | null>(null);
  const [loadingData, setLoadingData] = useState(true);

  useEffect(() => {
    if (!roleLoading && !isTrainer) {
      navigate("/");
      toast({ title: "غير مصرح", description: "ليس لديك صلاحية الوصول لهذه الصفحة", variant: "destructive" });
    }
  }, [roleLoading, isTrainer, navigate, toast]);

  useEffect(() => {
    if (isTrainer && userId) fetchAllData();
  }, [isTrainer, userId]);

  const fetchAllData = async () => {
    setLoadingData(true);
    const [coursesRes, workshopsRes, roomsRes, profileRes] = await Promise.all([
      supabase.from("trainer_courses").select("*").eq("trainer_id", userId!).order("created_at", { ascending: false }),
      supabase.from("workshops").select("*").eq("host_id", userId!).order("scheduled_at", { ascending: false }),
      supabase.from("rooms").select("*").eq("host_id", userId!).order("scheduled_at", { ascending: false }),
      supabase.from("profiles").select("*").eq("id", userId!).single(),
    ]);

    if (coursesRes.data) setCourses(coursesRes.data as TrainerCourse[]);
    if (workshopsRes.data) setWorkshops(workshopsRes.data);
    if (roomsRes.data) setRooms(roomsRes.data as Room[]);
    if (profileRes.data) setProfile(profileRes.data);
    setLoadingData(false);
  };

  if (roleLoading || loadingData) {
    return (
      <AppLayout>
        <div className="flex items-center justify-center py-20">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </AppLayout>
    );
  }

  if (!isTrainer) return null;

  const pendingCourses = courses.filter((c) => !c.is_approved);
  const approvedCourses = courses.filter((c) => c.is_approved);

  return (
    <AppLayout>
      <div className="px-4 py-6 space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-lg bg-accent/10 flex items-center justify-center">
              <GraduationCap className="h-6 w-6 text-accent" />
            </div>
            <div>
              <h1 className="text-xl font-display font-bold text-foreground">لوحة المدرب</h1>
              <p className="text-sm text-muted-foreground">إدارة الدورات والمحتوى التعليمي</p>
            </div>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" asChild>
              <Link to="/bookings"><Calendar className="h-4 w-4 ml-1" />الحجوزات</Link>
            </Button>
            <Button variant="outline" size="sm" asChild>
              <Link to={`/trainer/${userId}`}><User className="h-4 w-4 ml-1" />صفحتي</Link>
            </Button>
          </div>
        </div>

        <TrainerStats trainerId={userId} />

        {/* Quick Stats */}
        <div className="grid grid-cols-5 gap-3">
          {[
            { icon: BookOpen, count: courses.length, label: "دورة", color: "text-primary" },
            { icon: Video, count: workshops.length, label: "ورشة", color: "text-accent" },
            { icon: Headphones, count: rooms.length, label: "غرفة", color: "text-primary" },
            { icon: CheckCircle, count: approvedCourses.length, label: "معتمدة", color: "text-primary" },
            { icon: Clock, count: pendingCourses.length, label: "قيد المراجعة", color: "text-accent" },
          ].map(({ icon: Icon, count, label, color }) => (
            <Card key={label}>
              <CardContent className="pt-4 text-center">
                <Icon className={`h-5 w-5 ${color} mx-auto mb-1`} />
                <p className="text-xl font-bold text-foreground">{count}</p>
                <p className="text-xs text-muted-foreground">{label}</p>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Tabs */}
        <Tabs defaultValue="courses" className="w-full">
          <TabsList className="w-full grid grid-cols-6">
            <TabsTrigger value="courses" className="text-xs gap-1"><BookOpen className="h-3.5 w-3.5" />الدورات</TabsTrigger>
            <TabsTrigger value="workshops" className="text-xs gap-1"><Video className="h-3.5 w-3.5" />الورش</TabsTrigger>
            <TabsTrigger value="rooms" className="text-xs gap-1"><Headphones className="h-3.5 w-3.5" />الغرف</TabsTrigger>
            <TabsTrigger value="analytics" className="text-xs gap-1"><BarChart3 className="h-3.5 w-3.5" />التحليلات</TabsTrigger>
            <TabsTrigger value="services" className="text-xs gap-1"><Sparkles className="h-3.5 w-3.5" />الخدمات</TabsTrigger>
            <TabsTrigger value="settings" className="text-xs gap-1"><Settings className="h-3.5 w-3.5" />الإعدادات</TabsTrigger>
          </TabsList>

          <TabsContent value="courses" className="mt-4">
            <TrainerCoursesTab courses={courses} trainerId={userId!} onRefresh={fetchAllData} />
          </TabsContent>

          <TabsContent value="workshops" className="mt-4">
            <TrainerWorkshopsTab workshops={workshops} onRefresh={fetchAllData} />
          </TabsContent>

          <TabsContent value="rooms" className="mt-4">
            <TrainerRoomsTab rooms={rooms} onRefresh={fetchAllData} />
          </TabsContent>

          <TabsContent value="analytics" className="mt-4">
            {userId && <TrainerAnalytics trainerId={userId} />}
          </TabsContent>

          <TabsContent value="services" className="mt-4">
            {userId && <TrainerServicesManager trainerId={userId} />}
          </TabsContent>

          <TabsContent value="settings" className="mt-4 space-y-6">
            {userId && profile && (
              <TrainerProfileEditor
                userId={userId}
                profile={{
                  full_name: profile.full_name || "",
                  bio: profile.bio || "",
                  experience_years: profile.experience_years || 0,
                  specializations: profile.specializations || [],
                  avatar_url: profile.avatar_url || "",
                  country: profile.country || "",
                }}
                onUpdate={() => fetchAllData()}
              />
            )}
            {userId && <TrainerAvailabilityManager trainerId={userId} />}
          </TabsContent>
        </Tabs>
      </div>
    </AppLayout>
  );
};

export default TrainerDashboard;

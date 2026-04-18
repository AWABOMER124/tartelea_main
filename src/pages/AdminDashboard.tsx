/**
 * STEP 7 closure note:
 * Admin dashboard summary and approval tabs now read/write through backend `/admin/*` routes.
 * New admin work must avoid `@/integrations/supabase/client` and use backend admin helpers instead.
 */
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useUserRole } from "@/hooks/useUserRole";
import { useToast } from "@/hooks/use-toast";
import AppLayout from "@/components/layout/AppLayout";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Shield, Users, BookOpen, MessageSquare, Loader2, GraduationCap, Video, Pin } from "lucide-react";
import ContentManagement from "@/components/admin/ContentManagement";
import PostManagement from "@/components/admin/PostManagement";
import UserManagement from "@/components/admin/UserManagement";
import TrainerCoursesManagement from "@/components/admin/TrainerCoursesManagement";
import EventsManagement from "@/components/admin/EventsManagement";
import CommunityPinsManagement from "@/components/admin/CommunityPinsManagement";
import { listAdminCommunityPosts } from "@/lib/backendCommunityAdmin";
import {
  listAdminContents,
  listAdminCourses,
  listAdminRooms,
  listAdminUsers,
  listAdminWorkshops,
  type AdminContentItem,
  type AdminUser,
} from "@/lib/backendAdmin";

const AdminDashboard = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { isModerator, isAdmin, loading: roleLoading } = useUserRole();

  const [contents, setContents] = useState<AdminContentItem[]>([]);
  const [communityPostsCount, setCommunityPostsCount] = useState(0);
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [pendingCoursesCount, setPendingCoursesCount] = useState(0);
  const [pendingEventsCount, setPendingEventsCount] = useState(0);
  const [loadingData, setLoadingData] = useState(true);

  useEffect(() => {
    if (!roleLoading && !isModerator) {
      navigate("/");
      toast({
        title: "غير مصرح",
        description: "ليست لديك صلاحية الوصول لهذه الصفحة",
        variant: "destructive",
      });
    }
  }, [roleLoading, isModerator, navigate, toast]);

  useEffect(() => {
    if (isModerator) {
      void fetchData();
    }
  }, [isModerator]);

  const fetchData = async () => {
    setLoadingData(true);

    try {
      const [contentItems, userItems, courseItems, workshopItems, roomItems, communityPostsRes] = await Promise.all([
        listAdminContents(),
        listAdminUsers(),
        listAdminCourses(),
        listAdminWorkshops(),
        listAdminRooms(),
        listAdminCommunityPosts({ limit: 1, offset: 0 }),
      ]);

      setContents(contentItems);
      setUsers(userItems);
      setPendingCoursesCount(courseItems.filter((course) => !course.is_approved).length);
      setPendingEventsCount(
        workshopItems.filter((workshop) => !workshop.is_approved).length +
        roomItems.filter((room) => !room.is_approved).length,
      );
      setCommunityPostsCount(communityPostsRes.total || 0);
    } catch (error) {
      toast({
        title: "تعذر تحميل بيانات الإدارة",
        description: error instanceof Error ? error.message : "حدث خطأ غير متوقع",
        variant: "destructive",
      });
      setCommunityPostsCount(0);
    } finally {
      setLoadingData(false);
    }
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

  if (!isModerator) {
    return null;
  }

  return (
    <AppLayout>
      <div className="px-4 py-6 space-y-6">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center">
            <Shield className="h-6 w-6 text-primary" />
          </div>
          <div>
            <h1 className="text-xl font-display font-bold text-foreground">لوحة التحكم</h1>
            <p className="text-sm text-muted-foreground">
              {isAdmin ? "مدير النظام" : "مشرف"}
            </p>
          </div>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <div className="bg-card rounded-xl p-4 border border-border">
            <div className="flex items-center gap-2 mb-2">
              <BookOpen className="h-5 w-5 text-primary" />
              <span className="text-sm text-muted-foreground">المحتوى</span>
            </div>
            <p className="text-2xl font-bold text-foreground">{contents.length}</p>
          </div>
          <div className="bg-card rounded-xl p-4 border border-border">
            <div className="flex items-center gap-2 mb-2">
              <MessageSquare className="h-5 w-5 text-accent" />
              <span className="text-sm text-muted-foreground">منشورات المجتمع</span>
            </div>
            <p className="text-2xl font-bold text-foreground">{communityPostsCount}</p>
          </div>
          <div className="bg-card rounded-xl p-4 border border-border">
            <div className="flex items-center gap-2 mb-2">
              <Users className="h-5 w-5 text-primary" />
              <span className="text-sm text-muted-foreground">المستخدمون</span>
            </div>
            <p className="text-2xl font-bold text-foreground">{users.length}</p>
          </div>
          <div className="bg-card rounded-xl p-4 border border-border relative">
            <div className="flex items-center gap-2 mb-2">
              <GraduationCap className="h-5 w-5 text-accent" />
              <span className="text-sm text-muted-foreground">قيد المراجعة</span>
            </div>
            <p className="text-2xl font-bold text-foreground">{pendingCoursesCount}</p>
            {pendingCoursesCount > 0 && (
              <span className="absolute top-2 left-2 w-3 h-3 bg-destructive rounded-full animate-pulse" />
            )}
          </div>
        </div>

        <Tabs defaultValue="contents" className="w-full">
          <TabsList className="w-full grid grid-cols-6">
            <TabsTrigger value="contents" className="gap-1 text-xs sm:text-sm">
              <BookOpen className="h-4 w-4" />
              <span className="hidden sm:inline">المحتوى</span>
            </TabsTrigger>
            <TabsTrigger value="pinned" className="gap-1 text-xs sm:text-sm">
              <Pin className="h-4 w-4" />
              <span className="hidden sm:inline">تثبيت المجتمع</span>
            </TabsTrigger>
            <TabsTrigger value="courses" className="gap-1 text-xs sm:text-sm relative">
              <GraduationCap className="h-4 w-4" />
              <span className="hidden sm:inline">الدورات</span>
              {pendingCoursesCount > 0 && (
                <span className="absolute -top-1 -right-1 w-2 h-2 bg-destructive rounded-full" />
              )}
            </TabsTrigger>
            <TabsTrigger value="events" className="gap-1 text-xs sm:text-sm relative">
              <Video className="h-4 w-4" />
              <span className="hidden sm:inline">الفعاليات</span>
              {pendingEventsCount > 0 && (
                <span className="absolute -top-1 -right-1 w-2 h-2 bg-destructive rounded-full" />
              )}
            </TabsTrigger>
            <TabsTrigger value="posts" className="gap-1 text-xs sm:text-sm">
              <MessageSquare className="h-4 w-4" />
              <span className="hidden sm:inline">إدارة المجتمع</span>
            </TabsTrigger>
            <TabsTrigger value="users" className="gap-1 text-xs sm:text-sm">
              <Users className="h-4 w-4" />
              <span className="hidden sm:inline">المستخدمون</span>
            </TabsTrigger>
          </TabsList>

          <TabsContent value="contents">
            <ContentManagement contents={contents} onRefresh={fetchData} />
          </TabsContent>

          <TabsContent value="pinned">
            <CommunityPinsManagement />
          </TabsContent>

          <TabsContent value="courses">
            <TrainerCoursesManagement />
          </TabsContent>

          <TabsContent value="events">
            <EventsManagement />
          </TabsContent>

          <TabsContent value="posts">
            <PostManagement />
          </TabsContent>

          <TabsContent value="users">
            <UserManagement users={users} isAdmin={isAdmin} onRefresh={fetchData} />
          </TabsContent>
        </Tabs>
      </div>
    </AppLayout>
  );
};

export default AdminDashboard;

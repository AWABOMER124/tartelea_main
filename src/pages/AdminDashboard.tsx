import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
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
import PinnedContentManagement from "@/components/admin/PinnedContentManagement";
import type { Database } from "@/integrations/supabase/types";

type Content = Database["public"]["Tables"]["contents"]["Row"];
type Post = Database["public"]["Tables"]["posts"]["Row"];
type Profile = Database["public"]["Tables"]["profiles"]["Row"];

const AdminDashboard = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { isModerator, isAdmin, loading: roleLoading } = useUserRole();

  const [contents, setContents] = useState<Content[]>([]);
  const [posts, setPosts] = useState<Post[]>([]);
  const [users, setUsers] = useState<Profile[]>([]);
  const [pendingCoursesCount, setPendingCoursesCount] = useState(0);
  const [pendingEventsCount, setPendingEventsCount] = useState(0);
  const [loadingData, setLoadingData] = useState(true);

  useEffect(() => {
    if (!roleLoading && !isModerator) {
      navigate("/");
      toast({
        title: "غير مصرح",
        description: "ليس لديك صلاحية الوصول لهذه الصفحة",
        variant: "destructive",
      });
    }
  }, [roleLoading, isModerator, navigate, toast]);

  useEffect(() => {
    if (isModerator) {
      fetchData();
    }
  }, [isModerator]);

  const fetchData = async () => {
    setLoadingData(true);

    const [contentsRes, postsRes, usersRes, coursesRes, workshopsRes, roomsRes] = await Promise.all([
      supabase.from("contents").select("*").order("created_at", { ascending: false }),
      supabase.from("posts").select("*").order("created_at", { ascending: false }),
      supabase.from("profiles").select("*").order("created_at", { ascending: false }),
      supabase.from("trainer_courses").select("id").eq("is_approved", false),
      supabase.from("workshops").select("id").eq("is_approved", false),
      supabase.from("rooms").select("id").eq("is_approved", false),
    ]);

    if (contentsRes.data) setContents(contentsRes.data);
    if (postsRes.data) setPosts(postsRes.data);
    if (usersRes.data) setUsers(usersRes.data);
    if (coursesRes.data) setPendingCoursesCount(coursesRes.data.length);
    const eventsCount = (workshopsRes.data?.length || 0) + (roomsRes.data?.length || 0);
    setPendingEventsCount(eventsCount);

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

  if (!isModerator) {
    return null;
  }

  return (
    <AppLayout>
      <div className="px-4 py-6 space-y-6">
        {/* Header */}
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center">
            <Shield className="h-6 w-6 text-primary" />
          </div>
          <div>
            <h1 className="text-xl font-display font-bold text-foreground">
              لوحة التحكم
            </h1>
            <p className="text-sm text-muted-foreground">
              {isAdmin ? "مدير النظام" : "مشرف"}
            </p>
          </div>
        </div>

        {/* Stats Cards */}
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
              <span className="text-sm text-muted-foreground">المنشورات</span>
            </div>
            <p className="text-2xl font-bold text-foreground">{posts.length}</p>
          </div>
          <div className="bg-card rounded-xl p-4 border border-border">
            <div className="flex items-center gap-2 mb-2">
              <Users className="h-5 w-5 text-primary" />
              <span className="text-sm text-muted-foreground">المستخدمين</span>
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

        {/* Tabs */}
        <Tabs defaultValue="contents" className="w-full">
          <TabsList className="w-full grid grid-cols-6">
            <TabsTrigger value="contents" className="gap-1 text-xs sm:text-sm">
              <BookOpen className="h-4 w-4" />
              <span className="hidden sm:inline">المحتوى</span>
            </TabsTrigger>
            <TabsTrigger value="pinned" className="gap-1 text-xs sm:text-sm">
              <Pin className="h-4 w-4" />
              <span className="hidden sm:inline">المثبت</span>
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
              <span className="hidden sm:inline">المنشورات</span>
            </TabsTrigger>
            <TabsTrigger value="users" className="gap-1 text-xs sm:text-sm">
              <Users className="h-4 w-4" />
              <span className="hidden sm:inline">المستخدمين</span>
            </TabsTrigger>
          </TabsList>

          <TabsContent value="contents">
            <ContentManagement contents={contents} onRefresh={fetchData} />
          </TabsContent>

          <TabsContent value="pinned">
            <PinnedContentManagement />
          </TabsContent>

          <TabsContent value="courses">
            <TrainerCoursesManagement />
          </TabsContent>

          <TabsContent value="events">
            <EventsManagement />
          </TabsContent>

          <TabsContent value="posts">
            <PostManagement posts={posts} onRefresh={fetchData} />
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

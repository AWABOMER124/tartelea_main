import { useState, useEffect } from "react";
import { useParams, Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import AppLayout from "@/components/layout/AppLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  User, 
  GraduationCap, 
  Video, 
  Calendar, 
  MapPin, 
  Award,
  BookOpen,
  Users,
  Star,
  ExternalLink,
  Loader2,
  MessageCircle,
  Clock,
  DollarSign,
  Sparkles,
} from "lucide-react";
import DirectMessages from "@/components/messages/DirectMessages";
import ServiceBookingDialog from "@/components/bookings/ServiceBookingDialog";
import type { Database } from "@/integrations/supabase/types";

type Profile = Database["public"]["Tables"]["profiles"]["Row"] & {
  bio?: string;
  experience_years?: number;
  specializations?: string[];
  social_links?: Record<string, string>;
  avatar_url?: string;
};
type TrainerCourse = Database["public"]["Tables"]["trainer_courses"]["Row"];
type Workshop = Database["public"]["Tables"]["workshops"]["Row"];

interface TrainerService {
  id: string;
  title: string;
  description: string | null;
  service_type: string;
  duration_minutes: number;
  price: number;
  is_active: boolean;
}

const categoryLabels: Record<string, string> = {
  quran: "القرآن الكريم",
  values: "القيم والأخلاق",
  community: "المجتمع",
  sudan_awareness: "الوعي السوداني",
  arab_awareness: "الوعي العربي",
  islamic_awareness: "الوعي الإسلامي",
};

const serviceTypeLabels: Record<string, string> = {
  private_session: "جلسة خاصة",
  consultation: "استشارة",
  mentorship: "توجيه ومتابعة",
  review: "مراجعة محتوى",
  custom: "خدمة مخصصة",
};

const TrainerProfile = () => {
  const { id } = useParams<{ id: string }>();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [courses, setCourses] = useState<TrainerCourse[]>([]);
  const [workshops, setWorkshops] = useState<Workshop[]>([]);
  const [services, setServices] = useState<TrainerService[]>([]);
  const [loading, setLoading] = useState(true);
  const [isTrainer, setIsTrainer] = useState(false);
  const [showChat, setShowChat] = useState(false);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [stats, setStats] = useState({
    totalStudents: 0,
    totalCourses: 0,
    totalWorkshops: 0,
    avgRating: 0
  });

  useEffect(() => {
    checkCurrentUser();
    if (id) {
      fetchTrainerData();
    }
  }, [id]);

  const checkCurrentUser = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    setCurrentUserId(user?.id || null);
  };

  const fetchTrainerData = async () => {
    setLoading(true);

    // Check if user is a trainer
    const { data: roleData } = await supabase
      .from("user_roles")
      .select("role")
      .eq("user_id", id)
      .eq("role", "trainer")
      .maybeSingle();

    if (!roleData) {
      setIsTrainer(false);
      setLoading(false);
      return;
    }

    setIsTrainer(true);

    // Fetch profile, courses, workshops, and services in parallel
    const [profileRes, coursesRes, workshopsRes, servicesRes] = await Promise.all([
      supabase
        .from("profiles")
        .select("*")
        .eq("id", id)
        .single(),
      supabase
        .from("trainer_courses")
        .select("*")
        .eq("trainer_id", id)
        .eq("is_approved", true)
        .order("created_at", { ascending: false }),
      supabase
        .from("workshops")
        .select("*")
        .eq("host_id", id)
        .eq("is_approved", true)
        .order("scheduled_at", { ascending: false }),
      supabase
        .from("trainer_services")
        .select("*")
        .eq("trainer_id", id)
        .eq("is_active", true)
        .order("created_at", { ascending: false })
    ]);

    if (profileRes.data) {
      setProfile(profileRes.data as Profile);
    }

    if (coursesRes.data) {
      setCourses(coursesRes.data);
    }

    if (workshopsRes.data) {
      setWorkshops(workshopsRes.data);
    }

    if (servicesRes.data) {
      setServices(servicesRes.data);
    }

    // Calculate stats
    if (coursesRes.data && coursesRes.data.length > 0) {
      const courseIds = coursesRes.data.map(c => c.id);
      
      const { count: studentsCount } = await supabase
        .from("course_subscriptions")
        .select("*", { count: "exact", head: true })
        .in("course_id", courseIds);

      // Get average rating
      const { data: ratingsData } = await supabase
        .from("course_ratings")
        .select("rating")
        .in("course_id", courseIds);

      const avgRating = ratingsData && ratingsData.length > 0
        ? ratingsData.reduce((sum, r) => sum + r.rating, 0) / ratingsData.length
        : 0;

      setStats({
        totalStudents: studentsCount || 0,
        totalCourses: coursesRes.data.length,
        totalWorkshops: workshopsRes.data?.length || 0,
        avgRating: Math.round(avgRating * 10) / 10
      });
    }

    setLoading(false);
  };

  if (loading) {
    return (
      <AppLayout>
        <div className="flex items-center justify-center py-20">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </AppLayout>
    );
  }

  if (!isTrainer || !profile) {
    return (
      <AppLayout>
        <div className="flex flex-col items-center justify-center py-20 px-4 text-center">
          <User className="h-16 w-16 text-muted-foreground mb-4" />
          <h1 className="text-xl font-bold text-foreground mb-2">
            الصفحة غير موجودة
          </h1>
          <p className="text-muted-foreground mb-4">
            هذا المستخدم ليس مدرباً أو الصفحة غير متاحة
          </p>
          <Button asChild>
            <Link to="/courses">تصفح الدورات</Link>
          </Button>
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout>
      <div className="px-4 py-6 space-y-6 max-w-4xl mx-auto">
        {/* Profile Header */}
        <Card className="border-border overflow-hidden">
          <div className="h-24 bg-gradient-to-l from-primary/20 via-accent/20 to-primary/10" />
          <CardContent className="relative pt-0 pb-6">
            <div className="flex flex-col sm:flex-row gap-4 -mt-12">
              {/* Avatar */}
              <div className="w-24 h-24 rounded-2xl bg-card border-4 border-background shadow-lg flex items-center justify-center overflow-hidden">
                {profile.avatar_url ? (
                  <img 
                    src={profile.avatar_url} 
                    alt={profile.full_name || "المدرب"}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <GraduationCap className="h-10 w-10 text-primary" />
                )}
              </div>

              {/* Info */}
              <div className="flex-1 pt-2 sm:pt-8">
                <h1 className="text-2xl font-display font-bold text-foreground">
                  {profile.full_name || "مدرب"}
                </h1>
                <div className="flex flex-wrap gap-2 mt-2">
                  {profile.country && (
                    <Badge variant="outline" className="gap-1">
                      <MapPin className="h-3 w-3" />
                      {profile.country}
                    </Badge>
                  )}
                  {profile.experience_years && profile.experience_years > 0 && (
                    <Badge variant="outline" className="gap-1">
                      <Award className="h-3 w-3" />
                      {profile.experience_years} سنوات خبرة
                    </Badge>
                  )}
                </div>
              </div>
            </div>

            {/* Bio */}
            {profile.bio && (
              <p className="mt-4 text-muted-foreground leading-relaxed">
                {profile.bio}
              </p>
            )}

            {/* Specializations */}
            {profile.specializations && profile.specializations.length > 0 && (
              <div className="mt-4">
                <h3 className="text-sm font-medium text-foreground mb-2">التخصصات</h3>
                <div className="flex flex-wrap gap-2">
                  {profile.specializations.map((spec, index) => (
                    <Badge key={index} className="bg-primary/10 text-primary">
                      {spec}
                    </Badge>
                  ))}
                </div>
              </div>
            )}

            {/* Contact Button */}
            {currentUserId && currentUserId !== id && (
              <Button 
                onClick={() => setShowChat(!showChat)} 
                className="mt-4 w-full gap-2"
                variant={showChat ? "outline" : "default"}
              >
                <MessageCircle className="h-4 w-4" />
                {showChat ? "إخفاء المحادثة" : "تواصل مع المدرب"}
              </Button>
            )}
          </CardContent>
        </Card>

        {/* Direct Messages */}
        {showChat && profile && (
          <DirectMessages
            recipientId={id!}
            recipientName={profile.full_name || "المدرب"}
            onBack={() => setShowChat(false)}
          />
        )}

        {/* Stats */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <Card className="p-4 text-center">
            <BookOpen className="h-6 w-6 text-primary mx-auto mb-2" />
            <p className="text-2xl font-bold text-foreground">{stats.totalCourses}</p>
            <p className="text-xs text-muted-foreground">دورة</p>
          </Card>
          <Card className="p-4 text-center">
            <Video className="h-6 w-6 text-accent mx-auto mb-2" />
            <p className="text-2xl font-bold text-foreground">{stats.totalWorkshops}</p>
            <p className="text-xs text-muted-foreground">ورشة</p>
          </Card>
          <Card className="p-4 text-center">
            <Users className="h-6 w-6 text-primary mx-auto mb-2" />
            <p className="text-2xl font-bold text-foreground">{stats.totalStudents}</p>
            <p className="text-xs text-muted-foreground">طالب</p>
          </Card>
          <Card className="p-4 text-center">
            <Star className="h-6 w-6 text-amber-500 mx-auto mb-2" />
            <p className="text-2xl font-bold text-foreground">{stats.avgRating || "-"}</p>
            <p className="text-xs text-muted-foreground">التقييم</p>
          </Card>
        </div>

        {/* Courses, Workshops & Services Tabs */}
        <Tabs defaultValue="courses" className="w-full">
          <TabsList className="w-full grid grid-cols-3">
            <TabsTrigger value="courses" className="gap-1 text-xs sm:text-sm">
              <BookOpen className="h-4 w-4" />
              <span className="hidden sm:inline">الدورات</span> ({courses.length})
            </TabsTrigger>
            <TabsTrigger value="workshops" className="gap-1 text-xs sm:text-sm">
              <Video className="h-4 w-4" />
              <span className="hidden sm:inline">الورش</span> ({workshops.length})
            </TabsTrigger>
            <TabsTrigger value="services" className="gap-1 text-xs sm:text-sm">
              <Sparkles className="h-4 w-4" />
              <span className="hidden sm:inline">الخدمات</span> ({services.length})
            </TabsTrigger>
          </TabsList>

          <TabsContent value="courses" className="mt-4">
            {courses.length === 0 ? (
              <Card className="p-8 text-center">
                <BookOpen className="h-12 w-12 text-muted-foreground mx-auto mb-3" />
                <p className="text-muted-foreground">لا توجد دورات حالياً</p>
              </Card>
            ) : (
              <div className="grid gap-4">
                {courses.map((course) => (
                  <Link key={course.id} to={`/courses/${course.id}`}>
                    <Card className="p-4 hover:shadow-md transition-shadow">
                      <div className="flex gap-4">
                        <div className="w-16 h-16 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                          <BookOpen className="h-6 w-6 text-primary" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <h3 className="font-semibold text-foreground line-clamp-1">
                            {course.title}
                          </h3>
                          <p className="text-sm text-muted-foreground line-clamp-2 mt-1">
                            {course.description}
                          </p>
                          <div className="flex gap-2 mt-2">
                            <Badge variant="outline" className="text-xs">
                              {categoryLabels[course.category] || course.category}
                            </Badge>
                            <Badge variant="outline" className="text-xs">
                              {course.depth_level === "beginner" ? "مبتدئ" : 
                               course.depth_level === "intermediate" ? "متوسط" : "متقدم"}
                            </Badge>
                          </div>
                        </div>
                        <ExternalLink className="h-5 w-5 text-muted-foreground shrink-0" />
                      </div>
                    </Card>
                  </Link>
                ))}
              </div>
            )}
          </TabsContent>

          <TabsContent value="workshops" className="mt-4">
            {workshops.length === 0 ? (
              <Card className="p-8 text-center">
                <Video className="h-12 w-12 text-muted-foreground mx-auto mb-3" />
                <p className="text-muted-foreground">لا توجد ورش حالياً</p>
              </Card>
            ) : (
              <div className="grid gap-4">
                {workshops.map((workshop) => {
                  const isPast = new Date(workshop.scheduled_at) < new Date();
                  return (
                    <Link key={workshop.id} to={`/workshops/${workshop.id}`}>
                      <Card className="p-4 hover:shadow-md transition-shadow">
                        <div className="flex gap-4">
                          <div className="w-16 h-16 rounded-lg bg-accent/10 flex items-center justify-center shrink-0 overflow-hidden">
                            {workshop.image_url ? (
                              <img 
                                src={workshop.image_url} 
                                alt={workshop.title}
                                className="w-full h-full object-cover"
                              />
                            ) : (
                              <Video className="h-6 w-6 text-accent" />
                            )}
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2">
                              <h3 className="font-semibold text-foreground line-clamp-1">
                                {workshop.title}
                              </h3>
                              {isPast && (
                                <Badge variant="secondary" className="text-xs">منتهية</Badge>
                              )}
                              {workshop.is_live && (
                                <Badge className="bg-destructive text-xs animate-pulse">مباشر</Badge>
                              )}
                            </div>
                            <p className="text-sm text-muted-foreground line-clamp-1 mt-1">
                              {workshop.description}
                            </p>
                            <div className="flex items-center gap-2 mt-2 text-xs text-muted-foreground">
                              <Calendar className="h-3 w-3" />
                              {new Date(workshop.scheduled_at).toLocaleDateString("ar", {
                                weekday: "long",
                                year: "numeric",
                                month: "long",
                                day: "numeric",
                                hour: "2-digit",
                                minute: "2-digit"
                              })}
                            </div>
                          </div>
                          <ExternalLink className="h-5 w-5 text-muted-foreground shrink-0" />
                        </div>
                      </Card>
                    </Link>
                  );
                })}
              </div>
            )}
          </TabsContent>

          <TabsContent value="services" className="mt-4">
            {services.length === 0 ? (
              <Card className="p-8 text-center">
                <Sparkles className="h-12 w-12 text-muted-foreground mx-auto mb-3" />
                <p className="text-muted-foreground">لا توجد خدمات متاحة حالياً</p>
              </Card>
            ) : (
              <div className="grid gap-4">
                {services.map((service) => (
                  <Card key={service.id} className="p-4">
                    <div className="flex gap-4">
                      <div className="w-12 h-12 rounded-lg bg-accent/10 flex items-center justify-center shrink-0">
                        <Sparkles className="h-5 w-5 text-accent" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <h3 className="font-semibold text-foreground">
                          {service.title}
                        </h3>
                        {service.description && (
                          <p className="text-sm text-muted-foreground line-clamp-2 mt-1">
                            {service.description}
                          </p>
                        )}
                        <div className="flex items-center gap-4 mt-2 text-xs text-muted-foreground">
                          <span className="flex items-center gap-1">
                            <Clock className="h-3 w-3" />
                            {service.duration_minutes} دقيقة
                          </span>
                          <span className="flex items-center gap-1">
                            <DollarSign className="h-3 w-3" />
                            {service.price === 0 ? "مجاني" : `$${service.price}`}
                          </span>
                          <Badge variant="outline" className="text-xs">
                            {serviceTypeLabels[service.service_type] || service.service_type}
                          </Badge>
                        </div>
                      </div>
                      {currentUserId && currentUserId !== id ? (
                        <ServiceBookingDialog 
                          service={{
                            ...service,
                            trainer_id: id!,
                          }}
                          trainerName={profile?.full_name || "المدرب"}
                        >
                          <Button size="sm">
                            احجز الآن
                          </Button>
                        </ServiceBookingDialog>
                      ) : (
                        <Button size="sm" variant="outline" disabled>
                          احجز الآن
                        </Button>
                      )}
                    </div>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>
        </Tabs>
      </div>
    </AppLayout>
  );
};

export default TrainerProfile;

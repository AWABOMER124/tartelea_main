import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useSubscription } from "@/hooks/useSubscription";
import AppLayout from "@/components/layout/AppLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  ArrowRight,
  Video,
  Calendar,
  Clock,
  Users,
  Radio,
  Play,
  Film,
  Loader2,
  Crown,
} from "lucide-react";
import { format, ar } from "@/lib/date-utils";
import PriceDisplay from "@/components/subscription/PriceDisplay";

interface Workshop {
  id: string;
  title: string;
  description: string | null;
  host_id: string;
  host_name?: string;
  category: string;
  scheduled_at: string;
  duration_minutes: number;
  is_live: boolean;
  is_approved: boolean;
  price: number;
  max_participants: number;
  participant_count?: number;
  image_url: string | null;
}

interface Recording {
  id: string;
  recording_url: string | null;
  duration_seconds: number | null;
  recorded_at: string | null;
  cloudflare_uid: string | null;
}

const categoryLabels: Record<string, string> = {
  quran: "القرآن",
  values: "القيم",
  community: "المجتمع",
  sudan_awareness: "الوعي السوداني",
  arab_awareness: "الوعي العربي",
  islamic_awareness: "الوعي الإسلامي",
};

const WorkshopDetail = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { toast } = useToast();
  const { hasSubscription } = useSubscription();

  const [workshop, setWorkshop] = useState<Workshop | null>(null);
  const [recordings, setRecordings] = useState<Recording[]>([]);
  const [loading, setLoading] = useState(true);
  const [isJoined, setIsJoined] = useState(false);
  const [joiningLoading, setJoiningLoading] = useState(false);
  const [userId, setUserId] = useState<string | null>(null);

  useEffect(() => {
    checkUser();
  }, []);

  useEffect(() => {
    if (id) {
      fetchWorkshopDetails();
      fetchRecordings();
    }
  }, [id]);

  useEffect(() => {
    if (userId && id) {
      checkParticipation();
    }
  }, [userId, id]);

  const checkUser = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    setUserId(user?.id || null);
  };

  const fetchWorkshopDetails = async () => {
    if (!id) return;

    const { data: workshopData, error } = await supabase
      .from("workshops")
      .select("*")
      .eq("id", id)
      .single();

    if (error) {
      toast({
        title: "خطأ",
        description: "فشل تحميل تفاصيل الورشة",
        variant: "destructive",
      });
      setLoading(false);
      return;
    }

    const { data: profileData } = await supabase
      .from("profiles")
      .select("full_name")
      .eq("id", workshopData.host_id)
      .single();

    const { count } = await supabase
      .from("workshop_participants")
      .select("*", { count: "exact", head: true })
      .eq("workshop_id", id);

    setWorkshop({
      ...workshopData,
      host_name: profileData?.full_name || "مدرب",
      participant_count: count || 0,
    });
    setLoading(false);
  };

  const fetchRecordings = async () => {
    if (!id) return;

    const { data } = await supabase
      .from("workshop_recordings")
      .select("id, recording_url, duration_seconds, recorded_at, cloudflare_uid")
      .eq("workshop_id", id)
      .eq("is_available", true)
      .order("recorded_at", { ascending: false });

    if (data) {
      setRecordings(data);
    }
  };

  const checkParticipation = async () => {
    if (!userId || !id) return;

    const { data } = await supabase
      .from("workshop_participants")
      .select("id")
      .eq("workshop_id", id)
      .eq("user_id", userId)
      .single();

    setIsJoined(!!data);
  };

  const handleJoin = async () => {
    if (!userId) {
      toast({
        title: "تنبيه",
        description: "يجب تسجيل الدخول للانضمام",
        variant: "destructive",
      });
      return;
    }

    if (!workshop) return;

    if (workshop.price > 0 && !hasSubscription) {
      toast({
        title: "ورشة مدفوعة",
        description: "يجب الاشتراك الشهري للانضمام لهذه الورشة",
        variant: "destructive",
      });
      navigate("/subscription");
      return;
    }

    setJoiningLoading(true);

    if (isJoined) {
      const { error } = await supabase
        .from("workshop_participants")
        .delete()
        .eq("workshop_id", id)
        .eq("user_id", userId);

      if (!error) {
        setIsJoined(false);
        toast({ title: "تم", description: "تم إلغاء مشاركتك" });
        fetchWorkshopDetails();
      }
    } else {
      const { error } = await supabase
        .from("workshop_participants")
        .insert({ workshop_id: id, user_id: userId });

      if (!error) {
        setIsJoined(true);
        toast({ title: "تم بنجاح", description: "تم تسجيلك في الورشة" });
        fetchWorkshopDetails();
      }
    }

    setJoiningLoading(false);
  };

  const formatDuration = (seconds: number | null) => {
    if (!seconds) return "--:--";
    const hours = Math.floor(seconds / 3600);
    const mins = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    if (hours > 0) {
      return `${hours}:${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
    }
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

  if (loading) {
    return (
      <AppLayout>
        <div className="p-4 space-y-4" dir="rtl">
          <Skeleton className="h-10 w-32" />
          <Skeleton className="h-56 w-full rounded-xl" />
          <Skeleton className="h-32 w-full" />
        </div>
      </AppLayout>
    );
  }

  if (!workshop) {
    return (
      <AppLayout>
        <div className="p-4 text-center" dir="rtl">
          <p className="text-muted-foreground">الورشة غير موجودة</p>
          <Button onClick={() => navigate("/workshops")} className="mt-4">
            العودة للورش
          </Button>
        </div>
      </AppLayout>
    );
  }

  const scheduledDate = new Date(workshop.scheduled_at);
  const isPast = scheduledDate < new Date();
  const discountedPrice = hasSubscription && workshop.price > 0
    ? workshop.price * 0.75
    : workshop.price;

  return (
    <AppLayout>
      <div className="pb-24" dir="rtl">
        {/* Back Button */}
        <div className="p-4">
          <Button variant="ghost" size="sm" onClick={() => navigate(-1)} className="gap-2">
            <ArrowRight className="h-4 w-4" />
            رجوع
          </Button>
        </div>

        {/* Workshop Image */}
        {workshop.image_url ? (
          <div className="px-4">
            <div className="relative rounded-xl overflow-hidden aspect-video">
              <img
                src={workshop.image_url}
                alt={workshop.title}
                className="w-full h-full object-cover"
              />
              {workshop.is_live && (
                <div className="absolute top-3 right-3">
                  <Badge variant="destructive" className="gap-1 text-sm">
                    <Radio className="h-3 w-3 animate-pulse" />
                    مباشر الآن
                  </Badge>
                </div>
              )}
              {workshop.price > 0 && (
                <div className="absolute top-3 left-3">
                  <Badge className="gap-1 bg-amber-500 text-white border-0">
                    <Crown className="h-3 w-3" />
                    مدفوعة
                  </Badge>
                </div>
              )}
            </div>
          </div>
        ) : (
          <div className="px-4">
            <div className="relative rounded-xl overflow-hidden aspect-video bg-gradient-to-br from-primary/20 to-primary/5 flex items-center justify-center">
              <Video className="h-16 w-16 text-primary/40" />
              {workshop.is_live && (
                <div className="absolute top-3 right-3">
                  <Badge variant="destructive" className="gap-1 text-sm">
                    <Radio className="h-3 w-3 animate-pulse" />
                    مباشر الآن
                  </Badge>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Workshop Info */}
        <div className="p-4 space-y-5">
          <div className="space-y-3">
            <h1 className="text-2xl font-display font-bold text-foreground">
              {workshop.title}
            </h1>
            <div className="flex flex-wrap gap-2">
              <Badge variant="secondary">{categoryLabels[workshop.category]}</Badge>
              <PriceDisplay price={workshop.price} size="sm" />
              {hasSubscription && workshop.price > 0 && (
                <Badge variant="outline" className="gap-1 text-xs border-green-500 text-green-600">
                  خصم 25% للمشتركين
                </Badge>
              )}
            </div>
          </div>

          {workshop.description && (
            <p className="text-muted-foreground leading-relaxed">{workshop.description}</p>
          )}

          {/* Details Grid */}
          <div className="grid grid-cols-2 gap-3">
            <Card>
              <CardContent className="p-3 flex items-center gap-2">
                <Calendar className="h-5 w-5 text-primary" />
                <div>
                  <p className="text-xs text-muted-foreground">التاريخ</p>
                  <p className="text-sm font-medium">{format(scheduledDate, "dd MMMM yyyy", { locale: ar })}</p>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-3 flex items-center gap-2">
                <Clock className="h-5 w-5 text-primary" />
                <div>
                  <p className="text-xs text-muted-foreground">الوقت</p>
                  <p className="text-sm font-medium">{format(scheduledDate, "HH:mm")}</p>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-3 flex items-center gap-2">
                <Users className="h-5 w-5 text-primary" />
                <div>
                  <p className="text-xs text-muted-foreground">المشاركون</p>
                  <p className="text-sm font-medium">{workshop.participant_count}/{workshop.max_participants}</p>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-3 flex items-center gap-2">
                <Clock className="h-5 w-5 text-primary" />
                <div>
                  <p className="text-xs text-muted-foreground">المدة</p>
                  <p className="text-sm font-medium">{workshop.duration_minutes} دقيقة</p>
                </div>
              </CardContent>
            </Card>
          </div>

          <p className="text-sm text-muted-foreground">
            المدرب: <span className="font-medium text-foreground">{workshop.host_name}</span>
          </p>

          {/* Price & Join Section */}
          {workshop.price > 0 && !hasSubscription && (
            <Card className="border-amber-200 bg-amber-50/50 dark:bg-amber-950/20 dark:border-amber-800">
              <CardContent className="p-4 text-center space-y-3">
                <Crown className="h-8 w-8 text-amber-500 mx-auto" />
                <div>
                  <p className="font-semibold text-foreground">ورشة مدفوعة</p>
                  <p className="text-sm text-muted-foreground">
                    اشترك شهرياً للحصول على خصم 25% والوصول لجميع الورش المدفوعة
                  </p>
                </div>
                <Button onClick={() => navigate("/subscription")} variant="default" className="w-full">
                  اشترك الآن - ${workshop.price}
                </Button>
              </CardContent>
            </Card>
          )}

          {/* Action Button */}
          <div className="flex gap-2">
            {workshop.is_live && isJoined ? (
              <Button
                onClick={() => navigate(`/workshops/${id}/live`)}
                className="flex-1 gap-2 h-12 text-base"
                variant="destructive"
              >
                <Radio className="h-5 w-5" />
                دخول البث المباشر
              </Button>
            ) : !isPast ? (
              <Button
                onClick={handleJoin}
                disabled={joiningLoading}
                variant={isJoined ? "outline" : "default"}
                className="flex-1 gap-2 h-12 text-base"
              >
                {joiningLoading ? (
                  <Loader2 className="h-5 w-5 animate-spin" />
                ) : isJoined ? (
                  "إلغاء المشاركة"
                ) : workshop.price > 0 ? (
                  hasSubscription
                    ? `سجل الآن - $${discountedPrice.toFixed(2)}`
                    : `سجل الآن - $${workshop.price}`
                ) : (
                  "سجل الآن - مجاناً"
                )}
              </Button>
            ) : (
              <Button variant="outline" disabled className="flex-1 h-12">
                انتهت الورشة
              </Button>
            )}
          </div>

          {/* Recordings Section */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="flex items-center gap-2 text-lg">
                <Film className="h-5 w-5 text-primary" />
                تسجيلات الورشة
              </CardTitle>
            </CardHeader>
            <CardContent className="p-4 pt-0">
              {recordings.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <Film className="h-12 w-12 mx-auto mb-2 opacity-50" />
                  <p>لا توجد تسجيلات متاحة حالياً</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {recordings.map((recording, index) => (
                    <div
                      key={recording.id}
                      onClick={() =>
                        navigate(`/workshop-recording/${recording.id}`, {
                          state: { recording: { ...recording, workshop } },
                        })
                      }
                      className="flex items-center gap-3 p-3 rounded-lg bg-muted/50 hover:bg-muted cursor-pointer transition-colors"
                    >
                      <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center">
                        <Play className="h-5 w-5 text-primary" />
                      </div>
                      <div className="flex-1">
                        <p className="font-medium text-foreground">
                          التسجيل {index + 1}
                        </p>
                        {recording.recorded_at && (
                          <p className="text-xs text-muted-foreground">
                            {format(new Date(recording.recorded_at), "dd MMM yyyy - HH:mm", {
                              locale: ar,
                            })}
                          </p>
                        )}
                      </div>
                      {recording.duration_seconds && (
                        <Badge variant="secondary">
                          {formatDuration(recording.duration_seconds)}
                        </Badge>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </AppLayout>
  );
};

export default WorkshopDetail;

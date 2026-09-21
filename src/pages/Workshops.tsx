import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import { useSubscription } from "@/hooks/useSubscription";
import { useUserRole } from "@/hooks/useUserRole";
import { useWorkshops, useUserWorkshopParticipations, useJoinWorkshop, useLeaveWorkshop, type Workshop } from "@/hooks/useWorkshops";
import AppLayout from "@/components/layout/AppLayout";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import FilterChip from "@/components/ui/FilterChip";
import PriceDisplay from "@/components/subscription/PriceDisplay";
import CreateWorkshopDialog from "@/components/workshops/CreateWorkshopDialog";
import {
  Video,
  Users,
  Loader2,
  Calendar,
  Clock,
  Plus,
  Radio,
  Film,
} from "lucide-react";
import { format, ar } from "@/lib/date-utils";
import { useQueryClient } from "@tanstack/react-query";
import PageMeta from "@/components/seo/PageMeta";
import { DiscoveryHeader, DiscoveryPage, EmptyState, FilterGroup, FilterPanel, ResultsHeading } from "@/components/layout/DiscoveryPage";

const categoryLabels: Record<string, string> = {
  quran: "القرآن",
  values: "القيم",
  community: "المجتمع",
  sudan_awareness: "الوعي السوداني",
  arab_awareness: "الوعي العربي",
  islamic_awareness: "الوعي الإسلامي",
};

const statusFilters = [
  { value: "all", label: "الكل" },
  { value: "upcoming", label: "القادمة" },
  { value: "live", label: "مباشر الآن" },
];

const WorkshopCardSkeleton = () => (
  <Card className="overflow-hidden">
    <CardContent className="p-4">
      <div className="flex gap-4">
        <Skeleton className="w-16 h-16 rounded-xl flex-shrink-0" />
        <div className="flex-1 space-y-2">
          <Skeleton className="h-5 w-3/4" />
          <Skeleton className="h-4 w-full" />
          <div className="flex gap-2">
            <Skeleton className="h-5 w-16 rounded-full" />
            <Skeleton className="h-5 w-14 rounded-full" />
          </div>
          <div className="flex gap-3">
            <Skeleton className="h-4 w-16" />
            <Skeleton className="h-4 w-12" />
            <Skeleton className="h-4 w-14" />
          </div>
        </div>
      </div>
      <Skeleton className="h-10 w-full mt-4 rounded-md" />
    </CardContent>
  </Card>
);

const Workshops = () => {
  const { toast } = useToast();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { user } = useAuth();
  const { hasSubscription } = useSubscription();
  const { role } = useUserRole();
  const [selectedStatus, setSelectedStatus] = useState("all");
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [joiningId, setJoiningId] = useState<string | null>(null);
  const userId = user?.id || null;

  const { data: workshops, isLoading: workshopsLoading } = useWorkshops();
  const { data: participations = [] } = useUserWorkshopParticipations(userId);
  const joinMutation = useJoinWorkshop();
  const leaveMutation = useLeaveWorkshop();

  const canCreate = role === "trainer" || role === "moderator" || role === "admin";

  const handleJoin = async (workshop: Workshop) => {
    if (!userId) {
      toast({
        title: "تنبيه",
        description: "يجب تسجيل الدخول للانضمام",
        variant: "destructive",
      });
      return;
    }

    if (workshop.price > 0 && !hasSubscription) {
      toast({
        title: "ورشة مدفوعة",
        description: "يجب الاشتراك الشهري أو الدفع للانضمام",
        variant: "destructive",
      });
      return;
    }

    setJoiningId(workshop.id);
    const isJoined = participations.includes(workshop.id);

    try {
      if (isJoined) {
        await leaveMutation.mutateAsync({ workshopId: workshop.id, userId });
        toast({ title: "تم", description: "تم إلغاء مشاركتك" });
      } else {
        await joinMutation.mutateAsync({ workshopId: workshop.id, userId });
        toast({ title: "تم بنجاح", description: "تم تسجيلك في الورشة" });
      }
    } catch (error) {
      toast({
        title: "خطأ",
        description: isJoined ? "فشل إلغاء المشاركة" : "فشل الانضمام",
        variant: "destructive",
      });
    } finally {
      setJoiningId(null);
    }
  };

  const handleEnterLive = (workshopId: string) => {
    navigate(`/workshops/${workshopId}/live`);
  };

  const handleWorkshopCreated = () => {
    queryClient.invalidateQueries({ queryKey: ["workshops"] });
  };

  const filteredWorkshops = workshops?.filter((workshop) => {
    if (selectedStatus === "live" && !workshop.is_live) return false;
    if (selectedStatus === "upcoming" && workshop.is_live) return false;
    return true;
  }) || [];

  return (
    <AppLayout>
      <PageMeta title="الورش" description="ورش المدرسة الترتيلية المباشرة والقادمة." path="/workshops" />
      <DiscoveryPage>
        <DiscoveryHeader eyebrow="تعلّم بالمشاركة" title="الورش التفاعلية" description="لقاءات تطبيقية مباشرة مع مدرّبي المدرسة، مرتّبة لتعرف ما يحدث الآن وما يأتي لاحقاً." icon={Video} actions={<>{canCreate && <Button onClick={() => setShowCreateDialog(true)} className="gap-2"><Plus className="h-4 w-4" />إنشاء ورشة</Button>}<Button variant="outline" onClick={() => navigate("/workshop-recordings")} className="gap-2"><Film className="h-4 w-4" />التسجيلات</Button></>} />

        <FilterPanel><FilterGroup label="الحالة">{statusFilters.map((filter) => <FilterChip key={filter.value} label={filter.label} isActive={selectedStatus === filter.value} onClick={() => setSelectedStatus(filter.value)} />)}</FilterGroup></FilterPanel>

        <ResultsHeading count={filteredWorkshops.length} label="الورش المتاحة" />

        {workshopsLoading ? (
          <div className="grid gap-3 sm:grid-cols-2">
            {[1, 2, 3, 4].map((i) => (
              <WorkshopCardSkeleton key={i} />
            ))}
          </div>
        ) : filteredWorkshops.length === 0 ? (
          <EmptyState icon={Video} title="لا توجد ورش بهذه الحالة" description="اختر حالة أخرى أو عد لاحقاً لمتابعة اللقاءات الجديدة." />
        ) : (
          <div className="grid gap-3 sm:grid-cols-2">
            {filteredWorkshops.map((workshop) => {
              const isJoined = participations.includes(workshop.id);
              const scheduledDate = new Date(workshop.scheduled_at);

              return (
                <Card 
                  key={workshop.id} 
                  className="flex h-full cursor-pointer flex-col overflow-hidden rounded-2xl border-border shadow-sm transition-colors hover:border-primary/25"
                  onClick={() => navigate(`/workshops/${workshop.id}`)}
                >
                  <CardContent className="flex h-full flex-col p-5">
                    <div className="flex gap-4">
                      <div className="relative flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-xl bg-primary/10">
                        <Video className="h-6 w-6 text-primary" />
                        {workshop.is_live && (
                          <div className="absolute -top-1 -right-1 bg-destructive rounded-full p-1">
                            <Radio className="h-3 w-3 text-destructive-foreground animate-pulse" />
                          </div>
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-2">
                          <h3 className="font-semibold text-foreground line-clamp-1">
                            {workshop.title}
                          </h3>
                          {workshop.is_live && (
                            <Badge variant="destructive" className="text-xs shrink-0">
                              مباشر
                            </Badge>
                          )}
                        </div>
                        {workshop.description && (
                          <p className="text-sm text-muted-foreground line-clamp-2 mt-1">
                            {workshop.description}
                          </p>
                        )}
                        <div className="flex flex-wrap gap-2 mt-2">
                          <Badge variant="secondary" className="text-xs">
                            {categoryLabels[workshop.category]}
                          </Badge>
                          <PriceDisplay price={workshop.price} size="sm" />
                        </div>
                        <div className="mt-3 flex flex-wrap items-center gap-3 text-xs text-muted-foreground">
                          <span className="flex items-center gap-1">
                            <Calendar className="h-4 w-4" />
                            {format(scheduledDate, "dd MMM", { locale: ar })}
                          </span>
                          <span className="flex items-center gap-1">
                            <Clock className="h-4 w-4" />
                            {format(scheduledDate, "HH:mm")}
                          </span>
                          <span className="flex items-center gap-1">
                            <Users className="h-4 w-4" />
                            {workshop.participant_count}/{workshop.max_participants}
                          </span>
                        </div>
                        <p className="text-sm text-muted-foreground mt-1">
                          المدرب: {workshop.host_name}
                        </p>
                      </div>
                    </div>
                    <div className="mt-auto flex gap-2 pt-4" onClick={(e) => e.stopPropagation()}>
                      {workshop.is_live && isJoined ? (
                        <Button
                          onClick={() => handleEnterLive(workshop.id)}
                          className="flex-1 gap-2"
                          variant="destructive"
                        >
                          <Radio className="h-4 w-4" />
                          دخول البث
                        </Button>
                      ) : (
                        <Button
                          onClick={() => handleJoin(workshop)}
                          disabled={joiningId === workshop.id}
                          variant={isJoined ? "outline" : "default"}
                          className="flex-1 gap-2"
                        >
                          {joiningId === workshop.id ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                          ) : isJoined ? (
                            "إلغاء المشاركة"
                          ) : (
                            "سجل الآن"
                          )}
                        </Button>
                      )}
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
      </DiscoveryPage>

      <CreateWorkshopDialog
        open={showCreateDialog}
        onOpenChange={setShowCreateDialog}
        onSuccess={handleWorkshopCreated}
      />
    </AppLayout>
  );
};

export default Workshops;

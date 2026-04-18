/**
 * STEP 3 official rooms page:
 * Rooms/sessions are now backend-owned. This screen must not read `rooms`,
 * `room_participants`, or `room_roles` directly from Supabase.
 */
import { useCallback, useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useBackendEntitlements } from "@/hooks/useBackendEntitlements";
import { useToast } from "@/hooks/use-toast";
import { useUserRole } from "@/hooks/useUserRole";
import AppLayout from "@/components/layout/AppLayout";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import FilterChip from "@/components/ui/FilterChip";
import PriceDisplay from "@/components/subscription/PriceDisplay";
import CreateRoomDialog from "@/components/rooms/CreateRoomDialog";
import {
  joinBackendSession,
  leaveBackendSession,
  listBackendSessions,
  type BackendSessionSummaryItem,
} from "@/lib/backendSessions";
import {
  Archive,
  Calendar,
  Clock,
  Globe,
  Headphones,
  Loader2,
  Lock,
  Mic,
  Plus,
  Radio,
  Users,
} from "lucide-react";
import { format, ar } from "@/lib/date-utils";

interface RoomCardModel {
  id: string;
  title: string;
  description: string | null;
  hostId: string;
  hostName: string;
  category: string;
  scheduledAt: string;
  durationMinutes: number | null;
  isLive: boolean;
  price: number;
  maxParticipants: number;
  participantCount: number;
  visibility: "public" | "restricted";
  imageUrl: string | null;
  speakerNames: string[];
  isRegistered: boolean;
  canJoin: boolean;
  denialReason?: string | null;
}

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

const accessMessages: Record<string, string> = {
  AUTH_REQUIRED: "سجّل الدخول أولًا للانضمام إلى الجلسة.",
  SESSION_NOT_APPROVED: "هذه الجلسة ما زالت بانتظار المراجعة.",
  SESSION_ENDED: "انتهت هذه الجلسة بالفعل.",
  SESSION_FULL: "وصلت الجلسة إلى الحد الأقصى من الحضور.",
  SUBSCRIPTION_REQUIRED: "هذه الجلسة مقيّدة وفق سياسة الوصول الحالية.",
};

const mapSessionItem = (item: BackendSessionSummaryItem): RoomCardModel => ({
  id: item.session.id,
  title: item.session.title,
  description: item.session.description ?? null,
  hostId: item.room.host_id,
  hostName: item.room.host.name,
  category: item.session.category ?? "community",
  scheduledAt: item.session.scheduled_at,
  durationMinutes: null,
  isLive: item.session.status === "live",
  price: Number(item.session.price) || 0,
  maxParticipants: Number(item.room.max_participants) || 50,
  participantCount: Number(item.room.participant_count) || 0,
  visibility: item.session.visibility,
  imageUrl: item.session.image_url ?? null,
  speakerNames: item.room.speakers.map((speaker) => speaker.name),
  isRegistered: Boolean(item.access.is_registered),
  canJoin: Boolean(item.access.canJoin),
  denialReason: item.access.denialReason ?? null,
});

const Rooms = () => {
  const { toast } = useToast();
  const navigate = useNavigate();
  const { access } = useBackendEntitlements();
  const { isTrainer, isModerator, isAdmin, userId } = useUserRole();
  const [rooms, setRooms] = useState<RoomCardModel[]>([]);
  const [loading, setLoading] = useState(true);
  const [joiningId, setJoiningId] = useState<string | null>(null);
  const [selectedStatus, setSelectedStatus] = useState("all");
  const [showCreateDialog, setShowCreateDialog] = useState(false);

  const canCreate = access.canCreateRoom || isTrainer || isModerator || isAdmin;

  const fetchRooms = useCallback(async () => {
    try {
      setLoading(true);
      const payload = await listBackendSessions();
      setRooms(payload.items.map(mapSessionItem));
    } catch (error) {
      toast({
        title: "خطأ",
        description:
          error instanceof Error ? error.message : "تعذر تحميل الجلسات الصوتية.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    void fetchRooms();
    const interval = window.setInterval(() => {
      void fetchRooms();
    }, 15000);

    return () => {
      window.clearInterval(interval);
    };
  }, [fetchRooms]);

  const handleJoin = async (room: RoomCardModel) => {
    if (!userId) {
      toast({
        title: "تنبيه",
        description: "سجّل الدخول أولًا للانضمام إلى الجلسة.",
        variant: "destructive",
      });
      navigate("/auth");
      return;
    }

    if (!room.canJoin && !room.isRegistered) {
      toast({
        title: "تعذر الانضمام",
        description:
          (room.denialReason && accessMessages[room.denialReason]) ||
          "لا يمكنك الانضمام إلى هذه الجلسة الآن.",
        variant: "destructive",
      });
      return;
    }

    try {
      setJoiningId(room.id);

      if (room.isRegistered && !room.isLive) {
        await leaveBackendSession(room.id);
        toast({
          title: "تم",
          description: "تم إلغاء تسجيلك من الجلسة.",
        });
      } else {
        await joinBackendSession(room.id);
        toast({
          title: "تم بنجاح",
          description: room.isLive
            ? "تم تجهيز دخولك إلى الجلسة المباشرة."
            : "تم تسجيلك في الجلسة بنجاح.",
        });
      }

      await fetchRooms();
    } catch (error) {
      toast({
        title: "خطأ",
        description:
          error instanceof Error ? error.message : "تعذر تحديث حالة الانضمام.",
        variant: "destructive",
      });
    } finally {
      setJoiningId(null);
    }
  };

  const handleEnterLive = async (room: RoomCardModel) => {
    if (!userId) {
      toast({
        title: "تنبيه",
        description: "سجّل الدخول أولًا للمتابعة.",
        variant: "destructive",
      });
      navigate("/auth");
      return;
    }

    try {
      if (!room.isRegistered) {
        await joinBackendSession(room.id);
      }
      navigate(`/rooms/${room.id}/live`);
    } catch (error) {
      toast({
        title: "تعذر الدخول",
        description:
          error instanceof Error ? error.message : "تعذر تجهيز دخول الجلسة المباشرة.",
        variant: "destructive",
      });
    }
  };

  const liveRooms = useMemo(() => rooms.filter((room) => room.isLive), [rooms]);

  const filteredRooms = useMemo(
    () =>
      rooms.filter((room) => {
        if (selectedStatus === "live") {
          return room.isLive;
        }
        if (selectedStatus === "upcoming") {
          return !room.isLive;
        }
        return true;
      }),
    [rooms, selectedStatus],
  );

  return (
    <AppLayout>
      <div className="px-4 py-6 space-y-6">
        <div className="text-center space-y-2">
          <div className="w-14 h-14 mx-auto bg-primary/10 rounded-2xl flex items-center justify-center">
            <Headphones className="h-7 w-7 text-primary" />
          </div>
          <h1 className="text-2xl font-display font-bold text-foreground">
            الغرف الصوتية
          </h1>
          <p className="text-sm text-muted-foreground">
            جلسات صوتية تفاعلية تُدار من الباك إند بعقد موحّد للغرف والصلاحيات
          </p>
        </div>

        <div className="flex gap-2">
          {canCreate && (
            <Button onClick={() => setShowCreateDialog(true)} className="flex-1 gap-2">
              <Plus className="h-4 w-4" />
              إنشاء غرفة جديدة
            </Button>
          )}
          <Button
            variant="outline"
            onClick={() => navigate("/room-recordings")}
            className="gap-2"
          >
            <Archive className="h-4 w-4" />
            الأرشيف
          </Button>
        </div>

        {liveRooms.length > 0 && (
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <span className="h-2.5 w-2.5 rounded-full bg-green-500 animate-pulse" />
              <h2 className="text-sm font-bold text-foreground">يحدث الآن</h2>
            </div>

            <div className="space-y-3">
              {liveRooms.map((room) => (
                <Card
                  key={`live-${room.id}`}
                  className="overflow-hidden border-green-500/30 bg-gradient-to-br from-card to-green-50/30 dark:to-green-950/10 cursor-pointer hover:shadow-md transition-shadow"
                  onClick={() => void handleEnterLive(room)}
                >
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between gap-2 mb-2">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <Badge variant="secondary" className="text-[10px] h-4 px-1.5">
                            {categoryLabels[room.category] || room.category}
                          </Badge>
                          <Badge
                            variant="destructive"
                            className="text-[10px] h-4 px-1.5 gap-0.5"
                          >
                            <Radio className="h-2 w-2 animate-pulse" />
                            مباشر
                          </Badge>
                        </div>
                        <h3 className="font-bold text-foreground line-clamp-1">
                          {room.title}
                        </h3>
                        {room.description && (
                          <p className="text-xs text-muted-foreground line-clamp-1 mt-0.5">
                            {room.description}
                          </p>
                        )}
                      </div>
                    </div>

                    {room.speakerNames.length > 0 && (
                      <div className="flex items-center gap-2 mt-2 mb-2">
                        <div className="flex -space-x-2 rtl:space-x-reverse">
                          {room.speakerNames.slice(0, 3).map((name, index) => (
                            <Avatar key={`${room.id}-${index}`} className="h-7 w-7 border-2 border-card">
                              <AvatarFallback className="text-[10px] bg-primary/10 text-primary font-bold">
                                {name.charAt(0)}
                              </AvatarFallback>
                            </Avatar>
                          ))}
                        </div>
                        <div className="flex flex-col min-w-0">
                          {room.speakerNames.slice(0, 2).map((name) => (
                            <span
                              key={`${room.id}-${name}`}
                              className="text-[11px] text-foreground font-medium truncate flex items-center gap-1"
                            >
                              {name}
                              <Mic className="h-2.5 w-2.5 text-muted-foreground" />
                            </span>
                          ))}
                          {room.speakerNames.length > 2 && (
                            <span className="text-[10px] text-muted-foreground">
                              +{room.speakerNames.length - 2} آخرين
                            </span>
                          )}
                        </div>
                      </div>
                    )}

                    <div className="flex items-center justify-between mt-2">
                      <span className="text-xs text-muted-foreground flex items-center gap-1">
                        <Users className="h-3 w-3" />
                        {room.participantCount} مشارك
                      </span>
                      {room.visibility === "restricted" && (
                        <Badge
                          variant="outline"
                          className="text-[10px] gap-0.5 border-amber-500/50 text-amber-600"
                        >
                          <Lock className="h-2.5 w-2.5" />
                          وصول مقيّد
                        </Badge>
                      )}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        )}

        <div className="flex gap-2 overflow-x-auto pb-2">
          {statusFilters.map((filter) => (
            <FilterChip
              key={filter.value}
              label={filter.label}
              isActive={selectedStatus === filter.value}
              onClick={() => setSelectedStatus(filter.value)}
            />
          ))}
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-6 w-6 animate-spin text-primary" />
          </div>
        ) : filteredRooms.length === 0 ? (
          <Card>
            <CardContent className="py-8 text-center">
              <Headphones className="h-12 w-12 mx-auto text-muted-foreground/50 mb-4" />
              <p className="text-muted-foreground">لا توجد جلسات صوتية متاحة حاليًا.</p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-3">
            {filteredRooms.map((room) => {
              const scheduledDate = new Date(room.scheduledAt);

              return (
                <Card key={room.id} className="overflow-hidden">
                  <CardContent className="p-4">
                    <div className="flex gap-3">
                      <div className="w-14 h-14 rounded-xl bg-primary/10 flex items-center justify-center flex-shrink-0 relative overflow-hidden">
                        {room.imageUrl ? (
                          <img
                            src={room.imageUrl}
                            alt={room.title}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <Headphones className="h-7 w-7 text-primary" />
                        )}

                        {room.isLive && (
                          <div className="absolute -top-1 -right-1 bg-green-500 rounded-full p-0.5 border-2 border-card">
                            <Radio className="h-2 w-2 text-white animate-pulse" />
                          </div>
                        )}
                      </div>

                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-2">
                          <h3 className="font-semibold text-foreground line-clamp-1 text-sm">
                            {room.title}
                          </h3>
                          {room.isLive && (
                            <Badge
                              variant="destructive"
                              className="text-[10px] shrink-0 h-4 px-1.5"
                            >
                              مباشر
                            </Badge>
                          )}
                        </div>

                        {room.description && (
                          <p className="text-xs text-muted-foreground line-clamp-2 mt-0.5">
                            {room.description}
                          </p>
                        )}

                        <div className="flex flex-wrap gap-1.5 mt-2">
                          <Badge variant="secondary" className="text-[10px] h-4 px-1.5">
                            {categoryLabels[room.category] || room.category}
                          </Badge>
                          {room.visibility === "restricted" ? (
                            <Badge
                              variant="outline"
                              className="text-[10px] gap-0.5 h-4 px-1.5 border-amber-500/50 text-amber-600"
                            >
                              <Lock className="h-2.5 w-2.5" />
                              وصول مقيّد
                            </Badge>
                          ) : (
                            <Badge
                              variant="outline"
                              className="text-[10px] gap-0.5 h-4 px-1.5"
                            >
                              <Globe className="h-2.5 w-2.5" />
                              عامة
                            </Badge>
                          )}
                          <PriceDisplay price={room.price} size="sm" />
                        </div>

                        <div className="flex items-center gap-3 mt-2 text-xs text-muted-foreground">
                          <span className="flex items-center gap-1">
                            <Calendar className="h-3 w-3" />
                            {format(scheduledDate, "dd MMM", { locale: ar })}
                          </span>
                          <span className="flex items-center gap-1">
                            <Clock className="h-3 w-3" />
                            {format(scheduledDate, "HH:mm")}
                          </span>
                          <span className="flex items-center gap-1">
                            <Users className="h-3 w-3" />
                            {room.participantCount}/{room.maxParticipants}
                          </span>
                        </div>

                        <p className="text-xs text-muted-foreground mt-1">
                          المضيف: {room.hostName}
                        </p>
                      </div>
                    </div>

                    <div className="flex gap-2 mt-3">
                      {room.isLive ? (
                        <Button
                          onClick={() => void handleEnterLive(room)}
                          className="flex-1 gap-2"
                          variant="destructive"
                          size="sm"
                        >
                          <Radio className="h-3.5 w-3.5" />
                          دخول البث
                        </Button>
                      ) : (
                        <>
                          {userId === room.hostId && (
                            <Button
                              onClick={() => void handleEnterLive(room)}
                              className="flex-1 gap-2"
                              size="sm"
                            >
                              <Radio className="h-3.5 w-3.5" />
                              دخول الغرفة
                            </Button>
                          )}
                          <Button
                            onClick={() => void handleJoin(room)}
                            disabled={joiningId === room.id}
                            variant={room.isRegistered ? "outline" : "default"}
                            size="sm"
                            className={userId === room.hostId ? "gap-2" : "flex-1 gap-2"}
                          >
                            {joiningId === room.id ? (
                              <Loader2 className="h-3.5 w-3.5 animate-spin" />
                            ) : room.isRegistered ? (
                              "إلغاء التسجيل"
                            ) : (
                              "سجل الآن"
                            )}
                          </Button>
                        </>
                      )}
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
      </div>

      <CreateRoomDialog
        open={showCreateDialog}
        onOpenChange={setShowCreateDialog}
        onSuccess={fetchRooms}
      />
    </AppLayout>
  );
};

export default Rooms;

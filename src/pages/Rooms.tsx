import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useSubscription } from "@/hooks/useSubscription";
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
  Headphones,
  Users,
  Loader2,
  Calendar,
  Clock,
  Plus,
  Radio,
  Lock,
  Globe,
  Archive,
  Mic,
} from "lucide-react";
import { format, ar } from "@/lib/date-utils";

interface Room {
  id: string;
  title: string;
  description: string | null;
  host_id: string;
  host_name?: string;
  host_avatar?: string | null;
  category: string;
  scheduled_at: string;
  duration_minutes: number;
  is_live: boolean;
  is_approved: boolean;
  price: number;
  max_participants: number;
  participant_count?: number;
  access_type: string;
  speaker_names?: string[];
  image_url?: string | null;
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

const Rooms = () => {
  const { toast } = useToast();
  const navigate = useNavigate();
  const { hasSubscription } = useSubscription();
  const { isTrainer, isModerator, isAdmin } = useUserRole();
  const [rooms, setRooms] = useState<Room[]>([]);
  const [participations, setParticipations] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [joiningId, setJoiningId] = useState<string | null>(null);
  const [selectedStatus, setSelectedStatus] = useState("all");
  const [userId, setUserId] = useState<string | null>(null);
  const [showCreateDialog, setShowCreateDialog] = useState(false);

  const canCreate = isTrainer || isModerator || isAdmin;

  useEffect(() => {
    checkUser();
    fetchRooms();

    const channel = supabase
      .channel('rooms-updates')
      .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'rooms' }, () => { fetchRooms(); })
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, []);

  useEffect(() => {
    if (userId) fetchParticipations();
  }, [userId]);

  const checkUser = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    setUserId(user?.id || null);
  };

  const fetchRooms = async () => {
    setLoading(true);
    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);
    const todayISO = todayStart.toISOString();

    const { data: roomsData, error } = await supabase
      .from("rooms")
      .select("*")
      .eq("is_approved", true)
      .is("ended_at", null)
      .or(`scheduled_at.gte.${todayISO},is_live.eq.true`)
      .order("scheduled_at", { ascending: true });

    if (error) {
      toast({ title: "خطأ", description: "فشل تحميل الغرف", variant: "destructive" });
      setLoading(false);
      return;
    }

    const hostIds = [...new Set(roomsData?.map((r) => r.host_id) || [])];
    const { data: profilesData } = await supabase.from("profiles").select("id, full_name, avatar_url").in("id", hostIds);
    const profilesMap = new Map(profilesData?.map((p) => [p.id, p]) || []);

    const { data: participantsData } = await supabase.from("room_participants").select("room_id");
    const counts: Record<string, number> = {};
    participantsData?.forEach((p) => { counts[p.room_id] = (counts[p.room_id] || 0) + 1; });

    // Fetch speakers for live rooms
    const liveRoomIds = roomsData?.filter((r) => r.is_live).map((r) => r.id) || [];
    let speakersMap = new Map<string, string[]>();
    if (liveRoomIds.length > 0) {
      const { data: rolesData } = await supabase
        .from("room_roles")
        .select("room_id, user_id, role")
        .in("room_id", liveRoomIds)
        .in("role", ["host", "co_host", "moderator", "speaker"]);

      if (rolesData) {
        const speakerUserIds = [...new Set(rolesData.map((r) => r.user_id))];
        const { data: speakerProfiles } = await supabase.from("profiles").select("id, full_name").in("id", speakerUserIds);
        const speakerNameMap = new Map(speakerProfiles?.map((p) => [p.id, p.full_name || "متحدث"]) || []);

        rolesData.forEach((r) => {
          const current = speakersMap.get(r.room_id) || [];
          const name = speakerNameMap.get(r.user_id);
          if (name && !current.includes(name)) current.push(name);
          speakersMap.set(r.room_id, current);
        });
      }
    }

    const roomsWithData = (roomsData || []).map((room) => {
      const profile = profilesMap.get(room.host_id);
      return {
        ...room,
        host_name: profile?.full_name || "مدرب",
        host_avatar: profile?.avatar_url || null,
        participant_count: counts[room.id] || 0,
        speaker_names: speakersMap.get(room.id) || [],
      };
    });

    setRooms(roomsWithData);
    setLoading(false);
  };

  const fetchParticipations = async () => {
    const { data } = await supabase.from("room_participants").select("room_id").eq("user_id", userId!);
    if (data) setParticipations(data.map((p) => p.room_id));
  };

  const handleJoin = async (room: Room) => {
    if (!userId) {
      toast({ title: "تنبيه", description: "يجب تسجيل الدخول للانضمام", variant: "destructive" });
      return;
    }
    if (room.access_type === "subscribers_only" && !hasSubscription) {
      toast({ title: "للمشتركين فقط", description: "هذه الغرفة متاحة فقط لأصحاب الاشتراك الشهري", variant: "destructive" });
      return;
    }
    if (room.price > 0 && !hasSubscription) {
      toast({ title: "غرفة مدفوعة", description: "يجب الاشتراك الشهري أو الدفع للانضمام", variant: "destructive" });
      return;
    }

    setJoiningId(room.id);
    const isJoined = participations.includes(room.id);

    if (isJoined) {
      const { error } = await supabase.from("room_participants").delete().eq("room_id", room.id).eq("user_id", userId);
      if (!error) {
        setParticipations((prev) => prev.filter((pid) => pid !== room.id));
        toast({ title: "تم", description: "تم إلغاء مشاركتك" });
        fetchRooms();
      }
    } else {
      const { error } = await supabase.from("room_participants").insert({ room_id: room.id, user_id: userId });
      if (!error) {
        setParticipations((prev) => [...prev, room.id]);
        toast({ title: "تم بنجاح", description: "تم تسجيلك في الغرفة" });
        fetchRooms();
      }
    }
    setJoiningId(null);
  };

  const handleEnterLive = (roomId: string) => navigate(`/rooms/${roomId}/live`);

  const liveRooms = rooms.filter((r) => r.is_live);
  const filteredRooms = rooms.filter((room) => {
    if (selectedStatus === "live") return room.is_live;
    if (selectedStatus === "upcoming") return !room.is_live;
    return true;
  });

  return (
    <AppLayout>
      <div className="px-4 py-6 space-y-6">
        {/* Header */}
        <div className="text-center space-y-2">
          <div className="w-14 h-14 mx-auto bg-primary/10 rounded-2xl flex items-center justify-center">
            <Headphones className="h-7 w-7 text-primary" />
          </div>
          <h1 className="text-2xl font-display font-bold text-foreground">الغرف الصوتية</h1>
          <p className="text-sm text-muted-foreground">غرف صوتية تفاعلية للنقاشات والحوارات</p>
        </div>

        {/* Create Button & Archive Link */}
        <div className="flex gap-2">
          {canCreate && (
            <Button onClick={() => setShowCreateDialog(true)} className="flex-1 gap-2">
              <Plus className="h-4 w-4" />
              إنشاء غرفة جديدة
            </Button>
          )}
          <Button variant="outline" onClick={() => navigate("/room-recordings")} className="gap-2">
            <Archive className="h-4 w-4" />
            الأرشيف
          </Button>
        </div>

        {/* 🔴 HAPPENING NOW - Clubhouse-style live rooms section */}
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
                  onClick={() => handleEnterLive(room.id)}
                >
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between gap-2 mb-2">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <Badge variant="secondary" className="text-[10px] h-4 px-1.5">
                            {categoryLabels[room.category]}
                          </Badge>
                          <Badge variant="destructive" className="text-[10px] h-4 px-1.5 gap-0.5">
                            <Radio className="h-2 w-2 animate-pulse" />
                            مباشر
                          </Badge>
                        </div>
                        <h3 className="font-bold text-foreground line-clamp-1">{room.title}</h3>
                        {room.description && (
                          <p className="text-xs text-muted-foreground line-clamp-1 mt-0.5">{room.description}</p>
                        )}
                      </div>
                    </div>

                    {/* Speakers list - Clubhouse style */}
                    {room.speaker_names && room.speaker_names.length > 0 && (
                      <div className="flex items-center gap-2 mt-2 mb-2">
                        <div className="flex -space-x-2 rtl:space-x-reverse">
                          {room.speaker_names.slice(0, 3).map((name, i) => (
                            <Avatar key={i} className="h-7 w-7 border-2 border-card">
                              <AvatarFallback className="text-[10px] bg-primary/10 text-primary font-bold">
                                {name.charAt(0)}
                              </AvatarFallback>
                            </Avatar>
                          ))}
                        </div>
                        <div className="flex flex-col min-w-0">
                          {room.speaker_names.slice(0, 2).map((name, i) => (
                            <span key={i} className="text-[11px] text-foreground font-medium truncate flex items-center gap-1">
                              {name}
                              <Mic className="h-2.5 w-2.5 text-muted-foreground" />
                            </span>
                          ))}
                          {room.speaker_names.length > 2 && (
                            <span className="text-[10px] text-muted-foreground">+{room.speaker_names.length - 2} آخرين</span>
                          )}
                        </div>
                      </div>
                    )}

                    <div className="flex items-center justify-between mt-2">
                      <span className="text-xs text-muted-foreground flex items-center gap-1">
                        <Users className="h-3 w-3" />
                        {room.participant_count} مستمع
                      </span>
                      {room.access_type === "subscribers_only" && (
                        <Badge variant="outline" className="text-[10px] gap-0.5 border-amber-500/50 text-amber-600">
                          <Lock className="h-2.5 w-2.5" />
                          للمشتركين
                        </Badge>
                      )}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        )}

        {/* Filters */}
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

        {/* Rooms List */}
        {loading ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-6 w-6 animate-spin text-primary" />
          </div>
        ) : filteredRooms.length === 0 ? (
          <Card>
            <CardContent className="py-8 text-center">
              <Headphones className="h-12 w-12 mx-auto text-muted-foreground/50 mb-4" />
              <p className="text-muted-foreground">لا توجد غرف متاحة</p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-3">
            {filteredRooms.map((room) => {
              const isJoined = participations.includes(room.id);
              const scheduledDate = new Date(room.scheduled_at);

              return (
                <Card key={room.id} className="overflow-hidden">
                  <CardContent className="p-4">
                    <div className="flex gap-3">
                      <div className="w-14 h-14 rounded-xl bg-primary/10 flex items-center justify-center flex-shrink-0 relative overflow-hidden">
                        {room.image_url ? (
                          <img src={room.image_url} alt={room.title} className="w-full h-full object-cover" />
                        ) : (
                          <Headphones className="h-7 w-7 text-primary" />
                        )}
                        {room.is_live && (
                          <div className="absolute -top-1 -right-1 bg-green-500 rounded-full p-0.5 border-2 border-card">
                            <Radio className="h-2 w-2 text-white animate-pulse" />
                          </div>
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-2">
                          <h3 className="font-semibold text-foreground line-clamp-1 text-sm">{room.title}</h3>
                          {room.is_live && (
                            <Badge variant="destructive" className="text-[10px] shrink-0 h-4 px-1.5">مباشر</Badge>
                          )}
                        </div>
                        {room.description && (
                          <p className="text-xs text-muted-foreground line-clamp-2 mt-0.5">{room.description}</p>
                        )}
                        <div className="flex flex-wrap gap-1.5 mt-2">
                          <Badge variant="secondary" className="text-[10px] h-4 px-1.5">
                            {categoryLabels[room.category]}
                          </Badge>
                          {room.access_type === "subscribers_only" ? (
                            <Badge variant="outline" className="text-[10px] gap-0.5 h-4 px-1.5 border-amber-500/50 text-amber-600">
                              <Lock className="h-2.5 w-2.5" />
                              للمشتركين
                            </Badge>
                          ) : (
                            <Badge variant="outline" className="text-[10px] gap-0.5 h-4 px-1.5">
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
                            {room.participant_count}/{room.max_participants}
                          </span>
                        </div>
                        <p className="text-xs text-muted-foreground mt-1">المضيف: {room.host_name}</p>
                      </div>
                    </div>
                    <div className="flex gap-2 mt-3">
                      {room.is_live ? (
                        <Button onClick={() => handleEnterLive(room.id)} className="flex-1 gap-2" variant="destructive" size="sm">
                          <Radio className="h-3.5 w-3.5" />
                          دخول البث
                        </Button>
                      ) : (
                        <>
                          {userId === room.host_id && (
                            <Button onClick={() => handleEnterLive(room.id)} className="flex-1 gap-2" size="sm">
                              <Radio className="h-3.5 w-3.5" />
                              دخول الغرفة
                            </Button>
                          )}
                          <Button
                            onClick={() => handleJoin(room)}
                            disabled={joiningId === room.id}
                            variant={isJoined ? "outline" : "default"}
                            size="sm"
                            className={userId === room.host_id ? "gap-2" : "flex-1 gap-2"}
                          >
                            {joiningId === room.id ? (
                              <Loader2 className="h-3.5 w-3.5 animate-spin" />
                            ) : isJoined ? "إلغاء المشاركة" : "سجل الآن"}
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

      <CreateRoomDialog open={showCreateDialog} onOpenChange={setShowCreateDialog} onSuccess={fetchRooms} />
    </AppLayout>
  );
};

export default Rooms;

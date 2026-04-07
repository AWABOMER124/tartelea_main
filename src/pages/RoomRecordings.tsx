import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import AppLayout from "@/components/layout/AppLayout";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Loader2, Play, Headphones, Calendar, Clock, Trash2, Users, BarChart3, Archive } from "lucide-react";
import { format, ar } from "@/lib/date-utils";
import { useUserRole } from "@/hooks/useUserRole";
import { useToast } from "@/hooks/use-toast";

interface ArchivedRoom {
  id: string;
  title: string;
  description: string | null;
  category: string;
  scheduled_at: string;
  ended_at: string | null;
  actual_started_at: string | null;
  peak_participants: number | null;
  total_participants_count: number | null;
  duration_minutes: number | null;
  host_name?: string;
  image_url?: string | null;
  recording_count?: number;
}

interface RoomRecording {
  id: string;
  room_id: string;
  recording_url: string;
  duration_seconds: number | null;
  file_size_bytes: number | null;
  recorded_at: string;
  room_title?: string;
  host_name?: string;
}

const categoryLabels: Record<string, string> = {
  quran: "القرآن", values: "القيم", community: "المجتمع",
  sudan_awareness: "الوعي السوداني", arab_awareness: "الوعي العربي", islamic_awareness: "الوعي الإسلامي",
};

const RoomRecordings = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { isAdmin, isModerator, userId } = useUserRole();
  const [recordings, setRecordings] = useState<RoomRecording[]>([]);
  const [archivedRooms, setArchivedRooms] = useState<ArchivedRoom[]>([]);
  const [loading, setLoading] = useState(true);
  const [playingId, setPlayingId] = useState<string | null>(null);

  useEffect(() => {
    Promise.all([fetchRecordings(), fetchArchivedRooms()]).then(() => setLoading(false));
  }, []);

  const fetchArchivedRooms = async () => {
    const { data, error } = await supabase
      .from("rooms")
      .select("*")
      .not("ended_at", "is", null)
      .eq("is_approved", true)
      .order("ended_at", { ascending: false })
      .limit(50);

    if (error || !data) return;

    const hostIds = [...new Set(data.map((r) => r.host_id))];
    const { data: profiles } = await supabase.from("profiles").select("id, full_name").in("id", hostIds);
    const profileMap = new Map(profiles?.map((p) => [p.id, p.full_name]) || []);

    // Count recordings per room
    const roomIds = data.map((r) => r.id);
    const { data: recData } = await supabase.from("room_recordings").select("room_id").in("room_id", roomIds).eq("is_available", true);
    const recCounts: Record<string, number> = {};
    recData?.forEach((r) => { recCounts[r.room_id] = (recCounts[r.room_id] || 0) + 1; });

    setArchivedRooms(data.map((r) => ({
      ...r,
      host_name: profileMap.get(r.host_id) || "مدرب",
      recording_count: recCounts[r.id] || 0,
    })));
  };

  const fetchRecordings = async () => {
    const { data, error } = await supabase
      .from("room_recordings")
      .select("*")
      .eq("is_available", true)
      .order("recorded_at", { ascending: false });

    if (error || !data || data.length === 0) { setRecordings([]); return; }

    const roomIds = [...new Set(data.map((r) => r.room_id))];
    const { data: rooms } = await supabase.from("rooms").select("id, title, host_id").in("id", roomIds);
    const hostIds = [...new Set(rooms?.map((r) => r.host_id) || [])];
    const { data: profiles } = await supabase.from("profiles").select("id, full_name").in("id", hostIds);

    const roomMap = new Map(rooms?.map((r) => [r.id, r]) || []);
    const profileMap = new Map(profiles?.map((p) => [p.id, p.full_name]) || []);

    setRecordings(data.map((rec) => {
      const room = roomMap.get(rec.room_id);
      return {
        ...rec,
        room_title: room?.title || "غرفة محذوفة",
        host_name: room ? profileMap.get(room.host_id) || "مدرب" : "غير معروف",
      };
    }));
  };

  const handleDelete = async (id: string) => {
    const { error } = await supabase.from("room_recordings").delete().eq("id", id);
    if (error) {
      toast({ title: "خطأ", description: "فشل حذف التسجيل", variant: "destructive" });
    } else {
      setRecordings((prev) => prev.filter((r) => r.id !== id));
      toast({ title: "تم", description: "تم حذف التسجيل" });
    }
  };

  const formatDuration = (seconds: number | null) => {
    if (!seconds) return "--:--";
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m}:${s.toString().padStart(2, "0")}`;
  };

  const formatFileSize = (bytes: number | null) => {
    if (!bytes) return "";
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  const calcRoomDuration = (start: string | null, end: string | null) => {
    if (!start || !end) return null;
    const diff = Math.floor((new Date(end).getTime() - new Date(start).getTime()) / 60000);
    if (diff < 60) return `${diff} دقيقة`;
    const h = Math.floor(diff / 60);
    const m = diff % 60;
    return `${h} ساعة ${m > 0 ? `و ${m} دقيقة` : ""}`;
  };

  return (
    <AppLayout>
      <div className="px-4 py-6 space-y-6">
        <div className="text-center space-y-2">
          <div className="w-14 h-14 mx-auto bg-primary/10 rounded-2xl flex items-center justify-center">
            <Archive className="h-7 w-7 text-primary" />
          </div>
          <h1 className="text-2xl font-display font-bold text-foreground">أرشيف الغرف الصوتية</h1>
          <p className="text-sm text-muted-foreground">الغرف المنتهية وتسجيلاتها</p>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-6 w-6 animate-spin text-primary" />
          </div>
        ) : (
          <Tabs defaultValue="rooms" className="w-full">
            <TabsList className="w-full">
              <TabsTrigger value="rooms" className="flex-1">الغرف المنتهية</TabsTrigger>
              <TabsTrigger value="recordings" className="flex-1">التسجيلات</TabsTrigger>
            </TabsList>

            <TabsContent value="rooms" className="space-y-3 mt-4">
              {archivedRooms.length === 0 ? (
                <Card>
                  <CardContent className="py-12 text-center">
                    <Headphones className="h-12 w-12 mx-auto text-muted-foreground/50 mb-4" />
                    <p className="text-muted-foreground">لا توجد غرف منتهية</p>
                  </CardContent>
                </Card>
              ) : (
                archivedRooms.map((room) => (
                  <Card key={room.id}>
                    <CardContent className="p-4">
                      <div className="flex gap-3">
                        <div className="w-14 h-14 rounded-xl bg-muted/50 flex items-center justify-center flex-shrink-0 overflow-hidden">
                          {room.image_url ? (
                            <img src={room.image_url} alt={room.title} className="w-full h-full object-cover" />
                          ) : (
                            <Headphones className="h-7 w-7 text-muted-foreground" />
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <h3 className="font-semibold text-foreground text-sm line-clamp-1">{room.title}</h3>
                          <p className="text-xs text-muted-foreground mt-0.5">{room.host_name}</p>
                          <div className="flex flex-wrap gap-1.5 mt-2">
                            <Badge variant="secondary" className="text-[10px] h-4 px-1.5">
                              {categoryLabels[room.category] || room.category}
                            </Badge>
                            <Badge variant="outline" className="text-[10px] h-4 px-1.5">منتهية</Badge>
                          </div>
                          {/* Stats */}
                          <div className="flex items-center gap-3 mt-2 text-xs text-muted-foreground">
                            {room.ended_at && (
                              <span className="flex items-center gap-1">
                                <Calendar className="h-3 w-3" />
                                {format(new Date(room.ended_at), "dd MMM yyyy", { locale: ar })}
                              </span>
                            )}
                            {room.actual_started_at && room.ended_at && (
                              <span className="flex items-center gap-1">
                                <Clock className="h-3 w-3" />
                                {calcRoomDuration(room.actual_started_at, room.ended_at)}
                              </span>
                            )}
                          </div>
                          <div className="flex items-center gap-3 mt-1.5 text-xs text-muted-foreground">
                            {(room.peak_participants ?? 0) > 0 && (
                              <span className="flex items-center gap-1">
                                <Users className="h-3 w-3" />
                                ذروة: {room.peak_participants}
                              </span>
                            )}
                            {(room.total_participants_count ?? 0) > 0 && (
                              <span className="flex items-center gap-1">
                                <BarChart3 className="h-3 w-3" />
                                إجمالي: {room.total_participants_count}
                              </span>
                            )}
                            {(room.recording_count ?? 0) > 0 && (
                              <Badge variant="outline" className="text-[10px] h-4 px-1.5">
                                {room.recording_count} تسجيل
                              </Badge>
                            )}
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))
              )}
            </TabsContent>

            <TabsContent value="recordings" className="space-y-3 mt-4">
              {recordings.length === 0 ? (
                <Card>
                  <CardContent className="py-12 text-center">
                    <Headphones className="h-12 w-12 mx-auto text-muted-foreground/50 mb-4" />
                    <p className="text-muted-foreground">لا توجد تسجيلات متاحة</p>
                  </CardContent>
                </Card>
              ) : (
                recordings.map((rec) => (
                  <Card key={rec.id} className="overflow-hidden">
                    <CardContent className="p-4">
                      <div className="flex items-start gap-3">
                        <button
                          onClick={() => setPlayingId(playingId === rec.id ? null : rec.id)}
                          className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0 hover:bg-primary/20 transition-colors"
                        >
                          <Play className="h-5 w-5 text-primary" />
                        </button>
                        <div className="flex-1 min-w-0">
                          <h3 className="font-semibold text-foreground text-sm line-clamp-1">{rec.room_title}</h3>
                          <p className="text-xs text-muted-foreground mt-0.5">{rec.host_name}</p>
                          <div className="flex items-center gap-3 mt-2 text-xs text-muted-foreground">
                            <span className="flex items-center gap-1">
                              <Calendar className="h-3 w-3" />
                              {format(new Date(rec.recorded_at), "dd MMM yyyy", { locale: ar })}
                            </span>
                            <span className="flex items-center gap-1">
                              <Clock className="h-3 w-3" />
                              {formatDuration(rec.duration_seconds)}
                            </span>
                            {rec.file_size_bytes && (
                              <Badge variant="outline" className="text-[10px]">{formatFileSize(rec.file_size_bytes)}</Badge>
                            )}
                          </div>
                        </div>
                        {(isAdmin || isModerator) && (
                          <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-destructive" onClick={() => handleDelete(rec.id)}>
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        )}
                      </div>
                      {playingId === rec.id && rec.recording_url && (
                        <div className="mt-3 pt-3 border-t border-border">
                          <audio controls autoPlay className="w-full h-10" src={rec.recording_url} onEnded={() => setPlayingId(null)} />
                        </div>
                      )}
                    </CardContent>
                  </Card>
                ))
              )}
            </TabsContent>
          </Tabs>
        )}
      </div>
    </AppLayout>
  );
};

export default RoomRecordings;

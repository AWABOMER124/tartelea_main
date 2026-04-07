import { useState, useEffect, useCallback, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useRoomRecording } from "@/hooks/useRoomRecording";
import { useRoomManage } from "@/hooks/useRoomManage";
import { useLiveKitRoom } from "@/hooks/useLiveKitRoom";
import { ConnectionState } from "livekit-client";
import LiveChat from "@/components/live/LiveChat";
import LiveStreamSharing from "@/components/live/LiveStreamSharing";
import RoomStage from "@/components/rooms/RoomStage";
import RoomAudience from "@/components/rooms/RoomAudience";
import RoomControls from "@/components/rooms/RoomControls";
import RoomManagementPanel from "@/components/rooms/RoomManagementPanel";
import RoomReactions from "@/components/rooms/RoomReactions";
import RoomHeader from "@/components/rooms/RoomHeader";
import type { StageParticipant } from "@/components/rooms/RoomStage";
import type { AudienceMember } from "@/components/rooms/RoomAudience";
import { Loader2, ChevronDown } from "lucide-react";
import { enableBackgroundAudio, disableBackgroundAudio } from "@/lib/capacitor/background-audio";

const formatElapsed = (seconds: number) => {
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = seconds % 60;
  if (h > 0) return `${h}:${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
  return `${m}:${String(s).padStart(2, "0")}`;
};

const RoomLive = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { toast } = useToast();

  const [loading, setLoading] = useState(true);
  const [room, setRoom] = useState<any>(null);
  const [isHost, setIsHost] = useState(false);
  const [userId, setUserId] = useState<string | null>(null);
  const [isAudioEnabled, setIsAudioEnabled] = useState(true);
  const [showChat, setShowChat] = useState(false);
  const [showManagement, setShowManagement] = useState(false);
  const [hasRaisedHand, setHasRaisedHand] = useState(false);
  const [userRoomRole, setUserRoomRole] = useState<string>("listener");
  const [liveKitReady, setLiveKitReady] = useState(false);

  const [speakers, setSpeakers] = useState<StageParticipant[]>([]);
  const [audience, setAudience] = useState<AudienceMember[]>([]);
  const [handRaises, setHandRaises] = useState<any[]>([]);

  // Elapsed time tracking
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const elapsedTimerRef = useRef<NodeJS.Timeout | null>(null);

  // Stats tracking
  const [peakParticipants, setPeakParticipants] = useState(0);
  const [totalHandRaises, setTotalHandRaises] = useState(0);

  // Speaking time tracking per user
  const speakingTimeRef = useRef<Map<string, number>>(new Map());

  const liveKit = useLiveKitRoom({
    roomId: id || "",
    enabled: liveKitReady,
  });

  const {
    isRecording, isUploading, formattedDuration,
    startRecording, stopRecording,
  } = useRoomRecording({ roomId: id || "", localStream: null });

  const roomManage = useRoomManage(id);

  // Elapsed time timer
  useEffect(() => {
    if (room?.is_live && room?.actual_started_at) {
      const startTime = new Date(room.actual_started_at).getTime();
      const updateElapsed = () => {
        setElapsedSeconds(Math.floor((Date.now() - startTime) / 1000));
      };
      updateElapsed();
      elapsedTimerRef.current = setInterval(updateElapsed, 1000);
      return () => {
        if (elapsedTimerRef.current) clearInterval(elapsedTimerRef.current);
      };
    } else {
      setElapsedSeconds(0);
    }
  }, [room?.is_live, room?.actual_started_at]);

  // Track peak participants
  useEffect(() => {
    const total = speakers.length + audience.length;
    setPeakParticipants((prev) => Math.max(prev, total));
  }, [speakers.length, audience.length]);

  // Track speaking time
  useEffect(() => {
    const interval = setInterval(() => {
      liveKit.activeSpeakers.forEach((uid) => {
        const current = speakingTimeRef.current.get(uid) || 0;
        speakingTimeRef.current.set(uid, current + 1);
      });
      // Update speakers with speaking duration
      setSpeakers((prev) =>
        prev.map((s) => ({
          ...s,
          speakingDuration: speakingTimeRef.current.get(s.id) || 0,
        }))
      );
    }, 1000);
    return () => clearInterval(interval);
  }, [liveKit.activeSpeakers]);

  useEffect(() => {
    fetchRoom();

    const channel = supabase
      .channel(`room-${id}`)
      .on("postgres_changes", { event: "UPDATE", schema: "public", table: "rooms", filter: `id=eq.${id}` },
        (payload) => setRoom((prev: any) => (prev ? { ...prev, ...payload.new } : prev))
      )
      .subscribe();

    const participantsChannel = supabase
      .channel(`room-participants-${id}`)
      .on("postgres_changes", { event: "*", schema: "public", table: "room_participants", filter: `room_id=eq.${id}` },
        () => fetchParticipants()
      )
      .subscribe();

    const rolesChannel = supabase
      .channel(`room-roles-${id}`)
      .on("postgres_changes", { event: "*", schema: "public", table: "room_roles", filter: `room_id=eq.${id}` },
        () => fetchParticipants()
      )
      .subscribe();

    const handRaisesChannel = supabase
      .channel(`room-hands-${id}`)
      .on("postgres_changes", { event: "*", schema: "public", table: "room_hand_raises", filter: `room_id=eq.${id}` },
        () => fetchHandRaises()
      )
      .subscribe();

    return () => {
      liveKit.disconnect();
      supabase.removeChannel(channel);
      supabase.removeChannel(participantsChannel);
      supabase.removeChannel(rolesChannel);
      supabase.removeChannel(handRaisesChannel);
      if (elapsedTimerRef.current) clearInterval(elapsedTimerRef.current);
    };
  }, [id]);

  const fetchRoom = async () => {
    if (!id) return;
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { navigate("/auth"); return; }

    setUserId(user.id);

    const { data, error } = await supabase.from("rooms").select("*").eq("id", id).single();
    if (error || !data) {
      toast({ title: "خطأ", description: "الغرفة غير موجودة", variant: "destructive" });
      navigate("/rooms");
      return;
    }

    setRoom(data);
    const hostFlag = data.host_id === user.id;
    setIsHost(hostFlag);
    setLoading(false);

    if (hostFlag) {
      await supabase.from("room_roles").upsert({ room_id: id, user_id: user.id, role: "host" }, { onConflict: "room_id,user_id" });
    }
    setLiveKitReady(true);
    enableBackgroundAudio();

    await Promise.all([fetchParticipants(), fetchHandRaises()]);
  };

  const fetchParticipants = async () => {
    if (!id) return;
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const { data: roomData } = await supabase.from("rooms").select("host_id").eq("id", id).single();
    if (!roomData) return;

    const { data: participantsData } = await supabase.from("room_participants").select("user_id").eq("room_id", id);
    const { data: rolesData } = await supabase.from("room_roles").select("user_id, role").eq("room_id", id);

    const roleMap = new Map(rolesData?.map((r) => [r.user_id, r.role]) || []);

    const allUserIds = [
      roomData.host_id,
      ...(participantsData?.map((p) => p.user_id).filter((uid) => uid !== roomData.host_id) || []),
    ];
    const uniqueIds = [...new Set(allUserIds)];

    const { data: profiles } = await supabase.from("profiles").select("id, full_name, avatar_url, bio").in("id", uniqueIds);
    const profileMap = new Map(profiles?.map((p) => [p.id, p]) || []);

    const myRole = roleMap.get(user.id) || (roomData.host_id === user.id ? "host" : "listener");
    setUserRoomRole(myRole);

    const speakerRoles = ["host", "co_host", "moderator", "speaker"];
    const newSpeakers: StageParticipant[] = [];
    const newAudience: AudienceMember[] = [];

    uniqueIds.forEach((uid) => {
      const role = roleMap.get(uid) || (uid === roomData.host_id ? "host" : "listener");
      const profile = profileMap.get(uid);
      const name = profile?.full_name || "مستخدم";

      if (speakerRoles.includes(role)) {
        const isSpeakingNow = liveKit.activeSpeakers.includes(uid);
        newSpeakers.push({
          id: uid,
          name,
          isHost: uid === roomData.host_id,
          isMuted: !isSpeakingNow && uid !== roomData.host_id,
          isSpeaking: isSpeakingNow,
          role,
          avatarUrl: profile?.avatar_url || undefined,
          bio: profile?.bio || undefined,
          speakingDuration: speakingTimeRef.current.get(uid) || 0,
          connectionQuality: liveKit.participantQualities.get(uid),
        });
      } else {
        newAudience.push({
          id: uid,
          name,
          hasRaisedHand: false,
          avatarUrl: profile?.avatar_url || undefined,
        });
      }
    });

    setSpeakers(newSpeakers);
    setAudience(newAudience);
  };

  const fetchHandRaises = async () => {
    if (!id) return;
    const { data } = await supabase
      .from("room_hand_raises")
      .select("*")
      .eq("room_id", id)
      .eq("status", "pending")
      .order("created_at", { ascending: true });
    setHandRaises(data || []);
    setTotalHandRaises((prev) => Math.max(prev, (data || []).length));

    setAudience((prev) =>
      prev.map((m) => ({
        ...m,
        hasRaisedHand: (data || []).some((h) => h.user_id === m.id),
      }))
    );
  };

  const toggleAudio = useCallback(async () => {
    await liveKit.toggleAudio();
    setIsAudioEnabled(liveKit.isAudioEnabled);
  }, [liveKit]);

  useEffect(() => {
    setIsAudioEnabled(liveKit.isAudioEnabled);
  }, [liveKit.isAudioEnabled]);

  const handleLeave = () => {
    liveKit.disconnect();
    disableBackgroundAudio();
    if (id && userId) {
      supabase.from("room_hand_raises").delete().eq("room_id", id).eq("user_id", userId).then(() => {});
      supabase.from("room_roles").delete().eq("room_id", id).eq("user_id", userId).then(() => {});
    }
    navigate("/rooms");
  };

  const handleStartLive = async () => {
    if (!isHost || !id) return;
    const result = await roomManage.startLive();
    if (result.success) {
      setRoom((prev: any) => ({ ...prev, is_live: true, actual_started_at: new Date().toISOString() }));
      toast({ title: "تم", description: "بدأ البث الصوتي" });
    }
  };

  const handleEndLive = async () => {
    if (!isHost || !id) return;
    // Update peak participants before ending
    if (id) {
      const total = speakers.length + audience.length;
      await supabase.from("rooms").update({
        peak_participants: Math.max(peakParticipants, total),
        total_participants_count: total,
      }).eq("id", id);
    }
    const result = await roomManage.endRoom();
    if (result.success) {
      toast({ title: "تم", description: "انتهى البث الصوتي" });
      navigate("/rooms");
    }
  };

  const handleRaiseHand = async () => {
    if (!id || !userId) return;
    if (hasRaisedHand) {
      await supabase.from("room_hand_raises").delete().eq("room_id", id).eq("user_id", userId);
      setHasRaisedHand(false);
      toast({ title: "تم إنزال اليد", description: "تم إلغاء طلب التحدث" });
    } else {
      await supabase.from("room_hand_raises").upsert(
        { room_id: id, user_id: userId, status: "pending" },
        { onConflict: "room_id,user_id" }
      );
      setHasRaisedHand(true);
      toast({ title: "✋ تم رفع اليد", description: "سيتم إعلام المضيف بطلبك" });
    }
  };

  const handleAcceptHandRaise = async (raisedUserId: string) => {
    const result = await roomManage.acceptHand(raisedUserId);
    if (result.success) toast({ title: "تم القبول", description: "تمت ترقية المستخدم إلى متحدث" });
  };

  const handleRejectHandRaise = async (raisedUserId: string) => {
    const result = await roomManage.rejectHand(raisedUserId);
    if (result.success) toast({ title: "تم الرفض", description: "تم رفض طلب التحدث" });
  };

  const handleDemoteToListener = async (targetUserId: string) => {
    const result = await roomManage.demoteListener(targetUserId);
    if (result.success) toast({ title: "تم", description: "تم نقل المستخدم للمستمعين" });
  };

  const handlePromoteToCoHost = async (targetUserId: string) => {
    const result = await roomManage.promoteCoHost(targetUserId);
    if (result.success) toast({ title: "تم", description: "تم ترقية المستخدم إلى مضيف مشارك" });
  };

  const handlePromoteToModerator = async (targetUserId: string) => {
    const result = await roomManage.promoteModerator(targetUserId);
    if (result.success) toast({ title: "تم", description: "تم ترقية المستخدم إلى مشرف" });
  };

  const handleKickUser = async (targetUserId: string) => {
    const result = await roomManage.kickUser(targetUserId);
    if (result.success) toast({ title: "تم الطرد", description: "تم طرد المستخدم من الغرفة" });
  };

  const handleInviteToStage = async (invitedUserId: string) => {
    const result = await roomManage.promoteSpeaker(invitedUserId);
    if (result.success) toast({ title: "تمت الدعوة", description: "تم ترقية المستخدم إلى متحدث" });
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  const canManage = isHost || userRoomRole === "co_host" || userRoomRole === "moderator";
  const isSpeaker = speakers.some((s) => s.id === userId) || liveKit.canPublish;
  const totalParticipants = speakers.length + audience.length;
  const isConnected = liveKit.connectionState === ConnectionState.Connected;
  const elapsedTime = elapsedSeconds > 0 ? formatElapsed(elapsedSeconds) : undefined;

  return (
    <div className="min-h-screen bg-background flex flex-col" dir="rtl">
      {/* Header */}
      <RoomHeader
        title={room?.title || ""}
        description={room?.description}
        category={room?.category}
        isLive={room?.is_live || false}
        totalParticipants={totalParticipants}
        handRaisesCount={handRaises.length}
        canManage={canManage}
        isConnected={isConnected}
        connectionError={liveKit.error}
        elapsedTime={elapsedTime}
        onLeave={handleLeave}
        onToggleManagement={() => { setShowManagement(!showManagement); setShowChat(false); }}
      />

      {/* Main Content */}
      <div className="flex-1 flex flex-col lg:flex-row overflow-hidden">
        <div className={`flex-1 overflow-y-auto ${showChat || showManagement ? "lg:w-2/3" : "w-full"}`}>
          <div className="max-w-xl mx-auto px-4 py-6 space-y-6">
            {room?.description && (
              <p className="text-sm text-muted-foreground text-center leading-relaxed bg-muted/30 rounded-xl px-4 py-3">
                {room.description}
              </p>
            )}

            <RoomStage speakers={speakers} currentUserId={userId || ""} />

            {audience.length > 0 && (
              <div className="flex items-center gap-3">
                <div className="flex-1 h-px bg-border" />
                <ChevronDown className="h-4 w-4 text-muted-foreground" />
                <div className="flex-1 h-px bg-border" />
              </div>
            )}

            <RoomAudience
              audience={audience}
              currentUserId={userId || ""}
              isHost={canManage}
              onInviteToStage={handleInviteToStage}
            />

            {isHost && (
              <div className="pt-4">
                <LiveStreamSharing isLive={room?.is_live} eventTitle={room?.title} eventId={id} />
              </div>
            )}
          </div>
        </div>

        {/* Management Panel */}
        {showManagement && canManage && (
          <div className="w-full lg:w-80 border-r border-border h-[calc(100vh-8rem)] overflow-y-auto">
            <RoomManagementPanel
              speakers={speakers}
              audience={audience}
              handRaises={handRaises}
              currentUserId={userId || ""}
              isHost={isHost}
              onAcceptHand={handleAcceptHandRaise}
              onRejectHand={handleRejectHandRaise}
              onDemote={handleDemoteToListener}
              onPromoteCoHost={handlePromoteToCoHost}
              onPromoteModerator={handlePromoteToModerator}
              onKick={handleKickUser}
              onPromoteSpeaker={handleInviteToStage}
              stats={{
                peakParticipants,
                totalJoined: totalParticipants,
                elapsedTime: elapsedTime || "0:00",
                handRaisesTotal: totalHandRaises,
              }}
            />
          </div>
        )}

        {/* Chat Sidebar */}
        {showChat && userId && !showManagement && (
          <div className="w-full lg:w-80 border-r border-border h-[calc(100vh-8rem)]">
            <LiveChat eventId={id!} eventType="room" userId={userId} overlay />
          </div>
        )}
      </div>

      {/* Reactions */}
      <div className="bg-card/80 backdrop-blur-sm border-t border-border px-2 py-1">
        <RoomReactions roomId={id} />
      </div>

      {/* Controls */}
      <RoomControls
        isHost={isHost}
        isSpeaker={isSpeaker}
        isLive={room?.is_live || false}
        isAudioEnabled={isAudioEnabled}
        hasRaisedHand={hasRaisedHand}
        showChat={showChat}
        isRecording={isRecording}
        isUploading={isUploading}
        formattedDuration={formattedDuration}
        elapsedTime={elapsedTime}
        onToggleAudio={toggleAudio}
        onLeave={handleLeave}
        onRaiseHand={handleRaiseHand}
        onToggleChat={() => { setShowChat(!showChat); setShowManagement(false); }}
        onStartLive={handleStartLive}
        onEndLive={handleEndLive}
        onStartRecording={startRecording}
        onStopRecording={stopRecording}
      />
    </div>
  );
};

export default RoomLive;

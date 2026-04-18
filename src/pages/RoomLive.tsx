/**
 * STEP 3 official live room page:
 * Session details, access decisions, and room actions all come from backend
 * session APIs. Supabase room tables are no longer the owner of this flow.
 */
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { ConnectionState } from "livekit-client";
import { Loader2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useRoomRecording } from "@/hooks/useRoomRecording";
import { useRoomManage } from "@/hooks/useRoomManage";
import { useLiveKitRoom } from "@/hooks/useLiveKitRoom";
import {
  getBackendSessionDetails,
  leaveBackendSession,
  type BackendSessionDetails,
} from "@/lib/backendSessions";
import { getBackendSessionUser } from "@/lib/backendSession";
import { enableBackgroundAudio, disableBackgroundAudio } from "@/lib/capacitor/background-audio";
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

const SPEAKING_ROOM_ROLES = new Set(["host", "co_host", "moderator", "speaker"]);

const formatElapsed = (seconds: number) => {
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const remainingSeconds = seconds % 60;
  if (hours > 0) {
    return `${hours}:${String(minutes).padStart(2, "0")}:${String(remainingSeconds).padStart(2, "0")}`;
  }
  return `${minutes}:${String(remainingSeconds).padStart(2, "0")}`;
};

const RoomLive = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { toast } = useToast();
  const backendUser = getBackendSessionUser();
  const userId = backendUser?.id ?? null;

  const [loading, setLoading] = useState(true);
  const [sessionDetails, setSessionDetails] = useState<BackendSessionDetails | null>(null);
  const [showChat, setShowChat] = useState(false);
  const [showManagement, setShowManagement] = useState(false);

  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const elapsedTimerRef = useRef<NodeJS.Timeout | null>(null);
  const [peakParticipants, setPeakParticipants] = useState(0);
  const [totalHandRaises, setTotalHandRaises] = useState(0);
  const speakingTimeRef = useRef<Map<string, number>>(new Map());

  const liveKit = useLiveKitRoom({
    sessionId: id || "",
    enabled: Boolean(id && sessionDetails?.access.canJoin),
  });

  const { isRecording, isUploading, formattedDuration, startRecording, stopRecording } =
    useRoomRecording({
      roomId: id || "",
      localStream: null,
    });

  const roomManage = useRoomManage(id);

  const applySessionDetails = useCallback((nextDetails: BackendSessionDetails) => {
    setSessionDetails(nextDetails);
    setPeakParticipants((prev) =>
      Math.max(prev, nextDetails.participants.length),
    );
    setTotalHandRaises((prev) =>
      Math.max(prev, nextDetails.hand_raises.length),
    );
  }, []);

  const refreshSessionDetails = useCallback(
    async (silent = false) => {
      if (!id) {
        return;
      }

      try {
        if (!silent) {
          setLoading(true);
        }

        const details = await getBackendSessionDetails(id);
        applySessionDetails(details);
      } catch (error) {
        const message =
          error instanceof Error ? error.message : "تعذر تحميل تفاصيل الجلسة الصوتية.";

        toast({
          title: "خطأ",
          description: message,
          variant: "destructive",
        });
        navigate("/rooms");
      } finally {
        if (!silent) {
          setLoading(false);
        }
      }
    },
    [applySessionDetails, id, navigate, toast],
  );

  useEffect(() => {
    if (!userId) {
      navigate("/auth");
      return;
    }

    void refreshSessionDetails();
  }, [navigate, refreshSessionDetails, userId]);

  useEffect(() => {
    if (!id || !userId) {
      return;
    }

    enableBackgroundAudio();
    const interval = window.setInterval(() => {
      void refreshSessionDetails(true);
    }, 8000);

    return () => {
      window.clearInterval(interval);
      disableBackgroundAudio();
      if (elapsedTimerRef.current) {
        clearInterval(elapsedTimerRef.current);
      }
    };
  }, [id, refreshSessionDetails, userId]);

  useEffect(() => {
    const actualStartedAt = sessionDetails?.session.actual_started_at;
    const isLive = sessionDetails?.session.status === "live";

    if (!actualStartedAt || !isLive) {
      setElapsedSeconds(0);
      if (elapsedTimerRef.current) {
        clearInterval(elapsedTimerRef.current);
        elapsedTimerRef.current = null;
      }
      return;
    }

    const startTime = new Date(actualStartedAt).getTime();
    const updateElapsed = () => {
      setElapsedSeconds(Math.floor((Date.now() - startTime) / 1000));
    };

    updateElapsed();
    elapsedTimerRef.current = setInterval(updateElapsed, 1000);

    return () => {
      if (elapsedTimerRef.current) {
        clearInterval(elapsedTimerRef.current);
      }
    };
  }, [sessionDetails?.session.actual_started_at, sessionDetails?.session.status]);

  useEffect(() => {
    const interval = window.setInterval(() => {
      liveKit.activeSpeakers.forEach((participantId) => {
        const current = speakingTimeRef.current.get(participantId) || 0;
        speakingTimeRef.current.set(participantId, current + 1);
      });
    }, 1000);

    return () => {
      window.clearInterval(interval);
    };
  }, [liveKit.activeSpeakers]);

  useEffect(() => {
    if (!sessionDetails || sessionDetails.session.status !== "live") {
      return;
    }

    const backendRole = sessionDetails.access.room_role;
    const backendCanPublish = Boolean(sessionDetails.access.canPublish);
    const livekitRole = liveKit.access?.room_role;
    const livekitCanPublish = Boolean(liveKit.access?.canPublish);

    if (
      liveKit.connectionState === ConnectionState.Connected &&
      (backendRole !== livekitRole || backendCanPublish !== livekitCanPublish)
    ) {
      void liveKit.connect();
    }
  }, [
    liveKit.access?.canPublish,
    liveKit.access?.room_role,
    liveKit.connect,
    liveKit.connectionState,
    sessionDetails,
  ]);

  const speakers = useMemo<StageParticipant[]>(() => {
    const participants = sessionDetails?.participants ?? [];
    return participants
      .filter((participant) => SPEAKING_ROOM_ROLES.has(participant.room_role))
      .map((participant) => {
        const isSpeaking = liveKit.activeSpeakers.includes(participant.id);
        return {
          id: participant.id,
          name: participant.name,
          isHost: participant.room_role === "host",
          isMuted: !isSpeaking && participant.room_role !== "host",
          isSpeaking,
          role: participant.room_role,
          avatarUrl: participant.avatar_url ?? undefined,
          bio: participant.bio ?? undefined,
          speakingDuration: speakingTimeRef.current.get(participant.id) || 0,
          connectionQuality: liveKit.participantQualities.get(participant.id),
        };
      });
  }, [liveKit.activeSpeakers, liveKit.participantQualities, sessionDetails?.participants]);

  const audience = useMemo<AudienceMember[]>(() => {
    const participants = sessionDetails?.participants ?? [];
    return participants
      .filter((participant) => !SPEAKING_ROOM_ROLES.has(participant.room_role))
      .map((participant) => ({
        id: participant.id,
        name: participant.name,
        hasRaisedHand: participant.has_raised_hand,
        avatarUrl: participant.avatar_url ?? undefined,
      }));
  }, [sessionDetails?.participants]);

  const currentParticipant = useMemo(
    () => sessionDetails?.participants.find((participant) => participant.id === userId),
    [sessionDetails?.participants, userId],
  );

  const isHost = sessionDetails?.access.room_role === "host";
  const canManage = Boolean(sessionDetails?.access.canModerate);
  const hasRaisedHand = Boolean(currentParticipant?.has_raised_hand);
  const isSpeaker =
    Boolean(sessionDetails?.access.canSpeak) || Boolean(liveKit.access?.canPublish);
  const totalParticipants = (sessionDetails?.participants.length ?? 0) || speakers.length + audience.length;
  const isConnected = liveKit.connectionState === ConnectionState.Connected;
  const elapsedTime = elapsedSeconds > 0 ? formatElapsed(elapsedSeconds) : undefined;

  const updateFromAction = (
    result: Awaited<ReturnType<typeof roomManage.promoteSpeaker>>,
  ) => {
    if (result.success && result.data) {
      applySessionDetails(result.data);
    }
    return result.success;
  };

  const handleLeave = async () => {
    liveKit.disconnect();
    disableBackgroundAudio();

    if (id) {
      try {
        await leaveBackendSession(id);
      } catch {
        // Best-effort cleanup; navigation should still proceed.
      }
    }

    navigate("/rooms");
  };

  const handleStartLive = async () => {
    const result = await roomManage.startLive();
    if (updateFromAction(result)) {
      toast({
        title: "تم",
        description: "بدأ البث الصوتي.",
      });
      await liveKit.connect();
    }
  };

  const handleEndLive = async () => {
    const result = await roomManage.endRoom();
    if (updateFromAction(result)) {
      toast({
        title: "تم",
        description: "انتهى البث الصوتي.",
      });
      liveKit.disconnect();
      navigate("/rooms");
    }
  };

  const handleRaiseHand = async () => {
    const result = hasRaisedHand
      ? await roomManage.lowerHand()
      : await roomManage.raiseHand();

    if (updateFromAction(result)) {
      toast({
        title: hasRaisedHand ? "تم" : "تم رفع اليد",
        description: hasRaisedHand
          ? "تم إلغاء طلب التحدث."
          : "تم إرسال طلب التحدث إلى إدارة الجلسة.",
      });
    }
  };

  const handleAcceptHandRaise = async (raisedUserId: string) => {
    const result = await roomManage.acceptHand(raisedUserId);
    if (updateFromAction(result)) {
      toast({
        title: "تم القبول",
        description: "تمت ترقية المستخدم إلى متحدث.",
      });
    }
  };

  const handleRejectHandRaise = async (raisedUserId: string) => {
    const result = await roomManage.rejectHand(raisedUserId);
    if (updateFromAction(result)) {
      toast({
        title: "تم الرفض",
        description: "تم رفض طلب التحدث.",
      });
    }
  };

  const handleDemoteToListener = async (targetUserId: string) => {
    const result = await roomManage.demoteListener(targetUserId);
    if (updateFromAction(result)) {
      toast({
        title: "تم",
        description: "تم نقل المستخدم إلى المستمعين.",
      });
    }
  };

  const handlePromoteToCoHost = async (targetUserId: string) => {
    const result = await roomManage.promoteCoHost(targetUserId);
    if (updateFromAction(result)) {
      toast({
        title: "تم",
        description: "تمت ترقية المستخدم إلى مضيف مشارك.",
      });
    }
  };

  const handlePromoteToModerator = async (targetUserId: string) => {
    const result = await roomManage.promoteModerator(targetUserId);
    if (updateFromAction(result)) {
      toast({
        title: "تم",
        description: "تمت ترقية المستخدم إلى مشرف.",
      });
    }
  };

  const handleKickUser = async (targetUserId: string) => {
    const result = await roomManage.kickUser(targetUserId);
    if (updateFromAction(result)) {
      toast({
        title: "تم الطرد",
        description: "تم طرد المستخدم من الجلسة.",
      });
    }
  };

  const handleInviteToStage = async (invitedUserId: string) => {
    const result = await roomManage.promoteSpeaker(invitedUserId);
    if (updateFromAction(result)) {
      toast({
        title: "تمت الدعوة",
        description: "تمت ترقية المستخدم إلى متحدث.",
      });
    }
  };

  const toggleAudio = useCallback(async () => {
    await liveKit.toggleAudio();
  }, [liveKit]);

  if (loading || !sessionDetails) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background flex flex-col" dir="rtl">
      <RoomHeader
        title={sessionDetails.session.title}
        description={sessionDetails.session.description}
        category={sessionDetails.session.category ?? undefined}
        isLive={sessionDetails.session.status === "live"}
        totalParticipants={totalParticipants}
        handRaisesCount={sessionDetails.hand_raises.length}
        canManage={canManage}
        isConnected={isConnected}
        connectionError={liveKit.error}
        elapsedTime={elapsedTime}
        onLeave={() => void handleLeave()}
        onToggleManagement={() => {
          setShowManagement((prev) => !prev);
          setShowChat(false);
        }}
      />

      <div className="flex-1 flex flex-col lg:flex-row overflow-hidden">
        <div className={`flex-1 overflow-y-auto ${showChat || showManagement ? "lg:w-2/3" : "w-full"}`}>
          <div className="max-w-xl mx-auto px-4 py-6 space-y-6">
            {sessionDetails.session.description && (
              <p className="text-sm text-muted-foreground text-center leading-relaxed bg-muted/30 rounded-xl px-4 py-3">
                {sessionDetails.session.description}
              </p>
            )}

            <RoomStage speakers={speakers} currentUserId={userId || ""} />

            {audience.length > 0 && (
              <RoomAudience
                audience={audience}
                currentUserId={userId || ""}
                isHost={canManage}
                onInviteToStage={handleInviteToStage}
              />
            )}

            {isHost && (
              <div className="pt-4">
                <LiveStreamSharing
                  isLive={sessionDetails.session.status === "live"}
                  eventTitle={sessionDetails.session.title}
                  eventId={id}
                />
              </div>
            )}
          </div>
        </div>

        {showManagement && canManage && (
          <div className="w-full lg:w-80 border-r border-border h-[calc(100vh-8rem)] overflow-y-auto">
            <RoomManagementPanel
              speakers={speakers}
              audience={audience}
              handRaises={sessionDetails.hand_raises}
              currentUserId={userId || ""}
              isHost={Boolean(isHost)}
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

        {showChat && userId && !showManagement && (
          <div className="w-full lg:w-80 border-r border-border h-[calc(100vh-8rem)]">
            <LiveChat eventId={id!} eventType="room" userId={userId} overlay />
          </div>
        )}
      </div>

      <div className="bg-card/80 backdrop-blur-sm border-t border-border px-2 py-1">
        <RoomReactions roomId={id} />
      </div>

      <RoomControls
        isHost={Boolean(isHost)}
        isSpeaker={isSpeaker}
        isLive={sessionDetails.session.status === "live"}
        isAudioEnabled={liveKit.isAudioEnabled}
        hasRaisedHand={hasRaisedHand}
        showChat={showChat}
        isRecording={isRecording}
        isUploading={isUploading}
        formattedDuration={formattedDuration}
        elapsedTime={elapsedTime}
        onToggleAudio={() => void toggleAudio()}
        onLeave={() => void handleLeave()}
        onRaiseHand={() => void handleRaiseHand()}
        onToggleChat={() => {
          setShowChat((prev) => !prev);
          setShowManagement(false);
        }}
        onStartLive={() => void handleStartLive()}
        onEndLive={() => void handleEndLive()}
        onStartRecording={startRecording}
        onStopRecording={stopRecording}
      />
    </div>
  );
};

export default RoomLive;

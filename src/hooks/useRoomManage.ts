/**
 * STEP 3 official room management path:
 * Sensitive session/room actions now go through backend `/sessions/:id/actions`.
 * Supabase `room-manage` must not be used for new room control logic.
 */
import { useCallback } from "react";
import { useToast } from "@/hooks/use-toast";
import { manageBackendSession } from "@/lib/backendSessions";

type RoomAction =
  | "promote_speaker"
  | "demote_listener"
  | "promote_co_host"
  | "promote_moderator"
  | "kick"
  | "raise_hand"
  | "lower_hand"
  | "accept_hand"
  | "reject_hand"
  | "start_live"
  | "end_session";

export const useRoomManage = (roomId: string | undefined) => {
  const { toast } = useToast();

  const invoke = useCallback(
    async (action: RoomAction, targetUserId?: string) => {
      if (!roomId) return { success: false, error: "No room ID" };

      try {
        const data = await manageBackendSession({
          sessionId: roomId,
          action,
          targetUserId,
        });

        return { success: true, data };
      } catch (error) {
        const message = error instanceof Error ? error.message : "حدث خطأ غير متوقع";
        toast({
          title: "خطأ",
          description: message,
          variant: "destructive",
        });

        return { success: false, error: message };
      }
    },
    [roomId, toast]
  );

  const promoteSpeaker = (userId: string) => invoke("promote_speaker", userId);
  const demoteListener = (userId: string) => invoke("demote_listener", userId);
  const promoteCoHost = (userId: string) => invoke("promote_co_host", userId);
  const promoteModerator = (userId: string) => invoke("promote_moderator", userId);
  const kickUser = (userId: string) => invoke("kick", userId);
  const raiseHand = () => invoke("raise_hand");
  const lowerHand = () => invoke("lower_hand");
  const acceptHand = (userId: string) => invoke("accept_hand", userId);
  const rejectHand = (userId: string) => invoke("reject_hand", userId);
  const startLive = () => invoke("start_live");
  const endRoom = () => invoke("end_session");

  return {
    promoteSpeaker,
    demoteListener,
    promoteCoHost,
    promoteModerator,
    kickUser,
    raiseHand,
    lowerHand,
    acceptHand,
    rejectHand,
    startLive,
    endRoom,
  };
};

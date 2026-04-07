import { useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

type RoomAction =
  | "promote_speaker"
  | "demote_listener"
  | "promote_co_host"
  | "promote_moderator"
  | "kick"
  | "accept_hand"
  | "reject_hand"
  | "start_live"
  | "end_room";

export const useRoomManage = (roomId: string | undefined) => {
  const { toast } = useToast();

  const invoke = useCallback(
    async (action: RoomAction, target_user_id?: string) => {
      if (!roomId) return { success: false, error: "No room ID" };

      try {
        const { data, error } = await supabase.functions.invoke("room-manage", {
          body: { action, room_id: roomId, target_user_id },
        });

        if (error) {
          console.error("room-manage error:", error);
          toast({
            title: "خطأ",
            description: "فشل تنفيذ العملية",
            variant: "destructive",
          });
          return { success: false, error: error.message };
        }

        if (data?.error) {
          toast({
            title: "خطأ",
            description: data.error,
            variant: "destructive",
          });
          return { success: false, error: data.error };
        }

        return { success: true, data };
      } catch (err) {
        console.error("room-manage exception:", err);
        toast({
          title: "خطأ",
          description: "حدث خطأ غير متوقع",
          variant: "destructive",
        });
        return { success: false, error: "Unexpected error" };
      }
    },
    [roomId, toast]
  );

  const promoteSpeaker = (userId: string) => invoke("promote_speaker", userId);
  const demoteListener = (userId: string) => invoke("demote_listener", userId);
  const promoteCoHost = (userId: string) => invoke("promote_co_host", userId);
  const promoteModerator = (userId: string) => invoke("promote_moderator", userId);
  const kickUser = (userId: string) => invoke("kick", userId);
  const acceptHand = (userId: string) => invoke("accept_hand", userId);
  const rejectHand = (userId: string) => invoke("reject_hand", userId);
  const startLive = () => invoke("start_live");
  const endRoom = () => invoke("end_room");

  return {
    promoteSpeaker,
    demoteListener,
    promoteCoHost,
    promoteModerator,
    kickUser,
    acceptHand,
    rejectHand,
    startLive,
    endRoom,
  };
};

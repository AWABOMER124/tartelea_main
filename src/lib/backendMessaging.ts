import {
  compatInsert,
  compatSelect,
  compatUpdate,
} from "@/lib/backendCompat";

export interface BackendDirectMessage {
  id: string;
  sender_id: string;
  receiver_id: string;
  message: string;
  is_read: boolean;
  created_at: string;
}

export interface BackendNotification {
  id: string;
  type: string;
  title: string;
  message: string | null;
  is_read: boolean;
  created_at: string;
  related_post_id: string | null;
  related_course_id: string | null;
}

export const listConversationMessages = async (
  userId: string,
  recipientId: string,
) => {
  const response = await compatSelect<BackendDirectMessage[]>("direct_messages", {
    or: `and(sender_id.eq.${encodeURIComponent(userId)},receiver_id.eq.${encodeURIComponent(recipientId)}),and(sender_id.eq.${encodeURIComponent(recipientId)},receiver_id.eq.${encodeURIComponent(userId)})`,
    order: [{ column: "created_at", ascending: true }],
  });

  return Array.isArray(response.data) ? response.data : [];
};

export const sendDirectMessage = async (
  senderId: string,
  receiverId: string,
  message: string,
) => {
  const response = await compatInsert<BackendDirectMessage>(
    "direct_messages",
    {
      sender_id: senderId,
      receiver_id: receiverId,
      message,
    },
    { single: true },
  );

  return response.data;
};

export const markConversationRead = async (
  senderId: string,
  receiverId: string,
) =>
  compatUpdate(
    "direct_messages",
    { is_read: true },
    [
      { column: "sender_id", operator: "eq", value: senderId },
      { column: "receiver_id", operator: "eq", value: receiverId },
      { column: "is_read", operator: "eq", value: false },
    ],
  );

export const listNotifications = async () => {
  const response = await compatSelect<BackendNotification[]>("notifications", {
    order: [{ column: "created_at", ascending: false }],
    limit: 20,
  });

  return Array.isArray(response.data) ? response.data : [];
};

export const markNotificationRead = async (notificationId: string) =>
  compatUpdate(
    "notifications",
    { is_read: true },
    [{ column: "id", operator: "eq", value: notificationId }],
    { single: true },
  );

export const markAllNotificationsRead = async () =>
  compatUpdate(
    "notifications",
    { is_read: true },
    [{ column: "is_read", operator: "eq", value: false }],
  );

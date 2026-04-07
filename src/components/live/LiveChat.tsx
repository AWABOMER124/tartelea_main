import { useState, useEffect, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Send, Loader2 } from "lucide-react";
import { format } from "@/lib/date-utils";

interface Message {
  id: string;
  user_id: string;
  message: string;
  created_at: string;
  user_name?: string;
  user_avatar?: string;
}

interface LiveChatProps {
  eventId: string;
  eventType: "workshop" | "room";
  userId: string;
  /** Overlay mode for TikTok/Facebook-style floating chat */
  overlay?: boolean;
}

// Random soft colors for user names
const nameColors = [
  "text-sky-400",
  "text-rose-400",
  "text-emerald-400",
  "text-violet-400",
  "text-amber-400",
  "text-pink-400",
  "text-teal-400",
  "text-orange-400",
];

const getNameColor = (userId: string) => {
  let hash = 0;
  for (let i = 0; i < userId.length; i++) {
    hash = userId.charCodeAt(i) + ((hash << 5) - hash);
  }
  return nameColors[Math.abs(hash) % nameColors.length];
};

const LiveChat = ({ eventId, eventType, userId, overlay = false }: LiveChatProps) => {
  const { toast } = useToast();
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState("");
  const [sending, setSending] = useState(false);
  const [profilesMap, setProfilesMap] = useState<Map<string, { name: string; avatar?: string }>>(new Map());
  const scrollRef = useRef<HTMLDivElement>(null);
  const isAutoScrollRef = useRef(true);

  const tableName = eventType === "workshop" ? "workshop_messages" : "room_messages";
  const foreignKey = eventType === "workshop" ? "workshop_id" : "room_id";

  useEffect(() => {
    fetchMessages();
    const cleanup = setupRealtimeSubscription();
    return cleanup;
  }, [eventId]);

  useEffect(() => {
    if (isAutoScrollRef.current) {
      scrollToBottom();
    }
  }, [messages]);

  const scrollToBottom = () => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  };

  const handleScroll = () => {
    if (!scrollRef.current) return;
    const { scrollTop, scrollHeight, clientHeight } = scrollRef.current;
    isAutoScrollRef.current = scrollHeight - scrollTop - clientHeight < 60;
  };

  const fetchMessages = async () => {
    let query;
    if (eventType === "workshop") {
      query = supabase
        .from("workshop_messages")
        .select("*")
        .eq("workshop_id", eventId)
        .order("created_at", { ascending: true })
        .limit(100);
    } else {
      query = supabase
        .from("room_messages")
        .select("*")
        .eq("room_id", eventId)
        .order("created_at", { ascending: true })
        .limit(100);
    }

    const { data, error } = await query;
    if (error) {
      console.error("Error fetching messages:", error);
      return;
    }

    if (data && data.length > 0) {
      const userIds = [...new Set(data.map((m) => m.user_id))] as string[];
      const { data: profiles } = await supabase
        .from("profiles")
        .select("id, full_name, avatar_url")
        .in("id", userIds);

      const map = new Map(
        profiles?.map((p) => [p.id, { name: p.full_name || "مستخدم", avatar: p.avatar_url || undefined }]) || []
      );
      setProfilesMap(map);
      setMessages(data as Message[]);
    }
  };

  const setupRealtimeSubscription = () => {
    const channel = supabase
      .channel(`${eventType}-chat-${eventId}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: tableName,
          filter: `${foreignKey}=eq.${eventId}`,
        },
        async (payload) => {
          const newMsg = payload.new as Message;

          if (!profilesMap.has(newMsg.user_id)) {
            const { data: profile } = await supabase
              .from("profiles")
              .select("full_name, avatar_url")
              .eq("id", newMsg.user_id)
              .single();

            if (profile) {
              setProfilesMap((prev) =>
                new Map(prev).set(newMsg.user_id, {
                  name: profile.full_name || "مستخدم",
                  avatar: profile.avatar_url || undefined,
                })
              );
            }
          }

          setMessages((prev) => {
            const updated = [...prev, newMsg];
            // Keep last 200 messages to prevent memory bloat
            if (updated.length > 200) return updated.slice(-200);
            return updated;
          });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  };

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim()) return;

    setSending(true);
    let error;

    if (eventType === "workshop") {
      const result = await supabase.from("workshop_messages").insert({
        workshop_id: eventId,
        user_id: userId,
        message: newMessage.trim(),
      });
      error = result.error;
    } else {
      const result = await supabase.from("room_messages").insert({
        room_id: eventId,
        user_id: userId,
        message: newMessage.trim(),
      });
      error = result.error;
    }

    if (error) {
      toast({
        title: "خطأ",
        description: "فشل إرسال الرسالة",
        variant: "destructive",
      });
    } else {
      setNewMessage("");
      isAutoScrollRef.current = true;
    }

    setSending(false);
  };

  // ─── Overlay / Social Style (TikTok/Facebook Live) ───
  if (overlay) {
    return (
      <div className="flex flex-col h-full">
        {/* Messages area - transparent background, floating messages */}
        <div
          ref={scrollRef}
          onScroll={handleScroll}
          className="flex-1 overflow-y-auto px-3 py-2 space-y-1 scrollbar-hide"
          style={{ maskImage: "linear-gradient(to bottom, transparent 0%, black 15%, black 100%)" }}
        >
          {messages.map((msg, idx) => {
            const isOwn = msg.user_id === userId;
            const profile = profilesMap.get(msg.user_id);
            const userName = isOwn ? "أنت" : (profile?.name || "مستخدم");
            const colorClass = getNameColor(msg.user_id);

            return (
              <div
                key={msg.id}
                className="flex items-start gap-2 animate-in slide-in-from-bottom-2 duration-300"
                style={{ animationDelay: `${Math.min(idx * 20, 100)}ms` }}
              >
                {/* Mini avatar */}
                <div className="w-7 h-7 rounded-full bg-background/40 backdrop-blur-sm flex items-center justify-center flex-shrink-0 border border-white/10">
                  {profile?.avatar ? (
                    <img src={profile.avatar} alt="" className="w-7 h-7 rounded-full object-cover" />
                  ) : (
                    <span className="text-[10px] font-bold text-foreground/80">
                      {userName.charAt(0)}
                    </span>
                  )}
                </div>

                {/* Message bubble */}
                <div className="bg-background/30 backdrop-blur-md rounded-2xl px-3 py-1.5 max-w-[80%] border border-white/5">
                  <span className={`text-xs font-semibold ${colorClass}`}>
                    {userName}
                  </span>
                  <p className="text-sm text-foreground leading-snug">
                    {msg.message}
                  </p>
                </div>
              </div>
            );
          })}
        </div>

        {/* Input bar - social style */}
        <form onSubmit={handleSendMessage} className="px-3 pb-2 pt-1">
          <div className="flex gap-2 items-center">
            <div className="flex-1 relative">
              <Input
                value={newMessage}
                onChange={(e) => setNewMessage(e.target.value)}
                placeholder="أضف تعليقاً..."
                className="bg-background/30 backdrop-blur-md border-white/10 rounded-full text-sm h-9 pr-4 pl-10 placeholder:text-muted-foreground/60"
                disabled={sending}
              />
              <Button
                type="submit"
                size="icon"
                variant="ghost"
                className="absolute left-1 top-1/2 -translate-y-1/2 h-7 w-7 rounded-full text-primary hover:bg-primary/10"
                disabled={sending || !newMessage.trim()}
              >
                {sending ? (
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                ) : (
                  <Send className="h-3.5 w-3.5" />
                )}
              </Button>
            </div>
          </div>
        </form>
      </div>
    );
  }

  // ─── Classic / Sidebar Style ───
  return (
    <div className="flex flex-col h-full bg-card rounded-lg border border-border">
      <div className="p-3 border-b border-border">
        <h3 className="font-semibold text-foreground text-sm">الشات المباشر</h3>
      </div>

      <div
        ref={scrollRef}
        onScroll={handleScroll}
        className="flex-1 overflow-y-auto p-3 space-y-3"
      >
        {messages.length === 0 ? (
          <p className="text-center text-muted-foreground text-sm py-4">
            لا توجد رسائل بعد
          </p>
        ) : (
          messages.map((msg) => {
            const isOwn = msg.user_id === userId;
            const profile = profilesMap.get(msg.user_id);
            const userName = isOwn ? "أنت" : (profile?.name || "مستخدم");

            return (
              <div
                key={msg.id}
                className={`flex flex-col ${isOwn ? "items-end" : "items-start"}`}
              >
                <span className="text-xs text-muted-foreground mb-1">
                  {userName}
                </span>
                <div
                  className={`max-w-[80%] rounded-lg px-3 py-2 text-sm ${
                    isOwn
                      ? "bg-primary text-primary-foreground"
                      : "bg-muted text-foreground"
                  }`}
                >
                  {msg.message}
                </div>
                <span className="text-xs text-muted-foreground mt-1">
                  {format(new Date(msg.created_at), "HH:mm")}
                </span>
              </div>
            );
          })
        )}
      </div>

      <form onSubmit={handleSendMessage} className="p-3 border-t border-border">
        <div className="flex gap-2">
          <Input
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            placeholder="اكتب رسالتك..."
            className="flex-1"
            disabled={sending}
          />
          <Button type="submit" size="icon" disabled={sending || !newMessage.trim()}>
            {sending ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Send className="h-4 w-4" />
            )}
          </Button>
        </div>
      </form>
    </div>
  );
};

export default LiveChat;

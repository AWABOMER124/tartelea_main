import { useState, useEffect, useRef } from "react";
import { useToast } from "@/hooks/use-toast";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Send, Loader2 } from "lucide-react";
import { format } from "@/lib/date-utils";
import { listLiveChatMessages, listLiveChatProfiles, sendLiveChatMessage } from "@/lib/backendLiveChat";

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

  useEffect(() => {
    let active = true;

    const refresh = async () => {
      const data = await listLiveChatMessages(eventType, eventId);
      if (!active) return;

      const nextProfiles = await listLiveChatProfiles(data.map((message) => message.user_id));
      if (!active) return;

      setProfilesMap(nextProfiles);
      setMessages(data);
    };

    void refresh();
    const interval = window.setInterval(() => {
      void refresh();
    }, 3000);

    return () => {
      active = false;
      window.clearInterval(interval);
    };
  }, [eventId, eventType]);

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

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim()) return;

    setSending(true);
    try {
      await sendLiveChatMessage(eventType, eventId, userId, newMessage.trim());
      setNewMessage("");
      isAutoScrollRef.current = true;
      const data = await listLiveChatMessages(eventType, eventId);
      const nextProfiles = await listLiveChatProfiles(data.map((message) => message.user_id));
      setProfilesMap(nextProfiles);
      setMessages(data);
    } catch {
      toast({
        title: "خطأ",
        description: "فشل إرسال الرسالة",
        variant: "destructive",
      });
    } finally {
      setSending(false);
    }
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

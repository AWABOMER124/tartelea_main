import { useState, useEffect, useRef } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Send, Loader2, ArrowRight } from "lucide-react";
import { formatDistanceToNow, ar } from "@/lib/date-utils";
import { listConversationMessages, markConversationRead, sendDirectMessage } from "@/lib/backendMessaging";

interface Message {
  id: string;
  sender_id: string;
  receiver_id: string;
  message: string;
  is_read: boolean;
  created_at: string;
  sender_name?: string;
}

interface DirectMessagesProps {
  recipientId: string;
  recipientName: string;
  onBack?: () => void;
}

const DirectMessages = ({ recipientId, recipientName, onBack }: DirectMessagesProps) => {
  const { toast } = useToast();
  const { user } = useAuth();
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState("");
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const userId = user?.id ?? null;
  const scrollRef = useRef<HTMLDivElement>(null);


  useEffect(() => {
    if (!userId || !recipientId) return;

    let active = true;
    const refresh = async () => {
      try {
        const data = await listConversationMessages(userId, recipientId);
        if (active) setMessages(data);
        await markConversationRead(recipientId, userId);
      } catch {
        // Keep the current view stable; send actions surface explicit errors.
      } finally {
        if (active) setLoading(false);
      }
    };

    void refresh();
    const interval = window.setInterval(() => {
      void refresh();
    }, 5000);

    return () => {
      active = false;
      window.clearInterval(interval);
    };
  }, [userId, recipientId]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);


  const scrollToBottom = () => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  };

  const handleSend = async () => {
    if (!userId || !newMessage.trim()) return;

    setSending(true);
    try {
      const data = await sendDirectMessage(userId, recipientId, newMessage.trim());
      if (data) {
        setMessages((prev) =>
          prev.some((message) => message.id === data.id) ? prev : [...prev, data],
        );
        setNewMessage("");
      }
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

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  if (!userId) {
    return (
      <div className="flex items-center justify-center py-8">
        <p className="text-muted-foreground">يجب تسجيل الدخول للمراسلة</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-[400px] border border-border rounded-lg overflow-hidden bg-card">
      {/* Header */}
      <div className="flex items-center gap-3 p-3 border-b border-border bg-muted/30">
        {onBack && (
          <Button variant="ghost" size="icon" onClick={onBack}>
            <ArrowRight className="h-4 w-4" />
          </Button>
        )}
        <Avatar className="h-8 w-8">
          <AvatarFallback className="bg-primary/10 text-primary text-sm">
            {recipientName.charAt(0)}
          </AvatarFallback>
        </Avatar>
        <span className="font-medium text-foreground">{recipientName}</span>
      </div>

      {/* Messages */}
      <ScrollArea className="flex-1 p-3" ref={scrollRef}>
        {loading ? (
          <div className="flex items-center justify-center h-full">
            <Loader2 className="h-6 w-6 animate-spin text-primary" />
          </div>
        ) : messages.length === 0 ? (
          <div className="flex items-center justify-center h-full text-muted-foreground text-sm">
            ابدأ المحادثة مع {recipientName}
          </div>
        ) : (
          <div className="space-y-3">
            {messages.map((msg) => {
              const isMine = msg.sender_id === userId;
              return (
                <div
                  key={msg.id}
                  className={`flex ${isMine ? "justify-start" : "justify-end"}`}
                >
                  <div
                    className={`max-w-[75%] rounded-lg px-3 py-2 ${
                      isMine
                        ? "bg-primary text-primary-foreground"
                        : "bg-muted text-foreground"
                    }`}
                  >
                    <p className="text-sm whitespace-pre-wrap">{msg.message}</p>
                    <p className={`text-xs mt-1 ${isMine ? "text-primary-foreground/70" : "text-muted-foreground"}`}>
                      {formatDistanceToNow(new Date(msg.created_at), { addSuffix: true, locale: ar })}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </ScrollArea>

      {/* Input */}
      <div className="flex gap-2 p-3 border-t border-border">
        <Input
          value={newMessage}
          onChange={(e) => setNewMessage(e.target.value)}
          onKeyDown={handleKeyPress}
          placeholder="اكتب رسالتك..."
          disabled={sending}
          className="flex-1"
        />
        <Button onClick={handleSend} disabled={sending || !newMessage.trim()} size="icon">
          {sending ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <Send className="h-4 w-4" />
          )}
        </Button>
      </div>
    </div>
  );
};

export default DirectMessages;

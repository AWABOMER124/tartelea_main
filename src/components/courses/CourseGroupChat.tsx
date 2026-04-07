import { useState, useEffect, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Send, Loader2, MessageSquare, User, Lock, Paperclip, Image, FileText, X } from "lucide-react";
import { formatDistanceToNow, ar } from "@/lib/date-utils";

interface ChatMessage {
  id: string;
  message: string;
  user_id: string;
  created_at: string;
  author_name?: string;
  avatar_url?: string;
  attachment_url?: string | null;
  attachment_type?: string | null;
}

interface CourseGroupChatProps {
  courseId: string;
  userId: string | null;
  isSubscribed: boolean;
}

const CourseGroupChat = ({ courseId, userId, isSubscribed }: CourseGroupChatProps) => {
  const { toast } = useToast();
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [newMessage, setNewMessage] = useState("");
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [attachmentFile, setAttachmentFile] = useState<File | null>(null);
  const [attachmentPreview, setAttachmentPreview] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const profilesCache = useRef<Map<string, { name: string; avatar: string | null }>>(new Map());

  useEffect(() => {
    if (isSubscribed && userId) {
      fetchMessages();
      const channel = supabase
        .channel(`course-chat-${courseId}`)
        .on(
          "postgres_changes",
          {
            event: "INSERT",
            schema: "public",
            table: "course_chat_messages",
            filter: `course_id=eq.${courseId}`,
          },
          async (payload) => {
            const msg = payload.new as ChatMessage;
            const profile = await getProfile(msg.user_id);
            msg.author_name = profile.name;
            msg.avatar_url = profile.avatar;
            setMessages((prev) => [...prev, msg]);
          }
        )
        .on(
          "postgres_changes",
          {
            event: "DELETE",
            schema: "public",
            table: "course_chat_messages",
            filter: `course_id=eq.${courseId}`,
          },
          (payload) => {
            setMessages((prev) => prev.filter((m) => m.id !== payload.old.id));
          }
        )
        .subscribe();

      return () => {
        supabase.removeChannel(channel);
      };
    } else {
      setLoading(false);
    }
  }, [courseId, userId, isSubscribed]);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const getProfile = async (id: string) => {
    if (profilesCache.current.has(id)) {
      return profilesCache.current.get(id)!;
    }
    const { data } = await supabase
      .from("profiles")
      .select("full_name, avatar_url")
      .eq("id", id)
      .maybeSingle();
    const profile = { name: data?.full_name || "مستخدم", avatar: data?.avatar_url || null };
    profilesCache.current.set(id, profile);
    return profile;
  };

  const fetchMessages = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("course_chat_messages")
      .select("*")
      .eq("course_id", courseId)
      .order("created_at", { ascending: true })
      .limit(100);

    if (error) {
      setLoading(false);
      return;
    }

    if (data) {
      const userIds = [...new Set(data.map((m) => m.user_id))];
      const { data: profiles } = await supabase
        .from("profiles")
        .select("id, full_name, avatar_url")
        .in("id", userIds);

      const profileMap = new Map(
        profiles?.map((p) => [p.id, { name: p.full_name || "مستخدم", avatar: p.avatar_url }]) || []
      );

      profileMap.forEach((v, k) => profilesCache.current.set(k, v));

      setMessages(
        data.map((m) => ({
          ...m,
          author_name: profileMap.get(m.user_id)?.name || "مستخدم",
          avatar_url: profileMap.get(m.user_id)?.avatar || null,
        }))
      );
    }
    setLoading(false);
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Max 5MB
    if (file.size > 5 * 1024 * 1024) {
      toast({
        title: "خطأ",
        description: "حجم الملف يجب أن لا يتجاوز 5 ميجابايت",
        variant: "destructive",
      });
      return;
    }

    setAttachmentFile(file);
    if (file.type.startsWith("image/")) {
      const reader = new FileReader();
      reader.onload = (ev) => setAttachmentPreview(ev.target?.result as string);
      reader.readAsDataURL(file);
    } else {
      setAttachmentPreview(null);
    }
  };

  const clearAttachment = () => {
    setAttachmentFile(null);
    setAttachmentPreview(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const uploadAttachment = async (file: File): Promise<{ url: string; type: string } | null> => {
    const ext = file.name.split(".").pop();
    const path = `${userId}/${courseId}/${Date.now()}.${ext}`;
    const { error } = await supabase.storage
      .from("chat-attachments")
      .upload(path, file);

    if (error) {
      toast({ title: "خطأ", description: "فشل رفع الملف", variant: "destructive" });
      return null;
    }

    const { data: urlData } = await supabase.storage
      .from("chat-attachments")
      .createSignedUrl(path, 60 * 60 * 24 * 7); // 7 days

    if (!urlData?.signedUrl) {
      toast({ title: "خطأ", description: "فشل إنشاء رابط الملف", variant: "destructive" });
      return null;
    }

    const type = file.type.startsWith("image/") ? "image" : "file";
    return { url: urlData.signedUrl, type };
  };

  const handleSend = async () => {
    if ((!newMessage.trim() && !attachmentFile) || !userId || sending) return;

    setSending(true);
    setUploading(!!attachmentFile);

    let attachmentUrl: string | null = null;
    let attachmentType: string | null = null;

    if (attachmentFile) {
      const result = await uploadAttachment(attachmentFile);
      if (result) {
        attachmentUrl = result.url;
        attachmentType = result.type;
      } else {
        setSending(false);
        setUploading(false);
        return;
      }
    }

    const { error } = await supabase.from("course_chat_messages").insert({
      course_id: courseId,
      user_id: userId,
      message: newMessage.trim() || (attachmentType === "image" ? "📷 صورة" : "📎 مرفق"),
      attachment_url: attachmentUrl,
      attachment_type: attachmentType,
    });

    if (error) {
      toast({
        title: "خطأ",
        description: "فشل إرسال الرسالة",
        variant: "destructive",
      });
    } else {
      setNewMessage("");
      clearAttachment();
    }
    setSending(false);
    setUploading(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const isImageUrl = (url: string) => {
    return /\.(jpg|jpeg|png|gif|webp|svg)(\?.*)?$/i.test(url);
  };

  if (!isSubscribed) {
    return (
      <Card>
        <CardContent className="py-8 text-center space-y-3">
          <Lock className="h-10 w-10 text-muted-foreground mx-auto" />
          <p className="text-muted-foreground font-medium">
            مجموعة الدردشة متاحة للمشتركين فقط
          </p>
          <p className="text-sm text-muted-foreground">
            اشترك في الدورة للانضمام إلى مجموعة النقاش والتدبر الجماعي
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="flex flex-col">
      <div className="p-4 border-b flex items-center gap-2">
        <MessageSquare className="h-5 w-5 text-primary" />
        <h3 className="font-semibold">مجموعة الدردشة</h3>
        <span className="text-xs text-muted-foreground mr-auto">
          {messages.length} رسالة
        </span>
      </div>

      <ScrollArea className="h-[400px] p-4" ref={scrollRef}>
        {loading ? (
          <div className="flex items-center justify-center h-full">
            <Loader2 className="h-6 w-6 animate-spin text-primary" />
          </div>
        ) : messages.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-muted-foreground gap-2">
            <MessageSquare className="h-10 w-10" />
            <p className="text-sm">لا توجد رسائل بعد. ابدأ المحادثة!</p>
          </div>
        ) : (
          <div className="space-y-3">
            {messages.map((msg) => {
              const isOwn = msg.user_id === userId;
              return (
                <div
                  key={msg.id}
                  className={`flex gap-2 ${isOwn ? "flex-row-reverse" : ""}`}
                >
                  <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0 overflow-hidden">
                    {msg.avatar_url ? (
                      <img
                        src={msg.avatar_url}
                        alt=""
                        className="w-full h-full object-cover rounded-full"
                      />
                    ) : (
                      <User className="h-4 w-4 text-primary" />
                    )}
                  </div>
                  <div
                    className={`max-w-[75%] rounded-2xl px-4 py-2 ${
                      isOwn
                        ? "bg-primary text-primary-foreground rounded-br-sm"
                        : "bg-muted rounded-bl-sm"
                    }`}
                  >
                    {!isOwn && (
                      <p className="text-xs font-medium mb-1 opacity-70">
                        {msg.author_name}
                      </p>
                    )}
                    {/* Attachment */}
                    {msg.attachment_url && msg.attachment_type === "image" ? (
                      <a href={msg.attachment_url} target="_blank" rel="noopener noreferrer" className="block mb-1">
                        <img
                          src={msg.attachment_url}
                          alt="مرفق"
                          className="rounded-lg max-w-full max-h-48 object-cover"
                        />
                      </a>
                    ) : msg.attachment_url ? (
                      <a
                        href={msg.attachment_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className={`flex items-center gap-2 mb-1 text-xs underline ${
                          isOwn ? "text-primary-foreground/80" : "text-primary"
                        }`}
                      >
                        <FileText className="h-4 w-4" />
                        تحميل المرفق
                      </a>
                    ) : null}
                    {msg.message && !(msg.attachment_url && (msg.message === "📷 صورة" || msg.message === "📎 مرفق")) && (
                      <p className="text-sm leading-relaxed">{msg.message}</p>
                    )}
                    <p
                      className={`text-[10px] mt-1 ${
                        isOwn ? "text-primary-foreground/60" : "text-muted-foreground"
                      }`}
                    >
                      {formatDistanceToNow(new Date(msg.created_at), {
                        addSuffix: true,
                        locale: ar,
                      })}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </ScrollArea>

      {/* Attachment preview */}
      {attachmentFile && (
        <div className="px-3 pt-2 flex items-center gap-2">
          <div className="flex items-center gap-2 bg-muted rounded-lg px-3 py-1.5 text-sm flex-1">
            {attachmentPreview ? (
              <img src={attachmentPreview} alt="" className="w-8 h-8 rounded object-cover" />
            ) : (
              <FileText className="h-4 w-4 text-muted-foreground" />
            )}
            <span className="truncate text-xs">{attachmentFile.name}</span>
            {uploading && <Loader2 className="h-3 w-3 animate-spin" />}
          </div>
          <Button variant="ghost" size="icon" className="h-7 w-7" onClick={clearAttachment}>
            <X className="h-4 w-4" />
          </Button>
        </div>
      )}

      <div className="p-3 border-t flex gap-2">
        <input
          type="file"
          ref={fileInputRef}
          onChange={handleFileSelect}
          accept="image/*,.pdf,.doc,.docx,.txt"
          className="hidden"
        />
        <Button
          variant="ghost"
          size="icon"
          className="flex-shrink-0"
          onClick={() => fileInputRef.current?.click()}
          disabled={sending}
        >
          <Paperclip className="h-4 w-4" />
        </Button>
        <Input
          placeholder="اكتب رسالتك..."
          value={newMessage}
          onChange={(e) => setNewMessage(e.target.value)}
          onKeyDown={handleKeyDown}
          disabled={sending}
          className="flex-1"
        />
        <Button
          size="icon"
          onClick={handleSend}
          disabled={sending || (!newMessage.trim() && !attachmentFile)}
        >
          {sending ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <Send className="h-4 w-4" />
          )}
        </Button>
      </div>
    </Card>
  );
};

export default CourseGroupChat;

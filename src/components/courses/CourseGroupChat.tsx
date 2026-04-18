import { useState, useEffect, useRef } from "react";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Send, Loader2, MessageSquare, User, Lock, Paperclip, FileText, X } from "lucide-react";
import { formatDistanceToNow, ar } from "@/lib/date-utils";
import { listCourseChatMessages, sendCourseChatMessage, type CourseChatMessage } from "@/lib/backendCourses";

interface CourseGroupChatProps {
  courseId: string;
  userId: string | null;
  isSubscribed: boolean;
}

const CourseGroupChat = ({ courseId, userId, isSubscribed }: CourseGroupChatProps) => {
  const { toast } = useToast();
  const [messages, setMessages] = useState<CourseChatMessage[]>([]);
  const [newMessage, setNewMessage] = useState("");
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [attachmentFile, setAttachmentFile] = useState<File | null>(null);
  const [attachmentPreview, setAttachmentPreview] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isSubscribed && userId) {
      void fetchMessages();
      const intervalId = window.setInterval(() => {
        void fetchMessages();
      }, 15000);

      return () => {
        window.clearInterval(intervalId);
      };
    }

    setLoading(false);
    return undefined;
  }, [courseId, userId, isSubscribed]);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const fetchMessages = async () => {
    setLoading(true);

    try {
      const data = await listCourseChatMessages(courseId);
      setMessages(data);
    } finally {
      setLoading(false);
    }
  };

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
      toast({
        title: "ط®ط·ط£",
        description: "ط­ط¬ظ… ط§ظ„ظ…ظ„ظپ ظٹط¬ط¨ ط£ظ† ظ„ط§ ظٹطھط¬ط§ظˆط² 5 ظ…ظٹط¬ط§ط¨ط§ظٹطھ",
        variant: "destructive",
      });
      return;
    }

    setAttachmentFile(file);

    if (file.type.startsWith("image/")) {
      const reader = new FileReader();
      reader.onload = (loadEvent) => setAttachmentPreview(loadEvent.target?.result as string);
      reader.readAsDataURL(file);
      return;
    }

    setAttachmentPreview(null);
  };

  const clearAttachment = () => {
    setAttachmentFile(null);
    setAttachmentPreview(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const handleSend = async () => {
    if ((!newMessage.trim() && !attachmentFile) || !userId || sending) return;

    setSending(true);
    setUploading(Boolean(attachmentFile));

    try {
      await sendCourseChatMessage({
        courseId,
        userId,
        message: newMessage,
        attachmentFile,
      });
      setNewMessage("");
      clearAttachment();
      await fetchMessages();
    } catch {
      toast({
        title: "ط®ط·ط£",
        description: "ظپط´ظ„ ط¥ط±ط³ط§ظ„ ط§ظ„ط±ط³ط§ظ„ط©",
        variant: "destructive",
      });
    } finally {
      setSending(false);
      setUploading(false);
    }
  };

  const handleKeyDown = (event: React.KeyboardEvent<HTMLInputElement>) => {
    if (event.key === "Enter" && !event.shiftKey) {
      event.preventDefault();
      void handleSend();
    }
  };

  if (!isSubscribed) {
    return (
      <Card>
        <CardContent className="py-8 text-center space-y-3">
          <Lock className="h-10 w-10 text-muted-foreground mx-auto" />
          <p className="text-muted-foreground font-medium">
            ظ…ط¬ظ…ظˆط¹ط© ط§ظ„ط¯ط±ط¯ط´ط© ظ…طھط§ط­ط© ظ„ظ„ظ…ط´طھط±ظƒظٹظ† ظپظ‚ط·
          </p>
          <p className="text-sm text-muted-foreground">
            ط§ط´طھط±ظƒ ظپظٹ ط§ظ„ط¯ظˆط±ط© ظ„ظ„ط§ظ†ط¶ظ…ط§ظ… ط¥ظ„ظ‰ ظ…ط¬ظ…ظˆط¹ط© ط§ظ„ظ†ظ‚ط§ط´ ظˆط§ظ„طھط¯ط¨ط± ط§ظ„ط¬ظ…ط§ط¹ظٹ
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="flex flex-col">
      <div className="p-4 border-b flex items-center gap-2">
        <MessageSquare className="h-5 w-5 text-primary" />
        <h3 className="font-semibold">ظ…ط¬ظ…ظˆط¹ط© ط§ظ„ط¯ط±ط¯ط´ط©</h3>
        <span className="text-xs text-muted-foreground mr-auto">
          {messages.length} ط±ط³ط§ظ„ط©
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
            <p className="text-sm">ظ„ط§ طھظˆط¬ط¯ ط±ط³ط§ط¦ظ„ ط¨ط¹ط¯. ط§ط¨ط¯ط£ ط§ظ„ظ…ط­ط§ط¯ط«ط©!</p>
          </div>
        ) : (
          <div className="space-y-3">
            {messages.map((message) => {
              const isOwn = message.user_id === userId;
              const isAttachmentOnly =
                Boolean(message.attachment_url) &&
                (message.message === "تم إرفاق صورة" || message.message === "تم إرفاق ملف");

              return (
                <div
                  key={message.id}
                  className={`flex gap-2 ${isOwn ? "flex-row-reverse" : ""}`}
                >
                  <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0 overflow-hidden">
                    {message.avatar_url ? (
                      <img
                        src={message.avatar_url}
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
                        {message.author_name}
                      </p>
                    )}
                    {message.attachment_url && message.attachment_type === "image" ? (
                      <a href={message.attachment_url} target="_blank" rel="noopener noreferrer" className="block mb-1">
                        <img
                          src={message.attachment_url}
                          alt="مرفق"
                          className="rounded-lg max-w-full max-h-48 object-cover"
                        />
                      </a>
                    ) : message.attachment_url ? (
                      <a
                        href={message.attachment_url}
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
                    {message.message && !isAttachmentOnly && (
                      <p className="text-sm leading-relaxed">{message.message}</p>
                    )}
                    <p
                      className={`text-[10px] mt-1 ${
                        isOwn ? "text-primary-foreground/60" : "text-muted-foreground"
                      }`}
                    >
                      {formatDistanceToNow(new Date(message.created_at), {
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
          placeholder="ط§ظƒطھط¨ ط±ط³ط§ظ„طھظƒ..."
          value={newMessage}
          onChange={(event) => setNewMessage(event.target.value)}
          onKeyDown={handleKeyDown}
          disabled={sending}
          className="flex-1"
        />
        <Button
          size="icon"
          onClick={() => void handleSend()}
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

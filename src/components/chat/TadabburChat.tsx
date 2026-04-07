import { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { 
  Send, 
  Loader2, 
  Bot, 
  User, 
  Sparkles,
  BookOpen,
  X,
  Maximize2,
  Minimize2,
  Crown,
  AlertCircle
} from "lucide-react";
import ReactMarkdown from "react-markdown";
import { cn } from "@/lib/utils";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Link } from "react-router-dom";
import RootDecoder from "@/components/tadabbur/RootDecoder";

type Message = { role: "user" | "assistant"; content: string };

const CHAT_URL = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/tadabbur-chat`;
const DAILY_LIMIT = 20;

const SUGGESTED_PROMPTS = [
  "تدبر لي كلمة 'صبر' من خلال جذرها العربي",
  "ما الفرق بين 'قلب' و'فؤاد' في اللسان العربي؟",
  "فكك لي كلمة 'الرحمن' من حروفها",
  "تدبر معي آية الكرسي",
];

interface TadabburChatProps {
  isOpen: boolean;
  onClose: () => void;
}

const TadabburChat = ({ isOpen, onClose }: TadabburChatProps) => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);
  const [remainingMessages, setRemainingMessages] = useState<number | null>(null);
  const [isSubscriber, setIsSubscriber] = useState(false);
  const [limitReached, setLimitReached] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const { toast } = useToast();

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const streamChat = async (userMessages: Message[]) => {
    const { data: { session } } = await supabase.auth.getSession();
    
    if (!session) {
      throw new Error("يجب تسجيل الدخول لاستخدام المساعد");
    }

    const resp = await fetch(CHAT_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${session.access_token}`,
      },
      body: JSON.stringify({ messages: userMessages }),
    });

    if (!resp.ok) {
      const errorData = await resp.json().catch(() => ({}));
      
      if (errorData.limit_reached) {
        setLimitReached(true);
        setRemainingMessages(0);
      }
      
      throw new Error(errorData.error || "فشل الاتصال بالمساعد");
    }

    // Extract usage info from headers
    const remaining = resp.headers.get("X-Usage-Remaining");
    const subscriber = resp.headers.get("X-Is-Subscriber");
    
    if (remaining !== null) {
      const remainingNum = parseInt(remaining, 10);
      setRemainingMessages(remainingNum === -1 ? null : remainingNum);
    }
    if (subscriber !== null) {
      setIsSubscriber(subscriber === "true");
    }

    if (!resp.body) throw new Error("No response body");

    const reader = resp.body.getReader();
    const decoder = new TextDecoder();
    let textBuffer = "";
    let assistantContent = "";

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      textBuffer += decoder.decode(value, { stream: true });

      let newlineIndex: number;
      while ((newlineIndex = textBuffer.indexOf("\n")) !== -1) {
        let line = textBuffer.slice(0, newlineIndex);
        textBuffer = textBuffer.slice(newlineIndex + 1);

        if (line.endsWith("\r")) line = line.slice(0, -1);
        if (line.startsWith(":") || line.trim() === "") continue;
        if (!line.startsWith("data: ")) continue;

        const jsonStr = line.slice(6).trim();
        if (jsonStr === "[DONE]") break;

        try {
          const parsed = JSON.parse(jsonStr);
          const content = parsed.choices?.[0]?.delta?.content as string | undefined;
          if (content) {
            assistantContent += content;
            setMessages((prev) => {
              const last = prev[prev.length - 1];
              if (last?.role === "assistant") {
                return prev.map((m, i) =>
                  i === prev.length - 1 ? { ...m, content: assistantContent } : m
                );
              }
              return [...prev, { role: "assistant", content: assistantContent }];
            });
          }
        } catch {
          textBuffer = line + "\n" + textBuffer;
          break;
        }
      }
    }
  };

  const handleSend = async (text?: string) => {
    const messageText = text || input.trim();
    if (!messageText || limitReached) return;

    const userMessage: Message = { role: "user", content: messageText };
    setMessages((prev) => [...prev, userMessage]);
    setInput("");
    setIsLoading(true);

    try {
      await streamChat([...messages, userMessage]);
    } catch (e) {
      console.error(e);
      const errorMessage = e instanceof Error ? e.message : "حدث خطأ غير متوقع";
      
      if (!errorMessage.includes("استنفدت")) {
        setMessages((prev) => [
          ...prev,
          { role: "assistant", content: `عذراً، ${errorMessage}` },
        ]);
      }
      
      toast({
        title: "خطأ",
        description: errorMessage,
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  if (!isOpen) return null;

  return (
    <div
      className={cn(
        "fixed z-50 transition-all duration-300",
        isExpanded
          ? "inset-4 md:inset-8"
          : "bottom-4 left-4 right-4 md:left-auto md:right-4 md:w-96 h-[500px]"
      )}
    >
      <Card className="h-full flex flex-col shadow-2xl border-primary/20">
        <CardHeader className="py-3 px-4 border-b bg-primary/5 flex-shrink-0">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
                <BookOpen className="h-4 w-4 text-primary" />
              </div>
              <div>
                <CardTitle className="text-base">مساعد التدبر</CardTitle>
                {!isSubscriber && remainingMessages !== null && (
                  <p className="text-xs text-muted-foreground">
                    متبقي: {remainingMessages} من {DAILY_LIMIT} رسالة
                  </p>
                )}
                {isSubscriber && (
                  <div className="flex items-center gap-1">
                    <Crown className="h-3 w-3 text-amber-500" />
                    <span className="text-xs text-amber-600">غير محدود</span>
                  </div>
                )}
              </div>
            </div>
            <div className="flex items-center gap-1">
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8"
                onClick={() => setIsExpanded(!isExpanded)}
              >
                {isExpanded ? (
                  <Minimize2 className="h-4 w-4" />
                ) : (
                  <Maximize2 className="h-4 w-4" />
                )}
              </Button>
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8"
                onClick={onClose}
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </CardHeader>

        <ScrollArea className="flex-1 p-4" ref={scrollRef}>
          {messages.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-center space-y-4 py-6">
              <div className="w-16 h-16 rounded-full bg-accent/10 flex items-center justify-center">
                <Sparkles className="h-8 w-8 text-accent" />
              </div>
              <div className="space-y-2">
                <h3 className="font-display font-semibold">أهلاً بك في مساعد التدبر</h3>
                <p className="text-sm text-muted-foreground max-w-xs">
                  أنا مساعد التدبر في اللسان العربي المبين، هنا لأرافقك في فهم الجذور العربية واستكشاف معاني القرآن الكريم
                </p>
              </div>

              {/* Root Decoder integrated */}
              <div className="w-full px-2">
                <RootDecoder onDecode={(root) => handleSend(`فكك لي الجذر "${root}" من حيث المعنى اللغوي والدلالي في اللسان العربي`)} />
              </div>
              
              <div className="flex flex-wrap gap-2 justify-center">
                {SUGGESTED_PROMPTS.map((prompt, i) => (
                  <Button
                    key={i}
                    variant="outline"
                    size="sm"
                    className="text-xs"
                    onClick={() => handleSend(prompt)}
                    disabled={limitReached}
                  >
                    {prompt}
                  </Button>
                ))}
              </div>
              
              {!isSubscriber && (
                <div className="mt-2 p-3 rounded-xl bg-accent/5 border border-accent/20 max-w-xs">
                  <p className="text-xs text-muted-foreground">
                    <Crown className="h-3 w-3 inline text-accent ml-1" />
                    اشترك للحصول على رسائل غير محدودة
                  </p>
                </div>
              )}
            </div>
          ) : (
            <div className="space-y-4">
              {messages.map((msg, i) => (
                <div
                  key={i}
                  className={cn(
                    "flex gap-3",
                    msg.role === "user" ? "flex-row-reverse" : ""
                  )}
                >
                  <div
                    className={cn(
                      "w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0",
                      msg.role === "user"
                        ? "bg-primary text-primary-foreground"
                        : "bg-secondary"
                    )}
                  >
                    {msg.role === "user" ? (
                      <User className="h-4 w-4" />
                    ) : (
                      <Bot className="h-4 w-4" />
                    )}
                  </div>
                  <div
                    className={cn(
                      "rounded-2xl px-4 py-2 max-w-[80%]",
                      msg.role === "user"
                        ? "bg-primary text-primary-foreground"
                        : "bg-secondary"
                    )}
                  >
                    {msg.role === "assistant" ? (
                      <div className="prose prose-sm dark:prose-invert max-w-none">
                        <ReactMarkdown>{msg.content}</ReactMarkdown>
                      </div>
                    ) : (
                      <p className="text-sm">{msg.content}</p>
                    )}
                  </div>
                </div>
              ))}
              {isLoading && messages[messages.length - 1]?.role === "user" && (
                <div className="flex gap-3">
                  <div className="w-8 h-8 rounded-full bg-secondary flex items-center justify-center">
                    <Bot className="h-4 w-4" />
                  </div>
                  <div className="rounded-2xl px-4 py-2 bg-secondary">
                    <Loader2 className="h-4 w-4 animate-spin" />
                  </div>
                </div>
              )}
            </div>
          )}
        </ScrollArea>

        {limitReached ? (
          <CardContent className="p-4 border-t flex-shrink-0">
            <div className="text-center space-y-3">
              <div className="flex items-center justify-center gap-2 text-amber-600">
                <AlertCircle className="h-5 w-5" />
                <span className="text-sm font-medium">انتهت رسائلك اليومية</span>
              </div>
              <p className="text-xs text-muted-foreground">
                اشترك للحصول على رسائل غير محدودة ومميزات حصرية
              </p>
              <Button asChild className="w-full" size="sm">
                <Link to="/subscription">
                  <Crown className="h-4 w-4 ml-2" />
                  اشترك الآن
                </Link>
              </Button>
            </div>
          </CardContent>
        ) : (
          <CardContent className="p-3 border-t flex-shrink-0">
            <div className="flex gap-2">
              <Textarea
                placeholder="اكتب سؤالك هنا... مثلاً: تدبر لي كلمة 'عقد'"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={handleKeyDown}
                className="min-h-[44px] max-h-32 resize-none"
                disabled={isLoading}
              />
              <Button
                onClick={() => handleSend()}
                disabled={isLoading || !input.trim()}
                size="icon"
                className="h-11 w-11 shrink-0"
              >
                {isLoading ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Send className="h-4 w-4" />
                )}
              </Button>
            </div>
            {!isSubscriber && remainingMessages !== null && remainingMessages <= 5 && (
              <p className="text-xs text-center text-amber-600 mt-2">
                ⚠️ متبقي {remainingMessages} رسائل فقط اليوم
              </p>
            )}
          </CardContent>
        )}
      </Card>
    </div>
  );
};

export default TadabburChat;

import { useEffect, useMemo, useState } from "react";
import { HelpCircle, Loader2, MessageSquarePlus, Send } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { formatDistanceToNow, ar } from "@/lib/date-utils";
import {
  type BackendCommunityContext,
  type BackendCommunitySessionQuestion,
  createBackendSessionQuestion,
  listBackendSessionQuestions,
} from "@/lib/backendCommunity";

interface BackendSessionQuestionsPanelProps {
  context: BackendCommunityContext;
  canAsk: boolean;
  isAuthenticated: boolean;
}

const sessionQuestionStatusLabels: Record<string, string> = {
  pending: "قيد الانتظار",
  approved: "مقبول",
  answered: "تمت الإجابة",
  rejected: "مرفوض",
  archived: "مؤرشف",
};

const BackendSessionQuestionsPanel = ({
  context,
  canAsk,
  isAuthenticated,
}: BackendSessionQuestionsPanelProps) => {
  const { toast } = useToast();
  const [questions, setQuestions] = useState<BackendCommunitySessionQuestion[]>([]);
  const [nextCursor, setNextCursor] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [createOpen, setCreateOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [questionBody, setQuestionBody] = useState("");
  const [isAnonymous, setIsAnonymous] = useState(false);

  const title = useMemo(() => {
    switch (context.type) {
      case "audio_room":
        return "أسئلة الغرفة الصوتية";
      case "speaker":
        return "أسئلة المتحدث";
      default:
        return "أسئلة الجلسة";
    }
  }, [context.type]);

  const loadQuestions = async ({
    append = false,
    cursor,
  }: {
    append?: boolean;
    cursor?: string | null;
  } = {}) => {
    try {
      if (append) {
        setLoadingMore(true);
      } else {
        setLoading(true);
      }

      const response = await listBackendSessionQuestions({
        contextId: context.id,
        cursor,
        limit: 10,
      });

      setQuestions((current) =>
        append ? [...current, ...(response.items || [])] : response.items || [],
      );
      setNextCursor(response.next_cursor || null);
    } catch (error) {
      toast({
        title: "تعذر تحميل الأسئلة",
        description: error instanceof Error ? error.message : "حدث خطأ غير متوقع",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  };

  useEffect(() => {
    setQuestions([]);
    setNextCursor(null);
    setCreateOpen(false);
    setQuestionBody("");
    setIsAnonymous(false);
    void loadQuestions();
  }, [context.id]);

  const handleCreateQuestion = async () => {
    if (!isAuthenticated) {
      toast({
        title: "تسجيل الدخول مطلوب",
        description: "سجل الدخول أولًا حتى تتمكن من طرح سؤال.",
        variant: "destructive",
      });
      return;
    }

    if (!canAsk) {
      toast({
        title: "الجلسة غير متاحة للكتابة",
        description: "تعذر مزامنة جلسة المجتمع الحالية. أعد تسجيل الدخول ثم حاول مرة أخرى.",
        variant: "destructive",
      });
      return;
    }

    if (!questionBody.trim()) {
      toast({
        title: "السؤال مطلوب",
        description: "اكتب السؤال أولًا.",
        variant: "destructive",
      });
      return;
    }

    try {
      setSubmitting(true);
      await createBackendSessionQuestion({
        context_id: context.id,
        body: questionBody.trim(),
        is_anonymous: isAnonymous,
      });

      toast({
        title: "تم إرسال السؤال",
        description: "تمت إضافة السؤال إلى هذا السياق المجتمعي.",
      });
      setQuestionBody("");
      setIsAnonymous(false);
      setCreateOpen(false);
      await loadQuestions();
    } catch (error) {
      toast({
        title: "تعذر إرسال السؤال",
        description: error instanceof Error ? error.message : "حدث خطأ غير متوقع",
        variant: "destructive",
      });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <section className="rounded-2xl border bg-card p-5 space-y-4">
      <div className="flex items-start justify-between gap-3">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <HelpCircle className="h-4 w-4 text-primary" />
            <h2 className="text-lg font-display font-bold text-foreground">{title}</h2>
          </div>
          <p className="text-sm text-muted-foreground">
            الأسئلة المرتبطة بسياق: {context.title}
          </p>
        </div>
        <Button
          size="sm"
          className="gap-2"
          variant={createOpen ? "secondary" : "default"}
          onClick={() => setCreateOpen((value) => !value)}
        >
          <MessageSquarePlus className="h-4 w-4" />
          {createOpen ? "إغلاق" : "طرح سؤال"}
        </Button>
      </div>

      {createOpen && (
        <div className="rounded-xl border border-border/80 bg-background p-4 space-y-3">
          <Textarea
            placeholder="اكتب سؤالك المرتبط بهذه الجلسة..."
            rows={4}
            value={questionBody}
            onChange={(event) => setQuestionBody(event.target.value)}
          />
          <label className="flex items-center gap-2 text-sm text-muted-foreground">
            <input
              type="checkbox"
              checked={isAnonymous}
              onChange={(event) => setIsAnonymous(event.target.checked)}
            />
            إرسال السؤال بشكل مجهول
          </label>
          <Button onClick={handleCreateQuestion} disabled={submitting} className="gap-2">
            {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
            إرسال السؤال
          </Button>
        </div>
      )}

      {loading ? (
        <div className="py-8 flex items-center justify-center">
          <Loader2 className="h-6 w-6 animate-spin text-primary" />
        </div>
      ) : questions.length === 0 ? (
        <div className="rounded-xl border border-dashed text-center py-8 text-muted-foreground">
          لا توجد أسئلة في هذا السياق حتى الآن.
        </div>
      ) : (
        <div className="space-y-3">
          {questions.map((question) => (
            <div key={question.id} className="rounded-xl border bg-background p-4 space-y-2">
              <div className="flex items-center justify-between gap-3 flex-wrap">
                <div className="flex items-center gap-2 flex-wrap">
                  <Badge variant="secondary">
                    {sessionQuestionStatusLabels[question.status] || question.status}
                  </Badge>
                  <span className="text-xs text-muted-foreground">
                    {question.is_anonymous
                      ? "مجهول"
                      : question.asked_by?.name || "عضو المجتمع"}
                  </span>
                </div>
                <span className="text-xs text-muted-foreground">
                  {formatDistanceToNow(new Date(question.created_at), {
                    addSuffix: true,
                    locale: ar,
                  })}
                </span>
              </div>
              <p className="text-sm text-foreground whitespace-pre-wrap">{question.body}</p>
              {question.answer_text && (
                <div className="rounded-lg bg-primary/5 border border-primary/15 p-3 space-y-1">
                  <div className="text-xs text-primary font-medium">
                    {question.answered_by?.name
                      ? `إجابة ${question.answered_by.name}`
                      : "إجابة"}
                  </div>
                  <p className="text-sm text-foreground whitespace-pre-wrap">
                    {question.answer_text}
                  </p>
                </div>
              )}
            </div>
          ))}

          {nextCursor && (
            <div className="flex justify-center pt-2">
              <Button
                variant="outline"
                onClick={() => void loadQuestions({ append: true, cursor: nextCursor })}
                disabled={loadingMore}
              >
                {loadingMore ? <Loader2 className="h-4 w-4 animate-spin" /> : "تحميل المزيد"}
              </Button>
            </div>
          )}
        </div>
      )}
    </section>
  );
};

export default BackendSessionQuestionsPanel;

import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  ArrowRight,
  Flag,
  Loader2,
  MessageSquarePlus,
  Send,
  ThumbsUp,
} from "lucide-react";
import AppLayout from "@/components/layout/AppLayout";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import { formatDistanceToNow, ar } from "@/lib/date-utils";
import { hasBackendSession } from "@/lib/backendSession";
import {
  type BackendCommunityComment,
  type BackendCommunityPost,
  createBackendCommunityComment,
  getBackendCommunityPost,
  reactToBackendCommunityComment,
  reactToBackendCommunityPost,
} from "@/lib/backendCommunity";
import CommunityReportDialog from "@/components/community/CommunityReportDialog";
import PageMeta from "@/components/seo/PageMeta";

interface BackendPostDetailPageProps {
  postId: string;
}

const BackendPostDetailPage = ({ postId }: BackendPostDetailPageProps) => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { user } = useAuth();
  const [post, setPost] = useState<BackendCommunityPost | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [commentBody, setCommentBody] = useState("");
  const [replyTarget, setReplyTarget] = useState<{ id: string; name: string } | null>(null);
  const [reportPostOpen, setReportPostOpen] = useState(false);

  const isAuthenticated = Boolean(user);
  const backendSessionAvailable = hasBackendSession();
  const canInteract = isAuthenticated && backendSessionAvailable;

  const loadPost = async ({ silent = false }: { silent?: boolean } = {}) => {
    try {
      if (!silent) {
        setLoading(true);
      }
      const payload = await getBackendCommunityPost(postId);
      setPost(payload);
    } catch (error) {
      toast({
        title: "تعذر تحميل المنشور",
        description: error instanceof Error ? error.message : "حدث خطأ غير متوقع",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void loadPost();
  }, [postId]);

  const createdAtLabel = useMemo(() => {
    if (!post) return "";
    return formatDistanceToNow(new Date(post.created_at), {
      addSuffix: true,
      locale: ar,
    });
  }, [post]);

  const ensureInteractionSession = () => {
    if (!isAuthenticated) {
      toast({
        title: "تسجيل الدخول مطلوب",
        description: "سجل الدخول أولًا حتى تتمكن من التفاعل مع المجتمع.",
        variant: "destructive",
      });
      return false;
    }

    if (!backendSessionAvailable) {
      toast({
        title: "تعذر مزامنة جلسة المجتمع",
        description: "أعد تسجيل الدخول ثم حاول مرة أخرى.",
        variant: "destructive",
      });
      return false;
    }

    return true;
  };

  const handleLike = async () => {
    if (!post) return;
    if (!ensureInteractionSession()) return;

    try {
      await reactToBackendCommunityPost(post.id, !post.viewer_state?.liked);
      await loadPost({ silent: true });
    } catch (error) {
      toast({
        title: "تعذر تحديث الإعجاب",
        description: error instanceof Error ? error.message : "حدث خطأ غير متوقع",
        variant: "destructive",
      });
    }
  };

  const handleCommentLike = async (comment: BackendCommunityComment) => {
    if (!ensureInteractionSession()) return;

    try {
      await reactToBackendCommunityComment(comment.id, !comment.viewer_state?.liked);
      await loadPost({ silent: true });
    } catch (error) {
      toast({
        title: "تعذر تحديث الإعجاب",
        description: error instanceof Error ? error.message : "حدث خطأ غير متوقع",
        variant: "destructive",
      });
    }
  };

  const handleSubmitComment = async () => {
    if (!post) return;
    if (!ensureInteractionSession()) return;

    if (!post.viewer_state?.can_comment) {
      toast({
        title: "التعليق غير متاح",
        description: "هذا المنشور لا يقبل التعليقات حاليًا.",
        variant: "destructive",
      });
      return;
    }

    if (!commentBody.trim()) {
      toast({
        title: "التعليق فارغ",
        description: "اكتب تعليقًا أولًا.",
        variant: "destructive",
      });
      return;
    }

    try {
      setSubmitting(true);
      await createBackendCommunityComment(post.id, commentBody.trim(), replyTarget?.id);
      setCommentBody("");
      setReplyTarget(null);
      await loadPost({ silent: true });
    } catch (error) {
      toast({
        title: "تعذر إرسال التعليق",
        description: error instanceof Error ? error.message : "حدث خطأ غير متوقع",
        variant: "destructive",
      });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <AppLayout>
      <PageMeta
        title={post?.title || "تفاصيل المنشور"}
        description="تفاصيل منشور المجتمع الرسمي عبر Community Lite في الباك إند."
        path={`/community/${postId}`}
      />
      <div className="px-4 py-6 space-y-6">
        <Button variant="ghost" onClick={() => navigate("/community")} className="gap-2 px-0">
          <ArrowRight className="h-4 w-4" />
          العودة إلى المجتمع
        </Button>

        {loading ? (
          <div className="py-16 flex items-center justify-center">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : !post ? (
          <div className="rounded-2xl border bg-card text-muted-foreground text-center py-16">
            لم يتم العثور على المنشور.
          </div>
        ) : (
          <>
            <div className="rounded-2xl border bg-card p-5 space-y-4">
              <div className="flex items-start gap-3">
                <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                  <span className="text-sm font-medium text-primary">
                    {post.author?.name?.charAt(0) || "م"}
                  </span>
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-medium text-sm text-foreground">{post.author?.name || "عضو"}</span>
                    <Badge variant="secondary">{post.primary_context?.title || "المجتمع"}</Badge>
                    {post.kind === "announcement" && <Badge variant="outline">إعلان</Badge>}
                    {post.pin?.id && <Badge variant="outline">مثبت</Badge>}
                  </div>
                  <span className="text-xs text-muted-foreground">{createdAtLabel}</span>
                </div>
              </div>

              {post.title && (
                <h1 className="text-xl font-display font-bold text-foreground">{post.title}</h1>
              )}

              <p className="text-sm text-muted-foreground whitespace-pre-wrap leading-7">{post.body}</p>

              <div className="flex items-center gap-2 pt-3 border-t border-border">
                <Button variant="ghost" size="sm" className="gap-2" onClick={handleLike}>
                  <ThumbsUp
                    className={`h-4 w-4 ${post.viewer_state?.liked ? "fill-primary text-primary" : ""}`}
                  />
                  <span>{post.counts?.reactions || 0}</span>
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  className="gap-2"
                  onClick={() =>
                    document.getElementById("backend-community-comment-box")?.scrollIntoView({
                      behavior: "smooth",
                      block: "center",
                    })
                  }
                >
                  <MessageSquarePlus className="h-4 w-4" />
                  <span>{post.counts?.comments || 0}</span>
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  className="gap-2 mr-auto text-muted-foreground hover:text-destructive"
                  onClick={() => setReportPostOpen(true)}
                >
                  <Flag className="h-4 w-4" />
                  <span className="hidden sm:inline">تبليغ</span>
                </Button>
              </div>
            </div>

            <div className="space-y-3">
              <div className="flex items-center justify-between gap-2">
                <h2 className="text-lg font-display font-bold text-foreground">التعليقات</h2>
                {!isAuthenticated && (
                  <Badge variant="outline">سجل الدخول للتفاعل</Badge>
                )}
                {isAuthenticated && !backendSessionAvailable && (
                  <Badge variant="outline">أعد تسجيل الدخول للتفاعل</Badge>
                )}
              </div>

              {(post.comments || []).length === 0 ? (
                <div className="rounded-2xl border bg-card p-8 text-center text-muted-foreground">
                  لا توجد تعليقات حتى الآن.
                </div>
              ) : (
                <div className="space-y-3">
                  {(post.comments || []).map((comment) => (
                    <BackendCommentCard
                      key={comment.id}
                      comment={comment}
                      canInteract={canInteract}
                      canReply={Boolean(comment.viewer_state?.can_reply)}
                      onReply={() => setReplyTarget({ id: comment.id, name: comment.author.name })}
                      onLike={(targetComment) => void handleCommentLike(targetComment)}
                    />
                  ))}
                </div>
              )}
            </div>

            <div id="backend-community-comment-box" className="rounded-2xl border bg-card p-5 space-y-3">
              <div className="flex items-center justify-between gap-2">
                <h3 className="font-semibold text-foreground">
                  {replyTarget ? `رد على ${replyTarget.name}` : "تعليق جديد"}
                </h3>
                {replyTarget && (
                  <Button variant="ghost" size="sm" onClick={() => setReplyTarget(null)}>
                    إلغاء الرد
                  </Button>
                )}
              </div>

              <Textarea
                value={commentBody}
                onChange={(event) => setCommentBody(event.target.value)}
                placeholder="اكتب تعليقك..."
                rows={4}
                disabled={!post.viewer_state?.can_comment}
              />

              <Button
                onClick={handleSubmitComment}
                disabled={submitting || !post.viewer_state?.can_comment}
                className="gap-2"
              >
                {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
                إرسال التعليق
              </Button>
            </div>
          </>
        )}
      </div>

      {post && (
        <CommunityReportDialog
          open={reportPostOpen}
          onOpenChange={setReportPostOpen}
          targetType="post"
          targetId={post.id}
          targetLabel="المنشور"
          targetPreview={post.title || post.body}
        />
      )}
    </AppLayout>
  );
};

const BackendCommentCard = ({
  comment,
  canInteract,
  canReply,
  onReply,
  onLike,
}: {
  comment: BackendCommunityComment;
  canInteract: boolean;
  canReply: boolean;
  onReply: () => void;
  onLike: (comment: BackendCommunityComment) => void;
}) => {
  const createdAtLabel = formatDistanceToNow(new Date(comment.created_at), {
    addSuffix: true,
    locale: ar,
  });
  const [reportOpen, setReportOpen] = useState(false);

  return (
    <div className="rounded-2xl border bg-card p-4 space-y-3">
      <div className="flex items-start gap-3">
        <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
          <span className="text-xs font-medium text-primary">
            {comment.author?.name?.charAt(0) || "م"}
          </span>
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="font-medium text-sm text-foreground">{comment.author?.name || "عضو"}</span>
            <span className="text-xs text-muted-foreground">{createdAtLabel}</span>
          </div>
          <p className="text-sm text-muted-foreground mt-1 whitespace-pre-wrap">{comment.body}</p>
        </div>
      </div>

      <div className="flex items-center gap-2 flex-wrap">
        <Button
          variant="ghost"
          size="sm"
          className="gap-2 px-0"
          onClick={() => onLike(comment)}
          disabled={!canInteract}
        >
          <ThumbsUp
            className={`h-4 w-4 ${comment.viewer_state?.liked ? "fill-primary text-primary" : ""}`}
          />
          <span>{comment.counts?.reactions || 0}</span>
        </Button>

        {comment.parent_comment_id == null && canReply && (
          <Button variant="ghost" size="sm" className="gap-2 px-0" onClick={onReply}>
            <MessageSquarePlus className="h-4 w-4" />
            رد
          </Button>
        )}

        <Button
          variant="ghost"
          size="sm"
          className="gap-2 px-0 text-muted-foreground hover:text-destructive"
          onClick={() => setReportOpen(true)}
        >
          <Flag className="h-4 w-4" />
          تبليغ
        </Button>
      </div>

      {comment.replies?.length > 0 && (
        <div className="mr-5 border-r pr-4 space-y-3">
          {comment.replies.map((reply) => (
            <BackendCommentCard
              key={reply.id}
              comment={reply}
              canInteract={canInteract}
              canReply={false}
              onReply={() => undefined}
              onLike={onLike}
            />
          ))}
        </div>
      )}

      <CommunityReportDialog
        open={reportOpen}
        onOpenChange={setReportOpen}
        targetType="comment"
        targetId={comment.id}
        targetLabel="التعليق"
        targetPreview={comment.body}
      />
    </div>
  );
};

export default BackendPostDetailPage;

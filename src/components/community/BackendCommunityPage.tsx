import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Flag,
  Loader2,
  MessageSquarePlus,
  RefreshCw,
  ShieldAlert,
  ThumbsUp,
} from "lucide-react";
import AppLayout from "@/components/layout/AppLayout";
import PageMeta from "@/components/seo/PageMeta";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import { formatDistanceToNow, ar } from "@/lib/date-utils";
import { hasBackendSession } from "@/lib/backendSession";
import {
  type BackendCommunityContext,
  type BackendCommunityPost,
  createBackendCommunityPost,
  listBackendCommunityContexts,
  listBackendCommunityFeed,
  reactToBackendCommunityPost,
} from "@/lib/backendCommunity";
import CommunityReportDialog from "@/components/community/CommunityReportDialog";
import BackendSessionQuestionsPanel from "@/components/community/BackendSessionQuestionsPanel";

const SESSION_QUESTION_CONTEXT_TYPES = new Set(["workshop", "audio_room", "speaker"]);

const BackendCommunityPage = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { user } = useAuth();
  const [contexts, setContexts] = useState<BackendCommunityContext[]>([]);
  const [selectedContextId, setSelectedContextId] = useState<string>("all");
  const [pinnedPosts, setPinnedPosts] = useState<BackendCommunityPost[]>([]);
  const [posts, setPosts] = useState<BackendCommunityPost[]>([]);
  const [nextCursor, setNextCursor] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [createOpen, setCreateOpen] = useState(false);
  const [creating, setCreating] = useState(false);
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [createContextId, setCreateContextId] = useState<string>("");

  const isAuthenticated = Boolean(user);
  const backendSessionAvailable = hasBackendSession();
  const canWrite = isAuthenticated && backendSessionAvailable;

  const selectedContext = useMemo(
    () => contexts.find((context) => context.id === selectedContextId) || null,
    [contexts, selectedContextId],
  );

  const selectedContextSupportsQuestions = Boolean(
    selectedContext && SESSION_QUESTION_CONTEXT_TYPES.has(selectedContext.type),
  );

  const activeCreateContextId = useMemo(() => {
    if (createContextId) return createContextId;
    if (selectedContextId !== "all") return selectedContextId;
    return contexts[0]?.id || "";
  }, [createContextId, selectedContextId, contexts]);

  const loadData = async ({
    silent = false,
    append = false,
    cursor,
  }: {
    silent?: boolean;
    append?: boolean;
    cursor?: string | null;
  } = {}) => {
    try {
      if (append) {
        setLoadingMore(true);
      } else if (silent) {
        setRefreshing(true);
      } else {
        setLoading(true);
      }

      const scopedContextId = selectedContextId === "all" ? undefined : selectedContextId;
      const [contextsResult, feedResult] = await Promise.all([
        append ? Promise.resolve(contexts) : listBackendCommunityContexts(),
        listBackendCommunityFeed({
          contextId: scopedContextId,
          cursor,
          limit: 12,
        }),
      ]);

      if (!append) {
        setContexts(contextsResult);
        setPinnedPosts(feedResult.pinned_items || []);

        if (!createContextId && contextsResult.length > 0) {
          setCreateContextId(
            selectedContextId !== "all" ? selectedContextId : contextsResult[0].id,
          );
        }
      }

      setPosts((current) =>
        append ? [...current, ...(feedResult.items || [])] : feedResult.items || [],
      );
      setNextCursor(feedResult.next_cursor || null);
    } catch (error) {
      toast({
        title: "تعذر تحميل المجتمع",
        description: error instanceof Error ? error.message : "حدث خطأ غير متوقع",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
      setRefreshing(false);
      setLoadingMore(false);
    }
  };

  useEffect(() => {
    setPosts([]);
    setPinnedPosts([]);
    setNextCursor(null);
    void loadData();
  }, [selectedContextId]);

  const handleLike = async (post: BackendCommunityPost) => {
    if (!isAuthenticated) {
      toast({
        title: "تسجيل الدخول مطلوب",
        description: "سجل الدخول أولًا حتى تتمكن من التفاعل مع المجتمع.",
        variant: "destructive",
      });
      return;
    }

    if (!backendSessionAvailable) {
      toast({
        title: "تعذر مزامنة جلسة المجتمع",
        description: "أعد تسجيل الدخول ثم حاول مرة أخرى.",
        variant: "destructive",
      });
      return;
    }

    try {
      await reactToBackendCommunityPost(post.id, !post.viewer_state?.liked);
      await loadData({ silent: true });
    } catch (error) {
      toast({
        title: "تعذر تحديث التفاعل",
        description: error instanceof Error ? error.message : "حدث خطأ غير متوقع",
        variant: "destructive",
      });
    }
  };

  const handleCreatePost = async () => {
    if (!isAuthenticated) {
      toast({
        title: "تسجيل الدخول مطلوب",
        description: "سجل الدخول أولًا حتى تتمكن من النشر.",
        variant: "destructive",
      });
      return;
    }

    if (!backendSessionAvailable) {
      toast({
        title: "تعذر مزامنة جلسة المجتمع",
        description: "أعد تسجيل الدخول ثم حاول مرة أخرى.",
        variant: "destructive",
      });
      return;
    }

    if (!activeCreateContextId) {
      toast({
        title: "لا توجد مساحة متاحة",
        description: "لم يتم العثور على مساحة مجتمع صالحة للنشر.",
        variant: "destructive",
      });
      return;
    }

    if (!body.trim()) {
      toast({
        title: "النص مطلوب",
        description: "اكتب نص المنشور أولًا.",
        variant: "destructive",
      });
      return;
    }

    try {
      setCreating(true);
      await createBackendCommunityPost({
        primary_context_id: activeCreateContextId,
        title: title.trim() || undefined,
        body: body.trim(),
      });

      setCreateOpen(false);
      setTitle("");
      setBody("");
      await loadData({ silent: true });
      toast({
        title: "تم النشر",
        description: "تم إنشاء المنشور في المجتمع الرسمي عبر الباك إند.",
      });
    } catch (error) {
      toast({
        title: "تعذر إنشاء المنشور",
        description: error instanceof Error ? error.message : "حدث خطأ غير متوقع",
        variant: "destructive",
      });
    } finally {
      setCreating(false);
    }
  };

  return (
    <AppLayout>
      <PageMeta
        title="المجتمع"
        description="واجهة المجتمع الرسمية المرتبطة بموديول Community Lite في الباك إند."
        path="/community"
      />
      <div className="px-4 py-6 space-y-6">
        <div className="flex items-start justify-between gap-3">
          <div className="space-y-2">
            <div className="flex items-center gap-2 flex-wrap">
              <h1 className="text-xl font-display font-bold text-foreground">المجتمع</h1>
              <Badge variant="secondary">Backend-Owned</Badge>
              {!isAuthenticated && (
                <Badge variant="outline">تصفح فقط</Badge>
              )}
            </div>
            <p className="text-sm text-muted-foreground max-w-2xl">
              هذه هي طبقة المجتمع الرسمية للمنصة. جميع مسارات المجتمع الأساسية في الويب
              تعمل الآن عبر الباك إند مباشرة.
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              className="gap-2"
              onClick={() => void loadData({ silent: true })}
              disabled={refreshing}
            >
              {refreshing ? <Loader2 className="h-4 w-4 animate-spin" /> : <RefreshCw className="h-4 w-4" />}
              تحديث
            </Button>
            <Dialog open={createOpen} onOpenChange={setCreateOpen}>
              <DialogTrigger asChild>
                <Button size="sm" className="gap-2">
                  <MessageSquarePlus className="h-4 w-4" />
                  منشور جديد
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-md mx-4">
                <DialogHeader>
                  <DialogTitle className="font-display">إنشاء منشور جديد</DialogTitle>
                </DialogHeader>
                <div className="space-y-4">
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-foreground">المساحة</label>
                    <select
                      className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm"
                      value={activeCreateContextId}
                      onChange={(event) => setCreateContextId(event.target.value)}
                    >
                      {contexts.map((context) => (
                        <option key={context.id} value={context.id}>
                          {context.title}
                        </option>
                      ))}
                    </select>
                  </div>
                  <Input
                    placeholder="عنوان اختياري"
                    value={title}
                    onChange={(event) => setTitle(event.target.value)}
                  />
                  <Textarea
                    placeholder="اكتب منشورك..."
                    value={body}
                    onChange={(event) => setBody(event.target.value)}
                    rows={5}
                  />
                  {!canWrite && (
                    <div className="rounded-lg border border-amber-300/50 bg-amber-50 dark:bg-amber-950/20 p-3 text-sm text-muted-foreground">
                      سجل الدخول أولًا حتى تتمكن من النشر في المجتمع.
                    </div>
                  )}
                  <Button onClick={handleCreatePost} disabled={creating} className="w-full">
                    {creating ? <Loader2 className="h-4 w-4 animate-spin" /> : "نشر"}
                  </Button>
                </div>
              </DialogContent>
            </Dialog>
          </div>
        </div>

        <div className="flex flex-wrap gap-2">
          <Button
            variant={selectedContextId === "all" ? "default" : "outline"}
            size="sm"
            onClick={() => setSelectedContextId("all")}
          >
            الكل
          </Button>
          {contexts.map((context) => (
            <Button
              key={context.id}
              variant={selectedContextId === context.id ? "default" : "outline"}
              size="sm"
              onClick={() => setSelectedContextId(context.id)}
            >
              {context.title}
            </Button>
          ))}
        </div>

        {loading ? (
          <div className="py-16 flex items-center justify-center">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : (
          <div className="space-y-4">
            {pinnedPosts.length > 0 && (
              <section className="space-y-3">
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <ShieldAlert className="h-4 w-4" />
                  منشورات مثبتة
                </div>
                {pinnedPosts.map((post) => (
                  <BackendPostCard
                    key={`pinned-${post.id}`}
                    post={post}
                    pinned
                    onOpen={() => navigate(`/community/${post.id}`)}
                    onLike={() => void handleLike(post)}
                  />
                ))}
              </section>
            )}

            {posts.length === 0 ? (
              <div className="text-center py-14 text-muted-foreground border rounded-2xl bg-card">
                لا توجد منشورات حالية في هذا السياق.
              </div>
            ) : (
              <>
                {posts.map((post) => (
                  <BackendPostCard
                    key={post.id}
                    post={post}
                    onOpen={() => navigate(`/community/${post.id}`)}
                    onLike={() => void handleLike(post)}
                  />
                ))}
                {nextCursor && (
                  <div className="flex justify-center pt-2">
                    <Button
                      variant="outline"
                      onClick={() => void loadData({ append: true, cursor: nextCursor })}
                      disabled={loadingMore}
                    >
                      {loadingMore ? <Loader2 className="h-4 w-4 animate-spin" /> : "تحميل المزيد"}
                    </Button>
                  </div>
                )}
              </>
            )}
          </div>
        )}

        {selectedContext && selectedContextSupportsQuestions && (
          <BackendSessionQuestionsPanel
            context={selectedContext}
            canAsk={canWrite}
            isAuthenticated={isAuthenticated}
          />
        )}
      </div>
    </AppLayout>
  );
};

const BackendPostCard = ({
  post,
  pinned = false,
  onOpen,
  onLike,
}: {
  post: BackendCommunityPost;
  pinned?: boolean;
  onOpen: () => void;
  onLike: () => void;
}) => {
  const createdAtLabel = formatDistanceToNow(new Date(post.created_at), {
    addSuffix: true,
    locale: ar,
  });
  const [reportOpen, setReportOpen] = useState(false);

  return (
    <div className="post-card animate-fade-in">
      <div className="flex items-start gap-3 mb-3">
        <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
          <span className="text-sm font-medium text-primary">
            {post.author?.name?.charAt(0) || "م"}
          </span>
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="font-medium text-sm text-foreground">
              {post.author?.name || "عضو"}
            </span>
            <Badge variant="secondary">{post.primary_context?.title || "المجتمع"}</Badge>
            {post.kind === "announcement" && <Badge variant="outline">إعلان</Badge>}
            {pinned && <Badge variant="outline">مثبت</Badge>}
          </div>
          <span className="text-xs text-muted-foreground">{createdAtLabel}</span>
        </div>
      </div>

      {post.title && (
        <h3
          className="font-display font-semibold text-foreground mb-2 cursor-pointer hover:text-primary transition-colors"
          onClick={onOpen}
        >
          {post.title}
        </h3>
      )}

      <p
        className="text-sm text-muted-foreground mb-4 cursor-pointer line-clamp-4 whitespace-pre-wrap"
        onClick={onOpen}
      >
        {post.body}
      </p>

      <div className="flex items-center gap-2 pt-3 border-t border-border">
        <Button
          variant="ghost"
          size="sm"
          className="gap-2 text-muted-foreground hover:text-primary"
          onClick={onLike}
        >
          <ThumbsUp
            className={`h-4 w-4 ${post.viewer_state?.liked ? "fill-primary text-primary" : ""}`}
          />
          <span>{post.counts?.reactions || 0}</span>
        </Button>
        <Button
          variant="ghost"
          size="sm"
          className="gap-2 text-muted-foreground hover:text-primary"
          onClick={onOpen}
        >
          <MessageSquarePlus className="h-4 w-4" />
          <span>{post.counts?.comments || 0}</span>
        </Button>
        <Button
          variant="ghost"
          size="sm"
          className="gap-2 text-muted-foreground hover:text-destructive mr-auto"
          onClick={() => setReportOpen(true)}
        >
          <Flag className="h-4 w-4" />
          <span className="hidden sm:inline">تبليغ</span>
        </Button>
      </div>

      <CommunityReportDialog
        open={reportOpen}
        onOpenChange={setReportOpen}
        targetType="post"
        targetId={post.id}
        targetLabel="المنشور"
        targetPreview={post.title || post.body}
      />
    </div>
  );
};

export default BackendCommunityPage;

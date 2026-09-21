import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import AppLayout from "@/components/layout/AppLayout";
import ContentCard from "@/components/content/ContentCard";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import {
  type BackendCommunityContext,
  type BackendCommunityPost,
  listBackendCommunityContexts,
  listBackendCommunityFeed,
  reactToBackendCommunityPost,
} from "@/lib/backendCommunity";
import {
  listLibraryContent,
  type BackendContentItem,
} from "@/lib/backendContent";
import { Heart, Users, BookOpen, Loader2, MessageCircle, ThumbsUp } from "lucide-react";
import { formatDistanceToNow, ar } from "@/lib/date-utils";

const isSudanContext = (context: BackendCommunityContext) => {
  const haystack = [
    context.slug,
    context.title,
    context.subtitle,
    context.source_id,
  ]
    .filter(Boolean)
    .join(" ")
    .toLowerCase();

  return (
    context.source_id === "sudan_awareness" ||
    haystack.includes("sudan") ||
    haystack.includes("السودان") ||
    haystack.includes("السوداني")
  );
};

const SudanAwareness = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { user } = useAuth();
  const [contents, setContents] = useState<BackendContentItem[]>([]);
  const [posts, setPosts] = useState<BackendCommunityPost[]>([]);
  const [context, setContext] = useState<BackendCommunityContext | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshingPostId, setRefreshingPostId] = useState<string | null>(null);

  const loadData = async () => {
    setLoading(true);
    try {
      const [contentData, contexts] = await Promise.all([
        listLibraryContent({ isSudanAwareness: true }),
        listBackendCommunityContexts(),
      ]);

      const sudanContext = contexts.find(isSudanContext) || null;
      setContents(contentData.slice(0, 5));
      setContext(sudanContext);

      if (!sudanContext) {
        setPosts([]);
        return;
      }

      const feed = await listBackendCommunityFeed({
        contextId: sudanContext.id,
        limit: 5,
      });
      setPosts([...(feed.pinned_items || []), ...(feed.items || [])].slice(0, 5));
    } catch (error) {
      toast({
        title: "تعذر تحميل صفحة السودان",
        description: error instanceof Error ? error.message : "حدث خطأ غير متوقع",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void loadData();
  }, []);

  const handleLike = async (post: BackendCommunityPost) => {
    if (!user) {
      toast({
        title: "تسجيل الدخول مطلوب",
        description: "سجل الدخول أولاً للتفاعل مع منشورات المجتمع.",
        variant: "destructive",
      });
      return;
    }

    try {
      setRefreshingPostId(post.id);
      await reactToBackendCommunityPost(post.id, !post.viewer_state?.liked);
      if (context) {
        const feed = await listBackendCommunityFeed({ contextId: context.id, limit: 5 });
        setPosts([...(feed.pinned_items || []), ...(feed.items || [])].slice(0, 5));
      }
    } catch (error) {
      toast({
        title: "تعذر تحديث التفاعل",
        description: error instanceof Error ? error.message : "حدث خطأ غير متوقع",
        variant: "destructive",
      });
    } finally {
      setRefreshingPostId(null);
    }
  };

  return (
    <AppLayout>
      <div className="mx-auto w-full max-w-5xl space-y-8 px-4 py-6 sm:px-6 sm:py-10">
        <section className="max-w-2xl space-y-3">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-sudan-red/10">
            <Heart className="h-6 w-6 text-sudan-red" />
          </div>
          <div>
            <p className="text-sm font-semibold text-spiritual-green">مساحة معرفة ومجتمع</p>
            <h1 className="mt-1 text-2xl font-bold text-foreground sm:text-3xl">
              مبادرة الوعي السوداني
            </h1>
          </div>
          <p className="text-sm leading-7 text-muted-foreground sm:text-base">
            محتوى ونقاشات تساعد على فهم الواقع السوداني بوعي، وربط المعرفة بالمسؤولية والمجتمع.
          </p>
        </section>

        <div className="flex h-2 overflow-hidden rounded-full" aria-hidden="true">
          <div className="flex-1 bg-sudan-black" />
          <div className="flex-1 bg-sudan-red" />
          <div className="flex-1 bg-sudan-green" />
        </div>

        <section className="grid grid-cols-2 gap-4" aria-label="ملخص الصفحة">
          <Card className="shadow-none">
            <CardContent className="p-4 text-center">
              <BookOpen className="mx-auto mb-2 h-6 w-6 text-primary" />
              <div className="text-2xl font-bold text-foreground">{contents.length}</div>
              <div className="text-xs text-muted-foreground">مواد مختارة</div>
            </CardContent>
          </Card>
          <Card className="shadow-none">
            <CardContent className="p-4 text-center">
              <Users className="mx-auto mb-2 h-6 w-6 text-sudan-red" />
              <div className="text-2xl font-bold text-foreground">{posts.length}</div>
              <div className="text-xs text-muted-foreground">منشورات المجتمع</div>
            </CardContent>
          </Card>
        </section>

        <section className="space-y-4">
          <div>
            <p className="text-sm font-semibold text-spiritual-green">للقراءة والمشاهدة</p>
            <h2 className="mt-1 text-lg font-bold text-foreground">أحدث المحتوى التوعوي</h2>
          </div>

          {loading ? (
            <div className="flex justify-center py-10">
              <Loader2 className="h-6 w-6 animate-spin text-primary" />
            </div>
          ) : contents.length === 0 ? (
            <div className="rounded-2xl border border-dashed py-10 text-center text-sm text-muted-foreground">
              لا يوجد محتوى متاح حالياً.
            </div>
          ) : (
            <div className="space-y-3">
              {contents.map((content) => (
                <ContentCard
                  key={content.id}
                  id={content.id}
                  title={content.title}
                  description={content.description}
                  type={content.type}
                  category={content.category}
                  depthLevel={content.depth_level}
                  isSudanAwareness
                />
              ))}
            </div>
          )}
        </section>

        <section className="space-y-4">
          <div className="flex items-end justify-between gap-3">
            <div>
              <p className="text-sm font-semibold text-spiritual-green">من مجتمع المدرسة</p>
              <h2 className="mt-1 text-lg font-bold text-foreground">أحدث النقاشات</h2>
            </div>
            {context && (
              <Button variant="outline" size="sm" onClick={() => navigate("/community")}>
                عرض المجتمع
              </Button>
            )}
          </div>

          {loading ? (
            <div className="flex justify-center py-10">
              <Loader2 className="h-6 w-6 animate-spin text-primary" />
            </div>
          ) : !context ? (
            <div className="rounded-2xl border border-dashed py-10 text-center text-sm text-muted-foreground">
              مساحة السودان في المجتمع لم تُهيأ بعد.
            </div>
          ) : posts.length === 0 ? (
            <div className="rounded-2xl border border-dashed py-10 text-center text-sm text-muted-foreground">
              لا توجد منشورات حالياً في مساحة السودان.
            </div>
          ) : (
            <div className="space-y-3">
              {posts.map((post) => (
                <article key={post.id} className="rounded-2xl border border-border bg-card p-4 shadow-sm sm:p-5">
                  <div className="mb-3 flex items-center justify-between gap-3">
                    <div className="min-w-0">
                      <p className="truncate text-sm font-semibold text-foreground">
                        {post.author?.name || "عضو"}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {formatDistanceToNow(new Date(post.created_at), {
                          addSuffix: true,
                          locale: ar,
                        })}
                      </p>
                    </div>
                    <span className="rounded-full bg-secondary px-2.5 py-1 text-xs text-secondary-foreground">
                      {post.primary_context?.title || "السودان"}
                    </span>
                  </div>

                  {post.title && (
                    <button
                      type="button"
                      onClick={() => navigate(`/community/${post.id}`)}
                      className="mb-2 block w-full text-right font-semibold text-foreground hover:text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                    >
                      {post.title}
                    </button>
                  )}

                  <p className="line-clamp-4 whitespace-pre-wrap text-sm leading-7 text-muted-foreground">
                    {post.body}
                  </p>

                  <div className="mt-4 flex items-center gap-2 border-t border-border pt-3">
                    <Button
                      variant="ghost"
                      size="sm"
                      className="gap-2"
                      disabled={refreshingPostId === post.id}
                      onClick={() => void handleLike(post)}
                    >
                      {refreshingPostId === post.id ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <ThumbsUp className={`h-4 w-4 ${post.viewer_state?.liked ? "fill-primary text-primary" : ""}`} />
                      )}
                      <span>{post.counts?.reactions || 0}</span>
                    </Button>

                    <Button
                      variant="ghost"
                      size="sm"
                      className="gap-2"
                      onClick={() => navigate(`/community/${post.id}`)}
                    >
                      <MessageCircle className="h-4 w-4" />
                      <span>{post.counts?.comments || 0}</span>
                    </Button>
                  </div>
                </article>
              ))}
            </div>
          )}
        </section>
      </div>
    </AppLayout>
  );
};

export default SudanAwareness;

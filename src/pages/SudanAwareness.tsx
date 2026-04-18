/**
 * STEP 2 transitional marker:
 * Sudan awareness still embeds legacy Supabase community widgets for a dedicated content surface.
 * It is not the primary `/community` owner anymore and should remain frozen until migrated.
 */
import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import AppLayout from "@/components/layout/AppLayout";
import ContentCard from "@/components/content/ContentCard";
import PostCard from "@/components/community/PostCard";
import PostCommentsDialog from "@/components/community/PostCommentsDialog";
import { Heart, Users, BookOpen } from "lucide-react";

const SudanAwareness = () => {
  const { toast } = useToast();
  const [contents, setContents] = useState<any[]>([]);
  const [posts, setPosts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState<any>(null);
  const [userLikes, setUserLikes] = useState<Set<string>>(new Set());
  const [commentPostId, setCommentPostId] = useState<string | null>(null);
  const [commentPostTitle, setCommentPostTitle] = useState("");

  useEffect(() => {
    const init = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      setUser(user);
      await fetchData(user);
    };
    init();
  }, []);

  const fetchData = async (currentUser?: any) => {
    setLoading(true);

    // Fetch Sudan awareness content
    const { data: contentData } = await supabase
      .from("contents")
      .select("*")
      .eq("is_sudan_awareness", true)
      .order("created_at", { ascending: false })
      .limit(5);

    // Fetch Sudan awareness posts
    const { data: postData } = await supabase
      .from("posts")
      .select(`
        *,
        reactions:reactions (count),
        comments:comments (count)
      `)
      .eq("category", "sudan_awareness")
      .order("created_at", { ascending: false })
      .limit(5);

    if (contentData) setContents(contentData);
    
    if (postData) {
      const authorIds = [...new Set(postData.map((p) => p.author_id))];
      const { data: profiles } = await supabase
        .from("profiles_public")
        .select("id, full_name")
        .in("id", authorIds);
      const profileMap = new Map(profiles?.map((p) => [p.id, p.full_name]) || []);
      setPosts(postData.map((p) => ({ ...p, author_name: profileMap.get(p.author_id) || "عضو" })));
    }

    // Fetch user likes
    const u = currentUser || user;
    if (u) {
      const postIds = postData?.map((p) => p.id) || [];
      if (postIds.length > 0) {
        const { data: likes } = await supabase
          .from("reactions")
          .select("post_id")
          .eq("user_id", u.id)
          .in("post_id", postIds);
        if (likes) setUserLikes(new Set(likes.map((l) => l.post_id)));
      }
    }

    setLoading(false);
  };

  const handleLike = async (postId: string) => {
    if (!user) {
      toast({ title: "يجب تسجيل الدخول", description: "قم بتسجيل الدخول للتفاعل", variant: "destructive" });
      return;
    }
    const isLiked = userLikes.has(postId);
    setUserLikes((prev) => {
      const next = new Set(prev);
      if (isLiked) next.delete(postId); else next.add(postId);
      return next;
    });
    setPosts((prev) => prev.map((p) => p.id === postId ? { ...p, reactions: [{ count: (p.reactions?.[0]?.count || 0) + (isLiked ? -1 : 1) }] } : p));

    if (isLiked) {
      const { data: existing } = await supabase.from("reactions").select("id").eq("post_id", postId).eq("user_id", user.id).maybeSingle();
      if (existing) await supabase.from("reactions").delete().eq("id", existing.id);
    } else {
      await supabase.from("reactions").insert({ post_id: postId, user_id: user.id, type: "like" });
    }
  };

  return (
    <AppLayout>
      <div className="px-4 py-6 space-y-8">
        {/* Hero Section */}
        <section className="text-center py-6 space-y-4">
          <div className="w-16 h-16 mx-auto bg-sudan-red/10 rounded-full flex items-center justify-center">
            <Heart className="h-8 w-8 text-sudan-red" />
          </div>
          <h1 className="text-2xl font-display font-bold text-foreground">
            مبادرة الوعي السوداني
          </h1>
          <p className="text-muted-foreground text-sm max-w-sm mx-auto leading-relaxed">
            نقف مع السودان في أزمته الإنسانية. نعمل على نشر الوعي وتقديم الدعم المعنوي 
            والتعليمي للمتضررين.
          </p>
        </section>

        {/* Sudan Flag Colors Banner */}
        <div className="h-2 rounded-full overflow-hidden flex">
          <div className="flex-1 bg-sudan-black" />
          <div className="flex-1 bg-sudan-red" />
          <div className="flex-1 bg-sudan-green" />
        </div>

        {/* Stats */}
        <section className="grid grid-cols-2 gap-4">
          <div className="content-card text-center">
            <Users className="h-6 w-6 text-primary mx-auto mb-2" />
            <div className="text-2xl font-bold text-foreground">{contents.length}</div>
            <div className="text-xs text-muted-foreground">محتوى توعوي</div>
          </div>
          <div className="content-card text-center">
            <BookOpen className="h-6 w-6 text-sudan-red mx-auto mb-2" />
            <div className="text-2xl font-bold text-foreground">{posts.length}</div>
            <div className="text-xs text-muted-foreground">منشور مجتمعي</div>
          </div>
        </section>

        {/* Latest Content */}
        <section className="space-y-4">
          <h2 className="font-display font-semibold text-lg text-foreground">
            أحدث المحتوى التوعوي
          </h2>
          {loading ? (
            <div className="space-y-4">
              {[1, 2].map((i) => (
                <div key={i} className="content-card animate-pulse">
                  <div className="flex gap-3">
                    <div className="w-12 h-12 bg-muted rounded-lg" />
                    <div className="flex-1 space-y-2">
                      <div className="h-4 bg-muted rounded w-3/4" />
                      <div className="h-3 bg-muted rounded w-1/2" />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : contents.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground text-sm">
              لا يوجد محتوى متاح حالياً
            </div>
          ) : (
            contents.map((content) => (
              <ContentCard
                key={content.id}
                id={content.id}
                title={content.title}
                description={content.description}
                type={content.type}
                category={content.category}
                depthLevel={content.depth_level}
                isSudanAwareness={true}
              />
            ))
          )}
        </section>

        {/* Latest Posts */}
        <section className="space-y-4">
          <h2 className="font-display font-semibold text-lg text-foreground">
            أحدث منشورات المجتمع
          </h2>
          {loading ? (
            <div className="space-y-4">
              {[1, 2].map((i) => (
                <div key={i} className="post-card animate-pulse">
                  <div className="flex gap-3 mb-3">
                    <div className="w-10 h-10 bg-muted rounded-full" />
                    <div className="flex-1 space-y-2">
                      <div className="h-4 bg-muted rounded w-1/3" />
                      <div className="h-3 bg-muted rounded w-1/4" />
                    </div>
                  </div>
                  <div className="h-4 bg-muted rounded w-3/4" />
                </div>
              ))}
            </div>
          ) : posts.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground text-sm">
              لا توجد منشورات حالياً
            </div>
          ) : (
            posts.map((post) => (
              <PostCard
                key={post.id}
                id={post.id}
                title={post.title}
                body={post.body}
                category={post.category}
                authorName={post.author_name}
                createdAt={post.created_at}
                likesCount={post.reactions?.[0]?.count || 0}
                commentsCount={post.comments?.[0]?.count || 0}
                isLiked={userLikes.has(post.id)}
                onLike={() => handleLike(post.id)}
                onComment={() => {
                  setCommentPostId(post.id);
                  setCommentPostTitle(post.title);
                }}
              />
            ))
          )}
        </section>
      </div>

      {commentPostId && (
        <PostCommentsDialog
          open={!!commentPostId}
          onOpenChange={(open) => {
            if (!open) {
              setCommentPostId(null);
              fetchData();
            }
          }}
          postId={commentPostId}
          postTitle={commentPostTitle}
        />
      )}
    </AppLayout>
  );
};

export default SudanAwareness;

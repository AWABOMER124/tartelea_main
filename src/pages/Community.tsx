import { useState, useEffect, useCallback, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import AppLayout from "@/components/layout/AppLayout";
import PostCard from "@/components/community/PostCard";
import PostCommentsDialog from "@/components/community/PostCommentsDialog";
import FilterChip from "@/components/ui/FilterChip";
import PageMeta from "@/components/seo/PageMeta";
import { PostCardSkeleton } from "@/components/ui/loading-skeletons";
import { Button } from "@/components/ui/button";
import { Plus, Loader2 } from "lucide-react";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { useInfiniteScroll } from "@/hooks/useInfiniteScroll";
import type { Database } from "@/integrations/supabase/types";

type PostCategory = Database["public"]["Enums"]["post_category"];
type CategoryFilter = "all" | PostCategory;

interface PostWithMeta {
  id: string;
  title: string;
  body: string | null;
  category: PostCategory;
  author_id: string;
  created_at: string | null;
  author_name: string;
  reactions: { count: number }[];
  comments: { count: number }[];
}

const PAGE_SIZE = 15;

const Community = () => {
  const { toast } = useToast();
  const { user } = useAuth();
  const [posts, setPosts] = useState<PostWithMeta[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [categoryFilter, setCategoryFilter] = useState<CategoryFilter>("all");
  const [userLikes, setUserLikes] = useState<Set<string>>(new Set());
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [commentPostId, setCommentPostId] = useState<string | null>(null);
  const [commentPostTitle, setCommentPostTitle] = useState("");
  const [newPost, setNewPost] = useState({ title: "", body: "", category: "general" as PostCategory });
  const pageRef = useRef(0);

  const fetchPosts = useCallback(async (page: number, append = false) => {
    if (page === 0) setLoading(true);
    else setLoadingMore(true);

    const from = page * PAGE_SIZE;
    const to = from + PAGE_SIZE - 1;

    let query = supabase
      .from("posts")
      .select(`*, reactions:reactions (count), comments:comments (count)`)
      .order("created_at", { ascending: false })
      .range(from, to);

    if (categoryFilter !== "all") {
      query = query.eq("category", categoryFilter);
    }

    const { data, error } = await query;
    if (!error && data) {
      const authorIds = [...new Set(data.map((p) => p.author_id))];
      let profileMap = new Map<string, string | null>();
      if (authorIds.length > 0) {
        const { data: profiles } = await supabase
          .from("profiles_public")
          .select("id, full_name")
          .in("id", authorIds);
        profileMap = new Map(profiles?.map((p) => [p.id, p.full_name]) || []);
      }

      const newPosts = data.map((p) => ({
        ...p,
        author_name: profileMap.get(p.author_id) || "عضو",
      })) as PostWithMeta[];

      setPosts((prev) => append ? [...prev, ...newPosts] : newPosts);
      setHasMore(data.length === PAGE_SIZE);
    }

    if (user && page === 0) {
      const { data: likes } = await supabase.from("reactions").select("post_id").eq("user_id", user.id);
      if (likes) setUserLikes(new Set(likes.map((l) => l.post_id)));
    }

    setLoading(false);
    setLoadingMore(false);
  }, [categoryFilter, user]);

  useEffect(() => {
    pageRef.current = 0;
    setPosts([]);
    setHasMore(true);
    fetchPosts(0);
  }, [categoryFilter, user, fetchPosts]);

  const loadMore = useCallback(() => {
    const nextPage = pageRef.current + 1;
    pageRef.current = nextPage;
    fetchPosts(nextPage, true);
  }, [fetchPosts]);

  const { sentinelRef } = useInfiniteScroll({
    hasMore,
    isLoading: loadingMore,
    onLoadMore: loadMore,
  });

  const handleCreatePost = async () => {
    if (!user) {
      toast({ title: "يجب تسجيل الدخول", description: "قم بتسجيل الدخول لإنشاء منشور", variant: "destructive" });
      return;
    }
    if (!newPost.title.trim()) {
      toast({ title: "خطأ", description: "يرجى إدخال عنوان المنشور", variant: "destructive" });
      return;
    }

    const { error } = await supabase.from("posts").insert({
      author_id: user.id,
      title: newPost.title,
      body: newPost.body,
      category: newPost.category,
    });

    if (error) {
      toast({ title: "خطأ", description: "حدث خطأ أثناء إنشاء المنشور", variant: "destructive" });
    } else {
      toast({ title: "تم بنجاح", description: "تم إنشاء المنشور بنجاح" });
      setNewPost({ title: "", body: "", category: "general" });
      setIsDialogOpen(false);
      pageRef.current = 0;
      fetchPosts(0);
    }
  };

  const handleLike = async (postId: string) => {
    if (!user) {
      toast({ title: "يجب تسجيل الدخول", description: "قم بتسجيل الدخول للتفاعل", variant: "destructive" });
      return;
    }

    const isCurrentlyLiked = userLikes.has(postId);

    setUserLikes((prev) => {
      const next = new Set(prev);
      if (isCurrentlyLiked) next.delete(postId);
      else next.add(postId);
      return next;
    });
    setPosts((prev) =>
      prev.map((p) =>
        p.id === postId
          ? { ...p, reactions: [{ count: (p.reactions?.[0]?.count || 0) + (isCurrentlyLiked ? -1 : 1) }] }
          : p
      )
    );

    if (isCurrentlyLiked) {
      const { data: existing } = await supabase.from("reactions").select("id").eq("post_id", postId).eq("user_id", user.id).maybeSingle();
      if (existing) await supabase.from("reactions").delete().eq("id", existing.id);
    } else {
      await supabase.from("reactions").insert({ post_id: postId, user_id: user.id, type: "like" });
    }
  };

  const categoryFilters = [
    { value: "all", label: "الكل" },
    { value: "general", label: "عام" },
    { value: "quran", label: "القرآن" },
    { value: "awareness", label: "الوعي" },
    { value: "sudan_awareness", label: "السودان" },
    { value: "arab_awareness", label: "الوعي العربي" },
    { value: "islamic_awareness", label: "الوعي الإسلامي" },
  ];

  return (
    <AppLayout>
      <PageMeta title="المجتمع" description="مجتمع المدرسة الترتيلية - شارك تدبراتك وتفاعل مع المتعلمين في اللسان العربي المبين" path="/community" />
      <div className="px-4 py-6 space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-xl font-display font-bold text-foreground">المجتمع</h1>
          {user && (
            <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
              <DialogTrigger asChild>
                <Button size="sm" className="gap-2"><Plus className="h-4 w-4" />منشور جديد</Button>
              </DialogTrigger>
              <DialogContent className="max-w-sm mx-4">
                <DialogHeader>
                  <DialogTitle className="font-display">منشور جديد</DialogTitle>
                </DialogHeader>
                <div className="space-y-4">
                  <Input placeholder="عنوان المنشور" value={newPost.title} onChange={(e) => setNewPost({ ...newPost, title: e.target.value })} />
                  <Textarea placeholder="محتوى المنشور (اختياري)" value={newPost.body} onChange={(e) => setNewPost({ ...newPost, body: e.target.value })} rows={4} />
                  <Select value={newPost.category} onValueChange={(v: PostCategory) => setNewPost({ ...newPost, category: v })}>
                    <SelectTrigger><SelectValue placeholder="اختر التصنيف" /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="general">عام</SelectItem>
                      <SelectItem value="quran">القرآن</SelectItem>
                      <SelectItem value="awareness">الوعي</SelectItem>
                      <SelectItem value="sudan_awareness">السودان</SelectItem>
                      <SelectItem value="arab_awareness">الوعي العربي</SelectItem>
                      <SelectItem value="islamic_awareness">الوعي الإسلامي</SelectItem>
                    </SelectContent>
                  </Select>
                  <Button onClick={handleCreatePost} className="w-full">نشر</Button>
                </div>
              </DialogContent>
            </Dialog>
          )}
        </div>

        <div className="flex flex-wrap gap-2">
          {categoryFilters.map((filter) => (
            <FilterChip key={filter.value} label={filter.label} isActive={categoryFilter === filter.value} onClick={() => setCategoryFilter(filter.value as CategoryFilter)} />
          ))}
        </div>

        <div className="space-y-4">
          {loading ? (
            <div className="space-y-4">
              {[1, 2, 3].map((i) => (
                <PostCardSkeleton key={i} />
              ))}
            </div>
          ) : posts.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <p>لا توجد منشورات حالياً</p>
              {user && <p className="text-sm mt-2">كن أول من ينشر!</p>}
            </div>
          ) : (
            <>
              {posts.map((post) => (
                <PostCard
                  key={post.id}
                  id={post.id}
                  title={post.title}
                  body={post.body}
                  category={post.category}
                  authorName={post.author_name}
                  createdAt={post.created_at || new Date().toISOString()}
                  likesCount={post.reactions?.[0]?.count || 0}
                  commentsCount={post.comments?.[0]?.count || 0}
                  isLiked={userLikes.has(post.id)}
                  onLike={() => handleLike(post.id)}
                  onComment={() => { setCommentPostId(post.id); setCommentPostTitle(post.title); }}
                />
              ))}

              {/* Infinite scroll sentinel */}
              <div ref={sentinelRef} className="py-4 flex justify-center">
                {loadingMore && <Loader2 className="h-6 w-6 animate-spin text-primary" />}
                {!hasMore && posts.length > 0 && (
                  <p className="text-sm text-muted-foreground">لا توجد منشورات أخرى</p>
                )}
              </div>
            </>
          )}
        </div>
      </div>

      {commentPostId && (
        <PostCommentsDialog
          open={!!commentPostId}
          onOpenChange={(open) => { if (!open) { setCommentPostId(null); } }}
          postId={commentPostId}
          postTitle={commentPostTitle}
        />
      )}
    </AppLayout>
  );
};

export default Community;

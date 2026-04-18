/**
 * STEP 2 freeze marker:
 * This detail view is still bound to legacy Supabase community tables.
 * It is no longer routed from `/community/:id`; keep only as a transitional legacy reference.
 * Avoid adding new forum logic here until the backend community migration is complete.
 */
import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import AppLayout from "@/components/layout/AppLayout";
import PostCard from "@/components/community/PostCard";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { ArrowRight, Send, Trash2, CornerDownLeft } from "lucide-react";
import { formatDistanceToNow, ar } from "@/lib/date-utils";

interface Comment {
  id: string;
  body: string;
  author_id: string;
  created_at: string;
  parent_id: string | null;
  author_name?: string;
  replies?: Comment[];
}

const PostDetail = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [post, setPost] = useState<any>(null);
  const [comments, setComments] = useState<Comment[]>([]);
  const [loading, setLoading] = useState(true);
  const [userId, setUserId] = useState<string | null>(null);
  const [isLiked, setIsLiked] = useState(false);
  const [likesCount, setLikesCount] = useState(0);
  const [newComment, setNewComment] = useState("");
  const [replyTo, setReplyTo] = useState<{ id: string; name: string } | null>(null);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (id) {
      fetchAll();
    }
  }, [id]);

  const fetchAll = async () => {
    setLoading(true);
    const { data: { user } } = await supabase.auth.getUser();
    setUserId(user?.id || null);

    // Fetch post
    const { data: postData } = await supabase
      .from("posts")
      .select("*, reactions:reactions(count), comments:comments(count)")
      .eq("id", id!)
      .single();

    if (!postData) {
      setLoading(false);
      return;
    }

    // Fetch author name
    const { data: profile } = await supabase
      .from("profiles_public")
      .select("full_name")
      .eq("id", postData.author_id)
      .maybeSingle();

    setPost({ ...postData, author_name: profile?.full_name || "عضو" });
    setLikesCount(postData.reactions?.[0]?.count || 0);

    // Check if user liked
    if (user) {
      const { data: like } = await supabase
        .from("reactions")
        .select("id")
        .eq("post_id", id!)
        .eq("user_id", user.id)
        .maybeSingle();
      setIsLiked(!!like);
    }

    // Fetch comments
    await fetchComments();
    setLoading(false);
  };

  const fetchComments = async () => {
    const { data } = await supabase
      .from("comments")
      .select("id, body, author_id, created_at, parent_id")
      .eq("post_id", id!)
      .order("created_at", { ascending: true });

    if (!data) return;

    const authorIds = [...new Set(data.map((c) => c.author_id))];
    const { data: profiles } = await supabase
      .from("profiles_public")
      .select("id, full_name")
      .in("id", authorIds);
    const profileMap = new Map(profiles?.map((p) => [p.id, p.full_name]) || []);

    const enriched: Comment[] = data.map((c) => ({
      ...c,
      author_name: profileMap.get(c.author_id) || "عضو",
    }));

    // Build tree
    const rootComments: Comment[] = [];
    const childMap = new Map<string, Comment[]>();

    enriched.forEach((c) => {
      if (!c.parent_id) {
        rootComments.push({ ...c, replies: [] });
      } else {
        const children = childMap.get(c.parent_id) || [];
        children.push(c);
        childMap.set(c.parent_id, children);
      }
    });

    // Attach replies recursively
    const attachReplies = (comment: Comment): Comment => {
      const replies = (childMap.get(comment.id) || []).map(attachReplies);
      return { ...comment, replies };
    };

    setComments(rootComments.map(attachReplies));
  };

  const handleLike = async () => {
    if (!userId) {
      toast({ title: "يجب تسجيل الدخول", variant: "destructive" });
      return;
    }
    setIsLiked(!isLiked);
    setLikesCount((c) => c + (isLiked ? -1 : 1));

    if (isLiked) {
      const { data } = await supabase
        .from("reactions").select("id")
        .eq("post_id", id!).eq("user_id", userId).maybeSingle();
      if (data) await supabase.from("reactions").delete().eq("id", data.id);
    } else {
      await supabase.from("reactions").insert({ post_id: id!, user_id: userId, type: "like" });
    }
  };

  const handleSubmitComment = async () => {
    if (!userId) {
      toast({ title: "يجب تسجيل الدخول", variant: "destructive" });
      return;
    }
    if (!newComment.trim()) return;

    setSubmitting(true);
    const { error } = await supabase.from("comments").insert({
      post_id: id!,
      author_id: userId,
      body: newComment.trim(),
      parent_id: replyTo?.id || null,
    });

    if (!error) {
      setNewComment("");
      setReplyTo(null);
      await fetchComments();
    }
    setSubmitting(false);
  };

  const handleDelete = async (commentId: string) => {
    await supabase.from("comments").delete().eq("id", commentId);
    await fetchComments();
  };

  const CommentItem = ({ comment, depth = 0 }: { comment: Comment; depth?: number }) => (
    <div className={`${depth > 0 ? "mr-6 border-r-2 border-primary/20 pr-4" : ""}`}>
      <div className="flex gap-2 group py-3">
        <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
          <span className="text-xs font-medium text-primary">
            {comment.author_name?.charAt(0) || "م"}
          </span>
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-xs font-medium text-foreground">{comment.author_name}</span>
            <span className="text-xs text-muted-foreground">
              {formatDistanceToNow(new Date(comment.created_at), { addSuffix: true, locale: ar })}
            </span>
          </div>
          <p className="text-sm text-foreground mt-1">{comment.body}</p>
          <div className="flex items-center gap-2 mt-1">
            <Button
              variant="ghost"
              size="sm"
              className="h-6 text-xs text-muted-foreground hover:text-primary gap-1 px-2"
              onClick={() => setReplyTo({ id: comment.id, name: comment.author_name || "عضو" })}
            >
              <CornerDownLeft className="h-3 w-3" />
              رد
            </Button>
            {userId === comment.author_id && (
              <Button
                variant="ghost"
                size="sm"
                className="h-6 text-xs text-muted-foreground hover:text-destructive px-2 opacity-0 group-hover:opacity-100 transition-opacity"
                onClick={() => handleDelete(comment.id)}
              >
                <Trash2 className="h-3 w-3" />
              </Button>
            )}
          </div>
        </div>
      </div>
      {comment.replies?.map((reply) => (
        <CommentItem key={reply.id} comment={reply} depth={depth + 1} />
      ))}
    </div>
  );

  if (loading) {
    return (
      <AppLayout>
        <div className="px-4 py-6 space-y-4">
          <div className="animate-pulse space-y-4">
            <div className="h-6 bg-muted rounded w-1/3" />
            <div className="h-20 bg-muted rounded" />
            <div className="h-40 bg-muted rounded" />
          </div>
        </div>
      </AppLayout>
    );
  }

  if (!post) {
    return (
      <AppLayout>
        <div className="px-4 py-12 text-center">
          <p className="text-muted-foreground">المنشور غير موجود</p>
          <Button variant="ghost" onClick={() => navigate("/community")} className="mt-4 gap-2">
            <ArrowRight className="h-4 w-4" />
            العودة للمجتمع
          </Button>
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout>
      <div className="px-4 py-6 space-y-6 max-w-2xl mx-auto">
        {/* Back button */}
        <Button variant="ghost" size="sm" onClick={() => navigate("/community")} className="gap-2">
          <ArrowRight className="h-4 w-4" />
          العودة
        </Button>

        {/* Post */}
        <PostCard
          id={post.id}
          title={post.title}
          body={post.body}
          category={post.category}
          authorName={post.author_name}
          createdAt={post.created_at}
          likesCount={likesCount}
          commentsCount={comments.reduce((acc, c) => acc + 1 + (c.replies?.length || 0), 0)}
          isLiked={isLiked}
          onLike={handleLike}
        />

        {/* Comments Section */}
        <div className="space-y-2">
          <h2 className="font-display font-semibold text-foreground">
            التعليقات ({comments.reduce((acc, c) => acc + 1 + countReplies(c), 0)})
          </h2>

          {/* Comment input */}
          {userId && (
            <div className="space-y-2">
              {replyTo && (
                <div className="flex items-center gap-2 text-xs text-muted-foreground bg-muted/50 rounded px-3 py-1.5">
                  <span>الرد على {replyTo.name}</span>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-5 text-xs px-1"
                    onClick={() => setReplyTo(null)}
                  >
                    ✕
                  </Button>
                </div>
              )}
              <div className="flex gap-2">
                <Textarea
                  placeholder={replyTo ? `الرد على ${replyTo.name}...` : "اكتب تعليقك..."}
                  value={newComment}
                  onChange={(e) => setNewComment(e.target.value)}
                  rows={2}
                  className="flex-1 min-h-[60px]"
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && !e.shiftKey) {
                      e.preventDefault();
                      handleSubmitComment();
                    }
                  }}
                />
                <Button
                  size="icon"
                  onClick={handleSubmitComment}
                  disabled={submitting || !newComment.trim()}
                  className="self-end"
                >
                  <Send className="h-4 w-4" />
                </Button>
              </div>
            </div>
          )}

          {/* Comments list */}
          <div className="divide-y divide-border">
            {comments.length === 0 ? (
              <p className="text-center text-muted-foreground text-sm py-8">
                لا توجد تعليقات بعد. كن أول من يعلق!
              </p>
            ) : (
              comments.map((comment) => (
                <CommentItem key={comment.id} comment={comment} />
              ))
            )}
          </div>
        </div>
      </div>
    </AppLayout>
  );
};

function countReplies(comment: Comment): number {
  return (comment.replies || []).reduce((acc, r) => acc + 1 + countReplies(r), 0);
}

export default PostDetail;

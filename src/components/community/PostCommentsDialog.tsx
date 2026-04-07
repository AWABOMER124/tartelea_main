import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Send, Trash2 } from "lucide-react";
import { formatDistanceToNow, ar } from "@/lib/date-utils";

interface Comment {
  id: string;
  body: string;
  author_id: string;
  created_at: string;
  author_name?: string;
}

interface PostCommentsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  postId: string;
  postTitle: string;
  onCommentsCountChange?: (count: number) => void;
}

const PostCommentsDialog = ({
  open,
  onOpenChange,
  postId,
  postTitle,
  onCommentsCountChange,
}: PostCommentsDialogProps) => {
  const { toast } = useToast();
  const [comments, setComments] = useState<Comment[]>([]);
  const [newComment, setNewComment] = useState("");
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [userId, setUserId] = useState<string | null>(null);

  useEffect(() => {
    if (open) {
      fetchComments();
      fetchUser();
    }
  }, [open, postId]);

  const fetchUser = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    setUserId(user?.id || null);
  };

  const fetchComments = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("comments")
      .select("id, body, author_id, created_at")
      .eq("post_id", postId)
      .order("created_at", { ascending: true });

    if (!error && data) {
      // Fetch author names from profiles_public
      const authorIds = [...new Set(data.map((c) => c.author_id))];
      const { data: profiles } = await supabase
        .from("profiles_public")
        .select("id, full_name")
        .in("id", authorIds);

      const profileMap = new Map(
        profiles?.map((p) => [p.id, p.full_name]) || []
      );

      setComments(
        data.map((c) => ({
          ...c,
          author_name: profileMap.get(c.author_id) || "عضو",
        }))
      );
      onCommentsCountChange?.(data.length);
    }
    setLoading(false);
  };

  const handleSubmit = async () => {
    if (!userId) {
      toast({
        title: "يجب تسجيل الدخول",
        description: "قم بتسجيل الدخول للتعليق",
        variant: "destructive",
      });
      return;
    }
    if (!newComment.trim()) return;

    setSubmitting(true);
    const { error } = await supabase.from("comments").insert({
      post_id: postId,
      author_id: userId,
      body: newComment.trim(),
    });

    if (error) {
      toast({
        title: "خطأ",
        description: "فشل إرسال التعليق",
        variant: "destructive",
      });
    } else {
      setNewComment("");
      fetchComments();
    }
    setSubmitting(false);
  };

  const handleDelete = async (commentId: string) => {
    const { error } = await supabase
      .from("comments")
      .delete()
      .eq("id", commentId);
    if (!error) fetchComments();
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md mx-4 max-h-[80vh] flex flex-col">
        <DialogHeader>
          <DialogTitle className="font-display text-right">
            تعليقات: {postTitle}
          </DialogTitle>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto space-y-3 min-h-0 py-2">
          {loading ? (
            <div className="space-y-3">
              {[1, 2].map((i) => (
                <div key={i} className="animate-pulse flex gap-2">
                  <div className="w-8 h-8 bg-muted rounded-full" />
                  <div className="flex-1 space-y-1">
                    <div className="h-3 bg-muted rounded w-1/4" />
                    <div className="h-4 bg-muted rounded w-3/4" />
                  </div>
                </div>
              ))}
            </div>
          ) : comments.length === 0 ? (
            <p className="text-center text-muted-foreground text-sm py-8">
              لا توجد تعليقات بعد. كن أول من يعلق!
            </p>
          ) : (
            comments.map((comment) => (
              <div key={comment.id} className="flex gap-2 group">
                <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                  <span className="text-xs font-medium text-primary">
                    {comment.author_name?.charAt(0) || "م"}
                  </span>
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-medium text-foreground">
                      {comment.author_name}
                    </span>
                    <span className="text-xs text-muted-foreground">
                      {formatDistanceToNow(new Date(comment.created_at), {
                        addSuffix: true,
                        locale: ar,
                      })}
                    </span>
                    {userId === comment.author_id && (
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-5 w-5 opacity-0 group-hover:opacity-100 transition-opacity"
                        onClick={() => handleDelete(comment.id)}
                      >
                        <Trash2 className="h-3 w-3 text-destructive" />
                      </Button>
                    )}
                  </div>
                  <p className="text-sm text-foreground mt-0.5">
                    {comment.body}
                  </p>
                </div>
              </div>
            ))
          )}
        </div>

        {userId && (
          <div className="flex gap-2 pt-2 border-t border-border">
            <Textarea
              placeholder="اكتب تعليقك..."
              value={newComment}
              onChange={(e) => setNewComment(e.target.value)}
              rows={2}
              className="flex-1 min-h-[60px]"
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault();
                  handleSubmit();
                }
              }}
            />
            <Button
              size="icon"
              onClick={handleSubmit}
              disabled={submitting || !newComment.trim()}
              className="self-end"
            >
              <Send className="h-4 w-4" />
            </Button>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
};

export default PostCommentsDialog;

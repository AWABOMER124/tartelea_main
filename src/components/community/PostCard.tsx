/**
 * STEP 2 freeze marker:
 * Legacy Supabase community card kept only for transitional read-only/fallback surfaces.
 * Do not reuse in new community work; use backend community components instead.
 */
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Heart, MessageCircle, Share2, Link, Copy, Flag } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { formatDistanceToNow, ar } from "@/lib/date-utils";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useToast } from "@/hooks/use-toast";
import PostReportDialog from "./PostReportDialog";

interface PostCardProps {
  id?: string;
  title: string;
  body?: string | null;
  category: string;
  authorName?: string;
  createdAt: string;
  likesCount: number;
  commentsCount: number;
  isLiked?: boolean;
  onLike?: () => void;
  onComment?: () => void;
}

const categoryLabels: Record<string, string> = {
  general: "عام",
  quran: "القرآن",
  awareness: "الوعي",
  sudan_awareness: "السودان",
};

const PostCard = ({
  id,
  title,
  body,
  category,
  authorName,
  createdAt,
  likesCount,
  commentsCount,
  isLiked,
  onLike,
  onComment,
}: PostCardProps) => {
  const { toast } = useToast();
  const navigate = useNavigate();
  const [showReport, setShowReport] = useState(false);
  const timeAgo = formatDistanceToNow(new Date(createdAt), {
    addSuffix: true,
    locale: ar,
  });

  return (
    <div className="post-card animate-fade-in">
      <div className="flex items-start gap-3 mb-3">
        <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
          <span className="text-sm font-medium text-primary">
            {authorName?.charAt(0) || "م"}
          </span>
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="font-medium text-sm text-foreground">
              {authorName || "عضو مجهول"}
            </span>
            <Badge variant="secondary" className="text-xs">
              {categoryLabels[category] || category}
            </Badge>
          </div>
          <span className="text-xs text-muted-foreground">{timeAgo}</span>
        </div>
      </div>

      <h3
        className="font-display font-semibold text-foreground mb-2 cursor-pointer hover:text-primary transition-colors"
        onClick={() => id && navigate(`/community/${id}`)}
      >
        {title}
      </h3>
      
      {body && (
        <p className="text-sm text-muted-foreground mb-4 line-clamp-3">
          {body}
        </p>
      )}

      <div className="flex items-center gap-2 pt-3 border-t border-border">
        <Button
          variant="ghost"
          size="sm"
          className="gap-2 text-muted-foreground hover:text-primary"
          onClick={onLike}
        >
          <Heart
            className={`h-4 w-4 ${isLiked ? "fill-primary text-primary" : ""}`}
          />
          <span>{likesCount}</span>
        </Button>
        <Button
          variant="ghost"
          size="sm"
          className="gap-2 text-muted-foreground hover:text-primary"
          onClick={onComment}
        >
          <MessageCircle className="h-4 w-4" />
          <span>{commentsCount}</span>
        </Button>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="ghost"
              size="sm"
              className="gap-2 text-muted-foreground hover:text-primary mr-auto"
            >
              <Share2 className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem
              onClick={() => {
                const url = `${window.location.origin}/community?post=${id}`;
                navigator.clipboard.writeText(url);
                toast({ title: "تم النسخ", description: "تم نسخ رابط المنشور" });
              }}
            >
              <Copy className="h-4 w-4 ml-2" />
              نسخ الرابط
            </DropdownMenuItem>
            <DropdownMenuItem
              onClick={() => {
                const url = `${window.location.origin}/community?post=${id}`;
                const text = `${title}`;
                window.open(`https://wa.me/?text=${encodeURIComponent(text + "\n" + url)}`, "_blank");
              }}
            >
              واتساب
            </DropdownMenuItem>
            <DropdownMenuItem
              onClick={() => {
                const url = `${window.location.origin}/community?post=${id}`;
                window.open(`https://twitter.com/intent/tweet?text=${encodeURIComponent(title)}&url=${encodeURIComponent(url)}`, "_blank");
              }}
            >
              تويتر / X
            </DropdownMenuItem>
            <DropdownMenuItem
              onClick={() => {
                const url = `${window.location.origin}/community?post=${id}`;
                window.open(`https://t.me/share/url?url=${encodeURIComponent(url)}&text=${encodeURIComponent(title)}`, "_blank");
              }}
            >
              تيليجرام
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              className="text-destructive focus:text-destructive"
              onClick={() => setShowReport(true)}
            >
              <Flag className="h-4 w-4 ml-2" />
              تبليغ
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      {id && (
        <PostReportDialog
          open={showReport}
          onOpenChange={setShowReport}
          postId={id}
          postTitle={title}
        />
      )}
    </div>
  );
};

export default PostCard;

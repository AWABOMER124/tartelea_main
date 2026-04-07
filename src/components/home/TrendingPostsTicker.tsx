import { useEffect, useState, useRef } from "react";
import { Link } from "react-router-dom";
import { TrendingUp } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { formatDistanceToNow, ar } from "@/lib/date-utils";

interface TrendingPost {
  id: string;
  title: string;
  category: string;
  created_at: string;
  author_name?: string;
  is_pinned?: boolean;
}

const categoryLabels: Record<string, string> = {
  general: "عام",
  quran: "القرآن",
  awareness: "الوعي",
  sudan_awareness: "السودان",
  arab_awareness: "العربي",
  islamic_awareness: "الإسلامي",
};

const TrendingPostsTicker = () => {
  const [posts, setPosts] = useState<TrendingPost[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const [direction, setDirection] = useState<"up" | "down">("up");
  const [isAnimating, setIsAnimating] = useState(false);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    const fetchPosts = async () => {
      // Fetch pinned posts first
      const { data: pinned } = await supabase
        .from("pinned_content")
        .select("content_id, display_order")
        .eq("ticker_position", "trending")
        .eq("is_active", true)
        .eq("content_type", "post")
        .order("display_order", { ascending: true });

      const pinnedIds = new Set(pinned?.map((p) => p.content_id) || []);

      const { data } = await supabase
        .from("posts")
        .select("id, title, category, created_at, author_id")
        .order("created_at", { ascending: false })
        .limit(10);

      if (data && data.length > 0) {
        const authorIds = [...new Set(data.map((p) => p.author_id))];
        const { data: profiles } = await supabase
          .from("profiles")
          .select("id, full_name")
          .in("id", authorIds);

        const profileMap = new Map(profiles?.map((p) => [p.id, p.full_name]) || []);

        const allPosts = data.map((p) => ({
          id: p.id,
          title: p.title,
          category: p.category,
          created_at: p.created_at || new Date().toISOString(),
          author_name: profileMap.get(p.author_id) || "عضو",
          is_pinned: pinnedIds.has(p.id),
        }));

        // Pinned posts first, then rest
        const sorted = [
          ...allPosts.filter((p) => p.is_pinned),
          ...allPosts.filter((p) => !p.is_pinned),
        ];
        setPosts(sorted);
      }
    };
    fetchPosts();
  }, []);

  useEffect(() => {
    if (posts.length <= 1 || isPaused) return;
    intervalRef.current = setInterval(() => {
      setDirection("up");
      setIsAnimating(true);
      setTimeout(() => {
        setCurrentIndex((prev) => (prev + 1) % posts.length);
        setIsAnimating(false);
      }, 300);
    }, 4000);
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [posts.length, isPaused]);

  const goTo = (i: number) => {
    setDirection(i > currentIndex ? "up" : "down");
    setIsAnimating(true);
    setTimeout(() => {
      setCurrentIndex(i);
      setIsAnimating(false);
    }, 300);
  };

  if (posts.length === 0) return null;

  const post = posts[currentIndex];

  return (
    <div
      className="h-full flex flex-col justify-center"
      onMouseEnter={() => setIsPaused(true)}
      onMouseLeave={() => setIsPaused(false)}
    >
      <div className="flex items-center gap-1.5 mb-2">
        <TrendingUp className="h-3.5 w-3.5 text-primary" />
        <span className="text-xs font-semibold text-primary">آخر المواضيع</span>
      </div>

      <Link to="/community" className="block group">
        <div className="relative overflow-hidden rounded-lg bg-card/60 border border-border/50 p-3 transition-all hover:border-primary/30 hover:shadow-sm min-h-[90px]">
          <div
            key={post.id}
            className={`space-y-1.5 transition-all duration-300 ease-in-out ${
              isAnimating
                ? direction === "up"
                  ? "opacity-0 -translate-y-3"
                  : "opacity-0 translate-y-3"
                : "opacity-100 translate-y-0"
            }`}
          >
            <div className="flex items-center gap-1.5">
              <span className="inline-block text-[10px] px-1.5 py-0.5 rounded-full bg-primary/10 text-primary font-medium">
                {categoryLabels[post.category] || post.category}
              </span>
              {post.is_pinned && (
                <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-accent/15 text-accent font-medium">📌</span>
              )}
            </div>
            <p className="text-xs font-semibold text-foreground line-clamp-2 leading-relaxed group-hover:text-primary transition-colors">
              {post.title}
            </p>
            <div className="flex items-center gap-2 text-[10px] text-muted-foreground">
              <span>{post.author_name}</span>
              <span>·</span>
              <span>
                {formatDistanceToNow(new Date(post.created_at), {
                  addSuffix: true,
                  locale: ar,
                })}
              </span>
            </div>
          </div>
        </div>
      </Link>

      {posts.length > 1 && (
        <div className="flex justify-center gap-1.5 mt-2">
          {posts.slice(0, 5).map((_, i) => (
            <button
              key={i}
              onClick={() => goTo(i)}
              className={`h-2 rounded-full transition-all duration-300 min-w-[8px] ${
                i === currentIndex % 5 ? "bg-primary w-5" : "bg-muted-foreground/30 w-2"
              }`}
            />
          ))}
        </div>
      )}
    </div>
  );
};

export default TrendingPostsTicker;

import { useEffect, useState, useRef } from "react";
import { Link } from "react-router-dom";
import { GraduationCap, Video, Sparkles } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { formatDistanceToNow, ar } from "@/lib/date-utils";

interface ContentItem {
  id: string;
  title: string;
  type: "course" | "workshop";
  created_at: string;
  category?: string;
  is_pinned?: boolean;
}

const LatestContentTicker = () => {
  const [items, setItems] = useState<ContentItem[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const [isAnimating, setIsAnimating] = useState(false);
  const [direction, setDirection] = useState<"up" | "down">("up");
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    const fetchContent = async () => {
      // Fetch pinned content
      const { data: pinned } = await supabase
        .from("pinned_content")
        .select("content_id, content_type, display_order")
        .eq("ticker_position", "latest")
        .eq("is_active", true)
        .order("display_order", { ascending: true });

      const pinnedIds = new Set(pinned?.map((p) => p.content_id) || []);

      const [coursesRes, workshopsRes] = await Promise.all([
        supabase
          .from("trainer_courses")
          .select("id, title, created_at, category")
          .eq("is_approved", true)
          .order("created_at", { ascending: false })
          .limit(5),
        supabase
          .from("workshops")
          .select("id, title, created_at, category")
          .eq("is_approved", true)
          .order("created_at", { ascending: false })
          .limit(5),
      ]);

      const courses: ContentItem[] = (coursesRes.data || []).map((c) => ({
        id: c.id,
        title: c.title,
        type: "course",
        created_at: c.created_at || new Date().toISOString(),
        category: c.category,
        is_pinned: pinnedIds.has(c.id),
      }));

      const workshops: ContentItem[] = (workshopsRes.data || []).map((w) => ({
        id: w.id,
        title: w.title,
        type: "workshop",
        created_at: w.created_at || new Date().toISOString(),
        category: w.category,
        is_pinned: pinnedIds.has(w.id),
      }));

      const merged = [...courses, ...workshops].sort(
        (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
      );

      // Pinned first
      const sorted = [
        ...merged.filter((i) => i.is_pinned),
        ...merged.filter((i) => !i.is_pinned),
      ];
      setItems(sorted.slice(0, 10));
    };
    fetchContent();
  }, []);

  useEffect(() => {
    if (items.length <= 1 || isPaused) return;
    intervalRef.current = setInterval(() => {
      setDirection("up");
      setIsAnimating(true);
      setTimeout(() => {
        setCurrentIndex((prev) => (prev + 1) % items.length);
        setIsAnimating(false);
      }, 300);
    }, 3500);
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [items.length, isPaused]);

  const goTo = (i: number) => {
    setDirection(i > currentIndex ? "up" : "down");
    setIsAnimating(true);
    setTimeout(() => {
      setCurrentIndex(i);
      setIsAnimating(false);
    }, 300);
  };

  if (items.length === 0) return null;

  const item = items[currentIndex];
  const isCourse = item.type === "course";

  return (
    <div
      className="h-full flex flex-col justify-center"
      onMouseEnter={() => setIsPaused(true)}
      onMouseLeave={() => setIsPaused(false)}
    >
      <div className="flex items-center gap-1.5 mb-2">
        <Sparkles className="h-3.5 w-3.5 text-accent" />
        <span className="text-xs font-semibold text-accent">جديد المنصة</span>
      </div>

      <Link
        to={isCourse ? `/courses/${item.id}` : `/workshops/${item.id}`}
        className="block group"
      >
        <div className="relative overflow-hidden rounded-lg bg-card/60 border border-border/50 p-3 transition-all hover:border-accent/30 hover:shadow-sm min-h-[90px]">
          <div
            key={item.id}
            className={`space-y-1.5 transition-all duration-300 ease-in-out ${
              isAnimating
                ? direction === "up"
                  ? "opacity-0 -translate-y-3"
                  : "opacity-0 translate-y-3"
                : "opacity-100 translate-y-0"
            }`}
          >
            <div className="flex items-center gap-1.5">
              {isCourse ? (
                <GraduationCap className="h-3.5 w-3.5 text-accent" />
              ) : (
                <Video className="h-3.5 w-3.5 text-destructive" />
              )}
              <span className="text-[10px] font-medium text-muted-foreground">
                {isCourse ? "دورة" : "ورشة"}
              </span>
              {item.is_pinned && (
                <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-accent/15 text-accent font-medium">📌</span>
              )}
            </div>
            <p className="text-xs font-semibold text-foreground line-clamp-2 leading-relaxed group-hover:text-accent transition-colors">
              {item.title}
            </p>
            <span className="text-[10px] text-muted-foreground">
              {formatDistanceToNow(new Date(item.created_at), {
                addSuffix: true,
                locale: ar,
              })}
            </span>
          </div>
        </div>
      </Link>

      {items.length > 1 && (
        <div className="flex justify-center gap-1.5 mt-2">
          {items.slice(0, 5).map((_, i) => (
            <button
              key={i}
              onClick={() => goTo(i)}
              className={`h-2 rounded-full transition-all duration-300 min-w-[8px] ${
                i === currentIndex % 5 ? "bg-accent w-5" : "bg-muted-foreground/30 w-2"
              }`}
            />
          ))}
        </div>
      )}
    </div>
  );
};

export default LatestContentTicker;

import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import AppLayout from "@/components/layout/AppLayout";
import PageMeta from "@/components/seo/PageMeta";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ArrowRight, Calendar, User } from "lucide-react";

const categoryLabels: Record<string, string> = {
  quran: "القرآن الكريم",
  arabic: "اللسان العربي",
  awareness: "التوعية",
  education: "التعليم",
  general: "عام",
};

const BlogPost = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [post, setPost] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (id) fetchPost();
  }, [id]);

  const fetchPost = async () => {
    setLoading(true);
    const { data } = await (supabase as any)
      .from("blog_posts")
      .select("*")
      .eq("id", id!)
      .eq("is_published", true)
      .single();

    if (data) {
      const { data: profile } = await supabase
        .from("profiles_public")
        .select("full_name")
        .eq("id", data.author_id)
        .maybeSingle();

      setPost({ ...data, author_name: profile?.full_name || "المدرسة الترتيلية" });
    }
    setLoading(false);
  };

  if (loading) {
    return (
      <AppLayout>
        <div className="px-4 py-8 max-w-3xl mx-auto animate-pulse space-y-4">
          <div className="h-8 bg-muted rounded w-2/3" />
          <div className="h-4 bg-muted rounded w-1/3" />
          <div className="h-64 bg-muted rounded" />
        </div>
      </AppLayout>
    );
  }

  if (!post) {
    return (
      <AppLayout>
        <div className="px-4 py-16 text-center">
          <p className="text-muted-foreground">المقال غير موجود</p>
          <Button variant="ghost" onClick={() => navigate("/blog")} className="mt-4 gap-2">
            <ArrowRight className="h-4 w-4" />
            العودة للمدونة
          </Button>
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout>
      <PageMeta
        title={post.title}
        description={post.excerpt || post.content?.substring(0, 160)}
        path={`/blog/${post.id}`}
        keywords={`${categoryLabels[post.category] || ""}, المدرسة الترتيلية, مقال`}
        type="article"
      />

      <article className="px-4 py-8 max-w-3xl mx-auto space-y-6">
        <Button variant="ghost" size="sm" onClick={() => navigate("/blog")} className="gap-2">
          <ArrowRight className="h-4 w-4" />
          العودة للمدونة
        </Button>

        <header className="space-y-4">
          <Badge variant="secondary">
            {categoryLabels[post.category] || post.category}
          </Badge>
          <h1 className="text-3xl md:text-4xl font-display font-bold text-foreground leading-tight">
            {post.title}
          </h1>
          <div className="flex items-center gap-4 text-sm text-muted-foreground">
            <span className="flex items-center gap-1.5">
              <User className="h-4 w-4" />
              {post.author_name}
            </span>
            <span className="flex items-center gap-1.5">
              <Calendar className="h-4 w-4" />
              {post.published_at
                ? new Date(post.published_at).toLocaleDateString("ar", {
                    year: "numeric",
                    month: "long",
                    day: "numeric",
                  })
                : ""}
            </span>
          </div>
        </header>

        <div className="w-full h-px bg-border" />

        <div className="prose prose-lg max-w-none text-foreground/90 leading-loose whitespace-pre-wrap">
          {post.content}
        </div>
      </article>
    </AppLayout>
  );
};

export default BlogPost;

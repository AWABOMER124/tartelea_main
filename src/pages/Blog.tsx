import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import AppLayout from "@/components/layout/AppLayout";
import PageMeta from "@/components/seo/PageMeta";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { PenLine, Calendar, User, Search, BookOpen } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import { useUserRole } from "@/hooks/useUserRole";
interface BlogPost {
  id: string;
  title: string;
  excerpt: string | null;
  content: string;
  category: string;
  author_id: string;
  is_published: boolean;
  published_at: string | null;
  created_at: string;
  updated_at: string;
  author_name?: string;
}

const categoryLabels: Record<string, string> = {
  quran: "القرآن الكريم",
  arabic: "اللسان العربي",
  awareness: "التوعية",
  education: "التعليم",
  general: "عام",
};

const Blog = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { user } = useAuth();
  const { role } = useUserRole();
  const isAdmin = role === "admin" || role === "trainer";

  const [posts, setPosts] = useState<BlogPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const [dialogOpen, setDialogOpen] = useState(false);

  // New post form
  const [title, setTitle] = useState("");
  const [excerpt, setExcerpt] = useState("");
  const [content, setContent] = useState("");
  const [category, setCategory] = useState("general");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    fetchPosts();
  }, [selectedCategory]);

  const fetchPosts = async () => {
    setLoading(true);
    let query = (supabase as any)
      .from("blog_posts")
      .select("*")
      .eq("is_published", true)
      .order("published_at", { ascending: false });

    if (selectedCategory !== "all") {
      query = query.eq("category", selectedCategory);
    }

    const { data } = await query;

    if (data) {
      const authorIds = [...new Set(data.map((p: any) => p.author_id))] as string[];
      const { data: profiles } = await supabase
        .from("profiles_public")
        .select("id, full_name")
        .in("id", authorIds);
      const profileMap = new Map(profiles?.map((p) => [p.id, p.full_name]) || []);

      setPosts(
        data.map((p) => ({
          ...p,
          author_name: profileMap.get(p.author_id) || "المدرسة الترتيلية",
        }))
      );
    }
    setLoading(false);
  };

  const handleCreatePost = async () => {
    if (!user || !title.trim() || !content.trim()) return;
    setSubmitting(true);

    const { error } = await (supabase as any).from("blog_posts").insert({
      title: title.trim(),
      excerpt: excerpt.trim() || null,
      content: content.trim(),
      category,
      author_id: user.id,
      is_published: true,
      published_at: new Date().toISOString(),
    });

    if (error) {
      toast({ title: "خطأ", description: "فشل نشر المقال", variant: "destructive" });
    } else {
      toast({ title: "تم بنجاح", description: "تم نشر المقال" });
      setTitle("");
      setExcerpt("");
      setContent("");
      setCategory("general");
      setDialogOpen(false);
      fetchPosts();
    }
    setSubmitting(false);
  };

  const filteredPosts = posts.filter(
    (p) =>
      !searchQuery ||
      p.title.includes(searchQuery) ||
      p.excerpt?.includes(searchQuery) ||
      p.content?.includes(searchQuery)
  );

  return (
    <AppLayout>
      <PageMeta
        title="المدونة"
        description="مدونة المدرسة الترتيلية - مقالات متخصصة في اللسان العربي المبين وعلوم القرآن الكريم والتوعية العربية والإسلامية."
        path="/blog"
        keywords="مدونة, مقالات عربية, علوم القرآن, اللسان العربي, تدبر القرآن, مقالات إسلامية"
      />

      <div className="px-4 py-6 max-w-4xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
              <BookOpen className="h-5 w-5 text-primary" />
            </div>
            <div>
              <h1 className="text-2xl font-display font-bold text-foreground">المدونة</h1>
              <p className="text-sm text-muted-foreground">مقالات في اللسان العربي وعلوم القرآن</p>
            </div>
          </div>

          {isAdmin && (
            <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
              <DialogTrigger asChild>
                <Button size="sm" className="gap-2">
                  <PenLine className="h-4 w-4" />
                  مقال جديد
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                  <DialogTitle>نشر مقال جديد</DialogTitle>
                </DialogHeader>
                <div className="space-y-4">
                  <Input
                    placeholder="عنوان المقال"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                  />
                  <Input
                    placeholder="ملخص قصير (اختياري)"
                    value={excerpt}
                    onChange={(e) => setExcerpt(e.target.value)}
                  />
                  <Select value={category} onValueChange={setCategory}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {Object.entries(categoryLabels).map(([key, label]) => (
                        <SelectItem key={key} value={key}>{label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <Textarea
                    placeholder="محتوى المقال..."
                    value={content}
                    onChange={(e) => setContent(e.target.value)}
                    rows={12}
                  />
                  <Button onClick={handleCreatePost} disabled={submitting || !title.trim() || !content.trim()} className="w-full">
                    {submitting ? "جاري النشر..." : "نشر المقال"}
                  </Button>
                </div>
              </DialogContent>
            </Dialog>
          )}
        </div>

        {/* Search & Filter */}
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="ابحث في المقالات..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pr-10"
            />
          </div>
          <Select value={selectedCategory} onValueChange={setSelectedCategory}>
            <SelectTrigger className="w-full sm:w-[180px]">
              <SelectValue placeholder="التصنيف" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">الكل</SelectItem>
              {Object.entries(categoryLabels).map(([key, label]) => (
                <SelectItem key={key} value={key}>{label}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Posts List */}
        {loading ? (
          <div className="space-y-4">
            {[1, 2, 3].map((i) => (
              <Card key={i} className="animate-pulse">
                <CardContent className="p-6 space-y-3">
                  <div className="h-6 bg-muted rounded w-2/3" />
                  <div className="h-4 bg-muted rounded w-full" />
                  <div className="h-4 bg-muted rounded w-1/2" />
                </CardContent>
              </Card>
            ))}
          </div>
        ) : filteredPosts.length === 0 ? (
          <div className="text-center py-16 space-y-3">
            <BookOpen className="h-12 w-12 text-muted-foreground/40 mx-auto" />
            <p className="text-muted-foreground">لا توجد مقالات بعد</p>
          </div>
        ) : (
          <div className="space-y-4">
            {filteredPosts.map((post) => (
              <Card
                key={post.id}
                className="hover:shadow-md transition-shadow cursor-pointer"
                onClick={() => navigate(`/blog/${post.id}`)}
              >
                <CardContent className="p-6 space-y-3">
                  <div className="flex items-center gap-2 flex-wrap">
                    <Badge variant="secondary" className="text-xs">
                      {categoryLabels[post.category] || post.category}
                    </Badge>
                  </div>
                  <h2 className="text-xl font-display font-bold text-foreground leading-tight">
                    {post.title}
                  </h2>
                  {post.excerpt && (
                    <p className="text-muted-foreground leading-relaxed line-clamp-2">
                      {post.excerpt}
                    </p>
                  )}
                  <div className="flex items-center gap-4 text-xs text-muted-foreground">
                    <span className="flex items-center gap-1">
                      <User className="h-3 w-3" />
                      {post.author_name}
                    </span>
                    <span className="flex items-center gap-1">
                      <Calendar className="h-3 w-3" />
                      {post.published_at
                        ? new Date(post.published_at).toLocaleDateString("ar")
                        : ""}
                    </span>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </AppLayout>
  );
};

export default Blog;

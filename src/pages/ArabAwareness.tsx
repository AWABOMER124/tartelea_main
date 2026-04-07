import { useState, useEffect } from "react";
import { Globe, Filter } from "lucide-react";
import AppLayout from "@/components/layout/AppLayout";
import ContentCard from "@/components/content/ContentCard";
import FilterChip from "@/components/ui/FilterChip";
import { supabase } from "@/integrations/supabase/client";
import type { Database } from "@/integrations/supabase/types";

type Content = Database["public"]["Tables"]["contents"]["Row"];
type DepthLevel = Database["public"]["Enums"]["depth_level"];
type ContentType = Database["public"]["Enums"]["content_type"];

const depthFilters = [
  { value: "all", label: "الكل" },
  { value: "beginner", label: "مبتدئ" },
  { value: "intermediate", label: "متوسط" },
  { value: "advanced", label: "متقدم" },
];

const typeFilters = [
  { value: "all", label: "الكل" },
  { value: "article", label: "مقالات" },
  { value: "audio", label: "صوتيات" },
  { value: "video", label: "مرئيات" },
];

const ArabAwareness = () => {
  const [contents, setContents] = useState<Content[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedDepth, setSelectedDepth] = useState("all");
  const [selectedType, setSelectedType] = useState("all");

  useEffect(() => {
    fetchContents();
  }, [selectedDepth, selectedType]);

  const fetchContents = async () => {
    setLoading(true);
    
    let query = supabase
      .from("contents")
      .select("*")
      .eq("category", "arab_awareness")
      .order("created_at", { ascending: false });

    if (selectedDepth !== "all") {
      query = query.eq("depth_level", selectedDepth as DepthLevel);
    }
    if (selectedType !== "all") {
      query = query.eq("type", selectedType as ContentType);
    }

    const { data, error } = await query;
    
    if (!error && data) {
      setContents(data);
    }
    setLoading(false);
  };

  return (
    <AppLayout>
      <div className="px-4 py-6 space-y-6">
        {/* Header */}
        <section className="text-center space-y-4">
          <div className="w-16 h-16 mx-auto rounded-full bg-accent/10 flex items-center justify-center">
            <Globe className="h-8 w-8 text-accent" />
          </div>
          <h1 className="text-2xl font-display font-bold text-foreground">
            الوعي العربي
          </h1>
        </section>

        {/* Filters */}
        <section className="space-y-3">
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Filter className="h-4 w-4" />
            <span>المستوى</span>
          </div>
          <div className="flex gap-2 overflow-x-auto pb-2">
            {depthFilters.map((filter) => (
              <FilterChip
                key={filter.value}
                label={filter.label}
                isActive={selectedDepth === filter.value}
                onClick={() => setSelectedDepth(filter.value)}
              />
            ))}
          </div>

          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Filter className="h-4 w-4" />
            <span>النوع</span>
          </div>
          <div className="flex gap-2 overflow-x-auto pb-2">
            {typeFilters.map((filter) => (
              <FilterChip
                key={filter.value}
                label={filter.label}
                isActive={selectedType === filter.value}
                onClick={() => setSelectedType(filter.value)}
              />
            ))}
          </div>
        </section>

        {/* Content List */}
        <section className="space-y-3">
          {loading ? (
            <div className="space-y-3">
              {[1, 2, 3].map((i) => (
                <div key={i} className="content-card animate-pulse">
                  <div className="flex gap-3">
                    <div className="w-12 h-12 rounded-lg bg-muted" />
                    <div className="flex-1 space-y-2">
                      <div className="h-4 bg-muted rounded w-3/4" />
                      <div className="h-3 bg-muted rounded w-1/2" />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : contents.length === 0 ? (
            <div className="text-center py-12">
              <Globe className="h-12 w-12 mx-auto text-muted-foreground/50 mb-4" />
              <p className="text-muted-foreground">لا يوجد محتوى حالياً</p>
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
              />
            ))
          )}
        </section>
      </div>
    </AppLayout>
  );
};

export default ArabAwareness;

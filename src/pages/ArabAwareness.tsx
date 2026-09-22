import { useState, useEffect } from "react";
import { Globe, Filter } from "lucide-react";
import AppLayout from "@/components/layout/AppLayout";
import ContentCard from "@/components/content/ContentCard";
import FilterChip from "@/components/ui/FilterChip";
import { listLibraryContent, type BackendContentItem as Content } from "@/lib/backendContent";

const depthFilters = [
  { value: "all", label: "الكل" },
  { value: "beginner", label: "خلع — تخلية" },
  { value: "intermediate", label: "تدبّر — تحلية" },
  { value: "advanced", label: "تحرّر — تجلّي" },
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
    let active = true;

    const fetchContents = async () => {
      setLoading(true);
      try {
        const data = await listLibraryContent({
          category: "arab_awareness",
          depthLevel: selectedDepth,
          type: selectedType,
        });
        if (active) setContents(data);
      } finally {
        if (active) setLoading(false);
      }
    };

    void fetchContents();
    return () => {
      active = false;
    };
  }, [selectedDepth, selectedType]);

  return (
    <AppLayout>
      <div className="mx-auto w-full max-w-5xl space-y-6 px-4 py-6 sm:px-6 sm:py-10">
        {/* Header */}
        <section className="max-w-2xl space-y-3">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-accent/10 flex items-center justify-center">
            <Globe className="h-6 w-6 text-accent" />
          </div>
          <h1 className="text-2xl font-bold text-foreground sm:text-3xl">
            الوعي العربي
          </h1>
        </section>

        {/* Filters */}
        <section className="space-y-3">
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Filter className="h-4 w-4" />
            <span>مرحلة الرحلة</span>
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
            <div className="rounded-2xl border border-dashed py-12 text-center">
              <Globe className="h-12 w-12 mx-auto text-muted-foreground/50 mb-4" />
              <p className="text-muted-foreground">لا توجد مواد بهذه الفلاتر حالياً</p>
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

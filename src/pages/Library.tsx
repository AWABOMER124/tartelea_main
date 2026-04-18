import { useState, useEffect } from "react";
import AppLayout from "@/components/layout/AppLayout";
import ContentCard from "@/components/content/ContentCard";
import FilterChip from "@/components/ui/FilterChip";
import { listLibraryContent } from "@/lib/backendContent";

type ContentType = "all" | "article" | "audio" | "video";
type CategoryType = "all" | "quran" | "values" | "community" | "sudan_awareness";
type DepthType = "all" | "beginner" | "intermediate" | "advanced";

const Library = () => {
  const [contents, setContents] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [typeFilter, setTypeFilter] = useState<ContentType>("all");
  const [categoryFilter, setCategoryFilter] = useState<CategoryType>("all");
  const [depthFilter, setDepthFilter] = useState<DepthType>("all");

  useEffect(() => {
    void fetchContents();
  }, [typeFilter, categoryFilter, depthFilter]);

  const fetchContents = async () => {
    setLoading(true);
    try {
      const data = await listLibraryContent({
        type: typeFilter,
        category: categoryFilter,
        depthLevel: depthFilter,
      });
      setContents(data);
    } finally {
      setLoading(false);
    }
  };

  const typeFilters = [
    { value: "all", label: "الكل" },
    { value: "article", label: "مقالات" },
    { value: "audio", label: "صوتيات" },
    { value: "video", label: "مرئيات" },
  ];

  const categoryFilters = [
    { value: "all", label: "الكل" },
    { value: "quran", label: "القرآن" },
    { value: "values", label: "القيم" },
    { value: "community", label: "المجتمع" },
    { value: "sudan_awareness", label: "الوعي السوداني" },
  ];

  const depthFilters = [
    { value: "all", label: "الكل" },
    { value: "beginner", label: "مبتدئ" },
    { value: "intermediate", label: "متوسط" },
    { value: "advanced", label: "متقدم" },
  ];

  return (
    <AppLayout>
      <div className="px-4 py-6 space-y-6">
        <h1 className="text-xl font-display font-bold text-foreground">
          المكتبة
        </h1>

        {/* Type Filter */}
        <div className="space-y-2">
          <h3 className="text-sm font-medium text-muted-foreground">النوع</h3>
          <div className="flex flex-wrap gap-2">
            {typeFilters.map((filter) => (
              <FilterChip
                key={filter.value}
                label={filter.label}
                isActive={typeFilter === filter.value}
                onClick={() => setTypeFilter(filter.value as ContentType)}
              />
            ))}
          </div>
        </div>

        {/* Category Filter */}
        <div className="space-y-2">
          <h3 className="text-sm font-medium text-muted-foreground">التصنيف</h3>
          <div className="flex flex-wrap gap-2">
            {categoryFilters.map((filter) => (
              <FilterChip
                key={filter.value}
                label={filter.label}
                isActive={categoryFilter === filter.value}
                onClick={() => setCategoryFilter(filter.value as CategoryType)}
              />
            ))}
          </div>
        </div>

        {/* Depth Filter */}
        <div className="space-y-2">
          <h3 className="text-sm font-medium text-muted-foreground">المستوى</h3>
          <div className="flex flex-wrap gap-2">
            {depthFilters.map((filter) => (
              <FilterChip
                key={filter.value}
                label={filter.label}
                isActive={depthFilter === filter.value}
                onClick={() => setDepthFilter(filter.value as DepthType)}
              />
            ))}
          </div>
        </div>

        {/* Content List */}
        <div className="space-y-4">
          {loading ? (
            <div className="space-y-4">
              {[1, 2, 3].map((i) => (
                <div key={i} className="content-card animate-pulse">
                  <div className="flex gap-3">
                    <div className="w-12 h-12 bg-muted rounded-lg" />
                    <div className="flex-1 space-y-2">
                      <div className="h-4 bg-muted rounded w-3/4" />
                      <div className="h-3 bg-muted rounded w-1/2" />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : contents.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <p>لا يوجد محتوى متاح حالياً</p>
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
                isSudanAwareness={content.is_sudan_awareness}
              />
            ))
          )}
        </div>
      </div>
    </AppLayout>
  );
};

export default Library;

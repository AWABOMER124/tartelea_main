import { useState, useEffect } from "react";
import AppLayout from "@/components/layout/AppLayout";
import ContentCard from "@/components/content/ContentCard";
import FilterChip from "@/components/ui/FilterChip";
import { Library as LibraryIcon } from "lucide-react";
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
    { value: "beginner", label: "تخلية" },
    { value: "intermediate", label: "تحلية" },
    { value: "advanced", label: "تجلّي" },
  ];

  return (
    <AppLayout>
      <div className="mx-auto w-full max-w-5xl space-y-6 px-4 py-6 sm:px-6 sm:py-10">
        <header className="max-w-2xl space-y-2">
          <p className="text-sm font-semibold text-spiritual-green">ارجع إلى ما تحتاجه</p>
          <h1 className="text-2xl font-bold text-foreground sm:text-3xl">المكتبة</h1>
          <p className="leading-7 text-muted-foreground">مقالات وصوتيات ومرئيات مرتبة لتصل إلى المادة المناسبة بأقل خطوات.</p>
        </header>

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
            <div className="rounded-2xl border border-dashed border-border bg-card/60 py-12 text-center">
              <LibraryIcon className="mx-auto mb-3 h-9 w-9 text-muted-foreground/50" />
              <p className="font-semibold text-foreground">لا توجد مواد بهذه الفلاتر</p>
              <p className="mt-1 text-sm text-muted-foreground">غيّر النوع أو التصنيف أو المرحلة لعرض مواد أخرى.</p>
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

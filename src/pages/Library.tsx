import { useState, useEffect } from "react";
import AppLayout from "@/components/layout/AppLayout";
import ContentCard from "@/components/content/ContentCard";
import FilterChip from "@/components/ui/FilterChip";
import { listLibraryContent, type BackendContentItem } from "@/lib/backendContent";
import { BookOpen } from "lucide-react";
import PageMeta from "@/components/seo/PageMeta";
import { DiscoveryHeader, DiscoveryPage, EmptyState, FilterGroup, FilterPanel, ResultsHeading } from "@/components/layout/DiscoveryPage";

type ContentType = "all" | "article" | "audio" | "video";
type CategoryType = "all" | "quran" | "values" | "community" | "sudan_awareness";
type DepthType = "all" | "beginner" | "intermediate" | "advanced";

const Library = () => {
  const [contents, setContents] = useState<BackendContentItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [typeFilter, setTypeFilter] = useState<ContentType>("all");
  const [categoryFilter, setCategoryFilter] = useState<CategoryType>("all");
  const [depthFilter, setDepthFilter] = useState<DepthType>("all");

  useEffect(() => {
    let active = true;
    const fetchContents = async () => {
      setLoading(true);
      try {
        const data = await listLibraryContent({ type: typeFilter, category: categoryFilter, depthLevel: depthFilter });
        if (active) setContents(data);
      } finally {
        if (active) setLoading(false);
      }
    };
    void fetchContents();
    return () => { active = false; };
  }, [typeFilter, categoryFilter, depthFilter]);

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
    { value: "beginner", label: "خلع — تخلية" },
    { value: "intermediate", label: "تدبّر — تحلية" },
    { value: "advanced", label: "تحرّر — تجلّي" },
  ];

  return (
    <AppLayout>
      <PageMeta title="المكتبة" description="مقالات وصوتيات ومرئيات المدرسة الترتيلية." path="/library" />
      <DiscoveryPage>
        <DiscoveryHeader eyebrow="تعلّم في وقتك" title="المكتبة" description="تصفّح المواد حسب النوع والموضوع والمرحلة." icon={BookOpen} />

        <FilterPanel>
          <FilterGroup label="النوع">
            {typeFilters.map((filter) => (
              <FilterChip key={filter.value} label={filter.label} isActive={typeFilter === filter.value} onClick={() => setTypeFilter(filter.value as ContentType)} />
            ))}
          </FilterGroup>
          <FilterGroup label="الموضوع">
            {categoryFilters.map((filter) => (
              <FilterChip key={filter.value} label={filter.label} isActive={categoryFilter === filter.value} onClick={() => setCategoryFilter(filter.value as CategoryType)} />
            ))}
          </FilterGroup>
          <FilterGroup label="المرحلة">
            {depthFilters.map((filter) => (
              <FilterChip key={filter.value} label={filter.label} isActive={depthFilter === filter.value} onClick={() => setDepthFilter(filter.value as DepthType)} />
            ))}
          </FilterGroup>
        </FilterPanel>

        <section className="space-y-4">
          <ResultsHeading count={contents.length} label="المحتوى المتاح" />
          {loading ? (
            <div className="grid gap-3 sm:grid-cols-2">
              {[1, 2, 3, 4].map((i) => <div key={i} className="h-32 animate-pulse rounded-2xl border border-border bg-muted/60" />)}
            </div>
          ) : contents.length === 0 ? (
            <EmptyState icon={BookOpen} title="لا توجد نتائج بهذه التصفية" description="جرّب اختيار نوع أو موضوع آخر لعرض مواد أكثر." />
          ) : (
            <div className="grid gap-3 sm:grid-cols-2">{contents.map((content) => (
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
            ))}</div>
          )}
        </section>
      </DiscoveryPage>
    </AppLayout>
  );
};

export default Library;

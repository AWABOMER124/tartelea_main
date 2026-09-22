import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Search,
  X,
  Video,
  FileText,
  Headphones,
  GraduationCap,
  Loader2,
  SlidersHorizontal,
} from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { searchLearningCatalog } from "@/lib/backendDiscovery";

interface SearchResult {
  id: string;
  title: string;
  type: "course" | "content";
  contentType: string;
  category: string;
  depthLevel?: string;
}

const typeIcons = {
  article: FileText,
  audio: Headphones,
  video: Video,
};

const categoryLabels: Record<string, string> = {
  quran: "القرآن",
  values: "القيم",
  community: "المجتمع",
  sudan_awareness: "الوعي السوداني",
  arab_awareness: "الوعي العربي",
  islamic_awareness: "الوعي الإسلامي",
};

const levelLabels: Record<string, string> = {
  beginner: "خلع — تخلية",
  intermediate: "تدبّر — تحلية",
  advanced: "تحرّر — تجلّي",
};

const GlobalSearch = () => {
  const navigate = useNavigate();
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<SearchResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [showResults, setShowResults] = useState(false);
  const [showFilters, setShowFilters] = useState(false);
  const [filterCategory, setFilterCategory] = useState("all");
  const [filterType, setFilterType] = useState("all");
  const [filterLevel, setFilterLevel] = useState("all");
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setShowResults(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  useEffect(() => {
    const searchTimeout = setTimeout(() => {
      if (query.trim().length >= 2) {
        performSearch();
      } else {
        setResults([]);
      }
    }, 300);
    return () => clearTimeout(searchTimeout);
  }, [query, filterCategory, filterType, filterLevel]);

  const performSearch = async () => {
    setLoading(true);
    try {
      setResults(
        await searchLearningCatalog({
          query: query.trim(),
          category: filterCategory,
          type: filterType,
          level: filterLevel,
        }),
      );
      setShowResults(true);
    } finally {
      setLoading(false);
    }
  };

  const handleResultClick = (result: SearchResult) => {
    setShowResults(false);
    setQuery("");
    if (result.type === "course") {
      navigate(`/courses/${result.id}`);
    } else {
      navigate(`/content/${result.id}`);
    }
  };

  const hasActiveFilters = filterCategory !== "all" || filterType !== "all" || filterLevel !== "all";

  return (
    <div ref={containerRef} className="relative space-y-2">
      <div className="relative flex gap-2">
        <div className="relative flex-1">
          <Search className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="ابحث في المسارات والمكتبة..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onFocus={() => query.trim().length >= 2 && setShowResults(true)}
            className="min-h-11 pr-10 pl-10"
          />
          {query && (
            <button
              onClick={() => { setQuery(""); setResults([]); }}
              className="absolute left-2 top-1/2 flex h-9 w-9 -translate-y-1/2 items-center justify-center rounded-lg text-muted-foreground hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              aria-label="مسح البحث"
            >
              <X className="h-4 w-4 text-muted-foreground" />
            </button>
          )}
        </div>
        <button
          onClick={() => setShowFilters(!showFilters)}
          aria-label={showFilters ? "إخفاء فلاتر البحث" : "إظهار فلاتر البحث"}
          aria-expanded={showFilters}
          className={`flex h-11 w-11 items-center justify-center rounded-xl border transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring ${
            hasActiveFilters ? "bg-primary text-primary-foreground border-primary" : "bg-card border-border text-muted-foreground hover:bg-muted"
          }`}
        >
          <SlidersHorizontal className="h-4 w-4" />
        </button>
      </div>

      {/* Filters */}
      {showFilters && (
        <div className="flex flex-wrap gap-2">
          <Select value={filterCategory} onValueChange={setFilterCategory}>
            <SelectTrigger className="w-[130px] h-8 text-xs">
              <SelectValue placeholder="التصنيف" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">كل التصنيفات</SelectItem>
              {Object.entries(categoryLabels).map(([k, v]) => (
                <SelectItem key={k} value={k}>{v}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={filterType} onValueChange={setFilterType}>
            <SelectTrigger className="w-[110px] h-8 text-xs">
              <SelectValue placeholder="النوع" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">كل الأنواع</SelectItem>
              <SelectItem value="video">فيديو</SelectItem>
              <SelectItem value="audio">صوتي</SelectItem>
              <SelectItem value="article">مقال</SelectItem>
            </SelectContent>
          </Select>
          <Select value={filterLevel} onValueChange={setFilterLevel}>
            <SelectTrigger className="w-[110px] h-8 text-xs">
              <SelectValue placeholder="المستوى" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">كل المستويات</SelectItem>
              <SelectItem value="beginner">خلع — تخلية</SelectItem>
              <SelectItem value="intermediate">تدبّر — تحلية</SelectItem>
              <SelectItem value="advanced">تحرّر — تجلّي</SelectItem>
            </SelectContent>
          </Select>
          {hasActiveFilters && (
            <button
              onClick={() => { setFilterCategory("all"); setFilterType("all"); setFilterLevel("all"); }}
              className="text-xs text-destructive hover:underline"
            >
              مسح الفلاتر
            </button>
          )}
        </div>
      )}

      {showResults && (query.trim().length >= 2 || results.length > 0) && (
        <Card className="absolute top-full z-50 mt-2 w-full border-border shadow-lg" style={{ top: showFilters ? "5.5rem" : undefined }}>
          <CardContent className="p-2">
            {loading ? (
              <div className="flex items-center justify-center py-4">
                <Loader2 className="h-5 w-5 animate-spin text-primary" />
              </div>
            ) : results.length === 0 ? (
              <div className="text-center py-4 text-muted-foreground text-sm">
                لا توجد نتائج
              </div>
            ) : (
              <div className="space-y-1">
                {results.map((result) => {
                  const TypeIcon = typeIcons[result.contentType as keyof typeof typeIcons] || FileText;
                  return (
                    <button
                      key={`${result.type}-${result.id}`}
                      onClick={() => handleResultClick(result)}
                      className="flex min-h-12 w-full items-center gap-3 rounded-xl p-2 text-right transition-colors hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                    >
                      <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
                        {result.type === "course" ? (
                          <GraduationCap className="h-4 w-4 text-primary" />
                        ) : (
                          <TypeIcon className="h-4 w-4 text-primary" />
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-sm line-clamp-1">{result.title}</p>
                        <div className="flex items-center gap-2">
                          <Badge variant="outline" className="text-xs">
                            {result.type === "course" ? "دورة" : "محتوى"}
                          </Badge>
                          <span className="text-xs text-muted-foreground">
                            {categoryLabels[result.category]}
                          </span>
                          {result.depthLevel && (
                            <Badge variant="secondary" className="text-[10px]">
                              {levelLabels[result.depthLevel] || result.depthLevel}
                            </Badge>
                          )}
                        </div>
                      </div>
                    </button>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default GlobalSearch;
